import { create } from "zustand";
import { combine, persist } from "zustand/middleware";
import { idbStorage } from "./idb-storage";
import type { AddedCape } from "./plan";

/** The player's settings, for every page, kept in IndexedDB between visits. */
export const useSettings = create(
  persist(
    // `loaded` once what was saved is in (or failed to load), as in calculator.ts.
    combine(
      {
        fromInventory: false,
        ironman: false,
        noWaste: false,
        addedAlterations: true,
        addedCape: "worn" as AddedCape,
        /** Which accordions are open, by title, once opened or closed. */
        open: {} as Record<string, boolean>,
        loaded: false,
      },
      (set) =>
        new (class {
          /** The items in the inventory taken off the inputs. */
          setFromInventory = (fromInventory: boolean) => set({ fromInventory });
          setIronman = (ironman: boolean) => set({ ironman });
          /** The rituals Ironman mode adds (to make the necroplasm for inks) rounded up to their golden ratio. */
          setNoWaste = (noWaste: boolean) => set({ noWaste });
          /** The ritual's alteration glyphs on the rituals Ironman mode adds too, as many as fit. */
          setAddedAlterations = (addedAlterations: boolean) => set({ addedAlterations });
          /** The cape glyph on the rituals Ironman mode adds. */
          setAddedCape = (addedCape: AddedCape) => set({ addedCape });
          setOpen = (title: string, open: boolean) => set((state) => ({ open: { ...state.open, [title]: open } }));
        })(),
    ),
    {
      name: "settings",
      storage: idbStorage,
      partialize: ({ fromInventory, ironman, noWaste, addedAlterations, addedCape, open }) => ({
        fromInventory,
        ironman,
        noWaste,
        addedAlterations,
        addedCape,
        open,
      }),
      onRehydrateStorage: () => () => useSettings.setState({ loaded: true }),
    },
  ),
);
