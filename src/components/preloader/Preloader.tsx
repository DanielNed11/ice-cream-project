"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSequencePreloader } from "@/lib/hooks/useSequencePreloader";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { variants } from "@/lib/variants";

interface PreloaderProps {
  onDone: () => void;
}

// Blocks reveal only on the default (first) variant's frames -- the other
// two flavors prefetch quietly in the background after reveal. Under
// prefers-reduced-motion (which renders a static poster, not the
// scroll-scrub canvas -- see SequenceCanvas) it only waits on that single
// poster image instead, matching what SequenceCanvas actually needs.
export function Preloader({ onDone }: PreloaderProps) {
  const defaultVariant = variants[0];
  const reducedMotion = usePrefersReducedMotion();
  const { loaded, total, done } = useSequencePreloader(defaultVariant, reducedMotion);
  const percent = total === 0 ? 0 : Math.round((loaded / total) * 100);

  // Lock scroll while the preloader covers the screen so the pinned hero
  // ScrollTrigger underneath doesn't measure a scroll position the user
  // can't see.
  useEffect(() => {
    document.documentElement.style.overflow = done ? "" : "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [done]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.6 }}
        >
          <p className="font-sans text-2xl font-extrabold tracking-[0.2em] text-white">NANO</p>
          <div className="mt-6 h-[2px] w-48 overflow-hidden bg-white/15">
            <motion.div
              className="h-full bg-white"
              animate={{ width: `${percent}%` }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: "linear" }}
            />
          </div>
          <p className="mt-3 font-mono text-xs text-white/40">{percent}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
