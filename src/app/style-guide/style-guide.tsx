import { Page } from "@/lib/components/page";

/** The style guide's pages, in the sidebar's order: each a handful of related components. */
export const STYLE_GUIDE_PAGES = [
  { slug: "foundations", title: "Foundations", about: "Colours, typography, icons and keys." },
  {
    slug: "controls",
    title: "Controls",
    about: "Buttons, inputs, checkboxes, radio buttons, toggle switches, dropdowns and drop zones.",
  },
  { slug: "feedback", title: "Feedback", about: "Text tooltips, item tooltips, dialogs, NPC dialogue, spinners and progress bars." },
  { slug: "layout", title: "Layout", about: "Tables, accordions and ritual sites." },
  { slug: "items", title: "Items", about: "Slots and equipment." },
];

/** A style guide page: its title over its sections. */
export function StyleGuidePage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Page title={title} eyebrow="Style guide" className="gap-16">
      {children}
    </Page>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <h2 id={id} className="h2 border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * A subheading with its content, close under it (12px). The section's 24px gap goes between subsections,
 * so a subheading is nearer what it heads than what's above it.
 */
export function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="subheading">{title}</h3>
      {children}
    </div>
  );
}
