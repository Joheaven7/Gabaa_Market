import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/storefront/CartContext";

export const metadata: Metadata = {
  title: "ZEMEN MARKET (ዘመን ገበያ) — Ethiopia's Premier Multi-Vendor Marketplace",
  description:
    "Discover authentic Ethiopian coffee, electronics, artisan crafts, and fashion with independent seller fulfillment, Cash on Delivery (COD), and Addis Ababa subcity delivery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-zemen-dark text-slate-100 antialiased selection:bg-zemen-gold selection:text-black">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
