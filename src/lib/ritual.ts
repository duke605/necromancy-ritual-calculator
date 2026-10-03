// Relative imports, with extensions, so Node can run it for the tests.
import equipment from "../data/equipment.json" with { type: "json" };
import GLYPHS from "../data/glyphs.json" with { type: "json" };
import inks from "../data/inks.json" with { type: "json" };
import items from "../data/items.json" with { type: "json" };
import RITUALS from "../data/rituals.json" with { type: "json" };
import type { AlterationCounts } from "@/app/alterations";
import type { Worn } from "@/app/choose-gear";
import type { RitualChoice, RitualName } from "@/app/choose-ritual";
import type { GlyphName } from "./components/ritual-site";
import { collect } from "./collect.ts";
import { goldenRatio } from "./golden-ratio.ts";
import { ritualSeconds } from "./ritual-duration.ts";
import { ritualOutput } from "./ritual-output.ts";
import { SITES, type RitualSiteName } from "./sites.ts";

const ECTOPLASM = 55336;

/** Everything chosen for a ritual: all a `Ritual` is made from, and all that's saved of it. */
export type RitualConfig = {
  choice: RitualChoice;
  site: RitualSiteName;
  /** The alteration glyphs on the site, kept for each ritual. */
  alterations: Partial<Record<RitualName, AlterationCounts>>;
  worn: Worn;
};

type Gear = (typeof equipment)[keyof typeof equipment];
type Focus = (typeof RITUALS)[RitualName]["focuses"][number] & { souls?: number };
type Item = { id: number; amount: number };

/** What gear does that adds up, each in percent. */
const EFFECTS = [
  "xp",
  "focusSave",
  "alterationBoost",
  "necroplasm",
  "disturbanceXp",
  "soulAttraction",
  "doubleRewards",
] as const;
export type GearEffects = Record<(typeof EFFECTS)[number], number>;

/** The ritualist's outfit, by slot, with the plain mask. */
export const OUTFIT = { head: 57697, torso: 57698, legs: 57699, hands: 57700, feet: 57701 } as const;

const isOutfit = (piece?: { id: number }) =>
  "xp" in (equipment[`${piece?.id}` as keyof typeof equipment]?.effects ?? {});

/** `worn` with all of the ritualist's outfit on, the `modified` mask or the plain one, over whatever else is in its slots. */
export function wearOutfit(worn: Worn, modified = false): Worn {
  const outfit = collect({ ...OUTFIT, head: modified ? 57696 : OUTFIT.head })
    .map(([slot, id]) => [slot, { id }] as const)
    .toObject();
  return { ...worn, ...outfit };
}

const isNecroplasm = (id: number) => /necroplasm/i.test(items[`${id}` as keyof typeof items].name);

/**
 * A ritual as planned, with everything it takes, makes and gives worked out from what's chosen (`config`). It
 * never changes: `with` makes a new one, so whatever holds it sees the change.
 */
export class Ritual {
  readonly config: RitualConfig;

  constructor(config: RitualConfig) {
    this.config = config;
  }

  /** This ritual with `changes` made. */
  with(changes: Partial<RitualConfig>) {
    return new Ritual({ ...this.config, ...changes });
  }

  /** This ritual with `counts` as its alteration glyphs, leaving other rituals' alone. */
  withAlterations(counts: AlterationCounts) {
    return this.with({ alterations: { ...this.config.alterations, [this.config.choice.ritual]: counts } });
  }

  get data() {
    return RITUALS[this.config.choice.ritual];
  }

  get focus(): Focus {
    return this.data.focuses[this.config.choice.focus];
  }

  /** This ritual's alteration glyphs. */
  get alterations(): AlterationCounts {
    return this.config.alterations[this.config.choice.ritual] ?? {};
  }

  /** Every glyph on the site: the ritual's own, then the alteration glyphs, so its own get the spots nearest the focus. */
  get glyphs() {
    return [
      ...(this.data.glyphs as { name: GlyphName; amount: number }[]),
      ...collect(this.alterations)
        .filter(([, amount]) => amount)
        .map(([name, amount]) => ({ name, amount: amount! })),
    ];
  }

  /** The glyph spots the ritual's own glyphs leave for alteration glyphs. */
  get free() {
    const spots = SITES[this.config.site].join("").split("G").length - 1;
    return spots - this.data.glyphs.reduce((sum, { amount }) => sum + amount, 0);
  }

  /** The gear worn; an unequipped slot has none. */
  get gear() {
    return collect(this.config.worn)
      .map(([, piece]) => equipment[`${piece?.id}` as keyof typeof equipment])
      .filter((piece): piece is Gear => piece !== undefined)
      .toArray();
  }

  /** Whether a cape with the Necromancy cape's perk is worn (what was saved may be one that's no longer in the data). */
  get wearsCape() {
    const back = this.config.worn.back;
    return back !== undefined && "glyph" in (equipment[`${back.id}` as keyof typeof equipment]?.effects ?? {});
  }

