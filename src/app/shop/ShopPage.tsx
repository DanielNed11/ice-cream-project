"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Product } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCart } from "@/lib/cart/CartProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { formatMoney, imageFor } from "@/lib/format";
import { QuantityStepper } from "@/components/shop/QuantityStepper";

const MAX_PER_LINE = 100;

export function ShopPage() {
  const { user, loading: sessionLoading } = useAuth();
  const { cart, setQuantity } = useCart();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await apiRequest<Product[]>("/api/products", { anonymous: true }));
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
    <main className={`mx-auto min-h-dvh w-full max-w-7xl px-6 pb-24 sm:px-10 ${NAVBAR_HEIGHT_CLASS}`}>
      <header className="pt-12">
        <p className="font-mono text-xs tracking-[0.15em] text-white/50 uppercase">Shop</p>
        <h1 className="mt-3 font-serif text-4xl italic text-white sm:text-5xl">Pick your flavour</h1>
      </header>

      {error && (
        <p role="alert" className="mt-8 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {products === null && !error && (
        // Skeletons rather than a spinner: the cards keep their space, so the
        // grid does not jump when the real data lands.
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-[28rem] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      )}

      {products?.length === 0 && (
        <p className="mt-12 text-sm text-white/50">No flavours are available right now.</p>
      )}

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((product, index) => {
          const image = imageFor(product.slug);
          const inCart = quantityInCart(product.slug);
          const soldOut = product.stockQuantity === 0;

          return (
            <article
              key={product.slug}
              className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm"
            >
              <div className="relative aspect-[4/3] w-full bg-white/5">
                {image && (
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    // Only the first card is likely above the fold.
                    priority={index === 0}
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-sans text-lg font-bold tracking-wide text-white">{product.name}</h2>
                <p className="mt-1 font-mono text-sm text-white/60">{formatMoney(product.price)}</p>

                <p className="mt-4 text-xs text-white/60">
                  {soldOut ? "Sold out" : `${product.stockQuantity} tubs in stock`}
                </p>

                <div className="mt-6 flex-1" />

                {sessionLoading ? null : !user ? (
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm text-white transition-colors hover:bg-white/10"
                  >
                    Sign in to order
                  </Link>
                ) : soldOut ? (
                  <span className="inline-flex h-11 items-center text-sm text-white/60">
                    Back soon
                  </span>
                ) : inCart === 0 ? (
                  <button
                    type="button"
                    onClick={() => void changeQuantity(product.slug, 1)}
                    disabled={busySlug === product.slug}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {busySlug === product.slug ? "Adding…" : "Add to cart"}
                  </button>
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
            </article>
          );
        })}
      </div>

      {user && (cart?.items.length ?? 0) > 0 && (
        <div className="mt-12 flex justify-end">
          <Link
            href="/cart"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Go to cart · {formatMoney(cart?.totalPrice ?? 0)}
          </Link>
        </div>
      )}
    </main>
  );
}
