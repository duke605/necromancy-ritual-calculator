// Run with `npm test`.
// Expected values are from the live calculator (rituals.duke605.ca) where it has the buff, except where noted.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collect } from "../lib/collect.ts";
import { Ritual, wearOutfit, type RitualConfig } from "../lib/ritual.ts";

const [WEAK, LESSER, ECTOPLASM, BASIC, REGULAR] = [55598, 55599, 55336, 55594, 55595];
const [GRIMOIRE_4, NECKLACE] = [{ id: 55678 }, { id: 56412 }];

const lesserNecroplasm = (config: Partial<RitualConfig> = {}) =>
  new Ritual({
    choice: { ritual: "Lesser necroplasm", focus: 0 },
    site: "underworld",
    alterations: {},
    worn: {},
    ...config,
  });
const byId = (list: { id: number; amount: number }[]) =>
  collect(list)
    .map(({ id, amount }) => [id, amount] as const)
    .toObject();
/** Seconds to a tenth, past floating-point error. */
const tenths = (seconds: number) => Math.round(seconds * 10) / 10;

describe("Ritual", () => {
  it("leaves itself alone when changed", () => {
    const ritual = lesserNecroplasm();
    assert.equal(ritual.with({ site: "ungael" }).config.site, "ungael");
    assert.equal(ritual.config.site, "underworld");
  });

  it("keeps alteration glyphs for each ritual", () => {
    const altered = lesserNecroplasm().withAlterations({ "Multiply I": 1 });
    assert.deepEqual(altered.alterations, { "Multiply I": 1 });
    assert.deepEqual(altered.with({ choice: { ritual: "Lesser communion", focus: 0 } }).alterations, {});
  });

  it("takes and makes, with Multiply I and Underworld Grimoire 4, for 2", () => {
    const ritual = lesserNecroplasm({
      alterations: { "Lesser necroplasm": { "Multiply I": 1 } },
      worn: { pocket: GRIMOIRE_4 },
    });
    assert.deepEqual(byId(ritual.inputs(2)), { [WEAK]: 400, [BASIC]: 8, [REGULAR]: 2, [ECTOPLASM]: 1 });
    assert.deepEqual(byId(ritual.outputs(2)), { [LESSER]: 270, [ECTOPLASM]: 6 });
    assert.equal(ritual.experience * 2, 400);
    assert.equal(ritual.soulAttraction, 120);
  });

  it("makes 115 with Underworld Grimoire 4 alone", () => {
    // The live calculator says 114: it floors 100 × 1.15, which in floating point is 114.999….
    assert.equal(byId(lesserNecroplasm({ worn: { pocket: GRIMOIRE_4 } }).outputs(1))[LESSER], 115);
  });

  it("strengthens alteration glyphs with the necklace", () => {
    const ritual = lesserNecroplasm({
      alterations: { "Lesser necroplasm": { "Multiply I": 1 } },
      worn: { pocket: GRIMOIRE_4, neck: NECKLACE },
    });
    assert.equal(ritual.altered.multiply, 24);
    assert.equal(ritual.multiplier, 124);
    assert.equal(ritual.necroplasmMultiplier, 139);
    assert.equal(ritual.soulAttraction, 124);
    assert.equal(byId(ritual.outputs(2))[LESSER], 278);
  });

  it("makes glyphs last longer and gives less XP at Ungael", () => {
    const ritual = lesserNecroplasm({
      site: "ungael",
      alterations: { "Lesser necroplasm": { "Multiply I": 1 } },
      worn: { pocket: GRIMOIRE_4, neck: NECKLACE },
    });
    assert.equal(ritual.experience * 2, 320);
    assert.equal(ritual.goldenRatio, 21);
    assert.deepEqual(byId(ritual.inputs(7)), { [WEAK]: 1400, [BASIC]: 10, [REGULAR]: 6, [ECTOPLASM]: 3 });
    assert.deepEqual(byId(ritual.outputs(7)), { [LESSER]: 973, [ECTOPLASM]: 21 });
    assert.equal(tenths(ritual.seconds * 7), 277.2);
  });

  it("speeds up with Speed glyphs, to at most 50% faster", () => {
    const speed = (count: number) => lesserNecroplasm({ alterations: { "Lesser necroplasm": { "Speed III": count } } });
    assert.deepEqual(
      [1, 2, 3].map((count) => tenths(speed(count).seconds)),
      [34.8, 28.8, 22.8],
    );
    assert.equal(speed(4).soulAttraction, 460);
    // The wiki caps it at 50% (17 ticks); the live calculator means to, but doesn't, and says 16.8.
    assert.equal(tenths(speed(4).seconds), 20.4);
  });

  it("counts the cape's glyph, free and without a spot, strengthened by the necklace", () => {
    const ritual = lesserNecroplasm({
      alterations: { "Lesser necroplasm": { "Speed III": 4 } },
      worn: { back: { id: 55203, glyph: "Speed III" } },
    });
    assert.equal(ritual.soulAttraction, 550);
    assert.equal(ritual.with({ worn: { ...ritual.config.worn, neck: NECKLACE } }).soulAttraction, 640);
    // Its spots and ectoplasm are the four drawn glyphs' alone.
    assert.equal(ritual.free, 8);
    assert.equal(byId(ritual.inputs(3))[ECTOPLASM], 8);
    // Not on a cape that isn't in the data (a max cape, saved before it was taken out).
    assert.equal(ritual.with({ worn: { back: { id: 20767, glyph: "Speed III" } } }).capeGlyph, undefined);
  });

  it("gives more XP in the ritualist's outfit, 6% for all of it", () => {
    // Not in the live calculator: 1% a piece, and 1% more for the set, from the wiki.
    const outfit = [57697, 57698, 57699, 57700, 57701];
    const slots = ["head", "torso", "legs", "hands", "feet"] as const;
    const wearing = (count: number) =>
      lesserNecroplasm({
        worn: collect(slots.slice(0, count))
          .map((slot, i) => [slot, { id: outfit[i] }] as const)
          .toObject(),
      });
    assert.equal(wearing(4).experience, 208);
    assert.equal(wearing(5).experience, 212);
    // All of it, over anything else, with the mask asked for.
    const worn = wearOutfit({ head: { id: 57697 }, feet: { id: 55972 }, ring: { id: 61760 } }, true);
    assert.deepEqual(worn, {
      head: { id: 57696 },
      torso: { id: 57698 },
      legs: { id: 57699 },
      hands: { id: 57700 },
      feet: { id: 57701 },
      ring: { id: 61760 },
    });
    assert.equal(lesserNecroplasm({ worn }).experience, 212);
    assert.equal(wearOutfit(worn).head?.id, 57697);
  });
});
