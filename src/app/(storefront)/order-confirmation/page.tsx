"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Check, ArrowRight, ShieldAlert, PackageCheck } from "lucide-react";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "ZM-ORD";
  const token = searchParams.get("token") || "";

  const [copied, setCopied] = useState(false);

  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/track?token=${token}`
    : `/track?token=${token}`;

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="p-8 sm:p-12 rounded-3xl bg-zemen-card border border-zemen-border relative overflow-hidden shadow-2xl">
        <div className="h-16 w-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-emerald">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
          Order Successfully Confirmed
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
          Thank you for choosing Zemen Market
        </h1>
        <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
          Your order has been decomposed and routed to each respective seller. You will pay cash directly upon physical delivery.
        </p>

        {/* Order Reference Box */}
        <div className="mt-8 p-4 rounded-xl bg-black/50 border border-zemen-border flex items-center justify-between">
          <div className="text-left">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Order Reference</div>
            <div className="text-base font-extrabold text-zemen-gold">{orderNumber}</div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/20">
            Payment: COD Pending
          </span>
        </div>

        {/* Private Tracking Secret Link */}
        <div className="mt-6 p-5 rounded-2xl bg-amber-950/20 border border-zemen-gold/30 text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zemen-gold">
            <ShieldAlert className="w-4 h-4 text-zemen-gold" />
            <span>Private Guest Tracking Link</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Because this was placed as a guest order, your private tracking link is your unique credential to access fulfillment status and request cancellations.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={trackingUrl}
              className="flex-1 bg-black/60 border border-zemen-border rounded-lg px-3 py-2 text-xs text-slate-300 font-mono truncate"
            />
            <button
              onClick={copyToClipboard}
              className="px-3.5 py-2 bg-zemen-card hover:bg-slate-800 border border-zemen-border text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 transition-colors flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zemen-gold" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={trackingUrl}
            className="px-6 py-3.5 rounded-xl bg-zemen-gold hover:bg-zemen-gold-hover text-black font-bold text-sm flex items-center justify-center gap-2 shadow-gold transition-all"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Track Order Now</span>
          </a>
          <a
            href="/"
            className="px-6 py-3.5 rounded-xl bg-zemen-card border border-zemen-border hover:border-slate-500 text-slate-200 font-semibold text-sm flex items-center justify-center transition-all"
          >
            <span>Return to Homepage</span>
          </a>
        </div>
      </div>
    </div>
  );
}
