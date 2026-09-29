"use client";

import { useEffect } from "react";
import { usePrices } from "@/lib/prices";

/**
 * Brings the Grand Exchange prices up to date once the page loads, after the saved ones are read back
 * from IndexedDB (syncing first, the saved ones would land on top of the new ones). Renders nothing.
 */
export function PriceSync() {
  const loaded = usePrices((state) => state.loaded);
  useEffect(() => {
    if (loaded) usePrices.getState().sync().catch(console.error);
  }, [loaded]);
  return null;
}
