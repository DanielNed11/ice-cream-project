"use client";

import { useSyncExternalStore } from "react";

// Matches Tailwind's `sm` breakpoint -- the same width where Hero's grid
// switches from a stacked single column to the 3-column layout the pinned
// scroll-scrub hero was designed for.
const QUERY = "(min-width: 640px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsDesktopViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
