"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  Package,
  Boxes,
  Truck,
  Wallet,
  LogOut,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || (data.user?.role !== "SELLER" && data.user?.role !== "ADMIN")) {
          router.push("/auth/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zemen-dark text-slate-400 text-xs">
        Loading Seller Workspace...
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/seller/dashboard", icon: Store },
    { label: "Orders & COD", href: "/seller/orders", icon: Package },
    { label: "Products & Stock", href: "/seller/products", icon: Boxes },
    { label: "Delivery Coverage", href: "/seller/delivery", icon: Truck },
    { label: "Finance & Ledger", href: "/seller/finance", icon: Wallet },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#060B10]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-zemen-dark border-r border-zemen-border flex flex-col p-4 md:min-h-screen">
        {/* Store Profile Card */}
        <div className="p-3.5 rounded-2xl bg-zemen-card border border-zemen-border mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
              <Store className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-xs truncate">
                {user?.storeName || "My Store"}
              </h3>
              <span className="text-[10px] text-emerald-400 font-medium">Verified Merchant</span>
            </div>
          </div>

          {user?.sellerStatus === "PENDING_APPROVAL" && (
            <div className="mt-2.5 p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Application Awaiting Admin Approval</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? "bg-zemen-gold text-black font-bold shadow-gold"
                    : "text-slate-300 hover:bg-zemen-card hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </a>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="pt-4 border-t border-zemen-border/60 flex flex-col gap-2">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Storefront View</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
