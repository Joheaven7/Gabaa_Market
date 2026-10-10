import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { SellerProfile } from "@/lib/models/SellerProfile";
import { hashPassword } from "@/lib/auth/passwords";
import { setSessionCookie } from "@/lib/auth/session";
import { isValidEthiopianPhone, normalizeEthiopianPhone } from "@/lib/utils/phone";
import { logAudit } from "@/lib/services/auditService";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, phone, password, role, storeName, city, subcityOrZone, description } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!isValidEthiopianPhone(phone)) {
      return NextResponse.json(
        { error: "Invalid Ethiopian phone number. Please use format +251 9... or +251 7..." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeEthiopianPhone(phone);
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === "SELLER" ? "SELLER" : "CUSTOMER";

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: normalizedPhone,
      passwordHash,
      role: userRole,
      status: "ACTIVE",
    });

    let sellerProfileId: string | undefined;

    if (userRole === "SELLER") {
      if (!storeName || !city || !subcityOrZone) {
        return NextResponse.json(
          { error: "Store name, city, and subcity/zone are required for sellers." },
          { status: 400 }
        );
      }

      const slug = storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const seller = await SellerProfile.create({
        userId: user._id,
        storeName: storeName.trim(),
        slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
        businessDetails: {
          city: city.trim(),
          subcityOrZone: subcityOrZone.trim(),
          description: description?.trim(),
        },
        contactDetails: {
          contactPerson: name.trim(),
          phone: normalizedPhone,
          email: email.toLowerCase().trim(),
        },
        status: "PENDING_APPROVAL",
      });

      sellerProfileId = seller._id.toString();

      await logAudit({
        actorId: user._id,
        actorRole: "SELLER",
        action: "SELLER_APPLICATION_SUBMITTED",
        entityType: "SellerProfile",
        entityId: seller._id.toString(),
        afterSummary: `Seller application registered for store: ${storeName}`,
      });
    }

    await setSessionCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sellerId: sellerProfileId,
      storeName: storeName?.trim(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        sellerId: sellerProfileId,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message || "Failed to register" }, { status: 500 });
  }
}
