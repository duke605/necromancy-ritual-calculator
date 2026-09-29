"use client";

import { useState } from "react";
import { DialogContent, DialogFooter } from "@/lib/components/dialog";
import { Field } from "@/lib/components/field";
import { ItemSearch } from "@/lib/components/item-search";
import { NumberInput } from "@/lib/components/number-input";
import { Button } from "@/lib/components/ui/button";

/**
 * A dialog's form for an item and its amount: the item searched for (from `defaultQuery`, with `first`
 * listed ahead), the amount, and Cancel and save buttons. Nothing changes until it's saved; with no item
 * picked yet, it can't be.
 */
export function ItemAmountForm({
  defaultQuery = "",
  first,
  initialId = null,
  initialCount = 1,
  saveLabel = "Save",
  onSave,
  onCancel,
}: {
  defaultQuery?: string;
  first?: number[];
  initialId?: number | null;
  initialCount?: number;
  saveLabel?: string;
  onSave: (item: { id: number; count: number }) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState(initialId);
  const [count, setCount] = useState(initialCount);
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        if (id !== null) onSave({ id, count });
      }}
    >
      <DialogContent>
        <Field label="Item">
          <ItemSearch defaultQuery={defaultQuery} first={first} picked={id ?? -1} onPick={setId} />
        </Field>
      </DialogContent>
      <DialogFooter className="justify-between">
        <Field label="Amount">
          <NumberInput min={0} value={count} onChange={(event) => setCount(event.target.valueAsNumber || 0)} />
        </Field>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={id === null}>
            {saveLabel}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
