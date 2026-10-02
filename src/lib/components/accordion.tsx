"use client";

import { createContext, use, useId } from "react";
import { useSettings } from "@/lib/settings";

const GroupName = createContext<string | undefined>(undefined);

/**
 * Only one of the accordions inside it open at a time: opening one closes the others. It adds no markup;
 * it gives them one `name`, which the browser uses to group <details>.
 */
export function AccordionGroup({ children }: { children: React.ReactNode }) {
  return <GroupName value={useId()}>{children}</GroupName>;
}

/**
 * A panel that opens and closes by its title bar (a native <details>, so the browser's find-in-page
 * opens it too), and stays open or shut between visits, by its title. `headingLevel` keeps the page outline right
 * wherever it's used. The naked `variant` is
 * just its title, small and muted, over what it holds, for a part of a panel. `action` (a reset button, say) sits in
 * the title bar, before the chevron.
 */
export function Accordion({
  title,
  headingLevel = 2,
  variant = "panel",
  open,
  action,
  children,
}: {
  title: string;
  headingLevel?: 2 | 3 | 4;
  variant?: "panel" | "naked";
  /** Open to begin with, until it's been opened or shut. */
  open?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const Heading = `h${headingLevel}` as const;
  const naked = variant === "naked";
  const saved = useSettings((state) => state.open[title]);
  return (
    <details
      className={naked ? "accordion accordion-naked" : "panel frame accordion"}
      name={use(GroupName)}
      open={saved ?? open}
      onToggle={(event) => useSettings.getState().setOpen(title, event.currentTarget.open)}
    >
      <summary className={naked ? undefined : "panel-title"}>
        <Heading>{title}</Heading>
        {/* Clicking it doesn't open or shut the panel too. */}
        {action && (
          <span className="accordion-action" onClick={(event) => event.preventDefault()}>
            {action}
          </span>
        )}
      </summary>
      <div className={naked ? "pt-1" : "panel-body"}>{children}</div>
    </details>
  );
}
