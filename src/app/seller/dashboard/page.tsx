"use client";

import React, { useEffect, useState } from "react";
import { formatETB } from "@/lib/utils/currency";
import { Package, Banknote, Clock, Wallet, ArrowRight, Store, Truck } from "lucide-react";

export default function SellerDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/orders").then((res) => res.json()),
      fetch("/api/seller/remittances").then((res) => res.json()),
    ])
      .then(([ordersData, financeData]) => {
        if (ordersData.success) setOrders(ordersData.orders || []);
        if (financeData.success) setFinance(financeData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-slate-400">Loading store analytics...</div>;
  }

  const pendingFulfillmentCount = orders.filter((o) =>
    ["PENDING", "ACCEPTED", "PROCESSING"].includes(o.fulfillmentStatus)
  ).length;

  const totalCodCollected = orders
    .filter((o) => o.codCollectionStatus === "COLLECTED")
    .reduce((acc, o) => acc + (o.codCollectedAmount || o.itemsSubtotal + o.deliveryFee), 0);

  const outstandingCommission = finance?.balance?.outstandingBalance || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Merchant Workspace</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor your customer orders, physical COD cash collections, and marketplace obligations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-zemen-card border border-zemen-border space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Orders Needing Action</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{pendingFulfillmentCount}</div>
          <p className="text-[11px] text-amber-400">Awaiting processing or dispatch</p>
        </div>

        <div className="p-5 rounded-2xl bg-zemen-card border border-zemen-border space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Shipments</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{orders.length}</div>
          <p className="text-[11px] text-slate-400">All-time seller orders</p>
        </div>

        <div className="p-5 rounded-2xl bg-zemen-card border border-zemen-border space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">COD Cash Collected</span>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {formatETB(totalCodCollected, true)}
          </div>
          <p className="text-[11px] text-slate-400">Collected directly from buyers</p>
        </div>

        <div className="p-5 rounded-2xl bg-zemen-card border border-zemen-border space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Commission Due</span>
            <Wallet className="w-4 h-4 text-zemen-gold" />
          </div>
          <div className="text-2xl font-extrabold text-zemen-gold">
            {formatETB(outstandingCommission, true)}
          </div>
          <p className="text-[11px] text-slate-400">10% Platform fee on collected sales</p>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="p-6 rounded-2xl bg-zemen-card border border-zemen-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Recent Orders Needing Fulfillment</h2>
          <a
            href="/seller/orders"
            className="text-xs text-zemen-gold hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zemen-border text-slate-400">
                  <th className="pb-3 font-semibold">Order #</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Subcity</th>
                  <th className="pb-3 font-semibold">Fulfillment</th>
                  <th className="pb-3 font-semibold">COD Status</th>
                  <th className="pb-3 font-semibold">Items Subtotal</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zemen-border/50">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o._id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono font-bold text-white">{o.orderId?.orderNumber}</td>
                    <td className="py-3 text-slate-300">{o.orderId?.customerSnapshot?.name}</td>
                    <td className="py-3 text-slate-400">
                      {o.orderId?.customerSnapshot?.deliveryAddress?.subcityOrZone}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/40 border border-slate-700 text-slate-200">
                        {o.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          o.codCollectionStatus === "COLLECTED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-950 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {o.codCollectionStatus}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-white">
                      {formatETB(o.itemsSubtotal, true)}
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href="/seller/orders"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium"
                      >
                        Fulfill
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No orders placed yet. Products approved in the catalog will appear here when purchased.
          </div>
        )}
      </div>
    </div>
  );
}
