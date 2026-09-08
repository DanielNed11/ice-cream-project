"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { variants, getVariant, nextVariant, prevVariant, type FlavorId } from "@/lib/variants";
import { loadFrames } from "@/lib/hooks/sequenceCache";
import { SequenceCanvas } from "./SequenceCanvas";
import { HeroTextOverlay } from "./HeroTextOverlay";
import { VariantSwitcher } from "./VariantSwitcher";

export function Hero() {
  const [activeId, setActiveId] = useState<FlavorId>(variants[0].id);
  // Text/switcher stay hidden until the scroll-scrub animation has (almost)
  // finished playing, then pop in -- see SequenceCanvas's onRevealChange.
  // On mobile/reduced-motion (no scroll-scrub to wait on) this flips true
  // immediately.
  const [textRevealed, setTextRevealed] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const activeVariant = getVariant(activeId);

  useEffect(() => {
    // The default variant is already warm from the Preloader. Quietly warm
    // the other two so PREV/NEXT never has to wait on a network fetch.
    variants
      .filter((v) => v.id !== variants[0].id)
      .forEach((v) => loadFrames(v.id, v.sequence.basePath, v.sequence.frameCount));
  }, []);

  const revealTransition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <section
      id="product"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden bg-black py-28 sm:h-screen sm:py-0"
    >
      <div className="pointer-events-none relative z-10 sm:h-full">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 sm:h-full sm:grid-cols-[1fr_auto_1fr] sm:px-10">
          <motion.div
            className={`relative z-10 sm:col-start-1 ${textRevealed ? "pointer-events-auto" : "pointer-events-none"}`}
            initial={false}
            animate={{ opacity: textRevealed ? 1 : 0, y: textRevealed ? 0 : 24 }}
            transition={revealTransition}
          >
            <HeroTextOverlay variant={activeVariant} />
          </motion.div>
          {/* On mobile this sits in normal flow between the text and switcher;
              on sm+ it escapes to a full-bleed absolute background (see
              SequenceCanvas's own responsive positioning). Text/switcher are
              pinned to explicit columns so removing this from flow on sm+
              doesn't shift the switcher into the wrong column, and given an
              explicit z-index above the canvas since -- being the middle
              grid child -- it would otherwise paint over them on sm+. */}
          <SequenceCanvas sectionRef={sectionRef} activeVariant={activeVariant} onRevealChange={setTextRevealed} />
          <motion.div
            className={`relative z-10 flex justify-end sm:col-start-3 ${textRevealed ? "pointer-events-auto" : "pointer-events-none"}`}
            initial={false}
            animate={{ opacity: textRevealed ? 1 : 0, y: textRevealed ? 0 : 24 }}
            transition={{ ...revealTransition, delay: textRevealed ? 0.08 : 0 }}
          >
            <VariantSwitcher
              variant={activeVariant}
              onPrev={() => setActiveId(prevVariant(activeId).id)}
              onNext={() => setActiveId(nextVariant(activeId).id)}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
