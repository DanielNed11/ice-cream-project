// Extracts individual frames from the source MP4 animations into
// public/sequences/<flavor>/frame_XXX.webp for scroll-scrub playback, plus a
// poster frame per flavor in public/posters/. Run via `npm run prep:frames`
// whenever the source *-animation.mp4 files change.
//
// Pipeline: ffmpeg extracts every frame losslessly to PNG first, then sharp
// resizes + encodes each as WebP. Going through a lossless intermediate
// matters -- the source MP4s are themselves already lossy (H.264), so this
// keeps the WebP quality=80 encode below as the ONLY additional lossy step.
// Extracting frames from an already-lossy-recompressed source (e.g. an
// animated WebP that was itself quality=80) would stack two independent
// lossy passes and compound the artifacts.
import sharp from "sharp";
import { mkdir, writeFile, copyFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FLAVORS = [
  { id: "banana", source: "banana-animation.mp4" },
  { id: "chocolate", source: "chocolate-animation.mp4" },
  { id: "strawberry", source: "strawberry-animation.mp4" },
];

// Tuning knobs: downscale to 1280x720 (banana/chocolate sources are already
// this size; strawberry's source is 1080p and gets downscaled to match, same
// 16:9 aspect ratio so it's a clean proportional resize, no letterboxing),
// moderate WebP quality. Bump QUALITY up if alpha edges show banding.
const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 720;
const QUALITY = 80;

async function extractFlavor({ id, source }) {
  const sourcePath = path.join(ROOT, source);
  const outDir = path.join(ROOT, "public", "sequences", id);
  const tmpDir = path.join(ROOT, ".tmp-frames", id);
  await mkdir(outDir, { recursive: true });
  await mkdir(tmpDir, { recursive: true });

  // -fps_mode passthrough: emit exactly one output frame per input frame,
  // no duplication or dropping from timestamp rounding.
  await execFileAsync("ffmpeg", [
    "-y",
    "-i", sourcePath,
    "-fps_mode", "passthrough",
    path.join(tmpDir, "frame_%04d.png"),
  ]);

  const pngFiles = (await readdir(tmpDir)).filter((f) => f.endsWith(".png")).sort();
  console.log(`[${id}] extracted ${pngFiles.length} lossless frames from ${source}`);

  let firstFrameFile = null;
  for (let i = 0; i < pngFiles.length; i++) {
    const frameIndex = i + 1;
    const buffer = await sharp(path.join(tmpDir, pngFiles[i]))
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: "contain" })
      .webp({ quality: QUALITY })
      .toBuffer();

    const filename = `frame_${String(frameIndex).padStart(3, "0")}.webp`;
    await writeFile(path.join(outDir, filename), buffer);
    if (!firstFrameFile) firstFrameFile = path.join(outDir, filename);
  }

  await rm(tmpDir, { recursive: true, force: true });

  const posterDir = path.join(ROOT, "public", "posters");
  await mkdir(posterDir, { recursive: true });
  await copyFile(firstFrameFile, path.join(posterDir, `${id}-poster.webp`));

  const frameCount = pngFiles.length;
  console.log(`[${id}] wrote ${frameCount} frames -> public/sequences/${id}/`);
  return frameCount;
}

const results = {};
for (const flavor of FLAVORS) {
  results[flavor.id] = await extractFlavor(flavor);
}
await rm(path.join(ROOT, ".tmp-frames"), { recursive: true, force: true });

console.log("\nDone.", results);
const counts = new Set(Object.values(results));
if (counts.size > 1) {
  console.warn("WARNING: flavors produced different frame counts:", results);
}
