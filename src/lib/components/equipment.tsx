import Image from "next/image";
import { ItemTooltip } from "./item-tooltip";
import { Slot } from "./slot";

export type EquipmentSlot =
  "head" | "pocket" | "back" | "neck" | "ammo" | "mainHand" | "torso" | "offHand" | "legs" | "hands" | "feet" | "ring";

/**
 * An item as in src/data/items.json: `examine`, armour or weapon `stats`, and `effects` (lines such as a
 * ritual bonus) show in its tooltip.
 */
export type EquippedItem = {
  name: string;
  image: string;
  examine?: string;
  stats?: Record<string, string | number>;
  effects?: string[];
};

/** The stats a tooltip shows, in this order, by their names in the item data. Missing ones are left out. */
const STAT_LABELS: [key: string, label: string, unit?: string][] = [
  ["tier", "Tier"],
  ["class", "Class"],
  ["damage", "Damage"],
  ["accuracy", "Accuracy"],
  ["style", "Style"],
  ["speed", "Speed"],
  ["range", "Range"],
  ["armour", "Armour"],
  ["lifePoints", "Life points"],
  ["strength", "Strength"],
  ["ranged", "Ranged"],
  ["magic", "Magic"],
  ["necromancy", "Necromancy"],
  ["prayer", "Prayer"],
  ["pvmReduction", "PvM damage reduction", "%"],
  ["pvpReduction", "PvP damage reduction", "%"],
];

const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** An item's stats for its tooltip: labelled, numbers grouped ("1,415.5"), words capitalised. */
function statsOf(stats: Record<string, string | number> = {}) {
  return STAT_LABELS.filter(([key]) => stats[key] !== undefined).map(([key, label, unit = ""]) => {
    const value = stats[key];
    return { label, value: typeof value === "number" ? value.toLocaleString("en") + unit : capitalised(value) };
  });
}

// Positions on a grid of half-slot columns, matching the in-game Worn Equipment layout.
const slots: { id: EquipmentSlot; label: string; icon: string; column: number; row: number }[] = [
  { id: "head", label: "Head", icon: "head", column: 4, row: 1 },
  { id: "pocket", label: "Pocket", icon: "pocket", column: 6, row: 1 },
  { id: "back", label: "Back", icon: "back", column: 2, row: 2 },
  { id: "neck", label: "Neck", icon: "neck", column: 4, row: 2 },
  { id: "ammo", label: "Ammo", icon: "ammo", column: 6, row: 2 },
  { id: "mainHand", label: "Main hand", icon: "main-hand", column: 1, row: 3 },
  { id: "torso", label: "Torso", icon: "torso", column: 4, row: 3 },
  { id: "offHand", label: "Off-hand", icon: "off-hand", column: 7, row: 3 },
  { id: "legs", label: "Legs", icon: "legs", column: 4, row: 4 },
  { id: "hands", label: "Hands", icon: "hands", column: 1, row: 5 },
  { id: "feet", label: "Feet", icon: "feet", column: 4, row: 5 },
  { id: "ring", label: "Ring", icon: "ring", column: 7, row: 5 },
];

// Slots joined by a rail. The first slot is above or left of the second.
const rails: [EquipmentSlot, EquipmentSlot][] = [
  ["head", "neck"],
  ["neck", "torso"],
  ["torso", "legs"],
  ["legs", "feet"],
  ["back", "neck"],
  ["neck", "ammo"],
  ["mainHand", "torso"],
  ["torso", "offHand"],
  ["mainHand", "hands"],
  ["offHand", "ring"],
];
const slotById = Object.fromEntries(slots.map((slot) => [slot.id, slot]));

/** Slots' names, as the game gives them. */
export const SLOT_LABELS = Object.fromEntries(slots.map(({ id, label }) => [id, label])) as Record<
  EquipmentSlot,
  string
>;

/**
 * Worn Equipment, as the game lays it out: `items` in their slots, a faint silhouette in each empty one. Slots
 * in `choosable` are buttons, calling `onChoose` with the slot, e.g. to pick what goes there.
 */
export function Equipment({
  items = {},
  choosable = [],
  onChoose,
}: {
  items?: Partial<Record<EquipmentSlot, EquippedItem>>;
  choosable?: EquipmentSlot[];
  onChoose?: (slot: EquipmentSlot) => void;
}) {
  return (
    <div className="equipment" role="group" aria-label="Equipment">
      {rails.map(([from, to]) => {
        const a = slotById[from];
        const b = slotById[to];
        return (
          <div
            key={`${from}-${to}`}
            aria-hidden
            className={a.row === b.row ? "equipment-rail-h" : "equipment-rail-v"}
            style={{ gridColumn: `${a.column} / ${b.column + 2}`, gridRow: `${a.row} / ${b.row + 1}` }}
          />
        );
      })}
      {slots.map(({ id, label, icon, column, row }) => {
        const item = items[id];
        // A button where it can be chosen: the item's tooltip trigger, or around the silhouette.
        const choose = onChoose && choosable.includes(id) ? () => onChoose(id) : undefined;
        return (
          <Slot key={id} style={{ gridColumn: `${column} / span 2`, gridRow: row }}>
            {item ? (
              <ItemTooltip
                name={item.name}
                type={typeof item.stats?.type === "string" ? item.stats.type : undefined}
                image={item.image}
                stats={statsOf(item.stats)}
                effects={item.effects}
                flavour={item.examine}
              >
                <ItemTooltip.Trigger
                  {...(choose && {
                    role: "button",
                    "aria-haspopup": "dialog",
                    // The whole slot, not just the icon (centred in it by its margins: images are blocks).
                    className: "size-full cursor-pointer content-center",
                    onClick: choose,
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      choose();
                    },
                  })}
                >
                  <Image src={item.image} alt={`${label}: ${item.name}`} width={32} height={32} className="mx-auto" />
                </ItemTooltip.Trigger>
              </ItemTooltip>
            ) : choose ? (
              <button
                type="button"
                className="grid size-full cursor-pointer place-items-center"
                aria-haspopup="dialog"
                onClick={choose}
              >
                <Silhouette label={label} icon={icon} />
              </button>
            ) : (
              <Silhouette label={label} icon={icon} />
            )}
          </Slot>
        );
      })}
    </div>
  );
}

/** A faint silhouette of what goes in a slot, for an empty one. */
function Silhouette({ label, icon }: { label: string; icon: string }) {
  return <Image className="opacity-25" src={`/equipment/${icon}.png`} alt={`${label}: empty`} width={32} height={32} />;
}
