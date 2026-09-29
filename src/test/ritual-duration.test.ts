// Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDuration, ritualSeconds } from "../lib/ritual-duration.ts";

describe("ritualSeconds", () => {
  it("is 1.2s a ritual tick", () => assert.equal(ritualSeconds(20), 24));
  it("rounds up to a whole tick once sped up", () => assert.equal(ritualSeconds(83, -45), 46 * 1.2));
  it("speeds up by at most half", () => assert.equal(ritualSeconds(83, -60), 42 * 1.2));
});

describe("formatDuration", () => {
  it("leaves off hours and minutes while they're 0", () => assert.equal(formatDuration(24), "24s"));
  it("keeps minutes, even 0, after hours", () => assert.equal(formatDuration(3605), "1h 0m 5s"));
  it("gives minutes and seconds", () => assert.equal(formatDuration(99.6), "1m 40s"));
});