  /** The alteration glyph chosen for the worn cape: it works as if drawn, free and without a spot. */
  get capeGlyph() {
    return this.wearsCape ? this.config.worn.back?.glyph : undefined;
  }

  /** What the worn gear adds up to. */
  get effects() {
    const total: GearEffects = collect(EFFECTS)
      .map((effect) => [effect, 0] as const)
      .toObject();
    for (const { effects } of this.gear) {
      for (const effect of EFFECTS) total[effect] += Number((effects as Record<string, unknown>)[effect] ?? 0);
    }
    // The whole ritualist's outfit, five pieces at 1% each, gives 1% more.
    if (Object.values(this.config.worn).filter(isOutfit).length === 5) total.xp += 1;
    return total;
  }

  /**
   * What the alteration glyphs, the cape's too, do, added up, in percent: Multiply's to outputs, Speed's to
   * duration (negative) and all of theirs to soul attraction. The alteration necklace strengthens each (rounded:
   * 20% of a multiple of 5 is whole anyway).
   */
  get altered() {
    const total = { multiply: 0, duration: 0, soulAttraction: 0 };
    const boost = this.effects.alterationBoost;
    const counts = { ...this.alterations };
    if (this.capeGlyph) counts[this.capeGlyph] = (counts[this.capeGlyph] ?? 0) + 1;
    for (const [name, count = 0] of Object.entries(counts) as [GlyphName, number][]) {
      // Not every glyph has every effect.
      const glyph: Record<string, unknown> = GLYPHS[name];
      for (const effect of Object.keys(total) as (keyof typeof total)[]) {
        total[effect] += Math.round((count * Number(glyph[effect] ?? 0) * (100 + boost)) / 100);
      }
    }
    return total;
  }

  /** How many rituals a glyph lasts; a fifth longer at Ungael. */
  lasts(name: GlyphName) {
    return Math.floor(GLYPHS[name].durability * (this.config.site === "ungael" ? 1.2 : 1));
  }

  /** The fewest rituals that wear every glyph out together. */
  get goldenRatio() {
    return goldenRatio(this.glyphs.map(({ name }) => this.lasts(name)));
  }

  /** What `n` rituals take: the focus items, and the ink (and ectoplasm, for some) to redraw the glyphs as they wear out. */
  inputs(n: number): Item[] {
    const used: Record<number, number> = { [this.focus.input.id]: this.focus.input.amount * n };
    const add = (id: number, amount: number) => (used[id] = (used[id] ?? 0) + amount);
    for (const { name, amount } of this.glyphs) {
      const draws = Math.ceil(n / this.lasts(name)) * amount;
      const glyph: { inks: Partial<Record<keyof typeof inks, number>>; ectoplasm?: number } = GLYPHS[name];
      for (const [ink, each = 0] of Object.entries(glyph.inks)) add(inks[ink as keyof typeof inks].id, each * draws);
      if (glyph.ectoplasm) add(ECTOPLASM, glyph.ectoplasm * draws);
    }
    return Object.entries(used).map(([id, amount]) => ({ id: Number(id), amount }));
  }

  /** What `n` rituals make, with Multiply glyphs (and for necroplasm, the Underworld Grimoire), rounded down for each. */
  outputs(n: number): Item[] {
    const { multiply } = this.altered;
    const { necroplasm } = this.effects;
    return this.focus.outputs.map(({ id, amount }) => ({
      id,
      amount: ritualOutput(amount, multiply + (isNecroplasm(id) ? necroplasm : 0)) * n,
    }));
  }

  /** The souls `n` rituals send to the Well of Souls, multiplied as outputs are. */
  souls(n: number) {
    return ritualOutput(this.focus.souls ?? 0, this.altered.multiply) * n;
  }

  /** How long a ritual takes, in seconds, with its Speed glyphs. */
  get seconds() {
    return ritualSeconds(this.data.durationTicks, this.altered.duration);
  }

  /** How much each output is multiplied, in percent: 100, and what the Multiply glyphs add. */
  get multiplier() {
    return 100 + this.altered.multiply;
  }

  /** The same for necroplasm, with the Underworld Grimoire's too, for a ritual that makes it. */
  get necroplasmMultiplier() {
    return this.focus.outputs.some(({ id }) => isNecroplasm(id))
      ? this.multiplier + this.effects.necroplasm
      : undefined;
  }

  /** Soul attraction, in percent: 100 to begin with, and what the alteration glyphs and gear add. */
  get soulAttraction() {
    return 100 + this.altered.soulAttraction + this.effects.soulAttraction;
  }

  /** The Necromancy XP a ritual gives, without disturbances': a fifth less at Ungael, more in the ritualist's outfit. */
  get experience() {
    return (this.data.experience * (this.config.site === "ungael" ? 0.8 : 1) * (100 + this.effects.xp)) / 100;
  }
}
