"use client";

import React, { useEffect, useState } from "react";
import { formatETB } from "@/lib/utils/currency";
import {
  Package,
  Truck,
  Banknote,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Phone,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // COD Collection Modal State
  const [isCodModalOpen, setIsCodModalOpen] = useState(false);
  const [codAmount, setCodAmount] = useState<number>(0);
  const [codEvidence, setCodEvidence] = useState("");
  const [codSubmitting, setCodSubmitting] = useState(false);

  // Delivery Failure Modal State
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [failReason, setFailReason] = useState("");

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/seller/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateFulfillment = async (sellerOrderId: string, nextStatus: string) => {
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerOrderId,
          action: "UPDATE_FULFILLMENT",
          fulfillmentStatus: nextStatus,
        }),
      });

      if (res.ok) {
        loadOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openCodModal = (order: any) => {
    setSelectedOrder(order);
    setCodAmount(order.itemsSubtotal + order.deliveryFee); // Full expected amount in subunits
    setCodEvidence("Cash handed to driver at delivery");
    setIsCodModalOpen(true);
  };

  const handleRecordCodCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setCodSubmitting(true);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerOrderId: selectedOrder._id,
          action: "RECORD_COD_COLLECTION",
          codData: {
            collectedAmount: Number(codAmount),
            evidence: codEvidence.trim(),
            collectionDate: new Date(),
          },
        }),
      });

      if (res.ok) {
        setIsCodModalOpen(false);
        loadOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCodSubmitting(false);
    }
  };

  const openFailModal = (order: any) => {
    setSelectedOrder(order);
    setFailReason("Customer phone switched off / unreachable after 3 attempts");
    setIsFailModalOpen(true);
  };

  const handleFailDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerOrderId: selectedOrder._id,
          action: "UPDATE_FULFILLMENT",
          fulfillmentStatus: "DELIVERY_FAILED",
          failureReason: failReason.trim(),
        }),
      });

      if (res.ok) {
        setIsFailModalOpen(false);
        loadOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Shipment Fulfillment & Cash Collection
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Fulfill customer orders independently and record verified cash-on-delivery payments
        </p>
      </div>

      {loading ? (
        <div className="text-xs text-slate-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zemen-card border border-zemen-border">
          <Package className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="font-bold text-white text-base">No Customer Orders Yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Orders placed on the storefront will appear here for fulfillment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((so) => (
            <div
              key={so._id}
              className="p-6 rounded-2xl bg-zemen-card border border-zemen-border space-y-5"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zemen-border/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-white">
                      {so.orderId?.orderNumber}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {new Date(so.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-zemen-gold" />
                      <strong>{so.orderId?.customerSnapshot?.phone}</strong> (
                      {so.orderId?.customerSnapshot?.name})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {so.orderId?.customerSnapshot?.deliveryAddress?.subcityOrZone},{" "}
                      {so.orderId?.customerSnapshot?.deliveryAddress?.city} (
                      {so.orderId?.customerSnapshot?.deliveryAddress?.landmark})
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 border border-slate-700 text-slate-200">
                    Fulfillment: <strong>{so.fulfillmentStatus}</strong>
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      so.codCollectionStatus === "COLLECTED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-950 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    COD Cash: <strong>{so.codCollectionStatus}</strong>
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Items to Dispatch:
                  </span>
                  <div className="divide-y divide-zemen-border/40">
                    {so.itemsSnapshot.map((item: any, i: number) => (
                      <div key={i} className="py-2 first:pt-0 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-white">{item.title}</div>
                          <div className="text-slate-400 text-[11px]">
                            Qty: {item.quantity} • SKU: {item.sku}
                          </div>
                        </div>
                        <div className="font-bold text-slate-200">{formatETB(item.subtotal, true)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="p-4 rounded-xl bg-black/40 border border-zemen-border/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Products Subtotal:</span>
                    <span className="font-semibold text-white">{formatETB(so.itemsSubtotal, true)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Delivery Fee (Retained 100% by Seller):</span>
                    <span className="font-semibold text-emerald-400">{formatETB(so.deliveryFee, true)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Marketplace Commission (10% of items):</span>
                    <span className="text-zemen-gold font-semibold">-{formatETB(so.commissionAmount, true)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-2 border-t border-zemen-border">
                    <span>Your Net Payout Basis:</span>
                    <span className="text-emerald-300">{formatETB(so.sellerNetAmount, true)}</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-4 border-t border-zemen-border/60 flex flex-wrap items-center justify-between gap-3">
                {/* Fulfillment workflow steps */}
                <div className="flex items-center gap-2 flex-wrap">
                  {so.fulfillmentStatus === "PENDING" && (
                    <button
                      onClick={() => handleUpdateFulfillment(so._id, "ACCEPTED")}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Accept Order
                    </button>
                  )}

                  {so.fulfillmentStatus === "ACCEPTED" && (
                    <button
                      onClick={() => handleUpdateFulfillment(so._id, "PROCESSING")}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Start Packing (Processing)
                    </button>
                  )}

                  {so.fulfillmentStatus === "PROCESSING" && (
                    <button
                      onClick={() => handleUpdateFulfillment(so._id, "READY_TO_DISPATCH")}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Ready for Dispatch
                    </button>
                  )}

                  {so.fulfillmentStatus === "READY_TO_DISPATCH" && (
                    <button
                      onClick={() => handleUpdateFulfillment(so._id, "SHIPPED")}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Dispatched with Driver (Shipped)
                    </button>
                  )}

                  {so.fulfillmentStatus === "SHIPPED" && (
                    <>
                      <button
                        onClick={() => handleUpdateFulfillment(so._id, "DELIVERED")}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Mark Handed Over (Delivered)
                      </button>
                      <button
                        onClick={() => openFailModal(so)}
                        className="px-3.5 py-2 bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Report Delivery Failure
                      </button>
                    </>
                  )}
                </div>

                {/* Independent COD Collection Action Button */}
                <div>
                  {so.codCollectionStatus !== "COLLECTED" ? (
                    <button
                      onClick={() => openCodModal(so)}
                      className="px-4 py-2 bg-zemen-gold hover:bg-zemen-gold-hover text-black rounded-xl text-xs font-black shadow-gold flex items-center gap-1.5 transition-all"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Record COD Cash Collection</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        COD Collected: {formatETB(so.codCollectedAmount || so.itemsSubtotal + so.deliveryFee, true)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COD Collection Recording Modal */}
      {isCodModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zemen-card border border-zemen-border rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Banknote className="w-5 h-5 text-zemen-gold" />
              <span>Record Physical Cash Collection</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Delivery and payment are tracked separately. Recording cash collection will post a 10% platform commission obligation to your ledger.
            </p>

            <form onSubmit={handleRecordCodCollection} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Actual Cash Collected (in ETB Santims/Cents) *
                </label>
                <input
                  type="number"
                  required
                  value={codAmount}
                  onChange={(e) => setCodAmount(Number(e.target.value))}
                  className="w-full bg-black/50 border border-zemen-border rounded-xl px-3 py-2 text-white font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Expected: {formatETB(selectedOrder.itemsSubtotal + selectedOrder.deliveryFee, true)}
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Receipt / Evidence Reference *
                </label>
                <input
                  type="text"
                  required
                  value={codEvidence}
                  onChange={(e) => setCodEvidence(e.target.value)}
                  placeholder="e.g. Receipt #9021 signed by customer"
                  className="w-full bg-black/50 border border-zemen-border rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCodModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={codSubmitting}
                  className="px-4 py-2 bg-zemen-gold hover:bg-zemen-gold-hover text-black rounded-lg font-bold shadow-gold"
                >
                  {codSubmitting ? "Recording..." : "Confirm Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Failure Modal */}
      {isFailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zemen-card border border-zemen-border rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Report Delivery Failure</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Marking an order as failed will release customer obligation, mark COD uncollected, and automatically return items to active stock.
            </p>

            <form onSubmit={handleFailDelivery} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Failure Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  className="w-full bg-black/50 border border-zemen-border rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFailModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold"
                >
                  Confirm Failed Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
