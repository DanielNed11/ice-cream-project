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
  // Below `sm`, this mirrors the same frame full-bleed behind the sharp
  // canvas (blurred + dimmed) -- see `blurLayerClassName` below for why a
  // second layer is needed at all. Unused (never drawn to) at `sm`+.
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  // Persists across variant switches so switching flavor doesn't reset scroll position.
  const currentFrameRef = useRef({ value: 0 });
  const useStaticHero = usePrefersReducedMotion();
  const [fading, setFading] = useState(false);

  registerGsapPlugins();

  function drawFrame(canvas: HTMLCanvasElement | null, img: HTMLImageElement) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  function render(frameIndex: number) {
    const frames = framesRef.current;
    if (frames.length === 0) return;
    const img = frames[Math.min(Math.max(frameIndex, 0), frames.length - 1)];
    if (!img || !img.complete) return;
    drawFrame(canvasRef.current, img);
    drawFrame(bgCanvasRef.current, img);
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
        if (bgCanvasRef.current) {
          bgCanvasRef.current.width = canvas.width;
          bgCanvasRef.current.height = canvas.height;
        }
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
    // `sectionEl` is a real dependency here (not just scope config): the
    // effect needs to re-run once the node actually mounts, since it's null
    // on the very first render.
    { scope: sectionEl ?? undefined, dependencies: [useStaticHero, sectionEl] }
  );

  // The source frames are 16:9 (1280x720). object-cover on a narrow/tall
  // phone viewport (e.g. 390x844, aspect ~0.46) has to scale the image up
  // so much to fill both dimensions that it crops out most of the frame --
  // the tub ends up cut off and zoomed in far past what's readable. contain
  // shows the whole frame instead, but by itself that leaves a lot of bare
  // black letterboxing above/below and no longer reads as full-bleed like
  // the desktop layout. So below `sm` we fill the space with a second copy
  // of the same frame, blurred/scaled/dimmed behind the sharp contained one
  // -- full-bleed edge to edge, product never cropped. Wide/short viewports
  // (sm+) are close enough to 16:9 that plain cover reads as intended and
  // don't render the blurred layer at all.
  const blurLayerClassName =
    "absolute inset-0 h-full w-full scale-125 object-cover blur-3xl brightness-[0.45] sm:hidden";
  // Below `sm`, size this wrapper to exactly match the 16:9 frame at the
  // current width (aspect-video, vertically centered) instead of stretching
  // it to the full h-screen box -- that's what object-contain was doing
  // before, and it left a lot of dead letterbox space where a mask-image
  // couldn't usefully fade anything (the mask's own 0-100% range covered
  // that empty margin, not the photo itself). With the wrapper sized to the
  // real photo bounds, its edges *are* the photo's edges, so the mask below
  // actually feathers real content into the blurred layer behind it instead
  // of stopping short. sm+ reverts to the original full-bleed cover box.
  const foregroundBoxClassName =
    "absolute inset-x-0 top-1/2 -translate-y-1/2 aspect-video [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] sm:inset-0 sm:top-0 sm:h-full sm:w-full sm:translate-y-0 sm:aspect-auto sm:[mask-image:none]";

  if (useStaticHero) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={activeVariant.sequence.posterSrc}
          alt=""
          aria-hidden="true"
          fill
          className={blurLayerClassName}
        />
        <div className={foregroundBoxClassName}>
          <Image
            src={activeVariant.sequence.posterSrc}
            alt={`${activeVariant.name} tub`}
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={bgCanvasRef} aria-hidden="true" className={blurLayerClassName} />
      <div className={foregroundBoxClassName}>
        <canvas
          ref={canvasRef}
          aria-label={`${activeVariant.name} rotating product animation`}
          className="h-full w-full object-cover transition-opacity duration-150 ease-out"
          style={{ opacity: fading ? 0 : 1 }}
        />
      </div>
    </div>
  );
}
