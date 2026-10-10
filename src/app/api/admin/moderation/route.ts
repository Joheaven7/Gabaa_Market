import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";
import { Product } from "@/lib/models/Product";
import { logAudit } from "@/lib/services/auditService";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();
    // Fetch products needing moderation: either PENDING_REVIEW or having a pendingVersion
    const queue = await Product.find({
      $or: [{ status: "PENDING_REVIEW" }, { pendingVersion: { $ne: null } }],
      isDeleted: false,
    })
      .populate("sellerId", "storeName contactDetails")
      .populate("categoryId", "name")
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, queue });
  } catch (error: any) {
    console.error("Moderation queue GET error:", error);
    return NextResponse.json({ error: "Failed to load moderation queue." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { productId, decision, rejectionReason } = body;

    if (!productId || !decision) {
      return NextResponse.json({ error: "Product ID and decision are required." }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (decision === "APPROVE") {
      // Case A: Approving a pending material edit
      if (product.pendingVersion) {
        const pv = product.pendingVersion;
        product.title = pv.title;
        product.description = pv.description;
        product.price = pv.price;
        product.stockQuantity = pv.stockQuantity;
        product.sku = pv.sku;
        product.images = pv.images;
        product.variants = pv.variants;
        product.categoryId = pv.categoryId;

        product.publishedVersion = {
          title: pv.title,
          description: pv.description,
          price: pv.price,
          stockQuantity: pv.stockQuantity,
          sku: pv.sku,
          images: pv.images,
          variants: pv.variants,
          categoryId: pv.categoryId,
        };

        product.pendingVersion = undefined;
        product.status = "APPROVED";
      } else {
        // Case B: Approving an initial product submission
        product.status = "APPROVED";
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

      product.reviewedBy = new mongoose.Types.ObjectId(session.userId);
      product.reviewedAt = new Date();
      product.rejectionReason = undefined;
      await product.save();

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "PRODUCT_MODERATION_APPROVED",
        entityType: "Product",
        entityId: product._id.toString(),
        afterSummary: `Admin approved product "${product.title}" version.`,
      });

      return NextResponse.json({ success: true, message: "Product version approved and live.", product });
    } else if (decision === "REJECT") {
      // Rejecting changes or new submission
      if (product.pendingVersion) {
        // Drop the pending edit; live publishedVersion remains unaffected
        product.pendingVersion = undefined;
      } else {
        product.status = "REJECTED";
      }

      product.reviewedBy = new mongoose.Types.ObjectId(session.userId);
      product.reviewedAt = new Date();
      product.rejectionReason = rejectionReason || "Does not meet marketplace standards";
      await product.save();

      await logAudit({
        actorId: session.userId,
        actorRole: "ADMIN",
        action: "PRODUCT_MODERATION_REJECTED",
        entityType: "Product",
        entityId: product._id.toString(),
        afterSummary: `Product "${product.title}" rejected. Reason: ${product.rejectionReason}`,
      });

      return NextResponse.json({ success: true, message: "Product rejected.", product });
    }

    return NextResponse.json({ error: "Invalid moderation decision." }, { status: 400 });
  } catch (error: any) {
    console.error("Moderation POST error:", error);
    return NextResponse.json({ error: "Failed to process moderation." }, { status: 500 });
  }
}
