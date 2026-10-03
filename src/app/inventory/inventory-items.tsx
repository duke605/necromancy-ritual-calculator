"use client";

import { useState } from "react";
import items from "@/data/items.json";
import { ItemImage } from "@/lib/components/item-image";
import { ItemTooltip } from "@/lib/components/item-tooltip";
import { Panel } from "@/lib/components/panel";
import { Slot } from "@/lib/components/slot";
import { Spinner } from "@/lib/components/spinner";
import { Button } from "@/lib/components/ui/button";
import { collect } from "@/lib/collect";
import { useInventory } from "@/lib/inventory";
import { usePriceStats } from "@/lib/hooks/use-price-stats";
import { usePrices } from "@/lib/prices";
import { trigramSearch } from "@/lib/trigram";
import { AddItem } from "./add-item";
import { ClearInventory } from "./clear-inventory";
import { EditItem, type Owned } from "./edit-item";
import { RefreshPrices } from "./refresh-prices";
/** Whether a change raised or lowered an item's count or price. */
type Change = "up" | "down";

/** Items to a page, and the most a search shows. */
const PAGE = 200;

/**
 * What the user has, as slots: by name, a page at a time, or the best matches for a search in the title
 * bar (trigram search, so typos still find them), with buttons beside it to fetch live prices, to clear
 * every item and to add one by hand. Clicking an item edits it.
 */
export function InventoryItems() {
  const counts = useInventory((state) => state.counts);
  // Saved counts load from IndexedDB after the page does; until then, there's nothing to show yet.
  const loaded = useInventory((state) => state.loaded);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  // The item whose amount is being changed, in the edit dialog.
  const [editing, setEditing] = useState<Owned | null>(null);
  const last = useChanges(counts, loaded);

  const owned: Owned[] = collect(counts)
    .filter(([id, count]) => count > 0 && id in items)
    .map(([id, count]) => ({ ...items[id as keyof typeof items], count }))
    .toArray()
    .sort((a, b) => a.name.localeCompare(b.name));
  const pages = Math.ceil(owned.length / PAGE);
  const searching = query.trim() !== "";
  const shown = searching
    ? trigramSearch(owned, query, ({ name }) => name, PAGE)
    : owned.slice(page * PAGE, (page + 1) * PAGE);

  return (
    <Panel
      title="Your items"
      header={
        <div className="flex items-center gap-1">
          <input
            type="search"
            className="input flex-1"
            placeholder="Search your items"
            aria-label="Search your items"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <RefreshPrices />
          <ClearInventory />
          <AddItem query={query} />
        </div>
      }
      className="w-full"
    >
      <div className="bank-well">
        {!loaded ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner size="lg" label="Loading inventory" />
            <p className="body-sm text-muted-foreground" aria-hidden>
              Loading inventory…
            </p>
          </div>
        ) : shown.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Items">
            {shown.map((item) => (
              <li key={item.id}>
                <OwnedItem
                  item={item}
                  change={last.changes[item.id] && { kind: last.changes[item.id], at: last.at }}
                  onEdit={() => setEditing(item)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="body-sm text-muted-foreground">{owned.length ? "No matches." : "No items yet."}</p>
        )}
      </div>
      {loaded && !searching && pages > 1 && (
        <div className="px-2 pb-2">
          <Pagination page={Math.min(page, pages - 1)} pages={pages} onPage={setPage} />
        </div>
      )}
      <EditItem item={editing} onClose={() => setEditing(null)} />
    </Panel>
  );
}

/**
 * Which owned items the last change of the counts or prices raised or lowered, so their slots flash
 * (a count's change over its price's), and which change it was, so an item changed twice flashes twice.
 * Not saved state arriving on load: only changes after.
 */
function useChanges(counts: Record<number, number>, loaded: boolean) {
  const prices = usePrices((state) => state.prices);
  const pricesLoaded = usePrices((state) => state.loaded);
  const [last, setLast] = useState({
    counts,
    loaded,
    prices,
    pricesLoaded,
    changes: {} as Record<number, Change>,
    at: 0,
  });
  if (
    counts !== last.counts ||
    loaded !== last.loaded ||
    prices !== last.prices ||
    pricesLoaded !== last.pricesLoaded
  ) {
    const changes: Record<number, Change> = {};
    const compare = (id: number, now: number, was: number) => {
      if (now !== was) changes[id] ??= now > was ? "up" : "down";
    };
    if (last.loaded && counts !== last.counts) {
      for (const [id, count] of Object.entries(counts)) compare(Number(id), count, last.counts[Number(id)] ?? 0);
    }
    if (last.pricesLoaded && prices !== last.prices) {
      for (const id of Object.keys(counts).map(Number)) {
        const [now, was] = [prices[id]?.value, last.prices[id]?.value];
        // A price that's newly known, or no longer, isn't a rise or fall.
        if (now != null && was != null) compare(id, now, was);
      }
    }
    setLast({ counts, loaded, prices, pricesLoaded, changes, at: last.at + 1 });
  }
  return last;
}

/**
 * An owned item, with its tooltip: name, amount, GE price, high alch and examine. A click edits it. A
 * `change` flashes a box around it, green if it went up, red if down.
 */
function OwnedItem({
  item,
  change,
  onEdit,
}: {
  item: Owned;
  change?: { kind: Change; at: number };
  onEdit: () => void;
}) {
  const { id, name, image, examine, count } = item;
  // Not every item can be alched or traded.
  const prices = usePriceStats(id, "highAlch" in item ? item.highAlch : undefined);
  return (
    // Bare on the bank brown, as the bank shows them.
    <Slot invisible>
      {/* Keyed by the change, so a new one starts the flash over. */}
      {change && <span key={change.at} className="slot-flash" data-change={change.kind} aria-hidden />}
      <ItemTooltip
        name={name}
        image={image}
        stats={[{ label: "Amount", value: count.toLocaleString("en") }, ...prices]}
        flavour={examine}
      >
        <ItemTooltip.Trigger
          role="button"
          aria-label={`${name}, ${count.toLocaleString("en")}`}
          aria-haspopup="dialog"
          className="cursor-pointer"
          onClick={onEdit}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onEdit();
          }}
        >
          <ItemImage src={image} alt={name} count={count} />
        </ItemTooltip.Trigger>
      </ItemTooltip>
    </Slot>
  );
}

/** Previous and next, with which page this is. */
function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  return (
    <nav className="flex items-center justify-end gap-3" aria-label="Pages">
      <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="body-sm text-muted-foreground" aria-live="polite">
        Page {page + 1} of {pages}
      </span>
      <Button variant="secondary" size="sm" disabled={page === pages - 1} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
