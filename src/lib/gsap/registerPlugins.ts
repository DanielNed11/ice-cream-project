"use client";

// Import from the explicit dist path, not the bare "gsap"/"gsap/ScrollTrigger"
// specifiers. gsap's package.json "exports" map resolves the `import`
// condition to a different file (./index.js) than the `require` condition
// (./dist/gsap.js), and @gsap/react's own internal `import gsap from "gsap"`
// could in principle resolve via a different condition than this file does,
// producing two separate gsap core instances where registering ScrollTrigger
// on one wouldn't make it available on the other. This didn't turn out to be
// the actual bug we hit (see SequenceCanvas/Hero for that -- a ref-timing
// issue), but it's cheap, real GSAP+bundler guidance worth keeping anyway.
import gsap from "gsap/dist/gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useGSAP } from "@gsap/react";

let registered = false;

export function registerGsapPlugins() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  // Belt-and-suspenders against the dual-instance risk above: @gsap/react
  // ships this exact API to pin useGSAP's internal gsap reference to a
  // specific core instance. Not in @gsap/react's type definitions
  // (runtime-only API), hence the cast.
  (useGSAP as unknown as { register: (core: typeof gsap) => void }).register(gsap);
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
