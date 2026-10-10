"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, Store } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Login failed. Please check credentials.");
        setLoading(false);
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (data.user.role === "SELLER") {
        router.push("/seller/dashboard");
      } else {
        router.push("/");
      }
    } catch (e) {
      setError("Network error occurred.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-8 rounded-3xl bg-zemen-card border border-zemen-border shadow-2xl space-y-6">
        <div className="text-center">
          <div className="h-12 w-12 rounded-2xl bg-zemen-gold/10 border border-zemen-gold/30 text-zemen-gold flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Sign In to Zemen</h1>
          <p className="text-xs text-slate-400 mt-1">Access your customer, seller, or admin portal</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.et"
                className="w-full bg-black/40 border border-zemen-border rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-zemen-gold"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-zemen-border rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-zemen-gold"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-zemen-gold hover:bg-zemen-gold-hover text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-gold transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quick Testing Pre-fills */}
        <div className="pt-4 border-t border-zemen-border/60">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2 text-center">
            Demo / Testing Credentials
          </span>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@zemenmarket.et", "admin123456")}
              className="p-2 rounded-lg bg-black/40 hover:bg-black/60 border border-zemen-border/80 text-left text-xs flex items-center justify-between text-slate-300"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zemen-gold" />
                <span className="font-semibold text-white">Admin Demo</span>
              </div>
              <span className="text-[10px] text-slate-500">admin@zemenmarket.et</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("yonas@addistech.et", "seller123456")}
              className="p-2 rounded-lg bg-black/40 hover:bg-black/60 border border-zemen-border/80 text-left text-xs flex items-center justify-between text-slate-300"
            >
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">Seller Demo (Addis Tech)</span>
              </div>
              <span className="text-[10px] text-slate-500">yonas@addistech.et</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          Want to sell on Zemen?{" "}
          <a href="/seller/apply" className="text-emerald-400 hover:underline font-semibold">
            Apply as Merchant
          </a>
        </div>
      </div>
    </div>
  );
}
