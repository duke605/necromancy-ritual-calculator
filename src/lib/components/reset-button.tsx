"use client";

import { RotateCcwIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/** A small red reset icon, named by `label` and that in its tooltip. */
export function ResetButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="danger" size="icon-sm" className={className} aria-label={label} onClick={onClick}>
            <RotateCcwIcon strokeWidth={3} />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
