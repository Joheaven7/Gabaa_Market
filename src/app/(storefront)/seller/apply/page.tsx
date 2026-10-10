"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ADDIS_ABABA_SUBCITIES, REGIONAL_CITIES } from "@/config/ethiopianLocations";
import { Store, ShieldCheck, Banknote, Truck, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function SellerApplyPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [city, setCity] = useState("Addis Ababa");
  const [subcityOrZone, setSubcityOrZone] = useState("BOLE");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: "SELLER",
          storeName: storeName.trim(),
          city,
          subcityOrZone,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to submit seller application.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/seller/dashboard");
      }, 1500);
    } catch (e) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
          <Store className="w-3.5 h-3.5" />
          <span>ZEMEN MERCHANT NETWORK</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Sell Across Addis Ababa & Ethiopia
        </h1>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Join Ethiopia's curated marketplace. Fulfill your own orders with Cash-on-Delivery, set your delivery zones, and remit transparent 10% marketplace commission on an auditable ledger.
        </p>
      </div>

      {success ? (
        <div className="p-8 rounded-3xl bg-zemen-card border border-emerald-500/40 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Application Received!</h2>
          <p className="text-xs text-slate-300">
            Your store application has been logged. Redirecting to your merchant dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-8 rounded-3xl bg-zemen-card border border-zemen-border space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Store / Brand Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g., Entoto Leather Crafts"
                className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Contact Person Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Business Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@example.et"
                className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                Ethiopian Phone (+251) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 911 000000"
                className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Base City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
              >
                <option value="Addis Ababa">Addis Ababa (አዲስ አበባ)</option>
                <option value="Adama">Adama</option>
                <option value="Hawassa">Hawassa</option>
                <option value="Bahir Dar">Bahir Dar</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Subcity / Zone *</label>
              <select
                value={subcityOrZone}
                onChange={(e) => setSubcityOrZone(e.target.value)}
                className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
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
                      {loc.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="text-slate-300 block mb-1 font-semibold">Account Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
            />
          </div>

          <div className="text-xs">
            <label className="text-slate-300 block mb-1 font-semibold">
              Business / Store Overview (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell our administrators about your products, retail location, or warehouse..."
              className="w-full bg-black/40 border border-zemen-border rounded-xl px-3 py-2.5 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-zemen-gold hover:bg-zemen-gold-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-gold transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Merchant Profile...</span>
              </>
            ) : (
              <span>Submit Merchant Application</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
