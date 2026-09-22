import { variants } from "@/lib/variants";

// The shop sells in euros only and the API carries no currency, so the symbol
// lives in one place rather than at every call site.
export function formatMoney(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

export function formatDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Product art is matched to the API's slug against the local flavour list, so
// a product created through the admin API simply has no image.
export function imageFor(slug: string): string | null {
  return variants.find((variant) => variant.id === slug)?.lifestyleImageSrc ?? null;
}
