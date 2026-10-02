import type { Metadata } from "next";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/components/ui/tooltip";
import { ItemTooltip } from "@/lib/components/item-tooltip";
import { RasialSays } from "@/lib/components/rasial-says";
import { Button } from "@/lib/components/ui/button";
import glyphs from "@/data/glyphs.json";
import inks from "@/data/inks.json";
import items from "@/data/items.json";
import { Section, StyleGuidePage, Subsection } from "../style-guide";
import { DialogExamples } from "./dialog-examples";
import { SpinnerExample } from "./spinner-example";

export const metadata: Metadata = { title: "Feedback (style guide)" };

/** Progress bar sizes and textures, for showing every pairing. */
const PROGRESS_SIZES = [
  { label: "Default", className: "" },
  { label: "Small (progress-sm)", className: "progress-sm" },
];
const PROGRESS_TEXTURES = [
  { label: "Gold", className: "" },
  ...["molten", "eyes", "trans", "bi", "pride"].map((texture) => ({
    label: `progress-${texture}`,
    className: `progress-${texture}`,
  })),
];

export default function Feedback() {
  return (
    <StyleGuidePage title="Feedback">
      <Section id="text-tooltips" title="Text tooltips">
        <p className="body-sm text-muted-foreground">Held open here; they show on hover or focus.</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] place-items-center gap-y-24 py-16">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <Tooltip key={side} open>
              <TooltipTrigger className="icon-info text-sm" aria-label={`Info, ${side}`}>
                i
              </TooltipTrigger>
              <TooltipContent side={side}>Tooltip on the {side}</TooltipContent>
            </Tooltip>
          ))}
          <Tooltip open>
            <TooltipTrigger className="icon-info text-sm" aria-label="Info, no arrow">
              i
            </TooltipTrigger>
            <TooltipContent indirectional>No arrow</TooltipContent>
          </Tooltip>
        </div>
      </Section>
      <Section id="tooltips" title="Tooltips">
        <p className="body-sm text-muted-foreground">
          Sample text: the durability, ink and percentages are Multiply II&apos;s; the level is made up.
        </p>
        <div className="flex flex-wrap items-start gap-12">
          <ItemTooltip
            name="Multiply II"
            type="Alteration glyph"
            image={glyphs["Multiply II"].image}
            stats={[{ label: "Durability", value: 6 }]}
            effects={["+40% chance to multiply the ritual's products", "+40% soul attraction"]}
            requires={{ skill: "Necromancy", level: 60 }}
          >
            <ItemTooltip.RowHeading>Cost</ItemTooltip.RowHeading>
            <ItemTooltip.Stats
              // One line per ink, named: the icon backs the name up, since nothing in a tooltip can be hovered.
              stats={(["regular", "basic"] as const).map((ink) => {
                const { name, image } = items[`${inks[ink].id}` as keyof typeof items];
                return {
                  label: name,
                  value: (
                    <>
                      <Image src={image} alt="" aria-hidden width={20} height={20} />2
                    </>
                  ),
                };
              })}
            />
          </ItemTooltip>
          <ItemTooltip
            name="Multiply II"
            type="Alteration glyph"
            image={glyphs["Multiply II"].image}
            stats={[{ label: "Durability", value: 6 }]}
            effects={["+40% chance to multiply the ritual's products", "+40% soul attraction"]}
            requires={{ skill: "Necromancy", level: 60 }}
          >
            <ItemTooltip.Trigger>
              <span className="flex flex-col items-center gap-2">
                <Image
                  src={glyphs["Multiply II"].image}
                  alt="Multiply II"
                  width={48}
                  height={48}
                  className="size-12 object-contain"
                />
                <span className="body-sm text-muted-foreground">Hover or focus me</span>
              </span>
            </ItemTooltip.Trigger>
            <ItemTooltip.RowHeading>Cost</ItemTooltip.RowHeading>
            <ItemTooltip.Stats
              // One line per ink, named: the icon backs the name up, since nothing in a tooltip can be hovered.
              stats={(["regular", "basic"] as const).map((ink) => {
                const { name, image } = items[`${inks[ink].id}` as keyof typeof items];
                return {
                  label: name,
                  value: (
                    <>
                      <Image src={image} alt="" aria-hidden width={20} height={20} />2
                    </>
                  ),
                };
              })}
            />
          </ItemTooltip>
        </div>
      </Section>
      <Section id="dialogs" title="Dialogs">
        <p className="body-sm text-muted-foreground">
          A title bar with a close button, then optional header, content and footer rows. Only the content scrolls, with
          the gold scrollbar (.scrollbar).
        </p>
        <DialogExamples />
      </Section>
      <Section id="npc-dialogue" title="NPC dialogue">
        <p className="body-sm text-muted-foreground">
          Rasial talking, as NPCs do in the game (RasialSays): his chathead in a round frame, what he says beside it,
          and actions under that. For when things go wrong: the calculator failing to load, and the 404 page.
        </p>
        <RasialSays
          actions={
            <Button variant="ghost" size="xs">
              Back to rituals
            </Button>
          }
        >
          Even I, Rasial, the First Necromancer, cannot raise a page that never lived.
        </RasialSays>
      </Section>
      <Section id="spinner" title="Spinner">
        <p className="body-sm text-muted-foreground">
          Loading for as long as it takes (Spinner): a gold arc running round a sunken ring, its tail fading. Medium,
          large and extra large. Slower with reduced motion.
        </p>
        <SpinnerExample />
      </Section>
      <Section id="progress" title="Progress bars">
        <Subsection title="Fill">
          <div className="flex max-w-md flex-col gap-4">
            {[0, 0.05, 0.6, 1].map((value) => (
              <label key={value} className="body-sm flex flex-col gap-2 text-muted-foreground">
                {value * 100}%
                <progress className="progress" value={value} />
              </label>
            ))}
            <label className="body-sm flex flex-col gap-2 text-muted-foreground">
              Indeterminate (no value)
              <progress className="progress" />
            </label>
          </div>
        </Subsection>
        {/* Every size with every texture, all at 60%. */}
        <Subsection title="Sizes and textures">
          {/* Pulled out by the table's cell spacing, so its first row sits as close under the heading. */}
          <div className="-mx-4 -my-3 max-w-full overflow-x-auto">
            <table className="w-full max-w-3xl border-separate border-spacing-x-4 border-spacing-y-3">
              <thead>
                <tr>
                  <td />
                  {PROGRESS_SIZES.map(({ label }) => (
                    <th key={label} scope="col" className="body-sm text-left font-normal text-muted-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROGRESS_TEXTURES.map(({ label, className: texture }) => (
                  <tr key={label}>
                    <th
                      scope="row"
                      className="body-sm pr-2 text-left font-normal whitespace-nowrap text-muted-foreground"
                    >
                      {label}
                    </th>
                    {PROGRESS_SIZES.map(({ label: size, className }) => (
                      <td key={size} className="w-1/2">
                        <progress
                          className={`progress ${texture} ${className}`}
                          value={0.6}
                          aria-label={`${label}, ${size.toLowerCase()}, 60%`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Subsection>
      </Section>
    </StyleGuidePage>
  );
}
