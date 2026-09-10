"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { registerGsapPlugins, gsap } from "@/lib/gsap/registerPlugins";
import { getCachedFrames, loadFrames } from "@/lib/hooks/sequenceCache";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import type { Variant } from "@/lib/variants";

interface SequenceCanvasProps {
  // The actual DOM node (not a ref object) -- see Hero.tsx for why: React
  // attaches refs and fires layout effects bottom-up, so a ref owned by
  // this component's *parent* still reads `.current === null` inside this
  // component's own first layout effect. Hero.tsx tracks the node in state
  // via a callback ref instead, so this re-renders (and the effect below
  // re-runs) once the node genuinely exists.
  sectionEl: HTMLElement | null;
  activeVariant: Variant;
}

// Owns the scroll-scrubbed hero animation: preloads a variant's frame array,
// draws the frame matching the current scroll position onto a canvas
// (full-bleed across the whole hero section), and pins the section for the
// scrub distance. The Hero section this lives in is nothing but this
// canvas -- no overlay text -- see FlavorIntro for the flavor
// name/description/switcher, which lives in its own section below.
//
// Runs identically on mobile and desktop -- the scrub previously fell back
// to a static poster below the `sm` breakpoint because the hero section
// used to also hold stacked text, and pinning content taller than the
// viewport produced a dead-scroll void. Now that the hero is just this
// canvas at a plain h-screen on every breakpoint, that constraint is gone.
// The static poster fallback remains for prefers-reduced-motion only.
export function SequenceCanvas({ sectionEl, activeVariant }: SequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  // Persists across variant switches so switching flavor doesn't reset scroll position.
  const currentFrameRef = useRef({ value: 0 });
  const useStaticHero = usePrefersReducedMotion();
  const [fading, setFading] = useState(false);

  registerGsapPlugins();

  function render(frameIndex: number) {
    const canvas = canvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = frames[Math.min(Math.max(frameIndex, 0), frames.length - 1)];
    if (!img || !img.complete) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    if (useStaticHero) return;
    let cancelled = false;

    function applyFrames(imgs: HTMLImageElement[]) {
      const canvas = canvasRef.current;
      const first = imgs[0];
      if (!canvas || !first) return;

      const swap = () => {
        if (cancelled) return;
        canvas.width = first.naturalWidth || 1280;
        canvas.height = first.naturalHeight || 720;
        const isFirstLoad = framesRef.current.length === 0;
        setFading(true);
        window.setTimeout(() => {
          if (cancelled) return;
          framesRef.current = imgs;
          setFading(false);
          render(Math.floor(currentFrameRef.current.value));
        }, isFirstLoad ? 0 : 90);
      };

      if (first.complete) swap();
      else first.onload = swap;
    }

    const cached = getCachedFrames(activeVariant.id);
    if (cached) {
      applyFrames(cached);
    } else {
      loadFrames(activeVariant.id, activeVariant.sequence.basePath, activeVariant.sequence.frameCount).then(
        (imgs) => {
          if (!cancelled) applyFrames(imgs);
        }
      );
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVariant.id, useStaticHero]);

  useGSAP(
    () => {
      if (useStaticHero || !sectionEl) return;

      const proxy = currentFrameRef.current;
      const tween = gsap.to(proxy, {
        value: activeVariant.sequence.frameCount - 1,
        snap: "value",
        ease: "none",
        scrollTrigger: {
          trigger: sectionEl,
          start: "top top",
          end: "+=250%",
          // Lower = less delay between actual scroll position and the frame
          // shown. 0.5 felt laggy specifically during slow scrolling (the
          // catch-up delay is time-based, not frame-based -- more frames
          // never fixes this). Still >0 rather than `true` (zero smoothing)
          // so fast, jerky input (wheel notches, trackpad flicks) doesn't
          // look twitchy.
          scrub: 0.15,
          pin: true,
          anticipatePin: 1,
        },
        onUpdate: () => render(Math.floor(proxy.value)),
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    // `sectionEl` is a real dependency here (not just scope config): the
    // effect needs to re-run once the node actually mounts, since it's null
    // on the very first render.
    { scope: sectionEl ?? undefined, dependencies: [useStaticHero, sectionEl] }
  );

  // Full-bleed edge to edge on every breakpoint, matching desktop -- the
  // product frame crops to fill the viewport rather than letterboxing.
  if (useStaticHero) {
    return (
      <div className="absolute inset-0">
        <Image
          src={activeVariant.sequence.posterSrc}
          alt={`${activeVariant.name} tub`}
          fill
          priority
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        aria-label={`${activeVariant.name} rotating product animation`}
        className="h-full w-full object-cover transition-opacity duration-150 ease-out"
        style={{ opacity: fading ? 0 : 1 }}
      />
    </div>
  );
}
