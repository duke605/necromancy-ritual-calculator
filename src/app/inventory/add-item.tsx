"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/lib/components/dialog";
import { Button } from "@/lib/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { useInventory } from "@/lib/inventory";
import { ItemAmountForm } from "./item-amount-form";

/**
 * A small + button ("Add item", in its tooltip), opening a dialog to pick an item and its amount, searched for from `query` (what's
 * in the inventory's search). Saving sets that item's count, as a bank screenshot's sync would.
 */
export function AddItem({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const setCounts = useInventory((state) => state.setCounts);
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button size="icon-sm" className="shrink-0" aria-label="Add item" onClick={() => setOpen(true)}>
              {/* As thick as the dialog close button's X. */}
              <PlusIcon strokeWidth={3.4} />
            </Button>
          }
        />
        <TooltipContent>Add item</TooltipContent>
      </Tooltip>
      <Dialog open={open} title="Add item" onClose={() => setOpen(false)}>
        <ItemAmountForm
          defaultQuery={query}
          saveLabel="Add"
          onSave={({ id, count }) => {
            setCounts(new Map([[id, count]]));
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
