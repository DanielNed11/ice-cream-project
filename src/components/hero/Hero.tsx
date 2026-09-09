"use client";

import { useEffect, useState } from "react";
import { variants, getVariant, nextVariant, prevVariant, type FlavorId } from "@/lib/variants";
import { loadFrames } from "@/lib/hooks/sequenceCache";
import { SequenceCanvas } from "./SequenceCanvas";
import { FlavorIntro } from "./FlavorIntro";

interface HeroProps {
  initialVariantId: FlavorId;
}

export function Hero({ initialVariantId }: HeroProps) {
  const [activeId, setActiveId] = useState<FlavorId>(initialVariantId);
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
  const activeVariant = getVariant(activeId);

  useEffect(() => {
    // The opening variant is already warm from the Preloader. Quietly warm
    // the other two so PREV/NEXT never has to wait on a network fetch.
    variants
      .filter((v) => v.id !== initialVariantId)
      .forEach((v) => loadFrames(v.id, v.sequence.basePath, v.sequence.frameCount));
  }, [initialVariantId]);

  return (
    <>
      {/* Pure full-bleed scroll-scrub animation -- no text overlay. The
          flavor name/description/switcher live in FlavorIntro below,
          appearing once you've scrolled past this. */}
      <section id="product" ref={setSectionEl} className="relative h-screen w-full overflow-hidden bg-black">
        <SequenceCanvas sectionEl={sectionEl} activeVariant={activeVariant} />
      </section>
      <FlavorIntro
        activeVariant={activeVariant}
        onPrev={() => setActiveId(prevVariant(activeId).id)}
        onNext={() => setActiveId(nextVariant(activeId).id)}
      />
    </>
  );
}
