// Reads a bank screenshot off the main thread, so the page stays responsive and can show progress.
// Gets a File; posts { progress } (0 to 1) as it goes, then { width, height, found } or { error }.
import items from "@/data/items.json";
import { scanBank, type Match, type Pixels, type Template } from "./bank-scan";

export type ScanMessage =
  | { progress: number }
  | { width: number; height: number; found: Match[] }
  | { error: string };

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

/** Every item's icon (public/bank-icons, from `npm run data`), fetched once per worker. */
let templates: Promise<Template[]> | undefined;
const loadTemplates = () =>
  (templates ??= Promise.all(
    Object.keys(items).map(async (id) => {
      const res = await fetch(`/bank-icons/${id}.png`);
      if (!res.ok) throw new Error(`Icon ${id}: ${res.status}`);
      return { id: Number(id), pixels: await pixelsOf(await res.blob()) };
    }),
  ));

const post = (message: ScanMessage) => postMessage(message);

addEventListener("message", async ({ data: file }: MessageEvent<File>) => {
  try {
    const [pixels, icons] = await Promise.all([pixelsOf(file), loadTemplates()]);
    const found = scanBank(pixels, icons, {}, (done, total) => post({ progress: done / total }));
    post({ width: pixels.width, height: pixels.height, found });
  } catch (error) {
    // Fetched again next time, rather than failing every scan after one bad fetch.
    templates = undefined;
    post({ error: error instanceof Error ? error.message : String(error) });
  }
});
