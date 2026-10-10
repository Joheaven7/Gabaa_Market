"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Search, ShieldCheck, MapPin, User, LogOut, PackageCheck, Store } from "lucide-react";
import { useCart } from "@/components/storefront/CartContext";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<{ name?: string; role?: string; storeName?: string } | null>(null);

  useEffect(() => {
    // Check current user session
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zemen-border/80 bg-zemen-dark/95 backdrop-blur-md">
      {/* Top Banner: Ethiopian Marketplace Trust Bar */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-zemen-dark to-amber-950/70 px-4 py-1.5 text-xs text-slate-300 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-emerald-400">100% Cash-on-Delivery (COD)</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Direct Local Seller Delivery Across Addis Ababa</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="/track" className="hover:text-zemen-gold transition-colors flex items-center gap-1">
              <PackageCheck className="w-3.5 h-3.5 text-zemen-gold" />
              <span>Track Order</span>
            </a>
            <span>•</span>
            <a href="/seller/apply" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sell on Zemen</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-zemen-gold to-amber-700 flex items-center justify-center shadow-gold font-bold text-black text-xl tracking-tighter">
            ZM
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              <span>ZEMEN</span>
              <span className="text-zemen-gold font-light">MARKET</span>
            </div>
            <div className="text-[10px] tracking-widest text-emerald-400 uppercase font-semibold">
              ዘመን ገበያ • ETHIOPIA
            </div>
          </div>
        </a>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:flex items-center relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Yirgacheffe coffee, tech gadgets, leather craft..."
            className="w-full bg-zemen-card border border-zemen-border rounded-xl pl-10 pr-24 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-zemen-gold transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 bg-zemen-gold hover:bg-zemen-gold-hover text-black font-semibold text-xs rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a
            href="/catalog"
            className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Explore Catalog
          </a>

          {/* User / Portal buttons */}
          {user ? (
            <div className="flex items-center gap-2">
              {user.role === "SELLER" && (
                <a
                  href="/seller/dashboard"
                  className="text-xs bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-3 py-2 rounded-lg font-medium hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{user.storeName || "Seller Portal"}</span>
                </a>
              )}
              {user.role === "ADMIN" && (
                <a
                  href="/admin/dashboard"
                  className="text-xs bg-amber-950/80 border border-zemen-gold/40 text-zemen-gold px-3 py-2 rounded-lg font-medium hover:bg-amber-900/60 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </a>
              )}
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <a
              href="/auth/login"
              className="text-xs text-slate-300 hover:text-white border border-zemen-border px-3.5 py-2 rounded-lg hover:border-slate-500 transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-zemen-gold" />
              <span>Sign In</span>
            </a>
          )}

          {/* Cart Trigger */}
          <a
            href="/cart"
            className="relative p-2.5 bg-zemen-card border border-zemen-border hover:border-zemen-gold text-white rounded-xl transition-all flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5 text-zemen-gold" />
            <span className="hidden sm:inline text-xs font-semibold">Cart</span>
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center animate-scale">
                {totalCount}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  );
}
