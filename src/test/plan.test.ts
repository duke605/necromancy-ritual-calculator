// Run with `npm test`.
// Expected values are from the live calculator (rituals.duke605.ca) where it has the setup, except where noted.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collect } from "../lib/collect.ts";
import { ADDED_RITUALS, plan, type AddedSetup } from "../lib/plan.ts";
import { Ritual } from "../lib/ritual.ts";
import type { AlterationCounts } from "../app/alterations.tsx";

const [DRAGON_BONES, WEAK, LESSER, GREATER, ECTOPLASM, BASIC, GREATER_INK, VIAL, ASHES] = [
  536, 55598, 55599, 55600, 55336, 55594, 55596, 227, 592,
];

const greaterCommunion = (alterations: AlterationCounts = {}) =>
  new Ritual({
    choice: { ritual: "Greater communion", focus: 0 },
    site: "underworld",
    alterations: { "Greater communion": alterations },
    worn: {},
  });
/** Every added ritual set up as `setup`. */
const allAdded = (setup: AddedSetup) =>
  collect(ADDED_RITUALS)
    .map(({ ritual }) => [ritual, setup] as const)
    .toObject();
const byId = (list: { id: number; amount: number }[]) =>
  collect(list)
    .map(({ id, amount }) => [id, amount] as const)
    .toObject();
const steps = (result: ReturnType<typeof plan>) =>
  result.steps.map(({ ritual, count }) => `${ritual.config.choice.ritual} ${count}`);

