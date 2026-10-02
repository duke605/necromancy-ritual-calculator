import { create } from "zustand";
import { combine, persist } from "zustand/middleware";
import { idbStorage } from "./idb-storage";
import type { RitualName } from "@/app/choose-ritual";
import type { AddedSetup, AddedSetups } from "./plan";

/** The player's settings, for every page, kept in IndexedDB between visits. */
export const useSettings = create(
  persist(
    // `loaded` once what was saved is in (or failed to load), as in calculator.ts.
    combine(
      {
        fromInventory: false,
        ironman: false,
        noWaste: false,
        /** How each ritual Ironman mode adds is set up, by name; one that isn't, as the ritual. */
        added: {} as AddedSetups,
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
          setAdded = (ritual: RitualName, setup: AddedSetup) =>
            set((state) => ({ added: { ...state.added, [ritual]: setup } }));
          setOpen = (title: string, open: boolean) => set((state) => ({ open: { ...state.open, [title]: open } }));
        })(),
    ),
    {
      name: "settings",
      storage: idbStorage,
      partialize: ({ fromInventory, ironman, noWaste, added, open }) => ({
        fromInventory,
        ironman,
        noWaste,
        added,
        open,
      }),
      onRehydrateStorage: () => () => useSettings.setState({ loaded: true }),
    },
  ),
);
