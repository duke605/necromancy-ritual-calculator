import Image from "next/image";

/**
 * How the game shortens a stack count, past each threshold: by the divisor, with a suffix (and colour,
 * see .item-image-count). Each switch comes at the latest point it can, so it never needs more than
 * five characters: "99999", then "100K" to "9999K", then "10M", and so on.
 */
const TIERS = [
  { from: 1e16, divisor: 1e15, suffix: "Q" },
  { from: 1e13, divisor: 1e12, suffix: "T" },
  { from: 1e10, divisor: 1e9, suffix: "B" },
  { from: 1e7, divisor: 1e6, suffix: "M" },
  { from: 1e5, divisor: 1e3, suffix: "K" },
];

/** A stack count as the game shows it, rounded down, e.g. 109,420 as "109K". */
function shortCount(count: number) {
  const tier = TIERS.find(({ from }) => count >= from);
  return tier ? { text: `${Math.floor(count / tier.divisor)}${tier.suffix}`, suffix: tier.suffix } : { text: String(count) };
}

/**
 * An item's icon, with its stack `count` in the corner as the game draws it (left off for 1). The count
 * is the stack's, not a slot's: it goes wherever the item does.
 */
export function ItemImage({
  src,
  alt,
  count = 1,
  className,
}: {
  src: string;
  alt: string;
  count?: number;
  className?: string;
}) {
  const shown = shortCount(count);
  return (
    <span className="item-image">
      <Image src={src} alt={alt} width={32} height={32} className={className} />
      {count !== 1 && (
        // The exact count on hover, as the shortened one loses digits.
        <span className="item-image-count" data-suffix={shown.suffix} title={count.toLocaleString("en")}>
          {shown.text}
        </span>
      )}
    </span>
  );
}
