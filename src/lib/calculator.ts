import { create } from "zustand";
import { combine, persist } from "zustand/middleware";
import glyphs from "@/data/glyphs.json";
import rituals from "@/data/rituals.json";
import { idbStorage } from "./idb-storage";
import { Ritual, type RitualConfig } from "./ritual";
import { SITES } from "./sites";

const initial = {
  ritual: new Ritual({
    choice: { ritual: "Makeshift communion", focus: 0 },
    site: "underworld",
    alterations: {},
    worn: {},
  }),
  /** How many rituals the results are for, once one's typed; until then, the golden ratio. */
  rituals: undefined as number | undefined,
};

/**
 * The ritual being planned, kept in IndexedDB between visits, and how many of it. Changing the ritual is
 * setting a new one, made with its `with`. Actions are arrow-function fields, as in inventory.ts.
 */
export const useCalculator = create(
  persist(
    // `loaded` once what was saved is in (or failed to load), so the page can wait for it rather than flash the
    // defaults. Not in `initial`, so resetting leaves it.
    combine(
      { ...initial, loaded: false },
      (set) =>
        new (class {
          setRitual = (ritual: Ritual) => set({ ritual });
          setRituals = (rituals?: number) => set({ rituals });
          /** Back to the defaults: everything but the settings. */
          reset = () => set(initial);
        })(),
    ),
    {
      name: "calculator",
      storage: idbStorage,
      // What was chosen, not the Ritual: it's made again from that.
      partialize: ({ ritual, rituals }) => ({ ...ritual.config, rituals }),
      // After loading, whether or not it worked: persist's own hasHydrated stays false on an error.
      onRehydrateStorage: () => () => useCalculator.setState({ loaded: true }),
      // What was saved may name a ritual, focus item, site or glyph the data no longer has (it's regenerated
      // from the wiki): those fall back to the defaults, or are dropped.
      merge: (saved, current) => {
        const {
          choice,
          site,
          alterations = {},
          worn = {},
          rituals: times,
        } = (saved ?? {}) as Partial<RitualConfig & { rituals: number }>;
        const valid = choice && choice.ritual in rituals && rituals[choice.ritual].focuses[choice.focus];
        return {
          ...current,
          rituals: times,
          ritual: current.ritual.with({
            choice: valid ? choice : current.ritual.config.choice,
            site: site && site in SITES ? site : current.ritual.config.site,
            alterations: Object.fromEntries(
              Object.entries(alterations).map(([ritual, counts]) => [
                ritual,
                Object.fromEntries(Object.entries(counts ?? {}).filter(([name]) => name in glyphs)),
              ]),
            ),
            // Only an alteration glyph can be chosen for gear.
            worn: Object.fromEntries(
              Object.entries(worn).map(([slot, piece]) => [
                slot,
                piece && {
                  id: piece.id,
                  ...(piece.glyph &&
                    piece.glyph in glyphs &&
                    "alteration" in glyphs[piece.glyph] && { glyph: piece.glyph }),
                },
              ]),
            ),
          }),
        };
      },
    },
  ),
);
