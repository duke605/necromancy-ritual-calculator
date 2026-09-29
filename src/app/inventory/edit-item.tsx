"use client";

import { useState } from "react";
import type items from "@/data/items.json";
import { Dialog, DialogContent, DialogFooter } from "@/lib/components/dialog";
import { Field } from "@/lib/components/field";
import { ItemImage } from "@/lib/components/item-image";
import { NumberInput } from "@/lib/components/number-input";
import { RefreshIcon } from "@/lib/components/refresh-icon";
import { Slot } from "@/lib/components/slot";
import { Button } from "@/lib/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { useInventory } from "@/lib/inventory";
import { livePrice, usePrices, type Price } from "@/lib/prices";

export type Owned = (typeof items)[keyof typeof items] & { count: number };

/** The edit dialog for an item, owned or not (`count` 0), open while there's one. */
export function EditItem({ item, onClose }: { item: Owned | null; onClose: () => void }) {
  return (
    <Dialog open={item !== null} title="Edit item" onClose={onClose}>
      {item && <EditItemForm key={item.id} item={item} onClose={onClose} />}
    </Dialog>
  );
}

/**
 * The item (fixed), its price and its amount. A locked price is the user's: it can't be typed over or
 * refreshed, and syncs leave it alone. Refreshing fetches the live one. Nothing changes until it's saved
 * or deleted.
 */
function EditItemForm({
  item: { id, name, image, examine, tradeable, count },
  onClose,
}: {
  item: Owned;
  onClose: () => void;
}) {
  const saved = usePrices((state) => state.prices[id]) ?? { value: null, locked: false };
  const savePrice = usePrices((state) => state.setPrice);
  const setCounts = useInventory((state) => state.setCounts);
  const [price, setPrice] = useState<Price>(saved);
  const [amount, setAmount] = useState(count);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setPrice({ value: await livePrice(id), locked: false });
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        setCounts(new Map([[id, amount]]));
        if (price.value !== saved.value || price.locked !== saved.locked) savePrice(id, price);
        onClose();
      }}
    >
      <DialogContent className="flex items-center gap-4">
        <Slot>
          <ItemImage src={image} alt="" />
        </Slot>
        <div className="flex flex-col gap-2">
          <div>
            <span className="item-tooltip-name">{name}</span>
            <p className="item-tooltip-flavour body-sm">{examine}</p>
          </div>
          <Field label={tradeable ? "GE price" : "Price"}>
            <div className="flex items-center gap-1">
              <NumberInput
                steppers={false}
                // Room for a price in the billions and the lock.
                className="w-50"
                min={0}
                placeholder="Unknown"
                readOnly={price.locked}
                end={
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Lock price"
                          aria-pressed={price.locked}
                          onClick={() => setPrice({ ...price, locked: !price.locked })}
                        >
                          <span className={price.locked ? "icon-lock" : "icon-lock-open"} aria-hidden />
                        </Button>
                      }
                    />
                    <TooltipContent>{price.locked ? "Unlock price" : "Lock price"}</TooltipContent>
                  </Tooltip>
                }
                value={price.value ?? ""}
                onChange={(event) =>
                  setPrice({
                    ...price,
                    value: Number.isNaN(event.target.valueAsNumber) ? null : event.target.valueAsNumber,
                  })
                }
              />
              {/* Untradeable items aren't on the Grand Exchange. */}
              {tradeable && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-sm"
                        aria-label="Fetch live GE price"
                        disabled={refreshing || price.locked}
                        onClick={refresh}
                      >
                        <RefreshIcon spinning={refreshing} />
                      </Button>
                    }
                  />
                  <TooltipContent>Fetch live GE price</TooltipContent>
                </Tooltip>
              )}
            </div>
          </Field>
        </div>
      </DialogContent>
      <DialogFooter className="justify-between">
        <Field label="Amount">
          <NumberInput min={0} value={amount} onChange={(event) => setAmount(event.target.valueAsNumber || 0)} />
        </Field>
        <div className="flex gap-3">
          {/* Only with some to delete: it's opened for items not owned too, to price them. */}
          {count > 0 && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                // Items with none aren't shown.
                setCounts(new Map([[id, 0]]));
                onClose();
              }}
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
