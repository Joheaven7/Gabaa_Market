import { NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { SellerProfile } from "@/lib/models/SellerProfile";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully." });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  try {
    await connectDB();
    const user = await User.findById(session.userId).select("-passwordHash");
    let sellerStatus = null;

    if (session.sellerId) {
      const seller = await SellerProfile.findById(session.sellerId);
      if (seller) {
        sellerStatus = seller.status;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: user?.name,
        role: session.role,
        sellerId: session.sellerId,
        storeName: session.storeName,
        sellerStatus,
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
