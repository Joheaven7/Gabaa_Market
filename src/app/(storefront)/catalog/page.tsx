import React from "react";
import { connectDB } from "@/lib/db/mongodb";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

interface CatalogPageProps {
  searchParams: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

async function getCatalogData(params: CatalogPageProps["searchParams"]) {
  try {
    await connectDB();
    const categories = await Category.find({ status: "ACTIVE" }).sort({ sortOrder: 1 }).lean();

    const filter: any = { status: "APPROVED", isDeleted: false };

    if (params.q) {
      filter.$or = [
        { title: { $regex: params.q.trim(), $options: "i" } },
        { description: { $regex: params.q.trim(), $options: "i" } },
      ];
    }

    if (params.category) {
      const cat = await Category.findOne({ slug: params.category });
      if (cat) filter.categoryId = cat._id;
    }

    if (params.minPrice || params.maxPrice) {
      filter.price = {};
      if (params.minPrice) filter.price.$gte = Number(params.minPrice) * 100;
      if (params.maxPrice) filter.price.$lte = Number(params.maxPrice) * 100;
    }

    const products = await Product.find(filter)
      .populate("sellerId", "storeName status")
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    const approvedProducts = products.filter(
      (p) => (p.sellerId as any)?.status === "APPROVED"
    );

    return {
      categories: JSON.parse(JSON.stringify(categories)),
      products: JSON.parse(JSON.stringify(approvedProducts)),
    };
  } catch (e) {
    console.error("Catalog data load error:", e);
    return { categories: [], products: [] };
  }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { categories, products } = await getCatalogData(searchParams);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zemen-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Marketplace Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified listings fulfilled with independent seller delivery
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-zemen-gold">{products.length}</span> available items
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-zemen-card border border-zemen-border">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-zemen-gold" />
              <span>Categories</span>
            </h3>

            <div className="flex flex-col gap-1.5 text-xs">
              <a
                href="/catalog"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  !searchParams.category
                    ? "bg-zemen-gold text-black font-semibold"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                All Categories
              </a>
              {categories.map((cat: any) => (
                <a
                  key={cat._id}
                  href={`/catalog?category=${cat.slug}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}`}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    searchParams.category === cat.slug
                      ? "bg-zemen-gold text-black font-semibold"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.amharicName && (
                    <span className="text-[10px] opacity-75">{cat.amharicName}</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zemen-card border border-zemen-border">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Price Range (ETB)</span>
            </h3>
            <form action="/catalog" method="GET" className="flex flex-col gap-3">
              {searchParams.category && (
                <input type="hidden" name="category" value={searchParams.category} />
              )}
              {searchParams.q && <input type="hidden" name="q" value={searchParams.q} />}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Min (ETB)</label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={searchParams.minPrice || ""}
                    placeholder="0"
                    className="w-full bg-black/40 border border-zemen-border rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Max (ETB)</label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={searchParams.maxPrice || ""}
                    placeholder="50000"
                    className="w-full bg-black/40 border border-zemen-border rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition-colors"
              >
                Apply Filter
              </button>
            </form>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((p: any) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-zemen-card border border-zemen-border">
              <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="font-semibold text-white text-base">No products match your criteria</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting a different category or clearing your search filters.
              </p>
              <a
                href="/catalog"
                className="inline-block mt-4 px-4 py-2 bg-zemen-gold text-black rounded-lg text-xs font-semibold"
              >
                Reset Filters
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
