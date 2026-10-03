// Relative imports, with extensions, so Node can run it for the tests.
import inks from "../data/inks.json" with { type: "json" };
import RITUALS from "../data/rituals.json" with { type: "json" };
import type { AlterationCounts } from "@/app/alterations";
import type { RitualChoice, RitualName } from "@/app/choose-ritual";
import { collect } from "./collect.ts";
import type { GlyphName } from "./components/ritual-site";
import type { Ritual } from "./ritual.ts";

/** How many of each item, by its id. */
type Amounts = Record<number, number>;

/** One ritual, and how many times to do it. */
export type Step = { ritual: Ritual; count: number };

/** A ritual Ironman mode adds, to make `makes` (an item id, e.g. Lesser necroplasm) for the ink. */
type AddedStep = Step & { makes: number };

export type PlanOptions = {
  /** Make the inks that can be made, adding the rituals that make what they're made from. */
  ironman?: boolean;
  /** Round the added rituals up to their golden ratio. */
  noWaste?: boolean;
  /** What's already had, taken before anything's needed or made. */
  inventory?: Amounts;
  /** How each added ritual is set up, by name; one that isn't, as the ritual. */
  added?: AddedSetups;
};

/**
 * How an added ritual is set up: as the ritual (its alteration glyphs, as many as fit, and its cape glyph), or
 * with its own alteration glyphs and cape glyph (none without `cape`).
 */
export type AddedSetup = { same: true } | { same: false; alterations: AlterationCounts; cape?: GlyphName };
export type AddedSetups = Partial<Record<RitualName, AddedSetup>>;

// --- Data -----------------------------------------------------------------------------------------------------

/** The recipe for each ink that can be made, by the ink's id. Basic ink has none: it's only sold. */
const INK_RECIPES = new Map<number, { makes: number; materials: { id: number; amount: number }[] }>();
for (const ink of Object.values(inks)) {
  if ("materials" in ink) INK_RECIPES.set(ink.id, ink);
}

/** The ritual (and focus) that makes each ink material a ritual can make, by the material's id: the necroplasms. */
const MAKERS = new Map<number, RitualChoice>();
for (const { materials } of INK_RECIPES.values()) {
  for (const { id } of materials) {
    for (const [ritual, { focuses }] of Object.entries(RITUALS)) {
      const focus = focuses.findIndex(({ outputs }) => outputs.some((output) => output.id === id));
      if (focus !== -1 && !MAKERS.has(id)) MAKERS.set(id, { ritual: ritual as RitualName, focus });
    }
  }
}

/** The rituals Ironman mode can add, lowest level first. */
export const ADDED_RITUALS = [...MAKERS.values()].sort((a, b) => RITUALS[a.ritual].level - RITUALS[b.ritual].level);

/**
 * The added ritual `choice`, set up as `setup` says, for `main`: in the Underworld, in the same gear. Without
 * `alterations`, its alteration glyphs are left off. Without a Necromancy cape on, there's no cape glyph to choose.
 */
export function addedRitual(
  main: Ritual,
  choice: RitualChoice,
  setup: AddedSetup = { same: true },
  alterations = true,
) {
  const ritual = main.with({ choice, site: "underworld" });
  if (setup.same) return ritual.withAlterations(alterations ? fit(main.alterations, ritual.free) : {});
  const { worn } = main.config;
  return ritual
    .with({ worn: main.wearsCape ? { ...worn, back: { ...worn.back!, glyph: setup.cape } } : worn })
    .withAlterations(alterations ? setup.alterations : {});
}

// --- The plan -------------------------------------------------------------------------------------------------

/**
 * Everything `rituals` of `ritual` take, make and give.
 *
 * In Ironman mode, inks are made rather than bought, so rituals are added to make the necroplasm they're made from.
 * Those rituals are done in the Underworld, with the same gear, as many times as needed. What they make goes into
 * the inks; anything left over is listed as made.
 */
export function plan(ritual: Ritual, rituals: number, options: PlanOptions = {}) {
  const { ironman = false, noWaste = false, inventory = {}, added: setups = {} } = options;
  const main: Step = { ritual, count: rituals };

  if (!ironman) {
    const needed = takeFrom(inventory, inputsOf([main]));
    return { ...summarize([main], needed, sum(ritual.outputs(rituals)), ritual.souls(rituals)), glyphsLeftOff: false };
  }

  // With the added rituals' alteration glyphs, if that works out; otherwise without.
  const setup = { noWaste, inventory, setups };
  const withGlyphs = addRituals(main, { ...setup, alterations: true });
  // Left off the added rituals: with them, the counts never settled.
  const glyphsLeftOff = !withGlyphs;
  const added = (withGlyphs ?? addRituals(main, { ...setup, alterations: false })!).filter(({ count }) => count > 0);
  const steps = [...added, main];

  const needed = ironmanNeeds(steps, inventory);
  const made = sum(ritual.outputs(rituals));
  for (const step of added) {
    for (const output of step.ritual.outputs(step.count)) {
      // What an added ritual makes for the ink covers what's needed of it; only the rest is left over.
      const usedUp = output.id === step.makes ? Math.min(needed[output.id] ?? 0, output.amount) : 0;
      needed[output.id] = (needed[output.id] ?? 0) - usedUp;
      made[output.id] = (made[output.id] ?? 0) + output.amount - usedUp;
    }
  }
  return { ...summarize(steps, needed, made, ritual.souls(rituals)), glyphsLeftOff };
}

