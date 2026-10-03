"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter } from "@/lib/components/dialog";
import { Button } from "@/lib/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { useInventory } from "@/lib/inventory";

/** A small red button with a gold bin ("Clear inventory", in its tooltip) that removes every item, once confirmed. */
export function ClearInventory() {
  const [open, setOpen] = useState(false);
  const owned = useInventory((state) => Object.values(state.counts).filter((count) => count > 0).length);
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="danger"
              size="icon-sm"
              className="shrink-0"
              aria-label="Clear inventory"
              disabled={owned === 0}
              onClick={() => setOpen(true)}
            >
              <span className="icon-bin" aria-hidden />
            </Button>
          }
        />
        <TooltipContent>Clear inventory</TooltipContent>
      </Tooltip>
      <Dialog open={open} title="Clear inventory" onClose={() => setOpen(false)}>
        <DialogContent>
          <p className="body-sm">
            Removes all {owned.toLocaleString("en")} {owned === 1 ? "item" : "items"}. Prices are kept.
          </p>
        </DialogContent>
        <DialogFooter className="justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              useInventory.getState().clear();
              setOpen(false);
            }}
          >
            Clear
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
