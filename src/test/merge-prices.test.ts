// Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergePrices } from "../lib/merge-prices.ts";

describe("mergePrices", () => {
  const prices = { 1: { value: 100, locked: false }, 2: { value: 500, locked: true }, 3: { value: 7, locked: false } };
  const merged = mergePrices(prices, new Map([[1, 120], [2, 900], [4, 50]]));

  it("updates unlocked prices", () => assert.deepEqual(merged[1], { value: 120, locked: false }));
  it("leaves locked prices alone", () => assert.deepEqual(merged[2], { value: 500, locked: true }));
  it("keeps prices the sync didn't send", () => assert.deepEqual(merged[3], { value: 7, locked: false }));
  it("adds new ones", () => assert.deepEqual(merged[4], { value: 50, locked: false }));
});
