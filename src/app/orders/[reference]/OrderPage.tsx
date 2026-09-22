"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { formatDate, formatMoney } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/store/PageHeader";
import { ActionLink, TextLink } from "@/components/store/Action";
import { flavorFor, flavorIndexLabel } from "@/components/store/flavor";

// Route params arrive as a promise in this version of Next.
export function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
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
      <main
        className={`mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-6 ${NAVBAR_HEIGHT_CLASS}`}
      >
        <p className="eyebrow animate-pulse">Loading…</p>
      </main>
    );
  }

  const cancelled = order?.status === "CANCELLED";
  // The landing page tints each section with the flavour's own colour; a
  // confirmation borrows the colour of what was actually ordered. A cancelled
  // order stays neutral.
  const accentFlavor = order?.items.length ? flavorFor(order.items[0].productSlug) : null;
  const accentColor = cancelled ? undefined : accentFlavor?.themeColor;

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-3xl px-6 pb-28 ${NAVBAR_HEIGHT_CLASS}`}>
      {error ? (
        <div className="pt-20">
          <p
            role="alert"
            className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
          <p className="mt-6 text-sm text-white/60">
            <TextLink href="/account">Back to your orders</TextLink>
          </p>
        </div>
      ) : !order ? (
        <p className="eyebrow pt-20 animate-pulse">Loading…</p>
      ) : (
        <>
          {/* Reachable by reload, back and bookmark, so the heading has to
              reflect the order's current status rather than assume checkout. */}
          <PageHeader
            eyebrow={cancelled ? "Order cancelled" : "Order confirmed"}
            title={cancelled ? "Cancelled" : "Thank you"}
            accent={cancelled ? "Back in the freezer." : "Recovery is on its way."}
            accentColor={accentColor}
          >
            <p>
              {cancelled
                ? "This order was cancelled and the tubs went back into stock."
                : "We have emailed the details to you."}{" "}
              Your order number is{" "}
              <span className="font-mono tracking-wide text-white">#{order.reference}</span>.
            </p>
          </PageHeader>

          <Reveal className="surface-panel mt-12 block p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
              <span className="eyebrow">Receipt</span>
              <span className="font-mono text-xs text-white/60">{formatDate(order.placedAt)}</span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-white/70">
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

            <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/10 pt-6">
              <span className="eyebrow">Total</span>
              <span className="font-sans text-3xl font-extrabold tracking-tight tabular-nums text-white">
                {formatMoney(order.totalPrice)}
              </span>
            </div>
          </Reveal>

          <div className="mt-10 flex flex-wrap gap-4">
            <ActionLink
              href="/account"
              tone={accentColor ? "accent" : "filled"}
              accentColor={accentColor}
            >
              Your orders
            </ActionLink>
            <ActionLink href="/shop" tone="outline">
              Keep shopping
            </ActionLink>
          </div>
        </>
      )}
    </main>
  );
}
