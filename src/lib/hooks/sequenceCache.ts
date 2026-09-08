import type { FlavorId } from "@/lib/variants";

// Shared, module-level cache so the Preloader, Hero canvas, and variant
// switcher never re-fetch frames that have already loaded.
const cache = new Map<FlavorId, HTMLImageElement[]>();
const inflight = new Map<FlavorId, Promise<HTMLImageElement[]>>();

export function getCachedFrames(id: FlavorId): HTMLImageElement[] | undefined {
  return cache.get(id);
}

export function loadFrames(
  id: FlavorId,
  basePath: string,
  frameCount: number,
  onProgress?: (loaded: number, total: number) => void
): Promise<HTMLImageElement[]> {
  const existing = cache.get(id);
  if (existing && existing.length === frameCount) {
    onProgress?.(frameCount, frameCount);
    return Promise.resolve(existing);
  }

  const pending = inflight.get(id);
  if (pending) return pending;

  const promise = new Promise<HTMLImageElement[]>((resolve) => {
    const images: HTMLImageElement[] = new Array(frameCount);
    let settled = 0;

    const settle = () => {
      settled += 1;
      onProgress?.(settled, frameCount);
      if (settled === frameCount) {
        cache.set(id, images);
        inflight.delete(id);
        resolve(images);
      }
    };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      const frameNumber = String(i + 1).padStart(3, "0");
      img.onload = settle;
      img.onerror = settle;
      img.src = `${basePath}/frame_${frameNumber}.webp`;
      images[i] = img;
    }
  });

  inflight.set(id, promise);
  return promise;
}
