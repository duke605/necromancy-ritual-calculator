"use client";

import { XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./ui/button";

/**
 * A modal game window (.dialog in globals.css): a title bar with a close button over its rows. The
 * native <dialog>, so focus stays inside it, Escape closes it, and the page behind can't be used; a click on
 * the dimmed page around it closes it too. It fades and grows in, and back out. `onClose` hears every way it
 * closes; the parent then sets `open` false.
 *
 * Its body takes rows, each optional, in order:
 *   <Dialog open={open} title="Change item" onClose={() => setOpen(false)}>
 *     <DialogHeader>…</DialogHeader>
 *     <DialogContent>…</DialogContent>
 *     <DialogFooter>…</DialogFooter>
 *   </Dialog>
 * Only the content scrolls, when there's too much; the header and footer stay put. A form can wrap the
 * rows: give it `className="contents"`.
 */
export function Dialog({
  open,
  title,
  onClose,
  className,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  // While it fades out the children it had stay, rather than vanishing first. Each opening starts afresh
  // (`opening` keys the body), so nothing's left over from the last time.
  const [shown, setShown] = useState({ open, children, opening: 0 });
  if (open && (!shown.open || shown.children !== children)) {
    setShown({ open, children, opening: shown.open ? shown.opening : shown.opening + 1 });
  } else if (!open && shown.open) {
    setShown({ ...shown, open: false });
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // The browser focuses the first thing it can, the close button; the content's first control is
      // likelier what's wanted (a search, say), so it goes there when there is one.
      dialog.querySelector<HTMLElement>(".dialog-body :is(input, select, textarea, button, a[href])")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`panel frame dialog ${className ?? ""}`}
      aria-labelledby={id}
      onClose={onClose}
      // A click on the backdrop lands on the dialog itself, outside its box.
      onClick={(event) => {
        const { left, top, right, bottom } = event.currentTarget.getBoundingClientRect();
        const { clientX: x, clientY: y } = event;
        if (event.target === event.currentTarget && (x < left || x > right || y < top || y > bottom)) onClose();
      }}
    >
      <div className="panel-title dialog-title">
        <h2 id={id}>{title}</h2>
        <Button variant="danger" size="icon-sm" className="dialog-close" aria-label="Close" onClick={onClose}>
          {/* As thick as the drop zone's remove button's X. */}
          <XIcon strokeWidth={3.4} />
        </Button>
      </div>
      <div key={shown.opening} className="panel-body dialog-body">
        {shown.children}
      </div>
    </dialog>
  );
}

type Row = { className?: string; children: React.ReactNode };

/** A row over the content, e.g. a search field. */
export function DialogHeader({ className, children }: Row) {
  return <div className={`dialog-header ${className ?? ""}`}>{children}</div>;
}

/** The dialog's main content: the only part that scrolls. */
export function DialogContent({ className, children }: Row) {
  return <div className={`dialog-content scrollbar ${className ?? ""}`}>{children}</div>;
}

/** A row under the content, e.g. its buttons (right-aligned). */
export function DialogFooter({ className, children }: Row) {
  return <div className={`dialog-footer ${className ?? ""}`}>{children}</div>;
}
