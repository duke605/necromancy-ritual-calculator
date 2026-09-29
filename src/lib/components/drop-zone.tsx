"use client";

import { ClipboardPasteIcon, XIcon } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { Button } from "./ui/button";

/**
 * A box to give an image to: drop it on, paste it while hovering over (or focused on) the box, or click
 * to choose a file. The image then shows in the box, with a button to remove it, and another replaces it.
 * `onImage` gets the file, or null once it's removed. A button pastes from the clipboard too, for touch
 * screens, which can't paste over the box; with a mouse, a hint under it says how to.
 */
export function DropZone({ label, onImage }: { label: string; onImage?: (file: File | null) => void }) {
  const [url, setUrl] = useState<string>();
  // Hovered or focused: pastes come here. A paste goes to the page, not to what the pointer's over, so
  // the page listens only meanwhile.
  const [listening, setListening] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Why the clipboard couldn't be pasted from, under the buttons.
  const [problem, setProblem] = useState<string>();

  const take = (file?: File | null) => {
    if (!file?.type.startsWith("image/")) return;
    setProblem(undefined);
    setUrl(URL.createObjectURL(file));
    onImage?.(file);
  };
  // The previous image's memory is freed when it's replaced.
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const paste = useEffectEvent((event: ClipboardEvent) => {
    const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    take(file);
  });
  // The browser asks to allow it the first time (on iOS, a "Paste" bubble to tap).
  const pasteFromClipboard = async () => {
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) return take(new File([await item.getType(type)], "Pasted image", { type }));
      }
      setProblem("There's no image on your clipboard. Copy one, then try again.");
    } catch {
      setProblem("Couldn't read your clipboard. Allow it when asked, or choose the image instead.");
    }
  };

  useEffect(() => {
    if (!listening) return;
    addEventListener("paste", paste);
    return () => removeEventListener("paste", paste);
  }, [listening]);

  return (
    // The remove button goes under the box, not in it: a click in the label would open the file chooser.
    // Under it, on the dark page, the red stands out (on the brown box it blended in).
    <div className="flex flex-col items-end gap-2">
      <label
        className="drop-zone"
        data-dragging={dragging || undefined}
        data-filled={url ? true : undefined}
        onPointerEnter={() => setListening(true)}
        onPointerLeave={(event) => setListening(event.currentTarget.contains(document.activeElement))}
        onFocus={() => setListening(true)}
        onBlur={(event) => setListening(event.currentTarget.matches(":hover"))}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          take(event.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            take(event.target.files?.[0]);
            // Cleared, so choosing the same file again still counts as a change.
            event.target.value = "";
          }}
        />
        {/* A pasted or dropped file, not a page asset, so next/image has nothing to optimise. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt="The image given" />}
        <span>{url ? "Paste, drop or choose another to replace it" : label}</span>
      </label>
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        <p className="body-sm mr-auto hidden text-muted-foreground pointer-fine:block">
          Hover over the box and paste (<kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">V</kbd>, or{" "}
          <kbd className="kbd">⌘</kbd> <kbd className="kbd">V</kbd> on a Mac).
        </p>
        <Button variant="secondary" size="sm" onClick={pasteFromClipboard}>
          <ClipboardPasteIcon />
          Paste from clipboard
        </Button>
        {url && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setUrl(undefined);
              onImage?.(null);
            }}
          >
            {/* As thick as the gold chevrons and plus: about 1.7px (theirs is 2.5 of 24, drawn at 16px). This
                one's drawn at 12px, so 3.4 of 24. */}
            <XIcon strokeWidth={3.4} />
            Remove image
          </Button>
        )}
      </div>
      {problem && <p className="body-sm text-muted-foreground">{problem}</p>}
    </div>
  );
}
