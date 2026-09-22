"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Order, OrderStatus, Page } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { formatDate, formatMoney } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/store/PageHeader";
import { ActionButton, TextLink } from "@/components/store/Action";
import { flavorFor, flavorIndexLabel } from "@/components/store/flavor";

const PAGE_SIZE = 5;

// Tinted pills in the same rounded-full, mono-uppercase language as the
// landing page's labels. All three foregrounds clear 4.5:1 on black.
const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: "border-amber-300/30 bg-amber-400/10 text-amber-200",
  DELIVERED: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  CANCELLED: "border-white/15 bg-white/[0.06] text-white/60",
};

export function AccountPage() {
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

  // Clicking Next then Previous quickly can land the responses out of order,
  // so only the most recently requested page is allowed to write state.
  const latestPageRequest = useRef(0);

  const loadOrders = useCallback(async (page: number) => {
    const request = ++latestPageRequest.current;
    try {
      const loaded = await apiRequest<Page<Order>>(`/api/orders?page=${page}&size=${PAGE_SIZE}`);
      if (request !== latestPageRequest.current) return;
      setOrders(loaded);
      setError(null);
    } catch (cause) {
      if (request !== latestPageRequest.current) return;
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
      <main
        className={`mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 ${NAVBAR_HEIGHT_CLASS}`}
      >
        <p className="eyebrow animate-pulse">Loading…</p>
      </main>
    );
  }

  const totalPages = orders?.page.totalPages ?? 0;

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-3xl px-6 pb-24 ${NAVBAR_HEIGHT_CLASS}`}>
      <PageHeader
        eyebrow="Account"
        title={user.name}
        actions={
          <>
            {user.role !== "CUSTOMER" && (
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.2em] text-white/80 uppercase">
                {user.role}
              </span>
            )}
            <ActionButton
              // No explicit redirect: clearing the user trips the guard above,
              // which sends the visitor to the sign in page.
              onClick={() => void logout()}
              tone="outline"
              size="sm"
            >
              Sign out
            </ActionButton>
          </>
        }
      >
        <p className="font-mono text-sm text-white/60">{user.email}</p>
      </PageHeader>

      <section className="mt-20">
        <p className="eyebrow">Orders</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Everything you&apos;ve ordered.
        </h2>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        {orders && orders.content.length === 0 && (
          <div className="surface-panel mt-8 p-10 text-center">
            <p className="eyebrow">No orders</p>
            <p className="mt-4 text-xl font-bold tracking-tight text-white">Nothing ordered yet.</p>
            <p className="mt-3 text-sm text-white/60">
              When you place an order it shows up here, receipt and all.{" "}
              <TextLink href="/shop">Pick a flavour</TextLink>.
            </p>
          </div>
        )}

        <ul className="mt-8 space-y-4">
          {orders?.content.map((order, index) => (
            // Reveal sits inside the <li>, not around it: a <div> as a direct
            // child of <ul> would strip the list semantics.
            <li key={order.reference}>
              <Reveal
                delay={Math.min(index, 3) * 0.08}
                className="surface-panel block p-6 transition-colors duration-300 hover:border-white/20 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm tracking-wide text-white">#{order.reference}</p>
                    <p className="mt-1 font-mono text-xs text-white/60">{formatDate(order.placedAt)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <span
                      className={`rounded-full border px-3 py-1.5 font-mono text-[0.65rem] tracking-[0.2em] uppercase ${STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                    <span className="font-sans text-lg font-extrabold tracking-tight tabular-nums text-white">
                      {formatMoney(order.totalPrice)}
                    </span>
                  </div>
                </div>

                <ul className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm text-white/70">
                  {order.items.map((item) => {
                    const flavor = flavorFor(item.productSlug);

                    return (
                      <li key={item.productSlug} className="flex items-center justify-between gap-4">
                        <span className="flex min-w-0 items-center gap-3">
                          {flavor && (
                            <span
                              aria-hidden="true"
                              className="font-mono text-[0.65rem] tracking-[0.2em]"
                              style={{ color: flavor.themeColor }}
                            >
                              {flavorIndexLabel(flavor)}
                            </span>
                          )}
                          <span className="truncate">
                            {item.quantity}× {item.productName}
                          </span>
                        </span>
                        <span className="font-mono text-xs tabular-nums text-white/70">
                          {formatMoney(item.lineTotal)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {order.status === "PLACED" && (
                  <ActionButton
                    onClick={() => void cancelOrder(order.reference)}
                    disabled={cancelling === order.reference}
                    aria-busy={cancelling === order.reference}
                    tone="outline"
                    size="sm"
                    className="mt-6"
                  >
                    {cancelling === order.reference ? "Cancelling…" : "Cancel order"}
                  </ActionButton>
                )}
              </Reveal>
            </li>
          ))}
        </ul>

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between gap-4">
            <ActionButton
              onClick={() => setPageNumber((page) => Math.max(0, page - 1))}
              disabled={pageNumber === 0}
              tone="outline"
              size="sm"
            >
              Previous
            </ActionButton>
            <span className="font-mono text-xs tracking-[0.2em] text-white/60 uppercase">
              {pageNumber + 1} / {totalPages}
            </span>
            <ActionButton
              onClick={() => setPageNumber((page) => Math.min(totalPages - 1, page + 1))}
              disabled={pageNumber >= totalPages - 1}
              tone="outline"
              size="sm"
            >
              Next
            </ActionButton>
          </div>
        )}
      </section>
    </main>
  );
}
