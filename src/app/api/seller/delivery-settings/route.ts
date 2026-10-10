import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/session";
import { SellerDeliverySetting } from "@/lib/models/SellerDeliverySetting";
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

    let setting = await SellerDeliverySetting.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
    });

    if (!setting) {
      // Default initial configuration
      setting = await SellerDeliverySetting.create({
        sellerId: new mongoose.Types.ObjectId(sellerId),
        eligibleAreas: ["BOLE", "KIRKOS", "YEKA", "ARADA", "GULELE", "LIDETA"],
        feeRules: {
          defaultFlatFee: 15000, // 150 ETB in subunits
          estimatedDeliveryDays: 2,
          areaOverrides: [],
        },
        freeDeliveryThreshold: 200000, // 2000 ETB in subunits
        active: true,
      });
    }

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    console.error("Delivery settings GET error:", error);
    return NextResponse.json({ error: "Failed to load delivery settings." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SELLER" || !session.sellerId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { eligibleAreas, feeRules, freeDeliveryThreshold, active } = body;

    const setting = await SellerDeliverySetting.findOneAndUpdate(
      { sellerId: new mongoose.Types.ObjectId(session.sellerId) },
      {
        eligibleAreas: Array.isArray(eligibleAreas) ? eligibleAreas : [],
        feeRules: {
          defaultFlatFee: Math.round(Number(feeRules?.defaultFlatFee || 15000)),
          estimatedDeliveryDays: Number(feeRules?.estimatedDeliveryDays || 2),
          areaOverrides: feeRules?.areaOverrides || [],
        },
        freeDeliveryThreshold: freeDeliveryThreshold ? Math.round(Number(freeDeliveryThreshold)) : undefined,
        active: active !== undefined ? Boolean(active) : true,
        updatedBy: new mongoose.Types.ObjectId(session.userId),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    console.error("Delivery settings POST error:", error);
    return NextResponse.json({ error: "Failed to save delivery settings." }, { status: 500 });
  }
}
