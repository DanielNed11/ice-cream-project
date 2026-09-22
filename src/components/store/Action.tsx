"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The landing page's `Button` vocabulary (rounded-full, px-7, text-sm
 * semibold, a small scale nudge on hover/press) applied to the real buttons
 * and links the store pages need -- `Button` itself is anchor-only and belongs
 * to the landing page, so it is left untouched.
 *
 * The hover/press nudge is CSS rather than framer-motion here so it can be
 * switched off by `motion-reduce:` without a hook; the JS-driven entrances
 * elsewhere use `usePrefersReducedMotion` instead.
 */
export type ActionTone = "filled" | "outline" | "accent";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold " +
  "tracking-wide transition-[transform,background-color,opacity,border-color] duration-200 " +
  "hover:scale-[1.03] active:scale-[0.97] motion-reduce:transition-none " +
  "motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-ring " +
  // 44px minimum touch target, 48px at the default size.
  "disabled:pointer-events-none disabled:opacity-50";

const TONES: Record<ActionTone, string> = {
  filled: "bg-white text-black hover:bg-white/90",
  outline: "border border-white/25 text-white hover:border-white/50 hover:bg-white/10",
  // `accent` takes the flavour's themeColor inline; every themeColor in
  // variants.ts is contrast-checked for black text.
  accent: "text-black",
};

function classesFor(tone: ActionTone, size: "md" | "sm", fullWidth: boolean, className?: string) {
  return [
    BASE,
    TONES[tone],
    size === "sm" ? "h-11" : "h-12",
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ActionTone;
  size?: "md" | "sm";
  fullWidth?: boolean;
  accentColor?: string;
  children: ReactNode;
}

export function ActionButton({
  tone = "filled",
  size = "md",
  fullWidth = false,
  accentColor,
  className,
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      {...rest}
      className={classesFor(tone, size, fullWidth, className)}
      style={tone === "accent" && accentColor ? { backgroundColor: accentColor } : undefined}
    >
      {children}
    </button>
  );
}

interface ActionLinkProps {
  href: Route;
  tone?: ActionTone;
  size?: "md" | "sm";
  fullWidth?: boolean;
  accentColor?: string;
  className?: string;
  children: ReactNode;
}

export function ActionLink({
  href,
  tone = "filled",
  size = "md",
  fullWidth = false,
  accentColor,
  className,
  children,
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={classesFor(tone, size, fullWidth, className)}
      style={tone === "accent" && accentColor ? { backgroundColor: accentColor } : undefined}
    >
      {children}
    </Link>
  );
}

/** Inline text link, matching the underlined links on the landing page. */
export function TextLink({ href, children }: { href: Route; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-sm text-white underline underline-offset-4 transition-colors hover:text-white/80 focus-ring"
    >
      {children}
    </Link>
  );
}
