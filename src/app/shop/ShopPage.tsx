"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Product } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCart } from "@/lib/cart/CartProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { formatMoney, imageFor } from "@/lib/format";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/store/PageHeader";
import { ActionButton, ActionLink, TextLink } from "@/components/store/Action";
import { byFlavorOrder, flavorFor, flavorIndexLabel } from "@/components/store/flavor";

const MAX_PER_LINE = 100;

export function ShopPage() {
  const { user, loading: sessionLoading } = useAuth();
  const { cart, setQuantity } = useCart();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(byFlavorOrder(await apiRequest<Product[]>("/api/products", { anonymous: true })));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load the flavours.");
    }
  }, []);

  useEffect(() => {
    async function load() {
      await loadProducts();
    }
    void load();
  }, [loadProducts]);

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

  function quantityInCart(slug: string): number {
    return cart?.items.find((item) => item.productSlug === slug)?.quantity ?? 0;
  }

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-7xl px-6 pb-28 sm:px-10 ${NAVBAR_HEIGHT_CLASS}`}>
      <PageHeader eyebrow="Shop" title="Pick your flavour" accent="Recovery, reimagined.">
        <p>
          Every tub is the same promise: real, whole ingredients and 20g or more of protein. The only
          decision left is which one you reach for.
        </p>
      </PageHeader>

      {error && (
        <p
          role="alert"
          className="mt-10 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {products === null && !error && (
        // Skeletons rather than a spinner: the cards keep their space, so the
        // grid does not jump when the real data lands. Shaped like the real
        // card (image block plus text block) rather than a plain rectangle.
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="surface-panel overflow-hidden" aria-hidden="true">
              <div className="aspect-[4/3] w-full animate-pulse bg-white/5" />
              <div className="space-y-3 p-6">
                <div className="h-3 w-10 animate-pulse rounded-full bg-white/10" />
                <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/10" />
                <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
                <div className="h-12 w-40 animate-pulse rounded-full bg-white/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {products?.length === 0 && (
        <div className="surface-panel mt-16 p-10 text-center">
          <p className="eyebrow">Sold out</p>
          <p className="mt-4 text-xl font-bold tracking-tight text-white">
            No flavours are available right now.
          </p>
          <p className="mt-3 text-sm text-white/60">
            Every tub is churned in small batches. Check back shortly, or read what goes into them on the{" "}
            <TextLink href="/">front page</TextLink>.
          </p>
        </div>
      )}

      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((product, index) => {
          const image = imageFor(product.slug);
          const flavor = flavorFor(product.slug);
          const inCart = quantityInCart(product.slug);
          const soldOut = product.stockQuantity === 0;
          const lowStock = !soldOut && product.stockQuantity <= 5;

          return (
            <Reveal key={product.slug} delay={(index % 3) * 0.1}>
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors duration-300 hover:border-white/20">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/5">
                  {image && (
                    <Image
                      src={image}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      // At three columns every card is above the fold, so which
                      // one is the LCP element depends on the viewport. The Next
                      // 16 docs say to hint priority rather than preload in
                      // exactly that case.
                      fetchPriority={index === 0 ? "high" : "auto"}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  )}

                  {soldOut && (
                    <span className="absolute top-4 left-4 rounded-full bg-black/75 px-3 py-1 font-mono text-[0.65rem] tracking-[0.2em] text-white uppercase backdrop-blur-sm">
                      Sold out
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  {flavor && (
                    <p
                      className="font-mono text-xs tracking-[0.25em] uppercase"
                      style={{ color: flavor.themeColor }}
                    >
                      {flavorIndexLabel(flavor)}
                    </p>
                  )}

                  <h2 className="mt-2 text-xl font-bold tracking-tight text-white">{product.name}</h2>

                  {flavor && (
                    <p className="mt-2 font-serif text-base text-white/70 italic">
                      {flavor.taglineAccent}
                    </p>
                  )}

                  <p className="mt-4 font-mono text-lg tabular-nums text-white">
                    {formatMoney(product.price)}
                  </p>

                  <p className={`mt-2 text-sm ${lowStock ? "text-amber-200" : "text-white/60"}`}>
                    {soldOut
                      ? "Back in the churn"
                      : lowStock
                        ? `Only ${product.stockQuantity} tubs left`
                        : `${product.stockQuantity} tubs in stock`}
                  </p>

                  <div className="mt-6 flex-1" />

                  {/* Every branch occupies the same 48px row so the cards keep
                      a common baseline and nothing shifts when the session
                      resolves. */}
                  <div className="flex min-h-12 items-center">
                    {sessionLoading ? null : !user ? (
                      <ActionLink href="/login" tone="outline">
                        Sign in to order
                      </ActionLink>
                    ) : soldOut ? (
                      <span className="font-mono text-xs tracking-[0.2em] text-white/60 uppercase">
                        Back soon
                      </span>
                    ) : inCart === 0 ? (
                      <ActionButton
                        type="button"
                        onClick={() => void changeQuantity(product.slug, 1)}
                        disabled={busySlug === product.slug}
                        aria-busy={busySlug === product.slug}
                        tone={flavor ? "accent" : "filled"}
                        accentColor={flavor?.themeColor}
                      >
                        {busySlug === product.slug ? "Adding…" : "Add to cart"}
                      </ActionButton>
                    ) : (
                      <QuantityStepper
                        quantity={inCart}
                        max={Math.min(product.stockQuantity, MAX_PER_LINE)}
                        busy={busySlug === product.slug}
                        label={product.name}
                        onChange={(quantity) => void changeQuantity(product.slug, quantity)}
                      />
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {user && (cart?.items.length ?? 0) > 0 && (
        <Reveal>
          <div className="surface-panel mt-16 flex flex-wrap items-center justify-between gap-6 p-6 sm:px-8">
            <div>
              <p className="eyebrow">In your cart</p>
              <p className="mt-2 font-sans text-2xl font-extrabold tracking-tight text-white">
                {formatMoney(cart?.totalPrice ?? 0)}
              </p>
            </div>
            <ActionLink href="/cart" tone="filled">
              Go to cart
            </ActionLink>
          </div>
        </Reveal>
      )}
    </main>
  );
}
