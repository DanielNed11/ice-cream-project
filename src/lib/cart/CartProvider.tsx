"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiRequest } from "@/lib/api/client";
import type { Cart } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";

interface CartContextValue {
  cart: Cart | null;
  /** Total units across every line, for the navbar badge. */
  itemCount: number;
  loading: boolean;
  /** Quantity 0 removes the line; the backend owns that rule. */
  setQuantity: (slug: string, quantity: number) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCart(await apiRequest<Cart>("/api/cart"));
    } catch {
      setCart(null);
    }
  }, []);

  // The cart belongs to the signed in customer, so it is loaded when a session
  // appears and dropped when it goes away.
  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      if (!user) {
        if (!cancelled) setCart(null);
        return;
      }
      if (!cancelled) setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    }

    void loadCart();
    return () => {
      cancelled = true;
    };
  }, [user, refresh]);

  const setQuantity = useCallback(async (slug: string, quantity: number) => {
    // The response is the whole cart, so there is no need to refetch after.
    setCart(
      await apiRequest<Cart>("/api/cart/items", {
        method: "PUT",
        body: { slug, quantity },
      }),
    );
  }, []);

  const clear = useCallback(() => setCart(null), []);

  const itemCount = useMemo(
    () => cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0,
    [cart],
  );

  const value = useMemo(
    () => ({ cart, itemCount, loading, setQuantity, refresh, clear }),
    [cart, itemCount, loading, setQuantity, refresh, clear],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
