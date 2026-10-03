import { create } from "zustand";
import { combine, persist } from "zustand/middleware";
import { collect } from "./collect";
import { idbStorage } from "./idb-storage";

/**
 * What the user has, by item id, kept in IndexedDB between visits. The actions are arrow-function fields,
 * not methods, as in prices.ts: combine copies only an object's own fields.
 */
export const useInventory = create(
  persist(
    // `loaded` once what was saved is in (or failed to load), as in calculator.ts.
    combine(
      { counts: {} as Record<number, number>, loaded: false },
      (set) =>
        new (class {
          /** Sets these items' counts, as a bank screenshot shows them, leaving other items alone. */
          setCounts = (counts: Map<number, number>) =>
            set((state) => ({ counts: { ...state.counts, ...Object.fromEntries(counts) } }));
          /** Adds these to what's there of each item, leaving other items alone. */
          addCounts = (counts: Map<number, number>) =>
            set((state) => ({
              counts: {
                ...state.counts,
                ...collect(counts)
                  .map(([id, count]) => [id, (state.counts[id] ?? 0) + count] as const)
                  .toObject(),
              },
            }));
          /** Removes every item. */
          clear = () => set({ counts: {} });
        })(),
    ),
    {
      name: "inventory",
      storage: idbStorage,
      partialize: ({ counts }) => ({ counts }),
      onRehydrateStorage: () => () => useInventory.setState({ loaded: true }),
    },
  ),
);
