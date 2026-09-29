// Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { layoutGlyphs } from "../lib/glyph-layout.ts";

// The Underworld's glyph spots, in reading order: 0 1 / 2 3 4 / 5 6 / 7 8 / 9 10.
const UNDERWORLD = [
  "....L....",
  ".G..L..G.",
  "..G.G.G..",
  "...L.L...",
  "L.G.F.G.L",
  "...L.L...",
  "...G.G...",
  ".G..L..G.",
  "....L....",
];

describe("layoutGlyphs", () => {
  it("puts pairs either side of the focus, nearest first, and an odd one in its column", () =>
    assert.deepEqual(
      layoutGlyphs(UNDERWORLD, [
        { name: "A", amount: 1 },
        { name: "B", amount: 2 },
      ]),
      [undefined, undefined, undefined, "A", undefined, "B", "B", undefined, undefined, undefined, undefined],
    ));

  it("puts a second odd one out as near the focus as there's room", () => {
    const placed = layoutGlyphs(UNDERWORLD, [
      { name: "A", amount: 3 },
      { name: "B", amount: 1 },
    ]);
    // The pair, then the focus's column, then the next nearest spot.
    assert.deepEqual([placed[5], placed[6]], ["A", "A"]);
    assert.equal(placed[3], "A");
    assert.equal(placed[7], "B");
  });

  // Two of a kind, on small sites with the focus in the middle.
  const pair = [{ name: "A", amount: 2 }];
  it("pairs left and right before above and below", () =>
    assert.deepEqual(layoutGlyphs(["G.G", ".F.", "G.."], pair), ["A", "A", undefined]));
  it("pairs above and below where left and right can't", () =>
    assert.deepEqual(layoutGlyphs(["G..", ".F.", "G.."], pair), ["A", "A"]));
  it("pairs diagonally opposite where neither can", () =>
    assert.deepEqual(layoutGlyphs(["G..", ".F.", "..G"], pair), ["A", "A"]));

  it("fills every spot when there are as many glyphs as spots", () => {
    const placed = layoutGlyphs(UNDERWORLD, [
      { name: "A", amount: 5 },
      { name: "B", amount: 3 },
      { name: "C", amount: 3 },
    ]);
    assert.ok(placed.every(Boolean));
  });

  it("throws when there are more glyphs than spots", () =>
    assert.throws(() => layoutGlyphs(UNDERWORLD, [{ name: "A", amount: 12 }])));
});
