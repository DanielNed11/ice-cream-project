"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { registerGsapPlugins, gsap } from "@/lib/gsap/registerPlugins";
import { getCachedFrames, loadFrames } from "@/lib/hooks/sequenceCache";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useIsDesktopViewport } from "@/lib/hooks/useIsDesktopViewport";
import type { Variant } from "@/lib/variants";

// Text/switcher reveal fires once the scroll-scrub has played through this
// fraction of the sequence -- i.e. once the animation has essentially
// finished, not immediately on entry.
const REVEAL_PROGRESS_THRESHOLD = 0.92;

interface SequenceCanvasProps {
  sectionRef: RefObject<HTMLDivElement | null>;
  activeVariant: Variant;
  onRevealChange: (revealed: boolean) => void;
}

// Owns the scroll-scrubbed hero animation: preloads a variant's frame array,
// draws the frame matching the current scroll position onto a canvas
// (full-bleed across the whole hero section), and pins the section for the
// scrub distance. Reports scroll progress upward via onRevealChange so the
// overlay text/switcher can stay hidden until the sequence has finished.
//
// Below the `sm` breakpoint this renders a static poster instead. Pinning a
// section for a scroll-scrub distance only works cleanly when the section's
// natural content fits within one viewport; on narrow viewports the hero's
// text+image+switcher stack taller than that, and pinning it produces a
// large dead-scroll void with nothing visible. Simplifying to a static
// image on small viewports is the standard fix for this class of hero.
export function SequenceCanvas({ sectionRef, activeVariant, onRevealChange }: SequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  // Persists across variant switches so switching flavor doesn't reset scroll position.
  const currentFrameRef = useRef({ value: 0 });
  const revealedRef = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const isDesktop = useIsDesktopViewport();
  const useStaticHero = reducedMotion || !isDesktop;
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

  // There's no scroll-scrub to "finish" in the static-hero path (mobile or
  // reduced motion), so the text/switcher should just be visible right away.
  // Synced both directions (not just "reveal if true") because
  // useIsDesktopViewport's SSR snapshot defaults to false -- on the very
  // first client render useStaticHero can briefly read `true` even on
  // desktop, before the real matchMedia check corrects it a tick later. A
  // one-directional "only ever reveal" effect would let that transient
  // false positive permanently reveal the text before any scrolling; this
  // keeps revealedRef in sync with reality so it self-corrects and also
  // stays consistent with the scroll-driven updates below (which only run
  // when useStaticHero is false).
  useEffect(() => {
    revealedRef.current = useStaticHero;
    onRevealChange(useStaticHero);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useStaticHero]);

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
      if (useStaticHero || !sectionRef.current) return;

      const proxy = currentFrameRef.current;
      const tween = gsap.to(proxy, {
        value: activeVariant.sequence.frameCount - 1,
        snap: "value",
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=250%",
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const shouldReveal = self.progress >= REVEAL_PROGRESS_THRESHOLD;
            if (shouldReveal !== revealedRef.current) {
              revealedRef.current = shouldReveal;
              onRevealChange(shouldReveal);
            }
          },
        },
        onUpdate: () => render(Math.floor(proxy.value)),
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    // `ready` is deliberately excluded: render() already no-ops until frames
    // are loaded, so gating pin creation on it here only causes GSAP to
    // kill and recreate the ScrollTrigger's pin shortly after mount, which
    // risks leaving a stale fixed-position overlay in the DOM.
    { scope: sectionRef, dependencies: [useStaticHero] }
  );

  if (useStaticHero) {
    return (
      <div className="relative z-0 flex items-center justify-center sm:absolute sm:inset-0 sm:block">
        {isDesktop ? (
          <Image
            src={activeVariant.sequence.posterSrc}
            alt={`${activeVariant.name} tub`}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <Image
            src={activeVariant.sequence.posterSrc}
            alt={`${activeVariant.name} tub`}
            width={1280}
            height={720}
            priority
            className="h-auto max-h-[38vh] max-w-[85vw] w-auto object-contain"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative z-0 flex items-center justify-center sm:absolute sm:inset-0 sm:block">
      <canvas
        ref={canvasRef}
        aria-label={`${activeVariant.name} rotating product animation`}
        className="h-auto max-h-[38vh] max-w-[85vw] w-auto object-contain transition-opacity duration-150 ease-out sm:h-full sm:w-full sm:max-h-none sm:max-w-none sm:object-cover"
        style={{ opacity: fading ? 0 : 1 }}
      />
    </div>
  );
}
