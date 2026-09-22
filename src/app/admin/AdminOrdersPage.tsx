"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiDownload, apiRequest } from "@/lib/api/client";
import type { AdminOrder, OrderAnalytics, OrderStatus, Page } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { formatDate, formatMoney } from "@/lib/format";

const PAGE_SIZE = 10;

const STATUSES: OrderStatus[] = ["PLACED", "DELIVERED", "CANCELLED"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: "bg-amber-400/15 text-amber-200",
  DELIVERED: "bg-emerald-400/15 text-emerald-200",
  CANCELLED: "bg-white/10 text-white/60",
};

export function AdminOrdersPage() {
  const { user, loading: sessionLoading } = useAuth();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [orders, setOrders] = useState<Page<AdminOrder> | null>(null);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [pageNumber, setPageNumber] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Only an ADMIN or SUPERADMIN can read these endpoints; anyone else would
  // just collect 403s, so they are sent away before any request is made.
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) router.replace("/login");
    else if (!isAdmin) router.replace("/account");
  }, [sessionLoading, user, isAdmin, router]);

  const latestRequest = useRef(0);

  const loadOrders = useCallback(async (page: number, filter: OrderStatus | "") => {
    const request = ++latestRequest.current;
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    if (filter) query.set("status", filter);

    try {
      const loaded = await apiRequest<Page<AdminOrder>>(`/api/admin/orders?${query}`);
      if (request !== latestRequest.current) return;
      setOrders(loaded);
      setError(null);
    } catch (cause) {
      if (request !== latestRequest.current) return;
      setError(cause instanceof ApiError ? cause.message : "Could not load orders.");
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setAnalytics(await apiRequest<OrderAnalytics>("/api/admin/orders/summary"));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load the summary.");
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    async function load() {
      await Promise.all([loadAnalytics(), loadOrders(pageNumber, status)]);
    }

    void load();
  }, [isAdmin, pageNumber, status, loadAnalytics, loadOrders]);

  async function exportSpreadsheet() {
    setExporting(true);
    setError(null);
    try {
      const query = status ? `?status=${status}` : "";
      await apiDownload(`/api/admin/orders/export${query}`, `orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not export the orders.");
    } finally {
      setExporting(false);
    }
  }

  if (sessionLoading || !isAdmin) {
    return (
      <main className={`mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 ${NAVBAR_HEIGHT_CLASS}`}>
        <p className="text-sm text-white/60">Loading…</p>
      </main>
    );
  }

  const totalPages = orders?.page.totalPages ?? 0;

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-6xl px-6 pb-24 sm:px-10 ${NAVBAR_HEIGHT_CLASS}`}>
      <header className="flex flex-wrap items-end justify-between gap-4 pt-12">
        <div>
          <p className="font-mono text-xs tracking-[0.15em] text-white/60 uppercase">Admin</p>
          <h1 className="mt-3 font-serif text-4xl italic text-white">Orders</h1>
        </div>

        {user?.role === "SUPERADMIN" && (
          <Link
            href="/admin/products"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm text-white transition-colors hover:bg-white/10"
          >
            Manage products
          </Link>
        )}
      </header>

      {error && (
        <p role="alert" className="mt-8 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <section aria-label="Summary" className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Revenue", value: analytics ? formatMoney(analytics.totalRevenue) : "—" },
          { label: "Orders", value: analytics ? String(analytics.revenueOrderCount) : "—" },
          { label: "Average order", value: analytics ? formatMoney(analytics.averageOrderValue) : "—" },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="font-mono text-xs tracking-[0.15em] text-white/60 uppercase">{card.label}</p>
            <p className="mt-3 font-sans text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      {analytics && analytics.topProducts.length > 0 && (
        <section aria-label="Top products" className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="font-mono text-xs tracking-[0.15em] text-white/60 uppercase">Top sellers</p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {analytics.topProducts.map((product) => (
              <li key={product.productName} className="flex justify-between">
                <span>{product.productName}</span>
                <span className="font-mono">{product.quantitySold} tubs</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs tracking-[0.15em] text-white/60 uppercase">Filter</span>

        {(["", ...STATUSES] as const).map((option) => (
          <button
            key={option || "ALL"}
            type="button"
            onClick={() => {
              setStatus(option);
              setPageNumber(0);
            }}
            aria-pressed={status === option}
            className={`h-11 rounded-full border px-5 text-xs tracking-[0.1em] uppercase transition-colors ${
              status === option
                ? "border-white bg-white text-black"
                : "border-white/20 text-white/70 hover:bg-white/10"
            }`}
          >
            {option || "All"}
          </button>
        ))}

        <button
          type="button"
          onClick={() => void exportSpreadsheet()}
          disabled={exporting}
          aria-busy={exporting}
          className="ml-auto h-11 rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {exporting ? "Preparing…" : "Export .xlsx"}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 font-mono text-xs tracking-[0.1em] text-white/60 uppercase">
              <th scope="col" className="px-6 py-4">Order</th>
              <th scope="col" className="px-6 py-4">Customer</th>
              <th scope="col" className="px-6 py-4">Placed</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders?.content.map((order) => (
              <tr key={order.reference} className="border-b border-white/5 last:border-0">
                <td className="px-6 py-4 font-mono text-white">#{order.reference}</td>
                <td className="px-6 py-4 text-white/70">{order.customerEmail}</td>
                <td className="px-6 py-4 text-white/60">{formatDate(order.placedAt)}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-white">{formatMoney(order.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders?.content.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-white/60">No orders match that filter.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between text-sm text-white/60">
          <button
            type="button"
            onClick={() => setPageNumber((page) => Math.max(0, page - 1))}
            disabled={pageNumber === 0}
            className="h-11 rounded-full border border-white/20 px-5 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            Previous
          </button>
          <span>
            Page {pageNumber + 1} of {totalPages} · {orders?.page.totalElements} orders
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((page) => Math.min(totalPages - 1, page + 1))}
            disabled={pageNumber >= totalPages - 1}
            className="h-11 rounded-full border border-white/20 px-5 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
