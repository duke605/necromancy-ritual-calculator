"use client";

import Image from "next/image";
import items from "@/data/items.json";
import RITUALS from "@/data/rituals.json";
import { useField } from "@/lib/components/field";
import { Button } from "@/lib/components/ui/button";
import type { RitualChoice } from "./choose-ritual";

/**
 * The focus item, with how many when it's more than one, on a button; clicking it calls `onClick`, which chooses
 * the ritual and its focus item, as clicking the plinth does.
 */
export function FocusSelect({ choice, onClick }: { choice: RitualChoice; onClick: () => void }) {
  const { id, amount } = RITUALS[choice.ritual].focuses[choice.focus].input;
  const { name, image } = items[`${id}` as keyof typeof items];
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      aria-haspopup="dialog"
      {...useField()}
      onClick={onClick}
    >
      <Image src={image} alt="" aria-hidden width={24} height={24} className="size-6 shrink-0 object-contain" />
      <span className="truncate">{amount > 1 ? `${amount.toLocaleString("en")} × ${name}` : name}</span>
    </Button>
  );
}
