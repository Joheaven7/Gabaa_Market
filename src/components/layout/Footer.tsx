import React from "react";
import { ShieldCheck, Truck, Banknote, RefreshCw } from "lucide-react";
import { ADDIS_ABABA_SUBCITIES } from "@/config/ethiopianLocations";

export function Footer() {
  return (
    <footer className="w-full bg-[#05090D] border-t border-zemen-border text-slate-400 text-sm mt-20">
      {/* 4 Pillars of ZEMEN MARKET */}
      <div className="max-w-7xl mx-auto px-4 py-12 border-b border-zemen-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/20 text-emerald-400">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Cash-on-Delivery (COD)</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Pay physical cash directly to your merchant only upon receiving and inspecting your items.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-950/60 border border-zemen-gold/20 text-zemen-gold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Direct Merchant Delivery</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Each seller manages their own fast delivery tailored to your Addis Ababa subcity or regional zone.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Pre-Screened Merchants</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Every seller profile and product listing undergoes strict admin moderation before publication.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/20 text-purple-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">48-Hour Return Window</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Published return policy with administrative dispute resolution for complete buyer peace of mind.
            </p>
          </div>
        </div>
      </div>

      {/* Addis Ababa Subcity Coverage Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-b border-zemen-border/30">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
          Serving All Addis Ababa Subcities (የአዲስ አበባ ክፍለ ከተሞች):
        </h5>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {ADDIS_ABABA_SUBCITIES.map((subcity) => (
            <span
              key={subcity.code}
              className="px-2.5 py-1 rounded-md bg-zemen-card border border-zemen-border/60 hover:border-zemen-gold/40 text-slate-300 transition-colors"
            >
              {subcity.name} ({subcity.amharicName})
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-md bg-zemen-card border border-zemen-border/60 text-emerald-400 font-medium">
            + Adama, Hawassa, Bahir Dar, Dire Dawa
          </span>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <span className="text-slate-300 font-bold tracking-tight text-sm">
            ZEMEN MARKET (ዘመን ገበያ)
          </span>
          <span>© {new Date().getFullYear()} Zemen Marketplace Technologies PLC. All rights reserved.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <a href="/track" className="hover:text-zemen-gold transition-colors">
            Guest Order Tracking
          </a>
          <a href="/seller/apply" className="hover:text-emerald-400 transition-colors">
            Merchant Application
          </a>
          <a href="/auth/login" className="hover:text-white transition-colors">
            Sign In / Staff Portal
          </a>
        </div>
      </div>
    </footer>
  );
}
