// Reads a bank screenshot off the main thread, so the page stays responsive and can show progress.
// Gets { id, file }; posts { progress } (0 to 1) as it goes, then { width, height, found } or { error }, each
// with the id. Scans queue: one given mid-scan starts when it's done.
import items from "@/data/items.json";
import { scanBank, type Match, type Pixels, type Template } from "./bank-scan";

export type ScanRequest = { id: number; file: File };
export type ScanMessage = { id: number } & (
  | { progress: number }
  | { width: number; height: number; found: Match[] }
  | { error: string }
);

/**
 * An image's pixels, as they're stored: no colour profile applied, so a screenshot's colours are the
 * game's, and no premultiplied alpha, so a template's alphas (its tolerances) leave its colours alone.
 */
async function pixelsOf(image: Blob): Promise<Pixels> {
  const bitmap = await createImageBitmap(image, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
  const { width, height } = bitmap;
  const context = new OffscreenCanvas(width, height).getContext("2d")!;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return context.getImageData(0, 0, width, height);
}

/**
 * Every item's icon (public/bank-icons, from `npm run data`), fetched once per worker, from when it starts:
 * that's most of a first scan's time (over a second), so the page starts the worker ahead of it.
 */
let templates: Promise<Template[]> | undefined;
const loadTemplates = () =>
  (templates ??= Promise.all(
    Object.keys(items).map(async (id) => {
      const res = await fetch(`/bank-icons/${id}.png`);
      if (!res.ok) throw new Error(`Icon ${id}: ${res.status}`);
      return { id: Number(id), pixels: await pixelsOf(await res.blob()) };
    }),
  ));
// Fetched again by the first scan if this fails, which reports why.
loadTemplates().catch(() => (templates = undefined));

const post = (message: ScanMessage) => postMessage(message);

addEventListener("message", async ({ data: { id, file } }: MessageEvent<ScanRequest>) => {
  try {
    const [pixels, icons] = await Promise.all([pixelsOf(file), loadTemplates()]);
    const found = scanBank(pixels, icons, {}, (done, total) => post({ id, progress: done / total }));
    post({ id, width: pixels.width, height: pixels.height, found });
  } catch (error) {
    // Fetched again next time, rather than failing every scan after one bad fetch.
    templates = undefined;
    post({ id, error: error instanceof Error ? error.message : String(error) });
  }
});
