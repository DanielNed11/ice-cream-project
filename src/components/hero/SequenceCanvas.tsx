"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { registerGsapPlugins, gsap } from "@/lib/gsap/registerPlugins";
import { getCachedFrames, loadFrames } from "@/lib/hooks/sequenceCache";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useIsDesktopViewport } from "@/lib/hooks/useIsDesktopViewport";
import type { Variant } from "@/lib/variants";

interface SequenceCanvasProps {
  sectionRef: RefObject<HTMLDivElement | null>;
  activeVariant: Variant;
}

// Owns the scroll-scrubbed hero animation: preloads a variant's frame array,
// draws the frame matching the current scroll position onto a canvas, and
// pins the whole hero section (via sectionRef) for the scrub distance.
//
// Below the `sm` breakpoint this renders a static poster instead. Pinning a
// section for a scroll-scrub distance only works cleanly when the section's
// natural content fits within one viewport; on narrow viewports the hero's
// text+image+switcher stack taller than that, and pinning it produces a
// large dead-scroll void with nothing visible. Simplifying to a static
// image on small viewports is the standard fix for this class of hero.
export function SequenceCanvas({ sectionRef, activeVariant }: SequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  // Persists across variant switches so switching flavor doesn't reset scroll position.
  const currentFrameRef = useRef({ value: 0 });
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

  useEffect(() => {
    if (useStaticHero) return;
    let cancelled = false;

    function applyFrames(imgs: HTMLImageElement[]) {
      const canvas = canvasRef.current;
      const first = imgs[0];
      if (!canvas || !first) return;

      const swap = () => {
        if (cancelled) return;
        canvas.width = first.naturalWidth || 800;
        canvas.height = first.naturalHeight || 450;
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

  // On mobile this sits in normal document flow (a plain grid row between
  // the text and switcher); on sm+ it escapes to a full-bleed absolute
  // background behind the text/switcher overlay.
  const wrapperClass = "relative z-0 flex items-center justify-center sm:absolute sm:inset-0";

  if (useStaticHero) {
    return (
      <div className={wrapperClass}>
        <Image
          src={activeVariant.sequence.posterSrc}
          alt={`${activeVariant.name} tub`}
          width={800}
          height={450}
          priority
          className="h-auto max-h-[38vh] max-w-[85vw] w-auto object-contain sm:max-h-[70vh] sm:max-w-none"
        />
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <canvas
        ref={canvasRef}
        aria-label={`${activeVariant.name} rotating product animation`}
        className="h-auto max-h-[38vh] max-w-[85vw] w-auto object-contain transition-opacity duration-150 ease-out sm:max-h-[80vh] sm:max-w-none"
        style={{ opacity: fading ? 0 : 1 }}
      />
    </div>
  );
}
