"use client";

import React from "react";
import { useCart } from "@/components/storefront/CartContext";
import { formatETB } from "@/lib/utils/currency";
import { Trash2, Store, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";

export default function CartPage() {
  const { items, itemsBySeller, updateQuantity, removeItem, clearCart, subtotal, totalCount } =
    useCart();

  const sellerEntries = Object.entries(itemsBySeller);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="p-12 rounded-3xl bg-zemen-card border border-zemen-border">
          <ShoppingBag className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Your Shopping Cart is Empty</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            Discover verified Ethiopian goods, authentic coffee, and electronics with Cash-on-Delivery.
          </p>
          <a
            href="/catalog"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-zemen-gold text-black font-bold text-sm shadow-gold"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between pb-6 border-b border-zemen-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Shopping Cart ({totalCount} items)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grouped across {sellerEntries.length} independent merchant{sellerEntries.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items Grouped by Seller */}
        <div className="lg:col-span-2 space-y-6">
          {sellerEntries.map(([sellerId, bucket]) => (
            <div
              key={sellerId}
              className="rounded-2xl bg-zemen-card border border-zemen-border overflow-hidden"
            >
              {/* Seller Header */}
              <div className="bg-emerald-950/40 border-b border-zemen-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">{bucket.storeName}</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Seller Subtotal:{" "}
                  <strong className="text-zemen-gold">
                    {formatETB(bucket.itemsSubtotal, true)}
                  </strong>
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-zemen-border/60 p-4 space-y-4">
                {bucket.items.map((item) => (
                  <div key={item.productId} className="flex gap-4 items-center pt-3 first:pt-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-16 rounded-xl object-cover bg-black/40 border border-zemen-border"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                      <div className="text-xs font-bold text-zemen-gold mt-0.5">
                        {formatETB(item.price, true)}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-zemen-border rounded-lg bg-black/30">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-300 hover:text-white text-xs"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="px-2.5 py-1 text-slate-300 hover:text-white text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Proceed CTA */}
        <div>
          <div className="p-6 rounded-2xl bg-zemen-card border border-zemen-border sticky top-24 space-y-5">
            <h3 className="text-base font-bold text-white">Order Breakdown</h3>

            <div className="space-y-3 text-xs text-slate-300 border-b border-zemen-border pb-4">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-white">{formatETB(subtotal, true)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Participating Merchants:</span>
                <span className="font-semibold">{sellerEntries.length} Stores</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Fees:</span>
                <span className="text-emerald-400 font-semibold">Calculated at Checkout</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Each merchant calculates delivery to your subcity and collects cash directly upon physical delivery.
              </span>
            </div>

            <a
              href="/checkout"
              className="w-full py-3.5 rounded-xl bg-zemen-gold hover:bg-zemen-gold-hover text-black font-bold text-sm flex items-center justify-center gap-2 shadow-gold transition-all"
            >
              <span>Proceed to Guest Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
