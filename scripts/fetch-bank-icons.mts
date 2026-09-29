// Downloads the bank-scan templates (public/bank-icons/<item id>.png) from the RuneScape Wiki: the icon of
// every item in src/data/items.json. Run by `npm run data`, after the data.
//
// The wiki's icons are the game's own, less the 1px drop shadow, so they match screenshots. Each opaque
// pixel gets a tolerance (alpha 230: within 25 of each channel) and the rest none (alpha 0: anything goes).
import { mkdir, readFile, rm } from "node:fs/promises";
import sharp from "sharp";

const USER_AGENT = "necromancy-ritual-calculator (https://rituals.duke605.ca)";
const OUT_DIR = "public/bank-icons";
const ALPHA = 230;

const items: Record<string, { name: string; image: string }> = JSON.parse(await readFile("src/data/items.json", "utf8"));
const ids = Object.keys(items);

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
for (const id of ids) {
  const { name, image } = items[id];
  const res = await fetch(image, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok || res.headers.get("content-type") !== "image/png") throw new Error(`${res.status} for ${name}: ${image}`);
  const { data, info } = await sharp(Buffer.from(await res.arrayBuffer()))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) data[i] = data[i] > 128 ? ALPHA : 0;
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(`${OUT_DIR}/${id}.png`);
}
console.log(`${ids.length} icons`);
