"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Order, OrderStatus, Page } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";

const PAGE_SIZE = 5;

const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: "bg-amber-400/15 text-amber-200",
  DELIVERED: "bg-emerald-400/15 text-emerald-200",
  CANCELLED: "bg-white/10 text-white/50",
};

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

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Page<Order> | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  // The session is restored asynchronously, so "no user" only means signed out
  // once that has finished.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadOrders = useCallback(async (page: number) => {
    try {
      setOrders(await apiRequest<Page<Order>>(`/api/orders?page=${page}&size=${PAGE_SIZE}`));
      setError(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load your orders.");
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    async function loadCurrentPage() {
      await loadOrders(pageNumber);
    }

    void loadCurrentPage();
  }, [user, pageNumber, loadOrders]);

  async function cancelOrder(reference: string) {
    setCancelling(reference);
    try {
      await apiRequest<Order>(`/api/orders/${reference}/cancel`, { method: "POST" });
      await loadOrders(pageNumber);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not cancel that order.");
    } finally {
      setCancelling(null);
    }
  }

  if (loading || !user) {
    return (
      <main className={`mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 ${NAVBAR_HEIGHT_CLASS}`}>
        <p className="text-sm text-white/50">Loading…</p>
      </main>
    );
  }

  const totalPages = orders?.page.totalPages ?? 0;

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-3xl px-6 pb-16 ${NAVBAR_HEIGHT_CLASS}`}>
      <header className="flex flex-wrap items-start justify-between gap-4 pt-12">
        <div>
          <h1 className="font-serif text-4xl italic text-white">{user.name}</h1>
          <p className="mt-1 text-sm text-white/50">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {user.role !== "CUSTOMER" && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
              {user.role}
            </span>
          )}
          <button
            // No explicit redirect: clearing the user trips the guard above,
            // which sends the visitor to the sign in page.
            onClick={() => void logout()}
            className="rounded-full border border-white/20 px-5 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest text-white/50">Your orders</h2>

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {orders && orders.content.length === 0 && (
          <p className="mt-6 text-sm text-white/50">
            No orders yet.{" "}
            <Link href="/" className="text-white underline underline-offset-4">
              Pick a flavour
            </Link>
            .
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {orders?.content.map((order) => (
            <li key={order.reference} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-white">#{order.reference}</p>
                  <p className="mt-1 text-xs text-white/40">{formatDate(order.placedAt)}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-3 py-1 text-xs tracking-wide ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-sm text-white">{formatMoney(order.totalPrice)}</span>
                </div>
              </div>

              <ul className="mt-4 space-y-1 text-sm text-white/60">
                {order.items.map((item) => (
                  <li key={item.productSlug} className="flex justify-between">
                    <span>
                      {item.quantity}× {item.productName}
                    </span>
                    <span>{formatMoney(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              {order.status === "PLACED" && (
                <button
                  onClick={() => void cancelOrder(order.reference)}
                  disabled={cancelling === order.reference}
                  className="mt-5 rounded-full border border-white/20 px-5 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {cancelling === order.reference ? "Cancelling…" : "Cancel order"}
                </button>
              )}
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between text-sm text-white/60">
            <button
              onClick={() => setPageNumber((page) => Math.max(0, page - 1))}
              disabled={pageNumber === 0}
              className="rounded-full border border-white/20 px-5 py-2 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              Previous
            </button>
            <span>
              Page {pageNumber + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPageNumber((page) => Math.min(totalPages - 1, page + 1))}
              disabled={pageNumber >= totalPages - 1}
              className="rounded-full border border-white/20 px-5 py-2 transition-colors hover:bg-white/10 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
