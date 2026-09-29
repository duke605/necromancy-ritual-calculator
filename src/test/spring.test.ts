// Run with `npm test`.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { springPath } from "../lib/spring.ts";

describe("springPath", () => {
  // Opening from 200 to 347: overshoots past 347 by about 13% of the 147px, then ends exactly there.
  const open = springPath(200, 347);
  const overshoot = Math.max(...open) - 347;

  it("overshoots by about 13% and ends on the target", () => {
    assert.ok(overshoot > 0.1 * 147 && overshoot < 0.16 * 147, `overshoot ${overshoot}`);
    assert.equal(open.at(-1), 347);
  });

  it("bounces twice as far over twice the distance", () => {
    const far = Math.max(...springPath(53, 347)) - 347;
    assert.ok(Math.abs(far / overshoot - 2) < 0.05, `ratio ${far / overshoot}`);
  });

  it("bounces back off a hard edge without passing it", () => {
    const close = springPath(65, 0, { floor: 0 });
    assert.ok(Math.min(...close) >= 0, "went past the edge");
    assert.ok(close.some((x: number, i: number) => i > 0 && x > close[i - 1]), "didn't bounce");
    assert.equal(close.at(-1), 0);
  });

  it("carries a flick towards the target further past it", () => {
    const flicked = Math.max(...springPath(200, 347, { velocity: 1 })) - 347;
    assert.ok(flicked > overshoot, `flicked ${flicked}`);
  });

  it("carries a flick away back first", () => {
    const away = springPath(200, 347, { velocity: -1 });
    assert.ok(away[1] < 200, `moved to ${away[1]}`);
  });
});
