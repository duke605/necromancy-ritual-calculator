import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { trigramSearch } from "../lib/trigram.ts";

const names = ["Big bones", "Baby dragon bones", "Dragon bones", "Bones", "Ectoplasm", "Greater necroplasm"];
const search = (query: string, limit?: number) => trigramSearch(names, query, (name: string) => name, limit);

describe("trigramSearch", () => {
  it("puts the exact name first", () => assert.equal(search("Dragon bones")[0], "Dragon bones"));
  it("forgives typos", () => assert.equal(search("ectoplsm")[0], "Ectoplasm"));
  it("leaves out names sharing nothing", () => assert.ok(!search("bones").includes("Ectoplasm")));
  it("gives the first ones for an empty query", () => assert.deepEqual(search("  ", 2), names.slice(0, 2)));
  it("stops at the limit", () => assert.equal(search("bones", 2).length, 2));
});
