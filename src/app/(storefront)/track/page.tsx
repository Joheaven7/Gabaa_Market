"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { formatETB } from "@/lib/utils/currency";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Store,
  AlertCircle,
  XCircle,
  Search,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export default function OrderTrackingPage() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Cancellation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const fetchOrder = async (token: string) => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/track?token=${encodeURIComponent(token.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Order not found. Please verify your tracking token.");
        setOrderData(null);
      } else {
        setOrderData(data.order);
      }
    } catch (e) {
      setError("Failed to fetch order. Please check network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      fetchOrder(initialToken);
    }
  }, [initialToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(tokenInput);
  };

  const handleCancelRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;

    setCancelLoading(true);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenInput.trim(),
          reason: cancelReason.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCancelMessage(data.message);
        // Refresh order details
        fetchOrder(tokenInput);
      } else {
        setError(data.error || "Failed to process cancellation.");
      }
    } catch (e) {
      setError("Cancellation request failed.");
    } finally {
      setCancelLoading(false);
      setIsCancelModalOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Track Multi-Vendor Order
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Enter your secure private tracking token to view independent merchant fulfillment progress
        </p>

        {/* Token Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2">
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste your 64-character tracking token..."
            className="flex-1 bg-zemen-card border border-zemen-border rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-zemen-gold font-mono"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-zemen-gold hover:bg-zemen-gold-hover text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-gold"
          >
            <Search className="w-4 h-4" />
            <span>Track</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cancelMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{cancelMessage}</span>
        </div>
      )}

      {orderData && (
        <div className="space-y-6">
          {/* Order Header Card */}
          <div className="p-6 rounded-2xl bg-zemen-card border border-zemen-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Order Reference</div>
              <div className="text-xl font-black text-white mt-0.5">{orderData.orderNumber}</div>
              <div className="text-xs text-slate-400 mt-1">
                Placed on {new Date(orderData.createdAt).toLocaleDateString()} • Destination:{" "}
                <span className="text-slate-200 font-medium">
                  {orderData.customerSummary.subcity}, {orderData.customerSummary.city}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  orderData.orderStatus === "CANCELLED"
                    ? "bg-red-950 text-red-400 border border-red-500/30"
                    : orderData.orderStatus === "COMPLETED"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-950 text-zemen-gold border border-zemen-gold/30"
                }`}
              >
                Order: {orderData.orderStatus}
              </span>

              {orderData.orderStatus !== "CANCELLED" && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-3 py-1 bg-red-950/40 hover:bg-red-900/50 border border-red-500/20 text-red-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Request Cancellation
                </button>
              )}
            </div>
          </div>

          {/* Cancellation Notice if requested */}
          {orderData.cancellationRequest?.requested && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
              <strong>Cancellation Status:</strong> {orderData.cancellationRequest.status}
              <div className="text-slate-300 text-[11px] mt-1">
                Reason: {orderData.cancellationRequest.reason}
              </div>
            </div>
          )}

          {/* Separate Seller Orders Breakdown */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Fulfillment by Seller ({orderData.sellerOrders.length} Shipments)
            </h2>

            {orderData.sellerOrders.map((so: any) => (
              <div
                key={so.sellerOrderId}
                className="rounded-2xl bg-zemen-card border border-zemen-border overflow-hidden"
              >
                {/* Store Bar */}
                <div className="bg-black/40 px-5 py-3 border-b border-zemen-border flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{so.storeName}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      Fulfillment:{" "}
                      <strong className="text-slate-200 font-semibold">{so.fulfillmentStatus}</strong>
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">
                      COD Payment:{" "}
                      <strong
                        className={
                          so.codCollectionStatus === "COLLECTED"
                            ? "text-emerald-400 font-semibold"
                            : "text-amber-400 font-semibold"
                        }
                      >
                        {so.codCollectionStatus}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Items in this seller order */}
                <div className="p-5 divide-y divide-zemen-border/50">
                  {so.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                        alt={item.title}
                        className="h-12 w-12 rounded-lg object-cover bg-black/40 border border-zemen-border"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-semibold text-white truncate">{item.title}</div>
                        <div className="text-slate-400 mt-0.5">
                          Quantity: {item.quantity} × {formatETB(item.price, true)}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-zemen-gold">
                        {formatETB(item.subtotal, true)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals for this shipment */}
                <div className="bg-black/20 px-5 py-3 border-t border-zemen-border/60 text-xs flex justify-between text-slate-400">
                  <span>
                    Items: {formatETB(so.itemsSubtotal, true)} • Delivery Fee: {formatETB(so.deliveryFee, true)}
                  </span>
                  <span className="font-bold text-white">
                    Shipment Total: {formatETB(so.itemsSubtotal + so.deliveryFee, true)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Totals */}
          <div className="p-6 rounded-2xl bg-zemen-card border border-zemen-border space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Combined Products Subtotal:</span>
              <span className="text-white font-semibold">{formatETB(orderData.totals.itemsSubtotal, true)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Combined Delivery Total:</span>
              <span className="text-emerald-400 font-semibold">
                {formatETB(orderData.totals.deliveryTotal, true)}
              </span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-zemen-border">
              <span>Total Payable on Delivery:</span>
              <span className="text-zemen-gold">{formatETB(orderData.totals.grandTotal, true)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Request Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zemen-card border border-zemen-border rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Request Order Cancellation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              If merchants have not yet dispatched your items, the order will be cancelled immediately and reserved inventory released.
            </p>

            <form onSubmit={handleCancelRequest} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Reason for Cancellation *</label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Changed my mind, ordered duplicate items..."
                  className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
                >
                  {cancelLoading ? "Submitting..." : "Submit Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
