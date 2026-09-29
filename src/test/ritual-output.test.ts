// Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ritualOutput } from "../lib/ritual-output.ts";

describe("ritualOutput", () => {
  it("rounds down short of a whole one more", () => assert.equal(ritualOutput(1, 90), 1));
  it("gives a whole one more at double", () => assert.equal(ritualOutput(1, 100), 2));
  it("rounds down past one more", () => assert.equal(ritualOutput(1, 190), 2));
  it("multiplies bigger amounts", () => assert.equal(ritualOutput(100, 120), 220));
  it("leaves it alone with no Multiply glyphs", () => assert.equal(ritualOutput(3), 3));
});
