import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Category } from "@/lib/models/Category";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const categories = await Category.find({ status: "ACTIVE" })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}
