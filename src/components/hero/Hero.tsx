"use client";

import { useEffect, useRef, useState } from "react";
import { variants, getVariant, nextVariant, prevVariant, type FlavorId } from "@/lib/variants";
import { loadFrames } from "@/lib/hooks/sequenceCache";
import { SequenceCanvas } from "./SequenceCanvas";
import { HeroTextOverlay } from "./HeroTextOverlay";
import { VariantSwitcher } from "./VariantSwitcher";

export function Hero() {
  const [activeId, setActiveId] = useState<FlavorId>(variants[0].id);
  const sectionRef = useRef<HTMLDivElement>(null);
  const activeVariant = getVariant(activeId);

  useEffect(() => {
    // The default variant is already warm from the Preloader. Quietly warm
    // the other two so PREV/NEXT never has to wait on a network fetch.
    variants
      .filter((v) => v.id !== variants[0].id)
      .forEach((v) => loadFrames(v.id, v.sequence.basePath, v.sequence.frameCount));
  }, []);

  return (
    <section
      id="product"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden bg-black py-28 sm:h-screen sm:py-0"
    >
      <div className="pointer-events-none relative z-10 sm:h-full">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 sm:h-full sm:grid-cols-[1fr_auto_1fr] sm:px-10">
          <div className="pointer-events-auto sm:col-start-1">
            <HeroTextOverlay variant={activeVariant} />
          </div>
          {/* On mobile this sits in normal flow between the text and switcher;
              on sm+ it escapes to a full-bleed absolute background (see
              SequenceCanvas's own responsive positioning). Text/switcher are
              pinned to explicit columns so removing this from flow on sm+
              doesn't shift the switcher into the wrong column. */}
          <SequenceCanvas sectionRef={sectionRef} activeVariant={activeVariant} />
          <div className="pointer-events-auto flex justify-end sm:col-start-3">
            <VariantSwitcher
              variant={activeVariant}
              onPrev={() => setActiveId(prevVariant(activeId).id)}
              onNext={() => setActiveId(nextVariant(activeId).id)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
