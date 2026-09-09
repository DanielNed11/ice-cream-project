"use client";

import { useState } from "react";
import { getVariant, type FlavorId } from "@/lib/variants";
import { SequenceCanvas } from "./SequenceCanvas";
import { FlavorIntro } from "./FlavorIntro";

interface HeroProps {
  initialVariantId: FlavorId;
}

// The flavor shown is fixed for the whole visit -- randomized once on load
// (see page.tsx), no manual switching -- so there's no need for this to be
// mutable state at all beyond the one-time resolution already done upstream.
export function Hero({ initialVariantId }: HeroProps) {
  // A callback ref (state), not a plain useRef: SequenceCanvas needs this
  // DOM node to set up its ScrollTrigger, but React attaches refs and fires
  // layout effects bottom-up (children before parents). A plain ref object
  // would still read `.current === null` inside SequenceCanvas's first
  // layout effect, because this <section>'s own ref hasn't been attached
  // yet at that point -- that only happens once React finishes this
  // component's children and comes back up to this fiber. Using state here
  // means SequenceCanvas re-renders (and its effect re-runs) once the node
  // genuinely exists.
  const [sectionEl, setSectionEl] = useState<HTMLElement | null>(null);
  const activeVariant = getVariant(initialVariantId);

  return (
    <>
      {/* Pure full-bleed scroll-scrub animation -- no text overlay. The
          flavor name/description live in FlavorIntro below, appearing
          once you've scrolled past this. */}
      <section id="product" ref={setSectionEl} className="relative h-screen w-full overflow-hidden bg-black">
        <SequenceCanvas sectionEl={sectionEl} activeVariant={activeVariant} />
      </section>
      <FlavorIntro activeVariant={activeVariant} />
    </>
  );
}
