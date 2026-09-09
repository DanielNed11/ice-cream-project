export type FlavorId = "banana" | "chocolate" | "strawberry";

export interface NutritionFacts {
  proteinG: number;
  caloriesPerServing: number | null; // null = not disclosed on packaging, show "--"
  servingSize: string;
}

export interface Variant {
  id: FlavorId;
  index: number; // 1 | 2 | 3, shown as "01" / "02" / "03" in the hero
  name: string;
  subtitle: string;
  themeColor: string; // WCAG-checked: >=7:1 against #000000, safe for black CTA text too
  description: string;
  taglineAccent: string; // short phrase, set in Playfair Display italic
  ingredients: string[];
  ingredientNote: string;
  nutrition: NutritionFacts;
  sequence: {
    basePath: string;
    frameCount: number;
    posterSrc: string;
  };
  lifestyleImageSrc: string;
}

export const variants: Variant[] = [
  {
    id: "banana",
    index: 1,
    name: "NANO BANANA",
    subtitle: "PROTEIN ICE CREAM",
    themeColor: "#F4C430",
    description:
      "Premium Cavendish bananas and roasted almonds, blended into a protein ice cream built for muscle recovery.",
    taglineAccent: "Recovery, reimagined.",
    ingredients: ["Premium Cavendish Bananas", "Roasted Almonds"],
    ingredientNote: "Roasted almonds fold in real crunch and healthy fats.",
    nutrition: { proteinG: 22, caloriesPerServing: null, servingSize: "1 tub" },
    sequence: { basePath: "/sequences/banana", frameCount: 96, posterSrc: "/posters/banana-poster.webp" },
    lifestyleImageSrc: "/lifestyle/banana-product.jpg",
  },
  {
    id: "chocolate",
    index: 2,
    name: "NANO CHOCOLATE",
    subtitle: "PROTEIN ICE CREAM",
    themeColor: "#C68B4A",
    description:
      "Rich Belgian cacao, crafted into a smooth protein ice cream with 20g of protein per serving.",
    taglineAccent: "Indulgence, rebuilt.",
    ingredients: ["Premium Belgian Cacao"],
    ingredientNote: "Deep, dark cacao for a rich flavor with none of the sugar crash.",
    nutrition: { proteinG: 20, caloriesPerServing: null, servingSize: "1 tub" },
    sequence: { basePath: "/sequences/chocolate", frameCount: 96, posterSrc: "/posters/chocolate-poster.webp" },
    lifestyleImageSrc: "/lifestyle/chocolate-product.jpg",
  },
  {
    id: "strawberry",
    index: 3,
    name: "NANO STRAWBERRY",
    subtitle: "PROTEIN ICE CREAM",
    themeColor: "#FF6B9D",
    description:
      "Fresh ripened strawberries blended smooth and creamy -- 21g of protein per serving, only 40 calories.",
    taglineAccent: "Sweetness, perfected.",
    ingredients: ["Fresh Ripened Strawberries"],
    ingredientNote: "Real ripened strawberries for natural sweetness, no added sugar.",
    nutrition: { proteinG: 21, caloriesPerServing: 40, servingSize: "1 tub" },
    sequence: { basePath: "/sequences/strawberry", frameCount: 96, posterSrc: "/posters/strawberry-poster.webp" },
    lifestyleImageSrc: "/lifestyle/strawberry-product.jpg",
  },
];

export function getVariant(id: FlavorId): Variant {
  const variant = variants.find((v) => v.id === id);
  if (!variant) throw new Error(`Unknown flavor id: ${id}`);
  return variant;
}

export function nextVariant(id: FlavorId): Variant {
  const i = variants.findIndex((v) => v.id === id);
  return variants[(i + 1) % variants.length];
}

export function prevVariant(id: FlavorId): Variant {
  const i = variants.findIndex((v) => v.id === id);
  return variants[(i - 1 + variants.length) % variants.length];
}

// Client-only -- callers must not invoke this during SSR/SSG (it would bake
// one fixed choice into the static HTML instead of varying per visit) or in
// a useState/useMemo initializer (that runs during the server render too,
// then again on the client's first hydration pass with a different result,
// producing a hydration mismatch). Call it from a useEffect instead, after
// mount.
export function randomVariantId(): FlavorId {
  return variants[Math.floor(Math.random() * variants.length)].id;
}
