// Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { goldenRatio } from "../lib/golden-ratio.ts";

describe("goldenRatio", () => {
  it("is the least common multiple", () => assert.equal(goldenRatio([6, 4, 3]), 12));
  it("is the durability of one glyph", () => assert.equal(goldenRatio([7]), 7));
  it("is 1 with no glyphs", () => assert.equal(goldenRatio([]), 1));
});
