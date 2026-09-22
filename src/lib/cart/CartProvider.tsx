"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Cart } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";

interface CartContextValue {
  cart: Cart | null;
  /** Total units across every line, for the navbar badge. */
  itemCount: number;
  loading: boolean;
  /** Set when the cart could not be read, so "empty" is never guessed. */
  error: string | null;
  /** Quantity 0 removes the line; the backend owns that rule. */
  setQuantity: (slug: string, quantity: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  // Starts true so a cold load never paints "your cart is empty" in the frame
  // before the request has even been sent.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCart(await apiRequest<Cart>("/api/cart"));
      setError(null);
    } catch (cause) {
      // Deliberately keeps whatever was already loaded: a failed read must not
      // be presented as an empty cart.
      setError(cause instanceof ApiError ? cause.message : "Could not load your cart.");
    }
  }, []);

  // The cart belongs to the signed in customer, so it is loaded when a session
  // appears and dropped when it goes away.
  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      if (!user) {
        if (!cancelled) {
          setCart(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setLoading(true);

      // Read into a local first: refresh() would write state even after the
      // effect was cleaned up, putting a signed out visitor's cart back.
      try {
        const loaded = await apiRequest<Cart>("/api/cart");
        if (!cancelled) {
          setCart(loaded);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof ApiError ? cause.message : "Could not load your cart.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
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

  const itemCount = useMemo(
    () => cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0,
    [cart],
  );

  const value = useMemo(
    () => ({ cart, itemCount, loading, error, setQuantity, refresh }),
    [cart, itemCount, loading, error, setQuantity, refresh],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
