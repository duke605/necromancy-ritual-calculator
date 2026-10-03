// Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collect } from "../lib/collect.ts";

describe("collect", () => {
  it("maps, filters and flattens in order", () =>
    assert.deepEqual(
      collect([1, 2, 3, 4])
        .filter((n) => n % 2 === 0)
        .map((n) => n * 10)
        .flatMap((n) => [n, n + 1])
        .toArray(),
      [20, 21, 40, 41],
    ));

  it("runs every step for one item before the next, only once collected", () => {
    const seen: string[] = [];
    const chain = collect([1, 2])
      .map((n) => (seen.push(`map ${n}`), n))
      .filter((n) => (seen.push(`filter ${n}`), true));
    assert.deepEqual(seen, []);
    chain.toArray();
    assert.deepEqual(seen, ["map 1", "filter 1", "map 2", "filter 2"]);
  });

  it("collects pairs into an object", () =>
    assert.deepEqual(
      collect(["a", "b"])
        .map((key, index) => [key, index] as const)
        .toObject(),
      { a: 0, b: 1 },
    ));

  it("goes through an object by its key-value pairs, and a Map as it is", () => {
    assert.deepEqual(collect({ a: 1, b: 2 }).toArray(), [
      ["a", 1],
      ["b", 2],
    ]);
    assert.deepEqual(collect(new Map([["a", 1]])).toArray(), [["a", 1]]);
    assert.deepEqual(collect("ab").toArray(), ["a", "b"]);
  });

  it("reduces", () =>
    assert.equal(
      collect([1, 2, 3]).reduce((sum, n) => sum + n, 0),
      6,
    ));
});
