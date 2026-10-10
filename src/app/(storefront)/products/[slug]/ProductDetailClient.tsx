"use client";

import React, { useState } from "react";
import { formatETB } from "@/lib/utils/currency";
import { useCart } from "@/components/storefront/CartContext";
import { ADDIS_ABABA_SUBCITIES, REGIONAL_CITIES } from "@/config/ethiopianLocations";
import {
  ShoppingBag,
  Store,
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Check,
} from "lucide-react";

interface ProductDetailClientProps {
  product: any;
  deliverySetting: any;
}

export function ProductDetailClient({ product, deliverySetting }: ProductDetailClientProps) {
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(
    product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Subcity delivery coverage checker state
  const [selectedArea, setSelectedArea] = useState("BOLE");

  const eligibleAreas: string[] = deliverySetting?.eligibleAreas || [
    "BOLE",
    "KIRKOS",
    "YEKA",
    "ARADA",
    "GULELE",
  ];
  const isEligible = eligibleAreas.includes(selectedArea);

  // Calculate delivery fee for selected area
  let fee = deliverySetting?.feeRules?.defaultFlatFee || 10000;
  if (deliverySetting?.feeRules?.areaOverrides) {
    const override = deliverySetting.feeRules.areaOverrides.find(
      (o: any) => o.areaCode === selectedArea
    );
    if (override) fee = override.fee;
  }

  const handleAddToCart = () => {
    addItem(
      {
        productId: product._id,
        title: product.title,
        price: product.price,
        image: selectedImage,
        sellerId: product.sellerId._id,
        storeName: product.sellerId.storeName,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-400 mb-6 flex items-center gap-2">
        <a href="/" className="hover:text-white">Home</a>
        <span>/</span>
        <a href="/catalog" className="hover:text-white">Catalog</a>
        <span>/</span>
        <span className="text-slate-200 truncate">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-black/50 border border-zemen-border">
            <img
              src={selectedImage}
              alt={product.title}
              className="h-full w-full object-cover object-center"
            />
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`h-20 w-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === img
                      ? "border-zemen-gold shadow-gold"
                      : "border-zemen-border opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="flex flex-col">
          {/* Seller Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fulfilled by {product.sellerId.storeName}</span>
            </span>
            <span className="text-xs text-slate-400">SKU: {product.sku}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {product.title}
          </h1>

          {/* Pricing */}
          <div className="mt-4 p-4 rounded-xl bg-zemen-card border border-zemen-border flex items-baseline justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Cash on Delivery (COD) Price
              </div>
              <div className="text-3xl font-black text-zemen-gold mt-1">
                {formatETB(product.price, true)}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                  product.stockQuantity > 0
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Sold Out"}
              </span>
            </div>
          </div>

          {/* Interactive Delivery Area Checker */}
          <div className="mt-6 p-4 rounded-xl bg-zemen-card/80 border border-zemen-border/90">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-zemen-gold" />
                <span>Check Subcity Delivery Coverage</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Seller Est: {deliverySetting?.feeRules?.estimatedDeliveryDays || 2} Days
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full bg-black/60 border border-zemen-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zemen-gold"
              >
                <optgroup label="Addis Ababa Subcities (ክፍለ ከተሞች)">
                  {ADDIS_ABABA_SUBCITIES.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.name} ({loc.amharicName})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Regional Cities">
                  {REGIONAL_CITIES.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.name} ({loc.amharicName})
                    </option>
                  ))}
                </optgroup>
              </select>

              <div className="w-full sm:w-auto flex-shrink-0">
                {isEligible ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/40 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Eligible (+{formatETB(fee, true)})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold px-2 py-1 bg-red-950/40 border border-red-500/20 rounded-lg">
                    <XCircle className="w-4 h-4" />
                    <span>Area Not Covered</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add to Cart Control */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-zemen-border rounded-xl bg-black/40">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 py-2.5 text-slate-300 hover:text-white text-sm"
              >
                -
              </button>
              <span className="px-3 text-sm font-bold text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                className="px-3.5 py-2.5 text-slate-300 hover:text-white text-sm"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                added
                  ? "bg-emerald-600 text-white"
                  : product.stockQuantity <= 0
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-zemen-gold hover:bg-zemen-gold-hover text-black shadow-gold"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Multi-Vendor Cart</span>
                </>
              )}
            </button>
          </div>

          {/* Description */}
          <div className="mt-8 pt-8 border-t border-zemen-border">
            <h3 className="text-sm font-bold text-white mb-2">Product Description</h3>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>

          {/* Seller Information Card */}
          <div className="mt-8 p-5 rounded-2xl bg-zemen-card border border-zemen-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Merchant Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">{product.sellerId.storeName}</h5>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zemen-gold" />
                  <span>
                    {product.sellerId.businessDetails?.subcityOrZone}, {product.sellerId.businessDetails?.city}
                  </span>
                </p>
              </div>
            </div>
            {product.sellerId.businessDetails?.description && (
              <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-zemen-border/60">
                {product.sellerId.businessDetails.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
