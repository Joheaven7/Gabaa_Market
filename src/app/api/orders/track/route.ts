import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getOrderByTrackingToken } from "@/lib/services/orderService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Tracking token is required." }, { status: 400 });
    }

    await connectDB();
    const orderData = await getOrderByTrackingToken(token);

    if (!orderData) {
      return NextResponse.json(
        { error: "Order not found or tracking token is invalid." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: orderData });
  } catch (error: any) {
    console.error("Tracking API error:", error);
    return NextResponse.json({ error: "Failed to retrieve order details." }, { status: 500 });
  }
}
