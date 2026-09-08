// Extracts individual frames from the source animated WebP sequences into
// public/sequences/<flavor>/frame_XXX.webp for scroll-scrub playback, plus a
// poster frame per flavor in public/posters/. Run via `npm run prep:frames`
// whenever the source *-animation-final.webp files change.
import sharp from "sharp";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FLAVORS = [
  { id: "banana", source: "banana-animation-final.webp" },
  { id: "chocolate", source: "chocolate-animation-final.webp" },
  { id: "strawberry", source: "strawberry-animation-final.webp" },
];

// Tuning knobs: subsample every 2nd source frame (192 -> 96), downscale to
// 800x450, moderate WebP quality. Bump FRAME_STEP down (fewer frames) if
// scrubbing feels choppy, or QUALITY up if alpha edges show banding.
const FRAME_STEP = 2;
const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 450;
const QUALITY = 75;

async function extractFlavor({ id, source }) {
  const sourcePath = path.join(ROOT, source);
  const outDir = path.join(ROOT, "public", "sequences", id);
  await mkdir(outDir, { recursive: true });

  const meta = await sharp(sourcePath, { animated: true }).metadata();
  const pageCount = meta.pages ?? 1;
  console.log(`[${id}] source: ${meta.width}x${meta.pageHeight}, ${pageCount} pages, alpha=${meta.hasAlpha}`);

  let frameIndex = 1;
  let firstFrameFile = null;
  for (let page = 0; page < pageCount; page += FRAME_STEP) {
    const buffer = await sharp(sourcePath, { page })
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "contain" })
      .webp({ quality: QUALITY })
      .toBuffer();

    const filename = `frame_${String(frameIndex).padStart(3, "0")}.webp`;
    await writeFile(path.join(outDir, filename), buffer);
    if (!firstFrameFile) firstFrameFile = path.join(outDir, filename);
    frameIndex += 1;
  }

  const posterDir = path.join(ROOT, "public", "posters");
  await mkdir(posterDir, { recursive: true });
  await copyFile(firstFrameFile, path.join(posterDir, `${id}-poster.webp`));

  const frameCount = frameIndex - 1;
  console.log(`[${id}] wrote ${frameCount} frames -> public/sequences/${id}/`);
  return frameCount;
}

const results = {};
for (const flavor of FLAVORS) {
  results[flavor.id] = await extractFlavor(flavor);
}

console.log("\nDone.", results);
const counts = new Set(Object.values(results));
if (counts.size > 1) {
  console.warn("WARNING: flavors produced different frame counts:", results);
}
