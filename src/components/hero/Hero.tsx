"use client";

import { useEffect, useRef, useState } from "react";
import { variants, getVariant, nextVariant, prevVariant, type FlavorId } from "@/lib/variants";
import { loadFrames } from "@/lib/hooks/sequenceCache";
import { SequenceCanvas } from "./SequenceCanvas";
import { FlavorIntro } from "./FlavorIntro";

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
    <>
      {/* Pure full-bleed scroll-scrub animation -- no text overlay. The
          flavor name/description/switcher live in FlavorIntro below,
          appearing once you've scrolled past this. */}
      <section id="product" ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-black">
        <SequenceCanvas sectionRef={sectionRef} activeVariant={activeVariant} />
      </section>
      <FlavorIntro
        activeVariant={activeVariant}
        onPrev={() => setActiveId(prevVariant(activeId).id)}
        onNext={() => setActiveId(nextVariant(activeId).id)}
      />
    </>
  );
}
