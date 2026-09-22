"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Order, Product } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCart } from "@/lib/cart/CartProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { formatMoney, imageFor } from "@/lib/format";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/store/PageHeader";
import { ActionButton, ActionLink } from "@/components/store/Action";
import { flavorFor, flavorIndexLabel } from "@/components/store/flavor";

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
      <main
        className={`mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 ${NAVBAR_HEIGHT_CLASS}`}
      >
        <p className="eyebrow animate-pulse">Loading…</p>
      </main>
    );
  }

  // A failed read must never be presented as an empty cart.
  const isEmpty = !cartLoading && !cartError && (cart?.items.length ?? 0) === 0;

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-3xl px-6 pb-28 ${NAVBAR_HEIGHT_CLASS}`}>
      <PageHeader eyebrow="Cart" title="Your tubs" accent="One step from the freezer." />

      {(error ?? cartError) && (
        <p
          role="alert"
          className="mt-10 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error ?? cartError}
        </p>
      )}

      {isEmpty && (
        <div className="surface-panel mt-12 p-10 text-center">
          <p className="eyebrow">Empty</p>
          <p className="mt-4 text-xl font-bold tracking-tight text-white">Nothing in here yet.</p>
          <p className="mt-3 text-sm text-white/60">
            Banana, chocolate or strawberry — every tub carries 20g of protein or more.
          </p>
          <div className="mt-8 flex justify-center">
            <ActionLink href="/shop" tone="filled">
              Pick a flavour
            </ActionLink>
          </div>
        </div>
      )}

      <ul className="mt-12 space-y-4">
        {cart?.items.map((item) => {
          const image = imageFor(item.productSlug);
          const flavor = flavorFor(item.productSlug);

          return (
            <li
              key={item.productSlug}
              className="flex flex-wrap items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-300 hover:border-white/20"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                {image && (
                  <Image src={image} alt={item.productName} fill sizes="80px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                {flavor && (
                  <p
                    className="font-mono text-[0.65rem] tracking-[0.25em] uppercase"
                    style={{ color: flavor.themeColor }}
                  >
                    {flavorIndexLabel(flavor)}
                  </p>
                )}
                <p className="mt-1 font-sans text-base font-bold tracking-tight text-white">
                  {item.productName}
                </p>
                <p className="mt-1 font-mono text-xs tabular-nums text-white/60">
                  {formatMoney(item.price)} each
                </p>
              </div>

              <QuantityStepper
                quantity={item.quantity}
                max={Math.min(stockBySlug[item.productSlug] ?? MAX_PER_LINE, MAX_PER_LINE)}
                busy={busySlug === item.productSlug}
                label={item.productName}
                onChange={(quantity) => void changeQuantity(item.productSlug, quantity)}
              />

              <p className="w-20 text-right font-mono text-sm tabular-nums text-white">
                {formatMoney(item.lineTotal)}
              </p>
            </li>
          );
        })}
      </ul>

      {!isEmpty && cart && (
        <Reveal>
          <section className="surface-panel mt-10 p-6 sm:p-8">
            <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-6">
              <span className="eyebrow">Total</span>
              <span className="font-sans text-3xl font-extrabold tracking-tight tabular-nums text-white">
                {formatMoney(cart.totalPrice)}
              </span>
            </div>

            <ActionButton
              type="button"
              onClick={() => void checkout()}
              disabled={placing}
              aria-busy={placing}
              fullWidth
              className="mt-6"
            >
              {placing ? "Placing your order…" : "Checkout"}
            </ActionButton>

            <p className="mt-4 text-center font-mono text-[0.7rem] tracking-[0.2em] text-white/60 uppercase">
              A portfolio demo — no payment is taken
            </p>
          </section>
        </Reveal>
      )}
    </main>
  );
}
