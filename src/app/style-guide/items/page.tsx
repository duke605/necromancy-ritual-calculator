import type { Metadata } from "next";
import Image from "next/image";
import { Equipment } from "@/lib/components/equipment";
import { ItemImage } from "@/lib/components/item-image";
import { Slot } from "@/lib/components/slot";
import { ItemTooltip } from "@/lib/components/item-tooltip";
import { Panel } from "@/lib/components/panel";
import items from "@/data/items.json";
import { Section, StyleGuidePage, Subsection } from "../style-guide";

export const metadata: Metadata = { title: "Items (style guide)" };

export default function Items() {
  return (
    <StyleGuidePage title="Items">
      <Section id="slots" title="Slots">
        <Subsection title="States">
          <div className="flex flex-wrap items-end gap-6">
            <Example label="Empty">
              <Slot />
            </Example>
            <Example label="Silhouette">
              <Slot>
                <Image src="/equipment/head.png" alt="" aria-hidden width={32} height={32} className="opacity-25" />
              </Slot>
            </Example>
            <Example label="Item">
              <ItemSlot id="4089" />
            </Example>
          </div>
        </Subsection>
        {/* The slot knows nothing of the item: the tooltip goes on its icon, inside it. Its flavour is the
            item's examine. */}
        <Subsection title="Counts, with item tooltips">
          <div className="flex flex-wrap items-end gap-6">
            {[10, 10_000, 100_000, 10_000_000, 10_000_000_000, 10_000_000_000_000, 10_000_000_000_000_000].map(
              (count) => (
                <Example key={count} label={count.toLocaleString("en")}>
                  <ItemSlot id="55594" count={count} />
                </Example>
              ),
            )}
          </div>
        </Subsection>
      </Section>
      <Section id="equipment" title="Equipment">
        <div className="flex flex-wrap gap-12">
          {[
            { label: "Empty", items: {} },
            {
              label: "Filled",
              // The Subjugation set, from the item data, so each has its stats and examine.
              items: {
                head: items[24992],
                torso: items[24995],
                legs: items[24998],
                hands: items[25007],
                feet: items[25004],
              },
            },
          ].map(({ label, items }) => (
            <Panel key={label} title={`Worn equipment (${label.toLowerCase()})`} headingLevel={3}>
              <Equipment items={items} />
            </Panel>
          ))}
        </div>
      </Section>
    </StyleGuidePage>
  );
}

/** A style guide example with its label under it. */
function Example({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {children}
      <span className="body-sm text-muted-foreground">{label}</span>
    </div>
  );
}

/** An item from the data in a slot, with its tooltip: name, amount and examine. */
function ItemSlot({ id, count = 1 }: { id: keyof typeof items; count?: number }) {
  const { name, image, examine } = items[id];
  return (
    <Slot>
      <ItemTooltip
        name={name}
        image={image}
        stats={count > 1 ? [{ label: "Amount", value: count.toLocaleString("en") }] : []}
        flavour={examine}
      >
        <ItemTooltip.Trigger>
          <ItemImage src={image} alt={name} count={count} />
        </ItemTooltip.Trigger>
      </ItemTooltip>
    </Slot>
  );
}
