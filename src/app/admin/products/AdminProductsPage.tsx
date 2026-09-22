"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";
import type { Product } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { NAVBAR_HEIGHT_CLASS } from "@/components/navbar/Navbar";
import { formatMoney } from "@/lib/format";

interface DraftProduct {
  slug: string;
  name: string;
  price: string;
  stockQuantity: string;
}

const EMPTY_DRAFT: DraftProduct = { slug: "", name: "", price: "", stockQuantity: "" };

export function AdminProductsPage() {
  const { user, loading: sessionLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [draft, setDraft] = useState<DraftProduct>(EMPTY_DRAFT);
  // Stock is deliberately absent when editing: the API only accepts it on
  // create, because stock is written as a delta everywhere else.
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSuperAdmin = user?.role === "SUPERADMIN";

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) router.replace("/login");
    else if (!isSuperAdmin) router.replace("/account");
  }, [sessionLoading, user, isSuperAdmin, router]);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await apiRequest<Product[]>("/api/admin/products"));
      setError(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load products.");
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;

    async function load() {
      await loadProducts();
    }

    void load();
  }, [isSuperAdmin, loadProducts]);

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (editingSlug) {
        await apiRequest<Product>(`/api/admin/products/${editingSlug}`, {
          method: "PUT",
          body: { slug: draft.slug, name: draft.name, price: Number(draft.price) },
        });
      } else {
        await apiRequest<Product>("/api/admin/products", {
          method: "POST",
          body: {
            slug: draft.slug,
            name: draft.name,
            price: Number(draft.price),
            stockQuantity: Number(draft.stockQuantity),
          },
        });
      }
      setDraft(EMPTY_DRAFT);
      setEditingSlug(null);
      await loadProducts();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not save that product.");
    } finally {
      setBusy(false);
    }
  }

  async function setActive(slug: string, active: boolean) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest<Product>(
        active ? `/api/admin/products/${slug}/activate` : `/api/admin/products/${slug}`,
        { method: active ? "POST" : "DELETE" },
      );
      await loadProducts();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not update that product.");
    } finally {
      setBusy(false);
    }
  }

  if (sessionLoading || !isSuperAdmin) {
    return (
      <main className={`mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-6 ${NAVBAR_HEIGHT_CLASS}`}>
        <p className="text-sm text-white/60">Loading…</p>
      </main>
    );
  }

  const field =
    "w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white " +
    "placeholder:text-white/60 focus:border-white/40 focus:outline-none";

  return (
    <main className={`mx-auto min-h-dvh w-full max-w-5xl px-6 pb-24 sm:px-10 ${NAVBAR_HEIGHT_CLASS}`}>
      <header className="flex flex-wrap items-end justify-between gap-4 pt-12">
        <div>
          <p className="font-mono text-xs tracking-[0.15em] text-white/60 uppercase">Superadmin</p>
          <h1 className="mt-3 font-serif text-4xl italic text-white">Products</h1>
        </div>

        <Link
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 px-6 text-sm text-white transition-colors hover:bg-white/10"
        >
          Back to orders
        </Link>
      </header>

      {error && (
        <p role="alert" className="mt-8 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-mono text-xs tracking-[0.15em] text-white/60 uppercase">
          {editingSlug ? `Edit ${editingSlug}` : "New product"}
        </h2>

        <form onSubmit={submitDraft} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs text-white/60">Slug</span>
            <input
              className={field}
              value={draft.slug}
              onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
              placeholder="nano-pistachio"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs text-white/60">Name</span>
            <input
              className={field}
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="NANO PISTACHIO"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs text-white/60">Price (EUR)</span>
            <input
              className={field}
              type="number"
              step="0.01"
              min="0"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
              required
            />
          </label>

          {!editingSlug && (
            <label className="block">
              <span className="mb-2 block text-xs text-white/60">Initial stock</span>
              <input
                className={field}
                type="number"
                min="0"
                value={draft.stockQuantity}
                onChange={(event) => setDraft({ ...draft, stockQuantity: event.target.value })}
                required
              />
            </label>
          )}

          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-full bg-white px-7 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Saving…" : editingSlug ? "Save changes" : "Create product"}
            </button>

            {editingSlug && (
              <button
                type="button"
                onClick={() => {
                  setEditingSlug(null);
                  setDraft(EMPTY_DRAFT);
                }}
                className="h-11 rounded-full border border-white/20 px-7 text-sm text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {!editingSlug && (
          <p className="mt-4 text-xs text-white/60">
            Stock is only set here at creation. After that it moves on its own: down at checkout, back
            up on a cancellation, and topped up by the nightly restock job.
          </p>
        )}
      </section>

      <ul className="mt-8 space-y-4">
        {products?.map((product) => (
          <li
            key={product.slug}
            className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm font-bold tracking-wide text-white">{product.name}</p>
              <p className="mt-1 font-mono text-xs text-white/60">
                {product.slug} · {formatMoney(product.price)} · {product.stockQuantity} in stock
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs ${
                product.active ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/60"
              }`}
            >
              {product.active ? "Active" : "Withdrawn"}
            </span>

            <button
              type="button"
              onClick={() => {
                setEditingSlug(product.slug);
                setDraft({
                  slug: product.slug,
                  name: product.name,
                  price: String(product.price),
                  stockQuantity: String(product.stockQuantity),
                });
              }}
              className="h-11 rounded-full border border-white/20 px-5 text-xs text-white transition-colors hover:bg-white/10"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => void setActive(product.slug, !product.active)}
              disabled={busy}
              className="h-11 rounded-full border border-white/20 px-5 text-xs text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              {product.active ? "Withdraw" : "Bring back"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
