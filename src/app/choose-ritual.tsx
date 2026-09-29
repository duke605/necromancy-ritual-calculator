"use client";

import { useState } from "react";
import items from "@/data/items.json";
import rituals from "@/data/rituals.json";
import { Dialog, DialogContent, DialogFooter } from "@/lib/components/dialog";
import { Field } from "@/lib/components/field";
import { Select } from "@/lib/components/select";
import { Button } from "@/lib/components/ui/button";

export type RitualName = keyof typeof rituals;

/** A ritual, and which of its focus items it's done with (an index into its `focuses`). */
export type RitualChoice = { ritual: RitualName; focus: number };

/** The dialog for choosing the ritual and its focus item, open while `open`. */
export function ChooseRitual({
  open,
  choice,
  onChoose,
  onClose,
}: {
  open: boolean;
  choice: RitualChoice;
  onChoose: (choice: RitualChoice) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} title="Choose ritual" onClose={onClose}>
      {open && <ChooseRitualForm choice={choice} onChoose={onChoose} onClose={onClose} />}
    </Dialog>
  );
}

/**
 * The ritual, by level, and its focus items, by icon. A new ritual starts at its first. Nothing changes until
 * it's chosen.
 */
function ChooseRitualForm({
  choice,
  onChoose,
  onClose,
}: {
  choice: RitualChoice;
  onChoose: (choice: RitualChoice) => void;
  onClose: () => void;
}) {
  const [ritual, setRitual] = useState(choice.ritual);
  const [focus, setFocus] = useState(choice.focus);
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        onChoose({ ritual, focus });
        onClose();
      }}
    >
      <DialogContent className="flex flex-col gap-4">
        <Field label="Ritual">
          <Select
            value={ritual}
            onChange={(event) => {
              setRitual(event.target.value as RitualName);
              setFocus(0);
            }}
          >
            {Object.entries(rituals).map(([name, { level }]) => (
              // The level shows after the name with the Necromancy icon, where the browser can style options.
              <option key={name} value={name} data-level={level}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Focus item">
          <Select value={focus} onChange={(event) => setFocus(Number(event.target.value))}>
            {rituals[ritual].focuses.map(({ input: { id, amount } }, index) => {
              const { name, image } = items[`${id}` as keyof typeof items];
              return (
                <option key={id} value={index} style={{ "--option-icon": `url("${image}")` } as React.CSSProperties}>
                  {amount > 1 ? `${amount.toLocaleString("en")} × ${name}` : name}
                </option>
              );
            })}
          </Select>
        </Field>
      </DialogContent>
      <DialogFooter>
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
