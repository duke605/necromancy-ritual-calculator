/**
 * An item's price in coins: null until known (untradeable items aren't on the Grand Exchange, so the
 * user enters theirs). A locked price is the user's: syncing leaves it alone.
 */
export type Price = { value: number | null; locked: boolean };

/** Prices with new values from a sync, except locked ones, which are the user's. */
export function mergePrices(prices: Record<number, Price>, values: Map<number, number>): Record<number, Price> {
  const merged = { ...prices };
  for (const [id, value] of values) if (!prices[id]?.locked) merged[id] = { value, locked: false };
  return merged;
}
