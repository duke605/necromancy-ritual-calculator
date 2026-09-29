import type { Metadata } from "next";
import { Section, StyleGuidePage, Subsection } from "../style-guide";

export const metadata: Metadata = { title: "Foundations (style guide)" };

const colours = [
  { group: "Ink", names: ["ink-950", "ink-900", "ink-800", "ink-700", "ink-600"] },
  { group: "Stone", names: ["stone-700", "stone-600", "stone-500", "stone-400"] },
  { group: "Bronze", names: ["bronze-800", "bronze-700", "bronze-500", "bronze-400", "bronze-300"] },
  { group: "Gold", names: ["gold-950", "gold-800", "gold-600", "gold-500", "gold-400", "gold-300", "gold-200"] },
  { group: "Parchment", names: ["ash-400", "parchment-400", "parchment-200", "parchment-100"] },
  { group: "Accents", names: ["orange-500", "green-500", "steel-500", "steel-400", "steel-100", "blood-700", "blood-500"] },
];

const typography = [
  { className: "h1", sample: "Necromancy Rituals" },
  { className: "h2", sample: "Manual Setup" },
  { className: "h3", sample: "Advanced" },
  { className: "h4", sample: "Showing all 326 items" },
  { className: "body", sample: "Draw power from the ritual site to create necroplasm, ensouled bars and other resources. Glyphs placed around the platform change what the ritual produces and how long it lasts." },
  { className: "body-sm", sample: "Glyphs deplete as the ritual runs. Repair them before they fail, or the ritual ends early." },
  { className: "subheading", sample: "Additional settings" },
];

export default function Foundations() {
  return (
    <StyleGuidePage title="Foundations">
      <Section id="colours" title="Colours">
        {colours.map(({ group, names }) => (
          <Subsection key={group} title={group}>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
              {names.map((name) => (
                <li key={name} className="flex flex-col gap-1">
                  <span
                    aria-hidden
                    className="h-12 rounded-md border border-ink-950"
                    style={{ background: `var(--color-${name})` }}
                  />
                  <code className="body-sm font-mono">{name}</code>
                </li>
              ))}
            </ul>
          </Subsection>
        ))}
      </Section>
      <Section id="typography" title="Typography">
        <p className="body text-muted-foreground">
          Classes, not tags. Choose the element for the document outline and the class for the look:{" "}
          <code className="font-mono text-parchment-100">&lt;h2 className=&quot;h1&quot;&gt;</code>.
        </p>
        <dl className="flex flex-col gap-6">
          {typography.map(({ className, sample }) => (
            <div key={className} className="grid gap-2 md:grid-cols-[6rem_1fr] md:items-baseline">
              <dt>
                <code className="body-sm font-mono text-muted-foreground">.{className}</code>
              </dt>
              <dd className={className}>{sample}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="icons" title="Icons">
        <div className="flex flex-wrap items-end gap-6">
          {["text-sm", "text-base", "text-xl", "text-3xl"].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <span className={`icon-info ${size}`} role="img" aria-label="Information">
                i
              </span>
              <code className="body-sm font-mono text-muted-foreground">{size}</code>
            </div>
          ))}
        </div>
      </Section>
      <Section id="keys" title="Keys">
        <p className="body-sm text-muted-foreground">
          A native <code className="font-mono text-parchment-100">&lt;kbd className=&quot;kbd&quot;&gt;</code>, sized to
          the text around it.
        </p>
        <div className="flex items-center gap-3">
          <span>
            <kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">V</kbd>
          </span>
          <span>
            <kbd className="kbd">⌘</kbd> <kbd className="kbd">V</kbd>
          </span>
          <kbd className="kbd">Esc</kbd>
        </div>
        <p className="body-sm text-muted-foreground">
          Hover over the box and paste (<kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">V</kbd>, or{" "}
          <kbd className="kbd">⌘</kbd> <kbd className="kbd">V</kbd> on a Mac).
        </p>
      </Section>
    </StyleGuidePage>
  );
}
