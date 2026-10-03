"use client";

import Image from "next/image";
import { Accordion } from "@/lib/components/accordion";
import { NoWasteIcon } from "@/lib/components/icons";
import { Switch } from "@/lib/components/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { useSettings } from "@/lib/settings";
import { useShallow } from "zustand/react/shallow";

/**
 * The settings for the results, each named and briefly explained: taking from the inventory, Ironman mode, and
 * No waste. No waste is only for Ironman mode, but always there, so turning Ironman mode on and off doesn't move
 * what's under it. They fold away, as the results' lists do.
 */
export function ResultSettings() {
  const { fromInventory, ironman, noWaste } = useSettings(
    useShallow(({ fromInventory, ironman, noWaste }) => ({ fromInventory, ironman, noWaste })),
  );
  const { setFromInventory, setIronman, setNoWaste } = useSettings.getState();
  return (
    <Accordion title="Options" headingLevel={3} variant="naked" open>
      <div className="flex flex-col gap-3">
        <Setting
          title="Take from inventory"
          description="Takes the items in your inventory off the inputs."
          icon={
            <Image
              src="/icons/inventory.png"
              alt=""
              width={20}
              height={20}
              className="size-5 shrink-0 object-contain"
            />
          }
          on={fromInventory}
          onChange={setFromInventory}
        />
        <Setting
          title="Ironman Mode"
          description="Adds the rituals that make the necroplasm for your inks, and the ashes and vials of water they take."
          // The game's Ironman badge, a barbell: tiny, scaled up with its pixels kept crisp.
          icon={
            <Image
              src="/icons/ironman-badge.png"
              alt=""
              width={13}
              height={7}
              className="mt-1.5 h-2.5 w-auto shrink-0 [image-rendering:pixelated]"
            />
          }
          on={ironman}
          onChange={setIronman}
        />
        <Setting
          title="No waste"
          description="Rounds the rituals Ironman mode adds up to their golden ratios. Leaves some necroplasm over."
          icon={<NoWasteIcon className="size-5 shrink-0" />}
          on={noWaste}
          disabled={ironman ? undefined : "Needs Ironman mode"}
          onChange={setNoWaste}
        />
      </div>
    </Accordion>
  );
}

/**
 * A switch, with its `icon`, `title` and, muted under it, its `description`, all of which flip it. While
 * `disabled`, the reason it is, it's faded, and the reason shows on hover.
 */
export function Setting({
  title,
  description,
  icon,
  on,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  on: boolean;
  disabled?: string;
  onChange: (on: boolean) => void;
}) {
  const row = (
    <>
      <Switch checked={on} disabled={!!disabled} onChange={(event) => onChange(event.target.checked)} />
      {icon}
      <span className="flex flex-col">
        <span className="body-sm">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </>
  );
  const className = "flex cursor-pointer items-start gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-50";
  if (!disabled) return <label className={className}>{row}</label>;
  return (
    <Tooltip>
      <TooltipTrigger render={<label className={className} />}>{row}</TooltipTrigger>
      <TooltipContent>{disabled}</TooltipContent>
    </Tooltip>
  );
}
