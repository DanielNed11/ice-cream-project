"use client";

import type { Variant } from "@/lib/variants";
import { Reveal } from "@/components/ui/Reveal";
import { HeroTextOverlay } from "./HeroTextOverlay";

interface FlavorIntroProps {
  activeVariant: Variant;
}

// Sits right below the (text-free, full-bleed) scroll-scrub Hero. The flavor
// name/description/CTAs used to be overlaid on top of the hero animation
// itself -- moved here instead, in normal document flow against a plain
// black background, so it reveals the way every other section does
// (scrolled into view) and never has to fight the animation's own colors
// for legibility.
export function FlavorIntro({ activeVariant }: FlavorIntroProps) {
  return (
    <section className="bg-black px-6 py-24 sm:px-10">
      <Reveal className="mx-auto max-w-7xl">
        <HeroTextOverlay variant={activeVariant} />
      </Reveal>
    </section>
  );
}
