"use client";

import { useEffect, useRef, useState } from "react";
import type { Variant } from "@/lib/variants";
import { loadFrames } from "@/lib/hooks/sequenceCache";

const SAFETY_TIMEOUT_MS = 8000;

interface PreloadState {
  loaded: number;
  total: number;
  done: boolean;
}

function initialState(variant: Variant, posterOnly: boolean): PreloadState {
  return { loaded: 0, total: posterOnly ? 1 : variant.sequence.frameCount, done: false };
}

/**
 * Preloads a variant's frame sequence and reports real progress (not a fake
 * timer). Resolves `done` either when every frame has settled (loaded or
 * errored) or after a safety timeout, so a handful of failed requests can
 * never hard-lock the preloader.
 *
 * When `posterOnly` is true (small viewports, which render a static poster
 * instead of the scroll-scrub canvas -- see SequenceCanvas), only the single
 * poster image is preloaded instead of the full frame sequence.
 */
export function useSequencePreloader(variant: Variant, posterOnly = false): PreloadState {
  const [trackedKey, setTrackedKey] = useState(`${variant.id}:${posterOnly}`);
  const [state, setState] = useState<PreloadState>(() => initialState(variant, posterOnly));
  const doneRef = useRef(false);

  // Reset synchronously during render when the variant (or posterOnly mode)
  // changes -- React's documented pattern for adjusting state on prop
  // change -- rather than via a setState call inside the effect body.
  const key = `${variant.id}:${posterOnly}`;
  if (trackedKey !== key) {
    setTrackedKey(key);
    setState(initialState(variant, posterOnly));
    // Note: doneRef resets in the effect below (which also re-runs on key
    // change) -- refs can't be written during render.
  }

  useEffect(() => {
    doneRef.current = false;

    const timeoutId = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      console.warn(`[preloader] safety timeout hit for "${variant.id}" -- proceeding without full preload`);
      setState((s) => ({ ...s, done: true }));
    }, SAFETY_TIMEOUT_MS);

    if (posterOnly) {
      const img = new Image();
      const settle = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        window.clearTimeout(timeoutId);
        setState({ loaded: 1, total: 1, done: true });
      };
      img.onload = settle;
      img.onerror = settle;
      img.src = variant.sequence.posterSrc;
    } else {
      loadFrames(variant.id, variant.sequence.basePath, variant.sequence.frameCount, (loaded, total) => {
        if (doneRef.current) return;
        setState({ loaded, total, done: false });
        if (loaded === total) {
          doneRef.current = true;
          window.clearTimeout(timeoutId);
          setState({ loaded, total, done: true });
        }
      });
    }

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.id, posterOnly]);

  return state;
}