describe("plan", () => {
  it("is just the ritual, outside Ironman mode", () => {
    const result = plan(greaterCommunion(), 12);
    assert.deepEqual(steps(result), ["Greater communion 12"]);
    assert.deepEqual(byId(result.inputs), byId(greaterCommunion().inputs(12)));
  });

  it("adds the rituals that make the necroplasm for the inks, in Ironman mode", () => {
    const result = plan(greaterCommunion(), 12, { ironman: true });
    assert.deepEqual(steps(result), ["Lesser necroplasm 8", "Greater necroplasm 2", "Greater communion 12"]);
    // The live calculator also lists the inks, and the necroplasm the added rituals make, as inputs.
    assert.deepEqual(byId(result.inputs), {
      [DRAGON_BONES]: 12,
      [VIAL]: 24,
      [ASHES]: 24,
      [BASIC]: 39,
      [WEAK]: 1600,
    });
    // Done in order, each from what the ones before made: Lesser necroplasm ×8 makes 800, of which Greater
    // necroplasm ×2 takes 400 as its focus and 200 for its 10 regular inks (20 each), and Greater communion 120 for
    // its 6. Its 8 greater inks take 160 of the 200 Greater necroplasm. Each ink also takes a vial and ashes.
    assert.deepEqual(byId(result.outputs), { [ECTOPLASM]: 122, [LESSER]: 80, [GREATER]: 40 });
    assert.equal(result.souls, 120);
    assert.equal(result.experience, 22320);
    assert.equal(result.disturbanceChances, 72);
    assert.equal(Math.round(result.seconds * 10) / 10, 1291.2);
  });

  it("leaves the ritual's alteration glyphs off the added rituals, set up the same as it", () => {
    // Their inks can be of a tier the added rituals make the necroplasm for, or above: a Lesser necroplasm ritual
    // can't take ink made from Greater necroplasm. So it's as the live calculator, and as with no glyphs of their own.
    const result = plan(greaterCommunion({ "Multiply II": 2 }), 12, { ironman: true });
    assert.deepEqual(steps(result), ["Lesser necroplasm 9", "Greater necroplasm 2", "Greater communion 12"]);
    const plain = plan(greaterCommunion({ "Multiply II": 2 }), 12, {
      ironman: true,
      added: allAdded({ same: false, alterations: {} }),
    });
    assert.deepEqual(result.inputs, plain.inputs);
  });

  it("does the added rituals with alteration glyphs of their own, starting with the necroplasm for their inks", () => {
    const added = allAdded({ same: false, alterations: { "Multiply II": 2 } });
    const result = plan(greaterCommunion({ "Multiply II": 2 }), 12, { ironman: true, added });
    assert.deepEqual(steps(result), ["Lesser necroplasm 5", "Greater necroplasm 1", "Greater communion 12"]);
    // 8 ectoplasm for the glyphs: 4 for the ritual's two Multiply II, 2 for each added ritual's. Only Lesser
    // necroplasm's 2 are to get: the rest are what it makes. As are the 4 regular inks for its glyphs: their 80
    // Lesser necroplasm are to get, to start with.
    assert.equal(byId(result.inputs)[ECTOPLASM], 2);
    assert.equal(byId(result.inputs)[LESSER], 80);
    assert.equal(result.glyphsLeftOff, false);
  });

  it("does the added rituals with their own alteration glyphs, when set up so", () => {
    const added = allAdded({ same: false, alterations: {} });
    const result = plan(greaterCommunion({ "Multiply II": 2 }), 12, { ironman: true, added });
    assert.deepEqual(steps(result), ["Lesser necroplasm 9", "Greater necroplasm 2", "Greater communion 12"]);
    // The live calculator says 185 ectoplasm: the ritual's Multiply II take 4 of what the added rituals make.
    assert.deepEqual(byId(result.outputs), { [ECTOPLASM]: 181, [LESSER]: 20, [GREATER]: 40 });
  });

  it("rounds the added rituals up to their golden ratio, with No waste", () => {
    const result = plan(greaterCommunion(), 12, { ironman: true, noWaste: true });
    for (const { ritual, count } of result.steps.slice(0, -1)) assert.equal(count % ritual.goldenRatio, 0);
    assert.deepEqual(steps(result).at(-1), "Greater communion 12");
  });

  it("takes what's in the inventory first", () => {
    assert.equal(byId(plan(greaterCommunion(), 12, { inventory: { [DRAGON_BONES]: 5 } }).inputs)[DRAGON_BONES], 7);
  });

  it("leaves the inventory it's given alone", () => {
    const inventory = { [DRAGON_BONES]: 5 };
    plan(greaterCommunion(), 12, { inventory });
    plan(greaterCommunion(), 12, { ironman: true, inventory });
    assert.deepEqual(inventory, { [DRAGON_BONES]: 5 });
  });

  it("takes the inventory off what's to get, in Ironman mode", () => {
    // 39 basic inks, less the 30 had.
    const result = plan(greaterCommunion(), 12, { ironman: true, inventory: { [BASIC]: 30 } });
    assert.equal(byId(result.inputs)[BASIC], 9);
  });

  it("makes fewer inks, and adds fewer rituals, for what's in the inventory, in Ironman mode", () => {
    // The 8 greater inks it needs: no Greater necroplasm to make, so no rituals for it.
    const inks = plan(greaterCommunion(), 12, { ironman: true, inventory: { [GREATER_INK]: 8 } });
    assert.deepEqual(steps(inks), ["Lesser necroplasm 2", "Greater communion 12"]);
    // Enough Lesser necroplasm, and some ashes.
    const result = plan(greaterCommunion(), 12, { ironman: true, inventory: { [LESSER]: 1000, [ASHES]: 10 } });
    assert.deepEqual(steps(result), ["Greater necroplasm 2", "Greater communion 12"]);
    assert.equal(byId(result.inputs)[ASHES], 14);
  });

  it("does the added rituals with the cape glyph chosen for them", () => {
    const worn = { back: { id: 55203, glyph: "Speed III" as const } };
    const ritual = greaterCommunion().with({ worn });
    // The live calculator says 5 and 2: it adds a ritual too many when one makes exactly what's needed.
    const multiply = plan(ritual, 12, {
      ironman: true,
      added: allAdded({ same: false, alterations: {}, cape: "Multiply III" }),
    });
    assert.deepEqual(steps(multiply), ["Lesser necroplasm 4", "Greater necroplasm 1", "Greater communion 12"]);
    assert.equal(multiply.steps[0].ritual.capeGlyph, "Multiply III");
    // The ritual's own cape is left as it is.
    assert.equal(multiply.steps.at(-1)!.ritual.capeGlyph, "Speed III");
    assert.equal(plan(ritual, 12, { ironman: true }).steps[0].ritual.capeGlyph, "Speed III");
    const none = allAdded({ same: false, alterations: {} });
    assert.equal(plan(ritual, 12, { ironman: true, added: none }).steps[0].ritual.capeGlyph, undefined);
    // Without a Necromancy cape on, there's no glyph to choose.
    const capeless = plan(greaterCommunion(), 12, {
      ironman: true,
      added: allAdded({ same: false, alterations: {}, cape: "Multiply III" }),
    });
    assert.equal(capeless.steps[0].ritual.capeGlyph, undefined);
  });
});
