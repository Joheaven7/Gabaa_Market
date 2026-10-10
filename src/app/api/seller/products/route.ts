import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";
import { Product } from "@/lib/models/Product";
import { SellerProfile } from "@/lib/models/SellerProfile";
import { logAudit } from "@/lib/services/auditService";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SELLER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const sellerId =
      session.role === "ADMIN" && searchParams.get("sellerId")
        ? searchParams.get("sellerId")!
        : session.sellerId!;

    const products = await Product.find({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      isDeleted: false,
    })
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error("Seller products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SELLER" || !session.sellerId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const seller = await SellerProfile.findById(session.sellerId);
    if (!seller || seller.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your seller account is awaiting approval or suspended. You cannot create products yet." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, sku, price, stockQuantity, categoryId, images, variants } = body;

    if (!title || !description || !sku || price === undefined || !categoryId) {
      return NextResponse.json({ error: "Please fill all required fields." }, { status: 400 });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProduct = await Product.create({
      sellerId: new mongoose.Types.ObjectId(session.sellerId),
      categoryId: new mongoose.Types.ObjectId(categoryId),
      title: title.trim(),
      slug,
      description: description.trim(),
      sku: sku.trim().toUpperCase(),
      price: Math.round(Number(price)), // In ETB subunits
      stockQuantity: Math.max(0, Number(stockQuantity) || 0),
      images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"],
      variants: Array.isArray(variants) ? variants : [],
      status: "PENDING_REVIEW", // Mandatory initial moderation
      submittedAt: new Date(),
    });

    await logAudit({
      actorId: session.userId,
      actorRole: "SELLER",
      action: "PRODUCT_CREATED_FOR_MODERATION",
      entityType: "Product",
      entityId: newProduct._id.toString(),
      afterSummary: `Created product "${title}" submitted for admin review.`,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Seller products POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "SELLER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { productId, title, description, sku, price, stockQuantity, categoryId, images, variants, isStockOnly } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID required." }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (session.role === "SELLER" && product.sellerId.toString() !== session.sellerId) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // Quick stock adjustment without triggering re-moderation
    if (isStockOnly && stockQuantity !== undefined) {
      const oldStock = product.stockQuantity;
      product.stockQuantity = Math.max(0, Number(stockQuantity));
      await product.save();

      await logAudit({
        actorId: session.userId,
        actorRole: session.role,
        action: "PRODUCT_STOCK_UPDATED",
        entityType: "Product",
        entityId: product._id.toString(),
        beforeSummary: `Stock: ${oldStock}`,
        afterSummary: `Stock: ${product.stockQuantity}`,
      });

      return NextResponse.json({ success: true, product });
    }

    // Material edits:
    // If the product is already APPROVED, do NOT replace the live version. Create a pendingVersion!
    if (product.status === "APPROVED") {
      // Ensure publishedVersion snapshot exists
      if (!product.publishedVersion) {
        product.publishedVersion = {
          title: product.title,
          description: product.description,
          price: product.price,
          stockQuantity: product.stockQuantity,
          sku: product.sku,
          images: product.images,
          variants: product.variants,
          categoryId: product.categoryId,
        };
      }

      // Store edited version as pendingVersion
      product.pendingVersion = {
        title: title ? title.trim() : product.title,
        description: description ? description.trim() : product.description,
        price: price !== undefined ? Math.round(Number(price)) : product.price,
        stockQuantity: stockQuantity !== undefined ? Math.max(0, Number(stockQuantity)) : product.stockQuantity,
        sku: sku ? sku.trim().toUpperCase() : product.sku,
        images: Array.isArray(images) && images.length > 0 ? images : product.images,
        variants: Array.isArray(variants) ? variants : product.variants,
        categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : product.categoryId,
      };

      product.submittedAt = new Date();
      await product.save();

      await logAudit({
        actorId: session.userId,
        actorRole: session.role,
        action: "PRODUCT_MATERIAL_EDIT_SUBMITTED",
        entityType: "Product",
        entityId: product._id.toString(),
        afterSummary: `Material edit submitted for "${product.title}". Live version remains published while pendingVersion awaits review.`,
      });

      return NextResponse.json({
        success: true,
        message: "Your changes have been submitted for admin approval. The currently approved version remains live for buyers.",
        product,
      });
    }

    // If product was PENDING_REVIEW or REJECTED, update directly and reset to PENDING_REVIEW
    if (title) product.title = title.trim();
    if (description) product.description = description.trim();
    if (sku) product.sku = sku.trim().toUpperCase();
    if (price !== undefined) product.price = Math.round(Number(price));
    if (stockQuantity !== undefined) product.stockQuantity = Math.max(0, Number(stockQuantity));
    if (categoryId) product.categoryId = new mongoose.Types.ObjectId(categoryId);
    if (Array.isArray(images) && images.length > 0) product.images = images;
    if (Array.isArray(variants)) product.variants = variants;

    product.status = "PENDING_REVIEW";
    product.submittedAt = new Date();
    await product.save();

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Seller products PATCH error:", error);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}
