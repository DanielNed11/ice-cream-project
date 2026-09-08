"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerGsapPlugins() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;

  // Fonts load with `display: "swap"` (see layout.tsx), so the fallback
  // font's metrics differ from the real one -- once it swaps in, every
  // section below reflows to a different height. ScrollTrigger's initial
  // measurements happen before that swap, so every trigger position below
  // the fold goes stale unless we force a recalculation once fonts settle.
  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

export { gsap, ScrollTrigger };
