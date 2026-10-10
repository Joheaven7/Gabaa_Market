"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/storefront/CartContext";
import { formatETB } from "@/lib/utils/currency";
import { isValidEthiopianPhone } from "@/lib/utils/phone";
import { ADDIS_ABABA_SUBCITIES, REGIONAL_CITIES } from "@/config/ethiopianLocations";
import { ShieldCheck, Truck, Banknote, AlertCircle, Loader2, Store, CheckCircle2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemsBySeller, subtotal, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Addis Ababa");
  const [subcityOrZone, setSubcityOrZone] = useState("BOLE");
  const [woreda, setWoreda] = useState("");
  const [landmark, setLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<string[]>([]);

  const sellerEntries = Object.entries(itemsBySeller);

  // Approximate delivery fee preview based on subcity (server re-validates and calculates exact fee)
  const isAddis = city === "Addis Ababa";
  const estimatedDeliveryPerSeller = isAddis ? 15000 : 35000; // 150 ETB in Addis, 350 regional
  const estimatedTotalDelivery = sellerEntries.length * estimatedDeliveryPerSeller;
  const estimatedGrandTotal = subtotal + estimatedTotalDelivery;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setItemErrors([]);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!isValidEthiopianPhone(phone)) {
      setErrorMessage(
        "Please provide a valid Ethiopian mobile phone (e.g. +251 911 223344 or 0911223344)."
      );
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          deliveryAddress: {
            city: city.trim(),
            subcityOrZone,
            woreda: woreda.trim() || undefined,
            landmark: landmark.trim() || undefined,
            deliveryNotes: deliveryNotes.trim() || undefined,
          },
        },
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Order submission failed.");
        if (data.itemErrors) {
          setItemErrors(data.itemErrors);
        }
        setLoading(false);
        return;
      }

      // Order created successfully! Clear cart & navigate to confirmation
      clearCart();
      router.push(
        `/order-confirmation?orderNumber=${encodeURIComponent(
          data.orderNumber
        )}&token=${encodeURIComponent(data.trackingToken)}`
      );
    } catch (err: any) {
      console.error("Checkout error:", err);
      setErrorMessage("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400 mt-2">Add items to proceed to checkout.</p>
        <a
          href="/catalog"
          className="mt-4 inline-block px-4 py-2 bg-zemen-gold text-black rounded-lg text-xs font-bold"
        >
          Go to Catalog
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="pb-6 border-b border-zemen-border">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Guest Cash-on-Delivery Checkout
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          No mandatory account creation. Enter your delivery address and pay cash on physical delivery.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          {itemErrors.length > 0 && (
            <ul className="list-disc pl-6 space-y-1 text-slate-300">
              {itemErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer & Address Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details */}
          <div className="p-6 rounded-2xl bg-zemen-card border border-zemen-border space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-zemen-gold text-black text-xs font-bold flex items-center justify-center">
                1
              </span>
              <span>Recipient Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Abebe Kebede"
                  className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zemen-gold"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Ethiopian Mobile Phone (+251) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 911 223344"
                  className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zemen-gold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Delivery driver calls this number prior to arrival
                </span>
              </div>
            </div>

            <div className="text-xs">
              <label className="text-slate-300 block mb-1 font-medium">
                Email Address (Optional, for tracking receipt)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abebe@gmail.com"
                className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zemen-gold"
              />
            </div>
          </div>

          {/* Delivery Location */}
          <div className="p-6 rounded-2xl bg-zemen-card border border-zemen-border space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-500 text-black text-xs font-bold flex items-center justify-center">
                2
              </span>
              <span>Delivery Destination (Ethiopian Address)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zemen-gold"
                >
                  <option value="Addis Ababa">Addis Ababa (አዲስ አበባ)</option>
                  <option value="Adama">Adama (Nazret)</option>
                  <option value="Hawassa">Hawassa</option>
                  <option value="Bahir Dar">Bahir Dar</option>
                  <option value="Dire Dawa">Dire Dawa</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Subcity or Zone (ክፍለ ከተማ) *
                </label>
                <select
                  value={subcityOrZone}
                  onChange={(e) => setSubcityOrZone(e.target.value)}
                  className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zemen-gold"
                >
                  <optgroup label="Addis Ababa Subcities">
                    {ADDIS_ABABA_SUBCITIES.map((loc) => (
                      <option key={loc.code} value={loc.code}>
                        {loc.name} ({loc.amharicName})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Regional Locations">
                    {REGIONAL_CITIES.map((loc) => (
                      <option key={loc.code} value={loc.code}>
                        {loc.name} ({loc.amharicName})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Woreda / Kebele</label>
                <input
                  type="text"
                  value={woreda}
                  onChange={(e) => setWoreda(e.target.value)}
                  placeholder="Woreda 03"
                  className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Nearby Landmark / Building *
                </label>
                <input
                  type="text"
                  required
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Behind Edna Mall, near Tele compound"
                  className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="text-slate-300 block mb-1 font-medium">
                Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Call before arrival, gate is green..."
                className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
              />
            </div>
          </div>
        </div>

        {/* Order Review & COD Confirmation */}
        <div>
          <div className="p-6 rounded-2xl bg-zemen-card border border-zemen-border sticky top-24 space-y-5">
            <h3 className="text-base font-bold text-white">Order Summary</h3>

            {/* Split breakdown by seller */}
            <div className="space-y-4 text-xs divide-y divide-zemen-border/60">
              {sellerEntries.map(([sellerId, bucket]) => (
                <div key={sellerId} className="pt-3 first:pt-0">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1.5">
                    <Store className="w-3.5 h-3.5" />
                    <span>{bucket.storeName}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>{bucket.items.length} item(s)</span>
                    <span>{formatETB(bucket.itemsSubtotal, true)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 mt-1">
                    <span>Est. Delivery:</span>
                    <span>{formatETB(estimatedDeliveryPerSeller, true)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zemen-border space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal:</span>
                <span className="font-bold text-white">{formatETB(subtotal, true)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Est. Delivery Total:</span>
                <span className="font-bold text-emerald-400">
                  {formatETB(estimatedTotalDelivery, true)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-zemen-border">
                <span>Grand Total (ETB):</span>
                <span className="text-zemen-gold">{formatETB(estimatedGrandTotal, true)}</span>
              </div>
            </div>

            {/* Payment Method Callout */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Banknote className="w-4 h-4" />
                <span>Payment: 100% Cash-on-Delivery</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                You will hand physical cash directly to each merchant upon physical receipt of your goods. No prepayment required.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-zemen-gold hover:bg-zemen-gold-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating & Processing Order...</span>
                </>
              ) : (
                <span>Confirm Cash-on-Delivery Order</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
