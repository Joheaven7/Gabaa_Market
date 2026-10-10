"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  title: string;
  price: number; // in ETB cents
  quantity: number;
  image: string;
  sellerId: string;
  storeName: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  itemsBySeller: Record<
    string,
    {
      storeName: string;
      items: CartItem[];
      itemsSubtotal: number;
    }
  >;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("zemen_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("zemen_cart", JSON.stringify(items));
      } catch (e) {
        console.error("Failed to persist cart to storage:", e);
      }
    }
  }, [items, isInitialized]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(10, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.max(1, quantity) }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(10, quantity) } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  // Group items by seller
  const itemsBySeller: Record<
    string,
    { storeName: string; items: CartItem[]; itemsSubtotal: number }
  > = {};

  for (const item of items) {
    if (!itemsBySeller[item.sellerId]) {
      itemsBySeller[item.sellerId] = {
        storeName: item.storeName || "Seller",
        items: [],
        itemsSubtotal: 0,
      };
    }
    itemsBySeller[item.sellerId].items.push(item);
    itemsBySeller[item.sellerId].itemsSubtotal += item.price * item.quantity;
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        itemsBySeller,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
