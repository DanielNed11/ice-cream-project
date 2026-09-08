"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant: "outline" | "filled";
  fillColor?: string;
}

export function Button({ href, children, variant, fillColor }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold tracking-wide transition-colors";

  if (variant === "outline") {
    return (
      <motion.a
        href={href}
        className={`${base} border border-white/70 text-white hover:bg-white/10`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.a
      href={href}
      className={`${base} text-black`}
      style={{ backgroundColor: fillColor }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.a>
  );
}
