import type { FlavorId } from "@/lib/variants";

export interface Review {
  name: string;
  rating: number; // out of 5
  flavor: FlavorId;
  quote: string;
}

export const reviews: Review[] = [
  {
    name: "Maria T.",
    rating: 5,
    flavor: "banana",
    quote:
      "Nano Banana after leg day is unreal. Doesn't taste like a protein shake pretending to be ice cream.",
  },
  {
    name: "James K.",
    rating: 4,
    flavor: "chocolate",
    quote:
      "Chocolate is rich without being sickly sweet. Wish the tubs were bigger, honestly.",
  },
  {
    name: "Priya S.",
    rating: 5,
    flavor: "strawberry",
    quote:
      "Strawberry actually tastes like strawberries. 21g protein and I don't feel like I'm eating a supplement.",
  },
  {
    name: "Devon R.",
    rating: 5,
    flavor: "banana",
    quote:
      "The almond crunch in the banana tub is the detail that sold me. Now it's a standing Sunday order.",
  },
  {
    name: "Elena V.",
    rating: 4,
    flavor: "strawberry",
    quote:
      "Texture holds up even after a re-freeze, which is more than I can say for other 'healthy' pints.",
  },
  {
    name: "Marcus L.",
    rating: 5,
    flavor: "chocolate",
    quote:
      "Belgian cacao actually comes through. My go-to post-workout treat for the last two months.",
  },
];
