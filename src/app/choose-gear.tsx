"use client";

import { useState } from "react";
import equipment from "@/data/equipment.json";
import { Dialog, DialogContent, DialogFooter } from "@/lib/components/dialog";
import { SLOT_LABELS, type EquipmentSlot } from "@/lib/components/equipment";
import { Field } from "@/lib/components/field";
import { Select } from "@/lib/components/select";
import type { GlyphName } from "@/lib/components/ritual-site";
import { Button } from "@/lib/components/ui/button";
import { OUTFIT, wearOutfit } from "@/lib/ritual";
import { AlterationOptions } from "./alterations";

export type Gear = (typeof equipment)[keyof typeof equipment];

/** What's worn, by slot: the gear's id, and the alteration glyph chosen for it, for gear that takes one. */
export type Worn = Partial<Record<EquipmentSlot, { id: number; glyph?: GlyphName }>>;

/** All the gear that changes rituals. */
export const GEAR = Object.values(equipment) as Gear[];

/** The slots there's gear for. */
export const GEAR_SLOTS = [...new Set(GEAR.map(({ slot }) => slot))] as EquipmentSlot[];

/** What a piece of gear does for rituals, with the alteration `glyph` chosen for it, a line each, for its tooltip. */
export function gearEffects({ effects }: Gear, glyph?: GlyphName) {
  const all: Record<string, number | string | undefined> = effects;
  return [
    all.xp && `+${all.xp}% Necromancy XP`,
    all.focusSave && `${all.focusSave}% chance to keep the focus`,
    all.lights && `${all.lights === "all" ? "Light sources" : "Tier 1 and 2 light sources"} don't wear out`,
    all.alterationBoost && `Alteration glyphs ${all.alterationBoost}% stronger`,
    all.necroplasm && `+${all.necroplasm}% necroplasm`,
    all.disturbanceXp && `+${all.disturbanceXp}% XP from disturbances`,
    all.soulAttraction && `+${all.soulAttraction}% soul attraction`,
    all.doubleRewards && `${all.doubleRewards}% chance to double disturbance rewards`,
    all.glyph && `Free alteration glyph: ${glyph ?? "none"}`,
  ].filter(Boolean) as string[];
}

/** In a slot's gear, for all of the ritualist's outfit at once, with the plain mask or the modified one. */
const [ENTIRE_OUTFIT, ENTIRE_MODIFIED_OUTFIT] = [-1, -2];

/** The dialog for choosing what's worn in `slot`, or nothing, open while there's a slot. */
export function ChooseGear({
  slot,
  worn,
  onChoose,
  onClose,
}: {
  slot: EquipmentSlot | null;
  worn: Worn;
  onChoose: (worn: Worn) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={slot !== null} title={slot ? `Choose ${SLOT_LABELS[slot].toLowerCase()}` : ""} onClose={onClose}>
      {slot && <ChooseGearForm key={slot} slot={slot} worn={worn} onChoose={onChoose} onClose={onClose} />}
    </Dialog>
  );
}

/**
 * The slot's gear, by icon, and nothing. Nothing changes until it's chosen, or what's worn is unequipped
 * straight away.
 */
function ChooseGearForm({
  slot,
  worn,
  onChoose,
  onClose,
}: {
  slot: EquipmentSlot;
  worn: Worn;
  onChoose: (worn: Worn) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState(worn[slot]?.id ?? 0);
  const [glyph, setGlyph] = useState(worn[slot]?.glyph);
  const takesGlyph = "glyph" in (GEAR.find((gear) => gear.id === id)?.effects ?? {});
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        onChoose(
          id === ENTIRE_OUTFIT || id === ENTIRE_MODIFIED_OUTFIT
            ? wearOutfit(worn, id === ENTIRE_MODIFIED_OUTFIT)
            : { ...worn, [slot]: id ? { id, ...(takesGlyph && glyph && { glyph }) } : undefined },
        );
        onClose();
      }}
    >
      <DialogContent className="flex flex-col gap-4">
        <Field label={SLOT_LABELS[slot]}>
          <Select value={id} onChange={(event) => setId(Number(event.target.value))}>
            <option value={0}>Nothing</option>
            {GEAR.filter((gear) => gear.slot === slot).map(({ id, name, image }) => (
              <option key={id} value={id} style={{ "--option-icon": `url("${image}")` } as React.CSSProperties}>
                {name}
              </option>
            ))}
            {slot in OUTFIT && (
              <>
                <option value={ENTIRE_OUTFIT}>Entire Ritualist&apos;s Outfit</option>
                <option value={ENTIRE_MODIFIED_OUTFIT}>Entire Ritualist&apos;s Outfit (modified)</option>
              </>
            )}
          </Select>
        </Field>
        {takesGlyph && (
          <Field label="Alteration glyph">
            <Select value={glyph ?? ""} onChange={(event) => setGlyph((event.target.value as GlyphName) || undefined)}>
              <option value="">None</option>
              <AlterationOptions />
            </Select>
          </Field>
        )}
      </DialogContent>
      <DialogFooter>
        {/* Only with something to take off. */}
        {worn[slot] && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => {
              onChoose({ ...worn, [slot]: undefined });
              onClose();
            }}
          >
            Unequip
          </Button>
        )}
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Choose
        </Button>
      </DialogFooter>
    </form>
  );
}
