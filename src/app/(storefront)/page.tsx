import React from "react";
import { connectDB } from "@/lib/db/mongodb";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ShieldCheck, Truck, Banknote, Sparkles, ArrowRight, Store, CheckCircle2 } from "lucide-react";

async function getHomeData() {
  try {
    await connectDB();
    const categories = await Category.find({ status: "ACTIVE" }).sort({ sortOrder: 1 }).lean();
    const products = await Product.find({ status: "APPROVED", isDeleted: false })
      .populate("sellerId", "storeName status")
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    return {
      categories: JSON.parse(JSON.stringify(categories)),
      products: JSON.parse(JSON.stringify(products)),
    };
  } catch (error) {
    console.error("Home data load error:", error);
    return { categories: [], products: [] };
  }
}

export default async function HomePage() {
  const { categories, products } = await getHomeData();

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-zemen-border/60">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-600/15 via-emerald-600/10 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zemen-card border border-zemen-gold/30 text-xs font-semibold text-zemen-gold mb-6 shadow-gold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ZEMEN MARKET (ዘመን ገበያ) — Ethiopia's Multi-Vendor Commerce</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Curated Local Goods. <br />
              <span className="gold-gradient-text">Verified Cash-on-Delivery.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Shop directly from top verified merchants across Addis Ababa. Premium single-origin coffee, certified electronics, and authentic handcrafts delivered to your subcity with 100% Cash-on-Delivery.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/catalog"
                className="px-6 py-3.5 rounded-xl bg-zemen-gold hover:bg-zemen-gold-hover text-black font-bold text-sm flex items-center gap-2 shadow-gold transition-all"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/seller/apply"
                className="px-6 py-3.5 rounded-xl bg-zemen-card border border-zemen-border hover:border-slate-500 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Sell on Zemen</span>
              </a>
            </div>

            {/* Key Trust Signals */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl text-left">
              <div className="p-3.5 rounded-xl bg-zemen-card/60 border border-zemen-border/80">
                <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% COD</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Pay only upon inspection</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zemen-card/60 border border-zemen-border/80">
                <div className="text-zemen-gold font-bold text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>11 Subcities</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Addis-wide seller delivery</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zemen-card/60 border border-zemen-border/80">
                <div className="text-blue-400 font-bold text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Moderated</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Pre-screened products</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zemen-card/60 border border-zemen-border/80">
                <div className="text-purple-400 font-bold text-sm flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" />
                  <span>ETB Pricing</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Exact transparent pricing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Featured Categories
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Explore authentic Ethiopian selections</p>
            </div>
            <a href="/catalog" className="text-xs font-semibold text-zemen-gold hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat: any) => (
              <a
                key={cat._id}
                href={`/catalog?category=${cat.slug}`}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-zemen-card border border-zemen-border/80 glass-panel-hover"
              >
                <img
                  src={cat.image || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"}
                  alt={cat.name}
                  className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-xs text-emerald-400 font-medium">{cat.amharicName}</span>
                  <h3 className="text-sm font-bold text-white group-hover:text-zemen-gold transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Featured Verified Listings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspected and approved by marketplace administrators
            </p>
          </div>
          <a href="/catalog" className="text-xs font-semibold text-zemen-gold hover:underline flex items-center gap-1">
            <span>Explore All ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod: any) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-zemen-card border border-zemen-border">
            <p className="text-sm text-slate-400">
              Welcome to ZEMEN MARKET! Run <code className="text-zemen-gold">npm run seed</code> to populate authentic Ethiopian products and merchants.
            </p>
          </div>
        )}
      </section>

      {/* How It Works Banner */}
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="rounded-3xl bg-gradient-to-br from-zemen-card via-[#0D1622] to-[#0A121A] border border-zemen-border p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
              Transparent Multi-Vendor Lifecycle
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              How Zemen Market Protects You
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-zemen-gold flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="font-bold text-white text-base">Guest Multi-Vendor Order</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add items from any seller into a single unified cart. The server calculates delivery fees per merchant based on your subcity.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-white text-base">Independent Merchant Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Each merchant dispatches your package directly. Track progress securely using your private random tracking token.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-white text-base">Inspect & Cash Payment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You only pay cash upon physical delivery. Sellers record collection, and our double-entry ledger reconciles marketplace commission.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
