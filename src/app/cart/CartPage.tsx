"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Order, Product } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCart } from "@/lib/cart/CartProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { formatMoney, imageFor } from "@/lib/format";
import { QuantityStepper } from "@/components/shop/QuantityStepper";

const MAX_PER_LINE = 100;

export function CartPage() {
  const { user, loading: sessionLoading } = useAuth();
  const { cart, loading: cartLoading, error: cartError, setQuantity, refresh } = useCart();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  // Stock lives on the product, not the cart line, so the ceiling on the
  // steppers here has to come from a second read.
  const [stockBySlug, setStockBySlug] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadStock() {
      try {
        const products = await apiRequest<Product[]>("/api/products", { anonymous: true });
        setStockBySlug(Object.fromEntries(products.map((p) => [p.slug, p.stockQuantity])));
      } catch {
        // Without it the steppers just fall back to the hard line limit.
      }
    }

    void loadStock();
  }, []);

  useEffect(() => {
    if (!sessionLoading && !user) router.replace("/login");
  }, [sessionLoading, user, router]);

  async function changeQuantity(slug: string, quantity: number) {
    setBusySlug(slug);
    setError(null);
    try {
      await setQuantity(slug, Math.max(0, Math.min(MAX_PER_LINE, quantity)));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not update your cart.");
    } finally {
      setBusySlug(null);
    }
  }

  async function checkout() {
    setPlacing(true);
    setError(null);
    try {
      const order = await apiRequest<Order>("/api/orders", { method: "POST" });
      // Checkout empties the cart server side; mirror that before leaving.
      await refresh();
      router.push(`/orders/${order.reference}`);
    } catch (cause) {
      // 409 means stock ran out or a flavour was withdrawn while the cart sat
      // open, so the line quantities on screen may no longer be accurate.
      if (cause instanceof ApiError && cause.status === 409) await refresh();
      setError(cause instanceof ApiError ? cause.message : "Could not place your order.");
      // Only re-enabled on failure: on success the page is navigating away and
      // a finally here would flash an enabled button first. Any future await
      // added before the push must keep that in mind.
      setPlacing(false);
    }
  }

  if (sessionLoading || !user) {
    return (
      <main className={`mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 ${NAVBAR_HEIGHT_CLASS}`}>
        <p className="text-sm text-white/50">Loading…</p>
      </main>
    );
  }

  // A failed read must never be presented as an empty cart.
  const isEmpty = !cartLoading && !cartError && (cart?.items.length ?? 0) === 0;

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-3xl px-6 pb-24 ${NAVBAR_HEIGHT_CLASS}`}>
      <header className="pt-12">
        <p className="font-mono text-xs tracking-[0.15em] text-white/50 uppercase">Cart</p>
        <h1 className="mt-3 font-serif text-4xl italic text-white">Your tubs</h1>
      </header>

      {(error ?? cartError) && (
        <p role="alert" className="mt-8 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error ?? cartError}
        </p>
      )}

      {isEmpty && (
        <p className="mt-10 text-sm text-white/50">
          Your cart is empty.{" "}
          <Link href="/shop" className="text-white underline underline-offset-4">
            Pick a flavour
          </Link>
          .
        </p>
      )}

      <ul className="mt-10 space-y-4">
        {cart?.items.map((item) => {
          const image = imageFor(item.productSlug);

          return (
            <li
              key={item.productSlug}
              className="flex flex-wrap items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                {image && (
                  <Image src={image} alt={item.productName} fill sizes="80px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm font-bold tracking-wide text-white">{item.productName}</p>
                <p className="mt-1 font-mono text-xs text-white/50">{formatMoney(item.price)} each</p>
              </div>

              <QuantityStepper
                quantity={item.quantity}
                max={Math.min(stockBySlug[item.productSlug] ?? MAX_PER_LINE, MAX_PER_LINE)}
                busy={busySlug === item.productSlug}
                label={item.productName}
                onChange={(quantity) => void changeQuantity(item.productSlug, quantity)}
              />

              <p className="w-20 text-right font-mono text-sm text-white">{formatMoney(item.lineTotal)}</p>
            </li>
          );
        })}
      </ul>

      {!isEmpty && cart && (
        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-[0.15em] text-white/50 uppercase">Total</span>
            <span className="font-sans text-2xl font-bold text-white">{formatMoney(cart.totalPrice)}</span>
          </div>

          <button
            type="button"
            onClick={() => void checkout()}
            disabled={placing}
            aria-busy={placing}
            className="mt-6 h-12 w-full rounded-full bg-white text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {placing ? "Placing your order…" : "Checkout"}
          </button>

          <p className="mt-4 text-center text-xs text-white/60">
            A portfolio demo -- no payment is taken.
          </p>
        </section>
      )}
    </main>
  );
}
