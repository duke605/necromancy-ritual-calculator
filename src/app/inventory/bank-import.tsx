"use client";

import { useEffect, useRef, useState } from "react";
import items from "@/data/items.json";
import type { Match } from "@/lib/bank-scan";
import type { ScanMessage } from "@/lib/bank-scan.worker";
import { Dialog } from "@/lib/components/dialog";
import { DropZone } from "@/lib/components/drop-zone";
import { ItemTooltip } from "@/lib/components/item-tooltip";
import { Switch } from "@/lib/components/switch";
import { Button } from "@/lib/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { useInventory } from "@/lib/inventory";
import { usePrices } from "@/lib/prices";
import { ItemAmountForm } from "./item-amount-form";

type Id = keyof typeof items;
/** An item, with the fields only some have. */
type Item = (typeof items)[Id] & { highAlch?: number };
const item = (id: number) => items[String(id) as Id];

/** A found icon; `sure` once the user's saved its item and amount, so it's no longer marked as a guess. */
type Found = Match & { sure?: boolean };

/**
 * How sure the scan is of an icon, for its box's colour: no item matched ("unknown", red), several matched
 * closely ("close", yellow), its amount's shortened ("truncated", yellow too), or found ("found", green).
 */
const certainty = ({ id, candidates, truncated, sure }: Found) =>
  sure ? "found" : id === null ? "unknown" : candidates.length > 1 ? "close" : truncated ? "truncated" : "found";
type Scan = { url: string; width: number; height: number; found: Found[] };

const percent = (n: number, of: number) => `${(n / of) * 100}%`;

/** How far the screenshot's kept past its outermost slots, each way, in its pixels. */
const TRIM_MARGIN = 16;

/**
 * The screenshot cut down to its slots and a margin around them (the rest is the interface), with the
 * found icons moved to match. Left whole when nothing was found.
 */
async function trim(file: File, { width, height, found }: Omit<Scan, "url">): Promise<Scan> {
  if (!found.length) return { url: URL.createObjectURL(file), width, height, found };
  const left = Math.max(0, Math.min(...found.map(({ box }) => box.left)) - TRIM_MARGIN);
  const top = Math.max(0, Math.min(...found.map(({ box }) => box.top)) - TRIM_MARGIN);
  const right = Math.min(width, Math.max(...found.map(({ box }) => box.right)) + 1 + TRIM_MARGIN);
  const bottom = Math.min(height, Math.max(...found.map(({ box }) => box.bottom)) + 1 + TRIM_MARGIN);
  const canvas = new OffscreenCanvas(right - left, bottom - top);
  const bitmap = await createImageBitmap(file);
  canvas.getContext("2d")!.drawImage(bitmap, -left, -top);
  bitmap.close();
  return {
    url: URL.createObjectURL(await canvas.convertToBlob()),
    width: canvas.width,
    height: canvas.height,
    found: found.map((f) => ({
      ...f,
      box: { left: f.box.left - left, top: f.box.top - top, right: f.box.right - left, bottom: f.box.bottom - top },
    })),
  };
}

/** What an icon that matched no item shows in its tooltip. */
const UNKNOWN = { name: "Unknown item", image: undefined, examine: undefined, highAlch: undefined };

/**
 * Reads a bank screenshot: every slot's icon is boxed on it, coloured by how sure the scan is of it (see
 * `certainty`), its tooltip on hover, and a click picks it to set or correct its item and amount. Then the
 * named items go into the inventory: syncing sets their counts to the screenshot's, adding adds to them.
 */
