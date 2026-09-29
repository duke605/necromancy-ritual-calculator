// Run with `npm test`.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import sharp from "sharp";
import { scanBank } from "../lib/bank-scan.ts";

const load = async (path: string) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

const templates = await Promise.all(
  (await readdir("public/bank-icons")).map(async (file) => ({
    id: Number(file.replace(".png", "")),
    pixels: await load(`public/bank-icons/${file}`),
  })),
);

const byId = (a: { id: number; count: number }, b: { id: number; count: number }) => a.id - b.id || a.count - b.count;

// Items whose icons are the same, so either is a right guess for the other.
const IDENTICAL = [
  [532, 534], // Big bones, Baby dragon bones
  [55220, 55221], // Kili's tools, and ensouled
  [55602, 55612], // Lesser unensouled bar, Greater ensouled bar (within 5 of each channel)
];
const identical = (a: number, b: number) => a === b || IDENTICAL.some((pair) => pair.includes(a) && pair.includes(b));

// Each fixture is a screenshot (name.png) and what it shows (name.json): exactly those items and counts
// are named, none missed and none extra from the other icons. Items cut off at a screenshot's edge
// aren't expected.
const fixtures = "src/test/fixtures";
const names = (await readdir(fixtures)).filter((file) => file.endsWith(".png")).map((file) => file.replace(".png", ""));

describe("scanBank", () => {
  for (const name of names.sort()) {
    it(`finds the items in ${name}`, async () => {
      const { items }: { items: { id: number; count: number }[] } = JSON.parse(
        await readFile(`${fixtures}/${name}.json`, "utf8"),
      );
      // The best guess is the expected item, or ties with it (identical icons).
      // Icons matching no item (ones rituals don't use) are left out.
      const found = scanBank(await load(`${fixtures}/${name}.png`), templates).flatMap(
        ({ id, count, candidates }: { id: number | null; count: number; candidates: number[] }) => {
          if (id === null) return [];
          const want = items.find((item) => item.count === count && candidates.includes(item.id));
          return [{ id: want && identical(want.id, id) ? want.id : id, count }];
        },
      );
      assert.deepEqual(found.sort(byId), items.map(({ id, count }) => ({ id, count })).sort(byId));
    });
  }

  // bank-1 shows a full tab, 11 slots by 12, beside the inventory, presets and buttons.
  it("boxes every slot in the bank's grid, and nothing else", async () => {
    assert.equal(scanBank(await load(`${fixtures}/bank-1.png`), templates).length, 11 * 12);
  });
});
