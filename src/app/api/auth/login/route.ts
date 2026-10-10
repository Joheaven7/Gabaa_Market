import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { SellerProfile } from "@/lib/models/SellerProfile";
import { comparePassword } from "@/lib/auth/passwords";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Account is suspended. Please contact marketplace administration." },
        { status: 403 }
      );
    }

    let sellerId: string | undefined;
    let storeName: string | undefined;

    if (user.role === "SELLER") {
      const seller = await SellerProfile.findOne({ userId: user._id });
      if (seller) {
        sellerId = seller._id.toString();
        storeName = seller.storeName;
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    await setSessionCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sellerId,
      storeName,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        sellerId,
        storeName,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Failed to log in" }, { status: 500 });
  }
}
