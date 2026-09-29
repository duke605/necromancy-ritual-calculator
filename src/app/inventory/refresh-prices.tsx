"use client";

import { RefreshIcon } from "@/lib/components/refresh-icon";
import { Button } from "@/lib/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { usePrices } from "@/lib/prices";

/** A small refresh button that fetches every live GE price now, rather than waiting out the hour. */
export function RefreshPrices() {
  const syncing = usePrices((state) => state.syncing);
  const refresh = () => usePrices.getState().sync(true).catch(console.error);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon-sm"
            className="shrink-0"
            aria-label="Fetch live GE prices"
            disabled={syncing}
            onClick={refresh}
          >
            <RefreshIcon spinning={syncing} />
          </Button>
        }
      />
      <TooltipContent>Fetch live GE prices</TooltipContent>
    </Tooltip>
  );
}
