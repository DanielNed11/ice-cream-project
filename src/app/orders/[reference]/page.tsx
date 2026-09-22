"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";

function formatMoney(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

function formatDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Route params arrive as a promise in this version of Next.
export default function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = use(params);
  const { user, loading: sessionLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !user) router.replace("/login");
  }, [sessionLoading, user, router]);

  const loadOrder = useCallback(async () => {
    try {
      setOrder(await apiRequest<Order>(`/api/orders/${reference}`));
    } catch (cause) {
      // An order that is not yours is a 404 rather than a 403, so there is
      // nothing to distinguish here: both mean "no such order for you".
      setError(cause instanceof ApiError ? cause.message : "Could not load that order.");
    }
  }, [reference]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      await loadOrder();
    }

    void load();
  }, [user, loadOrder]);

  if (sessionLoading || !user) {
    return (
      <main className={`mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 ${NAVBAR_HEIGHT_CLASS}`}>
        <p className="text-sm text-white/50">Loading…</p>
      </main>
    );
  }

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-3xl px-6 pb-24 ${NAVBAR_HEIGHT_CLASS}`}>
      {error ? (
        <div className="pt-16">
          <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
          <Link href="/account" className="mt-6 inline-block text-sm text-white underline underline-offset-4">
            Back to your orders
          </Link>
        </div>
      ) : !order ? (
        <p className="pt-16 text-sm text-white/50">Loading…</p>
      ) : (
        <>
          <header className="pt-12">
            <p className="font-mono text-xs tracking-[0.15em] text-white/50 uppercase">
              Order confirmed
            </p>
            <h1 className="mt-3 font-serif text-4xl italic text-white">Thank you</h1>
            <p className="mt-4 text-sm text-white/60">
              We have emailed the details to you. Your order number is{" "}
              <span className="font-mono text-white">#{order.reference}</span>.
            </p>
          </header>

          <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-sm text-white">#{order.reference}</span>
              <span className="text-xs text-white/40">{formatDate(order.placedAt)}</span>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-white/70">
              {order.items.map((item) => (
                <li key={item.productSlug} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.productName}
                  </span>
                  <span>{formatMoney(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
              <span className="font-mono text-xs tracking-[0.15em] text-white/50 uppercase">Total</span>
              <span className="font-sans text-2xl font-bold text-white">
                {formatMoney(order.totalPrice)}
              </span>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/account"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Your orders
            </Link>
            <Link
              href="/shop"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-7 text-sm text-white transition-colors hover:bg-white/10"
            >
              Keep shopping
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
