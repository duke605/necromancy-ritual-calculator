"use client";

import Image from "next/image";
import { useState } from "react";
import items from "@/data/items.json";
import { Accordion } from "@/lib/components/accordion";
import { ItemTooltip } from "@/lib/components/item-tooltip";
import { Coins, usePriceStats } from "@/lib/hooks/use-price-stats";
import { useInventory } from "@/lib/inventory";
import { usePrices } from "@/lib/prices";
import type { Ritual } from "@/lib/ritual";
import { formatDuration } from "@/lib/ritual-duration";
import { EditItem } from "./inventory/edit-item";

type Item = { id: number; amount: number };

/** A list of lines (`children`, each an <li>) under a `title`, which folds it away. */
export function Lines({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Accordion title={title} headingLevel={3} variant="naked" open>
      <ul className="flex flex-col gap-1">{children}</ul>
    </Accordion>
  );
}

/** A line: an icon (if there is one), a name and, muted, an amount. */
function Line({ image, name, amount }: { image?: string; name: string; amount: number }) {
  return (
    <span className="flex items-center gap-2">
      {image ? (
        <Image src={image} alt="" aria-hidden width={20} height={20} className="size-5 object-contain" />
      ) : (
        <span className="size-5" aria-hidden />
      )}
      <span className="flex-1">{name}</span>
      <span className="text-muted-foreground">{amount.toLocaleString("en")}</span>
    </span>
  );
}

/** A line with no more to it, e.g. souls. */
export function PlainLine(props: { image?: string; name: string; amount: number }) {
  return (
    <li>
      <Line {...props} />
    </li>
  );
}

/** A line with `details` on hover (or tap), and a button for `onOpen`, a dialog, if it has one. */
function DetailedLine({
  image,
  name,
  amount,
  details,
  onOpen,
}: {
  image?: string;
  name: string;
  amount: number;
  details: Omit<React.ComponentProps<typeof ItemTooltip>, "name" | "image" | "children">;
  onOpen?: () => void;
}) {
  const button = onOpen && {
    role: "button",
    "aria-haspopup": "dialog" as const,
    onClick: onOpen,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onOpen();
    },
  };
  return (
    <li>
      <ItemTooltip name={name} image={image} {...details}>
        <ItemTooltip.Trigger className={onOpen ? "w-full cursor-pointer" : "w-full"} {...button}>
          <Line image={image} name={name} amount={amount} />
        </ItemTooltip.Trigger>
      </ItemTooltip>
    </li>
  );
}

/** A ritual, how many times, and on hover how long each and all of them take. */
export function RitualLine({ ritual, count }: { ritual: Ritual; count: number }) {
  return (
    <DetailedLine
      image="/icons/necromancy.png"
      name={ritual.config.choice.ritual}
      amount={count}
      details={{
        type: "Ritual",
        stats: [
          { label: "Time each", value: formatDuration(ritual.seconds) },
          { label: "Total time", value: formatDuration(ritual.seconds * count) },
        ],
      }}
    />
  );
}

/**
 * An item, how many, and on hover its prices, each and in all. Clicked, the inventory's edit dialog, to set its
 * price (owned or not) and how many are owned.
 */
export function ItemLine({ id, amount }: { id: number; amount: number }) {
  const item = items[`${id}` as keyof typeof items];
  const owned = useInventory((state) => state.counts[id] ?? 0);
  const [editing, setEditing] = useState(false);
  // Not every item can be alched or traded.
  const prices = usePriceStats(id, "highAlch" in item ? item.highAlch : undefined);
  const price = usePrices((state) => state.prices[id]?.value ?? null);
  return (
    <>
      <DetailedLine
        image={item.image}
        name={item.name}
        amount={amount}
        details={{
          stats: [
            ...prices,
            ...(price === null
              ? []
              : [{ label: "GE total", value: <Coins icon="/icons/ge-price.png" value={price * amount} /> }]),
          ],
          flavour: item.examine,
        }}
        onOpen={() => setEditing(true)}
      />
      <EditItem item={editing ? { ...item, count: owned } : null} onClose={() => setEditing(false)} />
    </>
  );
}

/**
 * What the `inputs` cost and the `outputs` are worth, at GE prices (none, for items without one), and the profit
 * or loss, then more totals (`children`, <TotalRow>s), under a title that folds them away.
 */
export function Totals({ inputs, outputs, children }: { inputs: Item[]; outputs: Item[]; children?: React.ReactNode }) {
  const prices = usePrices((state) => state.prices);
  const worth = (list: Item[]) => list.reduce((sum, { id, amount }) => sum + (prices[id]?.value ?? 0) * amount, 0);
  const [cost, value] = [worth(inputs), worth(outputs)];
  const profit = value - cost;
  const coins = (value: number, signed = false) =>
    value.toLocaleString("en", { signDisplay: signed ? "exceptZero" : "auto" });
  return (
    <Accordion title="Totals" headingLevel={3} variant="naked" open>
      <dl className="flex flex-col gap-1">
        <TotalRow icon="/icons/ge-price.png" label="Input">
          {coins(cost)}
        </TotalRow>
        <TotalRow icon="/icons/ge-price.png" label="Output">
          {coins(value)}
        </TotalRow>
        <TotalRow
          icon="/icons/ge-price.png"
          label="P&L"
          className={profit > 0 ? "text-green-500" : profit < 0 ? "text-blood-300" : undefined}
        >
          {coins(profit, true)}
        </TotalRow>
        {children}
      </dl>
    </Accordion>
  );
}

/** A total: its `icon` (if it has one), its `label`, then its value (`children`), muted unless given a colour. */
export function TotalRow({
  icon,
  label,
  className = "text-muted-foreground",
  children,
}: {
  icon?: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon ? (
        <Image src={icon} alt="" aria-hidden width={20} height={20} className="size-5 object-contain" />
      ) : (
        <span className="size-5" aria-hidden />
      )}
      <dt className="flex-1">{label}</dt>
      <dd className={className}>{children}</dd>
    </div>
  );
}
