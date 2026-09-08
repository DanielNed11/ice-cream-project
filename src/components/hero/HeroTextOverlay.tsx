"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Variant } from "@/lib/variants";
import { Button } from "@/components/ui/Button";

interface HeroTextOverlayProps {
  variant: Variant;
}

export function HeroTextOverlay({ variant }: HeroTextOverlayProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={variant.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-md"
      >
        <p className="font-mono text-xs tracking-[0.3em] text-white/60 uppercase">{variant.subtitle}</p>
        <h1 className="mt-3 text-5xl leading-[0.95] font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          {variant.name}
        </h1>
        <p className="mt-3 font-serif text-lg text-white/70 italic">{variant.taglineAccent}</p>
        <p className="mt-5 text-base text-white/80 sm:text-lg">{variant.description}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href="#ingredients" variant="outline">
            See Ingredients
          </Button>
          <Button href="#nutrition" variant="filled" fillColor={variant.themeColor}>
            Shop Now
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
