import { create } from "zustand";
import { combine, persist } from "zustand/middleware";
import items from "@/data/items.json";
import { idbStorage } from "./idb-storage";
import { mergePrices, type Price } from "./merge-prices";

export type { Price };

/** The real-time Grand Exchange prices the RuneScape Wiki hosts (prices.runescape.wiki/rs). */
const LATEST = "https://prices.runescape.wiki/api/v2/rs/latest";

/**
 * Prices to start with, for items the Grand Exchange has none for: their shop prices. Basic ghostly ink and weak
 * necroplasm, 3 gp each. Until changed, then the user's.
 */
const DEFAULTS: Record<number, Price> = {
  55594: { value: 3, locked: false },
  55598: { value: 3, locked: false },
};

/** How long synced prices are kept before syncing again. */
const STALE = 60 * 60 * 1000;

/** The least time a sync shows as fetching, in milliseconds. */
const SHOWN = 600;

/** What an instant buy last paid for each item, from the Grand Exchange: all of them, or just `id`. */
async function latest(id?: number): Promise<Record<string, { high?: number }>> {
  const res = await fetch(id === undefined ? LATEST : `${LATEST}?id=${id}`);
  if (!res.ok) throw new Error(`Prices: ${res.status}`);
  return (await res.json()).data;
}

/** An item's live price, or null if the Grand Exchange has none. */
export async function livePrice(id: number): Promise<number | null> {
  return (await latest(id))[id]?.high ?? null;
}

/**
 * Item prices, shared by everything that shows or uses one, and kept in IndexedDB between visits.
 * The actions are arrow-function fields, not methods: combine merges them in with Object.assign, which
 * copies an object's own fields but not its class's methods.
 */
export const usePrices = create(
  persist(
    // `loaded` once what was saved is in (or failed to load), as in calculator.ts.
    combine(
      { prices: DEFAULTS, loaded: false, syncedAt: null as null | number, syncing: false },
      (set, get) =>
        new (class {
          /** New values from the Grand Exchange, leaving locked prices alone. */
          setItemPrices = (values: Map<number, number>) =>
            set(({ prices }) => ({ prices: mergePrices(prices, values), syncedAt: Date.now() }));

          /** The user's own price for an item, or a live one (unlocked, so syncs keep it current). */
          setPrice = (id: number, price: Price) => set(({ prices }) => ({ prices: { ...prices, [id]: price } }));

          /**
           * Fetches the tradeable items' prices, unless they were synced within the hour (or `force`). The
           * API gives one item or all of them per request, so it's all of them, once, kept to ours. The
           * price is `high`: what an instant buy last paid, as the calculator prices what you'd buy.
           */
          sync = async (force = false) => {
            const { syncedAt } = get();
            if (!force && syncedAt && Date.now() - syncedAt < STALE) return;
            set({ syncing: true });
            try {
              // Fetched in a blink, which would barely turn the refresh icon; it's kept going a moment so it's seen.
              const [data] = await Promise.all([latest(), new Promise((resolve) => setTimeout(resolve, SHOWN))]);
              const values = new Map<number, number>();
              for (const [id, { tradeable }] of Object.entries(items)) {
                const high = data[id]?.high;
                if (tradeable && high) values.set(Number(id), high);
              }
              this.setItemPrices(values);
            } finally {
              set({ syncing: false });
            }
          };
        })(),
    ),
    {
      name: "prices",
      // Only the data's saved, not the actions.
      storage: idbStorage,
      partialize: ({ prices, syncedAt }) => ({ prices, syncedAt }),
      onRehydrateStorage: () => () => usePrices.setState({ loaded: true }),
      // The defaults for what was saved before there were any, or since; what was saved wins.
      merge: (saved, current) => {
        const { prices = {}, ...rest } = (saved ?? {}) as Partial<typeof current>;
        return { ...current, ...rest, prices: { ...DEFAULTS, ...prices } };
      },
    },
  ),
);
