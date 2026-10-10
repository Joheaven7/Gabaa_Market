import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { SellerProfile } from "@/lib/models/SellerProfile";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const categorySlug = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);

    const filter: any = {
      status: "APPROVED",
      isDeleted: false,
    };

    if (q) {
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
      ];
    }

    if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug });
      if (cat) {
        filter.categoryId = cat._id;
      }
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice) * 100;
      if (maxPrice) filter.price.$lte = Number(maxPrice) * 100;
    }

    const products = await Product.find(filter)
      .populate<{ sellerId: { _id: mongoose.Types.ObjectId; storeName: string; status: string } }>(
        "sellerId",
        "storeName status"
      )
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Filter out products whose sellers are suspended
    const approvedProducts = products.filter(
      (p) => (p.sellerId as any)?.status === "APPROVED"
    );

    return NextResponse.json({
      success: true,
      count: approvedProducts.length,
      products: approvedProducts,
    });
  } catch (error: any) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Failed to load products." }, { status: 500 });
  }
}