/**
 * The rituals Ironman mode adds, one for each necroplasm, with how many times each is done, lowest level first.
 *
 * Each count is set to make enough for everything, the added rituals included. But more of one ritual means more
 * ink for it, and so more of the others, so it goes round until no count changes. Counts only ever go up, so it
 * can't go back and forth forever. If it doesn't settle (alteration glyphs costing more ink than they make up for),
 * it gives up and returns undefined.
 */
function addRituals(
  main: Step,
  {
    noWaste,
    inventory,
    setups,
    alterations,
  }: { noWaste: boolean; inventory: Amounts; setups: AddedSetups; alterations: boolean },
): AddedStep[] | undefined {
  const added: AddedStep[] = collect(MAKERS)
    .map(([makes, choice]) => ({
      makes,
      ritual: addedRitual(main.ritual, choice, setups[choice.ritual], alterations),
      count: 0,
    }))
    .toArray();

  for (let round = 0; round < 1000; round++) {
    const needed = ironmanNeeds([...added, main], inventory);
    let changed = false;
    for (const step of added) {
      const count = timesNeeded(step, needed[step.makes] ?? 0, noWaste);
      if (count > step.count) {
        step.count = count;
        changed = true;
      }
    }
    if (!changed) return added.sort((a, b) => a.ritual.data.level - b.ritual.data.level);
  }
}

/** How many times `step` has to be done to make `amount` of what it makes: whole rituals, or with `noWaste`, golden ratios. */
function timesNeeded(step: AddedStep, amount: number, noWaste: boolean) {
  const each = step.ritual.outputs(1).find(({ id }) => id === step.makes)!.amount;
  const count = Math.ceil(amount / each);
  if (!noWaste) return count;
  const golden = step.ritual.goldenRatio;
  return Math.ceil(count / golden) * golden;
}

// --- What's needed --------------------------------------------------------------------------------------------

/**
 * What `steps` need in Ironman mode, beyond the `inventory`: what they use, then for the inks still needed, what
 * those are made from. (The inventory goes to the inks first, then to their materials.)
 */
function ironmanNeeds(steps: Step[], inventory: Amounts) {
  const left = { ...inventory };
  const stillNeeded = takeFrom(left, inputsOf(steps));
  return takeFrom(left, makeInks(stillNeeded));
}

/** Everything `steps` use, added up. */
function inputsOf(steps: Step[]) {
  const total: Amounts = {};
  for (const { ritual, count } of steps) add(total, ritual.inputs(count));
  return total;
}

/** `amounts` with the inks that can be made swapped for what they're made from, in whole batches. */
function makeInks(amounts: Amounts) {
  const result: Amounts = {};
  for (const [id, amount] of entries(amounts)) {
    const recipe = INK_RECIPES.get(id);
    if (!recipe) {
      add(result, [{ id, amount }]);
      continue;
    }
    const batches = Math.ceil(amount / recipe.makes);
    for (const material of recipe.materials) add(result, [{ id: material.id, amount: material.amount * batches }]);
  }
  return result;
}

/** What's left of `amounts` after taking what `inventory` has of each, which it then no longer has. */
function takeFrom(inventory: Amounts, amounts: Amounts) {
  const left: Amounts = {};
  for (const [id, amount] of entries(amounts)) {
    const taken = Math.min(inventory[id] ?? 0, amount);
    inventory[id] = (inventory[id] ?? 0) - taken;
    left[id] = amount - taken;
  }
  return left;
}

// --- Totals ---------------------------------------------------------------------------------------------------

/** The steps, what they still need and make, the souls, and their totals: time, XP and disturbance chances. */
function summarize(steps: Step[], needed: Amounts, made: Amounts, souls: number) {
  const total = (each: (ritual: Ritual) => number) =>
    steps.reduce((sum, { ritual, count }) => sum + each(ritual) * count, 0);
  return {
    steps,
    inputs: list(needed),
    outputs: list(made),
    souls,
    seconds: total((ritual) => ritual.seconds),
    experience: total((ritual) => ritual.experience),
    // How many chances; which disturbances come of them is random.
    disturbanceChances: total((ritual) => ritual.data.disturbanceChances),
  };
}

// --- Small helpers --------------------------------------------------------------------------------------------

/** Adds `items` to `to`. */
function add(to: Amounts, items: { id: number; amount: number }[]) {
  for (const { id, amount } of items) to[id] = (to[id] ?? 0) + amount;
  return to;
}

/** `items` added up by id. */
const sum = (items: { id: number; amount: number }[]) => add({}, items);

/** `amounts` as [id, amount] pairs, ids as numbers. */
const entries = (amounts: Amounts) => collect(amounts).map(([id, amount]) => [Number(id), amount] as const);

/** `amounts` as a list, leaving out what there's none of. */
const list = (amounts: Amounts) =>
  entries(amounts)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => ({ id, amount }))
    .toArray();

/** As many of the alteration glyphs `counts` as fit in `free` spots, in order. */
function fit(counts: AlterationCounts, free: number) {
  const fitted: AlterationCounts = {};
  for (const [name, count = 0] of Object.entries(counts) as [GlyphName, number][]) {
    const taken = Math.min(count, free);
    if (taken > 0) fitted[name] = taken;
    free -= taken;
  }
  return fitted;
}
