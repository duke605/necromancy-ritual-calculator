"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/lib/components/dialog";
import { Field } from "@/lib/components/field";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import items from "@/data/items.json";

/** Every item: enough rows to scroll, so the content scrolls between the header and footer. */
const all = Object.values(items);

/** A dialog with all three rows, opened by a button. */
export function DialogExamples() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open a dialog
      </Button>
      <Dialog open={open} title="Choose an item" onClose={close}>
        <DialogHeader>
          <Field label="Search">
            <Input type="search" placeholder="Items" />
          </Field>
        </DialogHeader>
        <DialogContent>
          <ul className="body-sm flex flex-col gap-2">
            {all.map(({ id, name, image }) => (
              <li key={id} className="flex items-center gap-2">
                <Image src={image} alt="" aria-hidden width={24} height={24} className="size-6 object-contain" />
                {name}
              </li>
            ))}
          </ul>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>Save</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
