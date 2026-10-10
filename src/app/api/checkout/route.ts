import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { processGuestCheckout } from "@/lib/services/orderService";
import { isValidEthiopianPhone, normalizeEthiopianPhone } from "@/lib/utils/phone";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { customer, items } = body;

    if (!customer || !customer.name || !customer.phone || !customer.deliveryAddress) {
      return NextResponse.json(
        { error: "Customer name, phone, and complete delivery address are required." },
        { status: 400 }
      );
    }

    if (!isValidEthiopianPhone(customer.phone)) {
      return NextResponse.json(
        {
          error:
            "Invalid Ethiopian phone number. Please provide a valid phone number (e.g. +251 9... or 09...).",
        },
        { status: 400 }
      );
    }

    if (!customer.deliveryAddress.city || !customer.deliveryAddress.subcityOrZone) {
      return NextResponse.json(
        { error: "Delivery city and subcity/zone must be selected." },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your shopping cart is empty." }, { status: 400 });
    }

    // Normalize customer phone
    customer.phone = normalizeEthiopianPhone(customer.phone);

    const result = await processGuestCheckout({
      customer,
      items,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          itemErrors: result.itemErrors,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.orderNumber,
      trackingToken: result.trackingToken,
      grandTotal: result.grandTotal,
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during checkout." },
      { status: 500 }
    );
  }
}
