import Image from "next/image";
import { usePrices } from "@/lib/prices";

/**
 * An item's prices as tooltip stats, with their icons: its GE price, where it's known, and its high alch,
 * where it can be alched.
 */
export function usePriceStats(id: number, highAlch?: number) {
  const price = usePrices((state) => state.prices[id]?.value ?? null);
  return [
    ...(price === null ? [] : [{ label: "GE price", value: <Coins icon="/icons/ge-price.png" value={price} /> }]),
    ...(highAlch === undefined
      ? []
      : [{ label: "High alch", value: <Coins icon="/icons/high-alchemy.png" value={highAlch} /> }]),
  ];
}

/** A value in coins after its icon, which the stat's label names. */
export function Coins({ icon, value }: { icon: string; value: number }) {
  return (
    <>
      <Image src={icon} alt="" aria-hidden width={16} height={16} />
      {value.toLocaleString("en")}
    </>
  );
}
