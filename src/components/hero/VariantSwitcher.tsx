"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Variant } from "@/lib/variants";

interface VariantSwitcherProps {
  variant: Variant;
  onPrev: () => void;
  onNext: () => void;
}

export function VariantSwitcher({ variant, onPrev, onNext }: VariantSwitcherProps) {
  return (
    <div className="flex flex-col items-end gap-6">
      <AnimatePresence mode="wait">
        <motion.span
          key={variant.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="font-mono text-6xl font-bold text-white/90 sm:text-7xl"
        >
          {String(variant.index).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
      <div className="flex flex-col items-center gap-3 rounded-full border border-white/20 px-2 py-4">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous flavor"
          className="font-mono text-xs tracking-widest text-white/60 transition-colors hover:text-white"
        >
          PREV
        </button>
        <span className="h-8 w-px bg-white/20" aria-hidden="true" />
        <button
          type="button"
          onClick={onNext}
          aria-label="Next flavor"
          className="font-mono text-xs tracking-widest text-white/60 transition-colors hover:text-white"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
