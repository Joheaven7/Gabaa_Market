"use client";

import React, { useState } from "react";
import { formatETB } from "@/lib/utils/currency";
import { useCart } from "./CartContext";
import { ShoppingBag, Check, Store } from "lucide-react";

export interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    slug: string;
    price: number; // in ETB cents
    stockQuantity: number;
    images?: string[];
    sellerId: {
      _id: string;
      storeName: string;
    };
    category?: {
      name: string;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const mainImage =
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: mainImage,
      sellerId: product.sellerId._id,
      storeName: product.sellerId.storeName,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-zemen-card border border-zemen-border overflow-hidden glass-panel-hover">
      {/* Product Image */}
      <a href={`/products/${product.slug}`} className="relative aspect-square w-full overflow-hidden bg-black/40">
        <img
          src={mainImage}
          alt={product.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/75 backdrop-blur-md text-emerald-400 border border-emerald-500/20">
            <Store className="w-3 h-3" />
            <span>{product.sellerId.storeName}</span>
          </span>
        </div>

        {product.stockQuantity < 5 && product.stockQuantity > 0 && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Only {product.stockQuantity} left
          </span>
        )}
      </a>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] font-medium text-slate-400 mb-1">
          {product.category?.name || "Authentic Marketplace"}
        </div>

        <a href={`/products/${product.slug}`} className="hover:text-zemen-gold transition-colors">
          <h3 className="font-semibold text-sm text-slate-100 line-clamp-2 leading-snug">
            {product.title}
          </h3>
        </a>

        {/* Pricing & Add to Cart button */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-zemen-border/60">
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              COD Price
            </div>
            <div className="text-base font-extrabold text-zemen-gold">
              {formatETB(product.price, true)}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stockQuantity <= 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              added
                ? "bg-emerald-600 text-white"
                : product.stockQuantity <= 0
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-zemen-gold hover:bg-zemen-gold-hover text-black shadow-gold"
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : product.stockQuantity <= 0 ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
