import { variants, type Variant } from "@/lib/variants";

/**
 * The landing page accents every flavour with its own `themeColor` and a
 * zero-padded index ("01" / "02" / "03") -- see Ingredients and Nutrition.
 * The store pages carry API products keyed by slug, so the same accent is
 * recovered the way `imageFor` recovers the artwork: by matching the slug
 * against the local flavour list. A product created through the admin API
 * simply has no accent and falls back to plain white.
 */
export function flavorFor(slug: string): Variant | null {
  return variants.find((variant) => variant.id === slug) ?? null;
}

/** "01" / "02" / "03", matching the Ingredients cards. */
export function flavorIndexLabel(variant: Variant): string {
  return String(variant.index).padStart(2, "0");
}

/**
 * Orders products the way the landing page numbers them, so the accents read
 * 01, 02, 03 instead of whatever order the API happened to return. Anything
 * without a local flavour (created through the admin API) sorts to the end.
 */
export function byFlavorOrder<T extends { slug: string }>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const left = flavorFor(a.slug)?.index ?? Number.MAX_SAFE_INTEGER;
    const right = flavorFor(b.slug)?.index ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}
