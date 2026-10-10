import React from "react";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import { Product } from "@/lib/models/Product";
import { SellerDeliverySetting } from "@/lib/models/SellerDeliverySetting";
import { formatETB } from "@/lib/utils/currency";
import { ProductDetailClient } from "./ProductDetailClient";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

async function getProduct(slug: string) {
  try {
    await connectDB();
    const product = await Product.findOne({ slug, isDeleted: false })
      .populate("sellerId", "storeName slug businessDetails contactDetails status")
      .populate("categoryId", "name slug")
      .lean();

    if (!product || product.status !== "APPROVED") {
      return null;
    }

    // Get seller delivery settings for the interactive checker
    const deliverySetting = await SellerDeliverySetting.findOne({
      sellerId: (product.sellerId as any)._id,
      active: true,
    }).lean();

    return {
      product: JSON.parse(JSON.stringify(product)),
      deliverySetting: deliverySetting ? JSON.parse(JSON.stringify(deliverySetting)) : null,
    };
  } catch (e) {
    console.error("Product query error:", e);
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const data = await getProduct(params.slug);
  if (!data) {
    notFound();
  }

  return <ProductDetailClient product={data.product} deliverySetting={data.deliverySetting} />;
}
