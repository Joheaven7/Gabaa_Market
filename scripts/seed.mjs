import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/zemen_market";

async function seed() {
  console.log("Connecting to MongoDB Atlas...", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log("Cleaning existing collections...");
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
    } catch (e) {
      // ignore
    }
  }

  console.log("Creating default Admin user...");
  const adminPasswordHash = await bcrypt.hash("admin123456", 10);
  const sellerPasswordHash = await bcrypt.hash("seller123456", 10);

  const adminUser = await mongoose.connection.collection("users").insertOne({
    name: "Zemen Marketplace Administrator",
    email: "admin@zemenmarket.et",
    phone: "+251911223344",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Creating Categories...");
  const categories = await mongoose.connection.collection("categories").insertMany([
    {
      name: "Ethiopian Coffee & Spices",
      amharicName: "የኢትዮጵያ ቡና እና ቅመማ ቅመም",
      slug: "coffee-and-spices",
      status: "ACTIVE",
      sortOrder: 1,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Electronics & Gadgets",
      amharicName: "ኤሌክትሮኒክስ እና መግብያዎች",
      slug: "electronics",
      status: "ACTIVE",
      sortOrder: 2,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Handwoven Habesha Wear",
      amharicName: "የሐበሻ ባህላዊ አልባሳት",
      slug: "habesha-fashion",
      status: "ACTIVE",
      sortOrder: 3,
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Leather & Crafts",
      amharicName: "ቆዳ እና የእጅ ጥበብ",
      slug: "leather-and-crafts",
      status: "ACTIVE",
      sortOrder: 4,
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const catIds = Object.values(categories.insertedIds);

  console.log("Creating Verified Sellers...");
  // Seller 1: Addis Tech Hub (Bole)
  const sellerUser1 = await mongoose.connection.collection("users").insertOne({
    name: "Yonas Mekonnen",
    email: "yonas@addistech.et",
    phone: "+251912345678",
    passwordHash: sellerPasswordHash,
    role: "SELLER",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const seller1 = await mongoose.connection.collection("sellerprofiles").insertOne({
    userId: sellerUser1.insertedId,
    storeName: "Addis Tech Hub",
    slug: "addis-tech-hub",
    businessDetails: {
      tinNumber: "0019283746",
      businessLicenseNo: "BL-AA-2024-9912",
      city: "Addis Ababa",
      subcityOrZone: "BOLE",
      description: "Premium consumer audio, phones, and accessories with Addis-wide delivery.",
    },
    contactDetails: {
      contactPerson: "Yonas Mekonnen",
      phone: "+251912345678",
      email: "yonas@addistech.et",
      physicalAddress: "Bole Medhanialem, Morning Star Mall 2nd Floor",
    },
    status: "APPROVED",
    approvedBy: adminUser.insertedId,
    approvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Seller 2: Sheba Crafts & Coffee (Kirkos)
  const sellerUser2 = await mongoose.connection.collection("users").insertOne({
    name: "Selamawit Tadesse",
    email: "selam@shebacrafts.et",
    phone: "+251978112233",
    passwordHash: sellerPasswordHash,
    role: "SELLER",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const seller2 = await mongoose.connection.collection("sellerprofiles").insertOne({
    userId: sellerUser2.insertedId,
    storeName: "Sheba Crafts & Coffee",
    slug: "sheba-crafts-coffee",
    businessDetails: {
      tinNumber: "0055443322",
      businessLicenseNo: "BL-AA-2023-4102",
      city: "Addis Ababa",
      subcityOrZone: "KIRKOS",
      description: "Authentic Yirgacheffe specialty coffee beans, hand-carved Jebena sets, and genuine leather.",
    },
    contactDetails: {
      contactPerson: "Selamawit Tadesse",
      phone: "+251978112233",
      email: "selam@shebacrafts.et",
      physicalAddress: "Meskel Square, Stadium Commercial Center",
    },
    status: "APPROVED",
    approvedBy: adminUser.insertedId,
    approvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Configuring Seller Delivery Settings...");
  await mongoose.connection.collection("sellerdeliverysettings").insertMany([
    {
      sellerId: seller1.insertedId,
      eligibleAreas: ["BOLE", "KIRKOS", "YEKA", "ARADA", "GULELE", "LIDETA", "LEMI_KURA"],
      feeRules: {
        defaultFlatFee: 15000, // 150.00 ETB
        estimatedDeliveryDays: 1,
        areaOverrides: [
          { areaCode: "BOLE", fee: 10000 }, // 100.00 ETB within Bole
        ],
      },
      freeDeliveryThreshold: 500000, // Free delivery above 5,000 ETB
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      sellerId: seller2.insertedId,
      eligibleAreas: ["BOLE", "KIRKOS", "YEKA", "ARADA", "LIDETA", "KOLFE_KERANIO", "ADAMA", "HAWASSA"],
      feeRules: {
        defaultFlatFee: 12000, // 120.00 ETB
        estimatedDeliveryDays: 2,
        areaOverrides: [
          { areaCode: "ADAMA", fee: 35000 }, // 350 ETB to Adama
          { areaCode: "HAWASSA", fee: 45000 }, // 450 ETB to Hawassa
        ],
      },
      freeDeliveryThreshold: 350000, // Free above 3,500 ETB
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log("Seeding Approved Products...");
  await mongoose.connection.collection("products").insertMany([
    {
      sellerId: seller1.insertedId,
      categoryId: catIds[1], // Electronics
      title: "Anker Soundcore Space Q45 Wireless ANC Headphones",
      slug: "anker-soundcore-space-q45",
      description: "Ultra-wide 3-stage noise cancelling headphones with 50-hour playtime and LDAC hi-res wireless sound. Verified authentic with 6-month warranty.",
      sku: "ANK-Q45-BLK",
      price: 1850000, // 18,500.00 ETB
      stockQuantity: 14,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
      ],
      status: "APPROVED",
      publishedVersion: {
        title: "Anker Soundcore Space Q45 Wireless ANC Headphones",
        description: "Ultra-wide 3-stage noise cancelling headphones with 50-hour playtime and LDAC hi-res wireless sound.",
        price: 1850000,
        stockQuantity: 14,
        sku: "ANK-Q45-BLK",
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"],
        categoryId: catIds[1],
      },
      submittedAt: new Date(),
      reviewedBy: adminUser.insertedId,
      reviewedAt: new Date(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      sellerId: seller1.insertedId,
      categoryId: catIds[1], // Electronics
      title: "Baseus Blade 100W Ultra-Slim Laptop Power Bank",
      slug: "baseus-blade-100w-powerbank",
      description: "Thin profile 20,000mAh dual Type-C fast charging battery pack ideal for MacBooks, Dell XPS, and mobile smartphones.",
      sku: "BAS-BLADE-100",
      price: 980000, // 9,800.00 ETB
      stockQuantity: 8,
      images: [
        "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800&auto=format&fit=crop&q=80",
      ],
      status: "APPROVED",
      publishedVersion: {
        title: "Baseus Blade 100W Ultra-Slim Laptop Power Bank",
        description: "Thin profile 20,000mAh dual Type-C fast charging battery pack.",
        price: 980000,
        stockQuantity: 8,
        sku: "BAS-BLADE-100",
        images: ["https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800&auto=format&fit=crop&q=80"],
        categoryId: catIds[1],
      },
      submittedAt: new Date(),
      reviewedBy: adminUser.insertedId,
      reviewedAt: new Date(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      sellerId: seller2.insertedId,
      categoryId: catIds[0], // Coffee & Spices
      title: "Single Origin Yirgacheffe Grade 1 Washed Coffee (1KG)",
      slug: "yirgacheffe-grade-1-coffee-1kg",
      description: "Hand-picked specialty Arabica coffee beans from Gedeo Zone, Yirgacheffe. Distinctive notes of bergamot, jasmine, and citrus floral sweetness. Medium roast.",
      sku: "YIRG-G1-1KG",
      price: 240000, // 2,400.00 ETB
      stockQuantity: 45,
      images: [
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80",
      ],
      status: "APPROVED",
      publishedVersion: {
        title: "Single Origin Yirgacheffe Grade 1 Washed Coffee (1KG)",
        description: "Hand-picked specialty Arabica coffee beans from Gedeo Zone, Yirgacheffe.",
        price: 240000,
        stockQuantity: 45,
        sku: "YIRG-G1-1KG",
        images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"],
        categoryId: catIds[0],
      },
      submittedAt: new Date(),
      reviewedBy: adminUser.insertedId,
      reviewedAt: new Date(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      sellerId: seller2.insertedId,
      categoryId: catIds[3], // Leather
      title: "Handmade Ethiopian Full-Grain Leather Weekender Duffle",
      slug: "ethiopian-leather-weekender-duffle",
      description: "Masterfully hand-stitched travel duffle bag crafted from genuine Ethiopian highland cowhide leather. Antique brass zips and heavy cotton lining.",
      sku: "LEATH-DUF-01",
      price: 1450000, // 14,500.00 ETB
      stockQuantity: 6,
      images: [
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80",
      ],
      status: "APPROVED",
      publishedVersion: {
        title: "Handmade Ethiopian Full-Grain Leather Weekender Duffle",
        description: "Masterfully hand-stitched travel duffle bag crafted from genuine Ethiopian highland cowhide leather.",
        price: 1450000,
        stockQuantity: 6,
        sku: "LEATH-DUF-01",
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80"],
        categoryId: catIds[3],
      },
      submittedAt: new Date(),
      reviewedBy: adminUser.insertedId,
      reviewedAt: new Date(),
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log("Seed finished successfully!");
  console.log("Admin credentials: admin@zemenmarket.et / admin123456");
  console.log("Seller credentials: yonas@addistech.et / seller123456");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