export function BankImport() {
  // Null before an image is given; a number (0 to 1) while it's read.
  const [scan, setScan] = useState<Scan | number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  // Under the drop zone: how many items were synced or added, or why a screenshot couldn't be read.
  const [note, setNote] = useState<string>();
  const setCounts = useInventory((state) => state.setCounts);
  const addCounts = useInventory((state) => state.addCounts);
  const inventory = useInventory((state) => state.counts);
  const prices = usePrices((state) => state.prices);
  // Whether the screenshot's amounts are added to what's there, or replace it ("sync").
  const [adding, setAdding] = useState(false);
  // The scan in progress, stopped if the image is replaced or removed first, or the page is left.
  const worker = useRef<Worker>(null);
  useEffect(() => () => worker.current?.terminate(), []);

  const read = (file: File | null) => {
    worker.current?.terminate();
    setPicked(null);
    setNote(undefined);
    if (!file) return setScan(null);
    setScan(0);
    // Where there's a server (dev, or `npm start`), kept on it as a test image (api/bank-screenshots/route.server.ts).
    // The scan doesn't wait on it, nor mind if it fails.
    if (process.env.BANK_SCREENSHOT_UPLOADS) {
      fetch("/api/bank-screenshots", { method: "POST", headers: { "content-type": file.type }, body: file }).catch(
        () => {},
      );
    }
    // ponytail: a new worker each scan, so it fetches the icons again (from the HTTP cache); keep one
    // alive if that shows.
    const scanner = (worker.current = new Worker(new URL("../../lib/bank-scan.worker.ts", import.meta.url)));
    scanner.onmessage = ({ data }: MessageEvent<ScanMessage>) => {
      if ("progress" in data) return setScan(data.progress);
      scanner.terminate();
      if ("error" in data) {
        setScan(null);
        setNote(`Couldn't read that image: ${data.error}`);
      } else {
        trim(file, data).then((trimmed) => {
          // Unless another image has been given since.
          if (worker.current === scanner) setScan(trimmed);
        });
      }
    };
    scanner.postMessage(file);
  };

  const remove = () => {
    if (typeof scan === "object" && scan) URL.revokeObjectURL(scan.url);
    read(null);
  };

  if (scan === null) {
    return (
      <div className="flex flex-col gap-3">
        <DropZone label="Paste, drop or choose a bank screenshot" onImage={read} />
        {note && <p className="body-sm text-muted-foreground">{note}</p>}
      </div>
    );
  }
  if (typeof scan === "number") {
    return (
      <label className="body-sm mx-auto mt-8 flex w-2/3 flex-col gap-2 text-center text-muted-foreground">
        Reading your screenshot…
        <progress className="progress" value={scan} />
      </label>
    );
  }

  const { url, width, height, found } = scan;
  const named = found.filter((f): f is Found & { id: number } => f.id !== null);
  const edit = (index: number, change: Partial<Found>) =>
    setScan({ ...scan, found: found.map((f, i) => (i === index ? { ...f, ...change, sure: true } : f)) });
  const add = () => {
    // The same item twice (in two tabs' screenshots stitched together, say) counts once for each.
    const counts = new Map<number, number>();
    for (const { id, count } of named) counts.set(id, (counts.get(id) ?? 0) + count);
    (adding ? addCounts : setCounts)(counts);
    URL.revokeObjectURL(url);
    setScan(null);
    setPicked(null);
    setNote(`${adding ? "Added" : "Synced"} ${named.length} items.`);
  };
  const pick = picked === null ? null : found[picked];

  return (
    <div className="flex flex-col gap-4">
      <div className="bank-preview">
        {/* The user's own file, not a page asset, so next/image has nothing to optimise. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Your bank screenshot" />
        {found.map((f, index) => {
          const { box, count, id, candidates } = f;
          const state = certainty(f);
          const { name, image, examine, highAlch } = id === null ? UNKNOWN : (item(id) as Item);
          const price = id === null ? null : (prices[id]?.value ?? null);
          const amount = count.toLocaleString("en");
          return (
            <ItemTooltip
              key={index}
              name={name}
              image={image}
              stats={[
                {
                  label: "Amount",
                  value:
                    id === null ? amount : <AmountChange count={count} have={inventory[id] ?? 0} adding={adding} />,
                },
                // Each, where there's one: not every item can be alched or traded.
                ...(price === null ? [] : [{ label: "GE price", value: price.toLocaleString("en") }]),
                ...(highAlch === undefined ? [] : [{ label: "High alch", value: highAlch.toLocaleString("en") }]),
              ]}
              flavour={examine}
            >
              {state === "unknown" && <p>Unrecognised item.</p>}
              {state === "close" && (
                <p>Could also be {candidates.slice(1).map((other) => item(other).name).join(" or ")}.</p>
              )}
              {state === "truncated" && <p>Quantity truncated, may need increasing.</p>}
              <ItemTooltip.Trigger
                role="button"
                aria-label={`${name}, ${amount}`}
                aria-haspopup="dialog"
                className="bank-box"
                data-state={state}
                style={{
                  left: percent(box.left, width),
                  top: percent(box.top, height),
                  width: percent(box.right - box.left + 1, width),
                  height: percent(box.bottom - box.top + 1, height),
                }}
                onClick={() => setPicked(index)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  setPicked(index);
                }}
              />
            </ItemTooltip>
          );
        })}
      </div>

      {named.length === 0 && (
        <p className="body-sm text-muted-foreground">No ritual items found.</p>
      )}

      <Dialog open={pick !== null} title="Change item" onClose={() => setPicked(null)}>
        {pick && picked !== null && (
          <ItemAmountForm
            defaultQuery={pick.id === null ? "" : item(pick.id).name}
            first={pick.sure ? [] : pick.candidates}
            initialId={pick.id}
            initialCount={pick.count}
            onSave={(change) => {
              edit(picked, change);
              setPicked(null);
            }}
            onCancel={() => setPicked(null)}
          />
        )}
      </Dialog>

      <div className="flex flex-col items-end gap-3">
        {named.length > 0 && <ImportMode adding={adding} onChange={setAdding} />}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="danger" size="sm" onClick={remove}>
            Cancel
          </Button>
          {named.length > 0 && (
            <Button size="sm" onClick={add}>
              {/* Both labels stacked in one place, so the button's as wide as the longer and doesn't change
                  size as the switch flips; they swap as the sidebar's logo and collapse button do, one
                  shrinking and fading out as the other comes in. The hidden one isn't read out. */}
              <span className="grid text-center">
                {[
                  { label: "Sync", shown: !adding },
                  { label: "Add", shown: adding },
                ].map(({ label, shown }) => (
                  <span
                    key={label}
                    aria-hidden={!shown}
                    className={`col-start-1 row-start-1 transition-[opacity,scale] duration-150 ease-[cubic-bezier(.25,.1,.25,1)] motion-reduce:transition-none ${shown ? "" : "scale-80 opacity-0"}`}
                  >
                    {label} {named.length} items
                  </span>
                ))}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A found amount, and how syncing or adding it would change what the inventory `have`s: "12,350 (+6,322)",
 * green up, red down, or just the amount when it wouldn't change.
 */
function AmountChange({ count, have, adding }: { count: number; have: number; adding: boolean }) {
  const change = (adding ? have + count : count) - have;
  return (
    <>
      {count.toLocaleString("en")}
      {change !== 0 && (
        <span className={change > 0 ? "text-green-500" : "text-blood-300"}>
          {" "}
          ({change > 0 ? "+" : "−"}
          {Math.abs(change).toLocaleString("en")})
        </span>
      )}
    </>
  );
}

/** Sync or add: a switch between the two words, the one it's set to in gold, with what each does in its tooltip. */
function ImportMode({ adding, onChange }: { adding: boolean; onChange: (adding: boolean) => void }) {
  return (
    <div className="body-sm flex items-center gap-2">
      {/* The words pick their side too, for the pointer; the switch is what's focused and read out. */}
      <span aria-hidden className={`cursor-pointer ${adding ? "" : "text-gold-300"}`} onClick={() => onChange(false)}>
        Sync
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Switch
              select
              aria-label="Add to amounts instead of syncing"
              checked={adding}
              onChange={(event) => onChange(event.target.checked)}
            />
          }
        />
        <TooltipContent>Sync sets amounts to the screenshot&apos;s. Add adds them to yours.</TooltipContent>
      </Tooltip>
      <span aria-hidden className={`cursor-pointer ${adding ? "text-gold-300" : ""}`} onClick={() => onChange(true)}>
        Add
      </span>
    </div>
  );
}
