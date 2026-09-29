import Image from "next/image";
import { Children, isValidElement } from "react";
import { FollowTooltip } from "./follow-tooltip";

type Stat = { label: string; value: React.ReactNode };

// An item's details card, laid out the same way every time: name band, stats, `children`, effects,
// requirement, flavour. Sections without content are left out, and the dividers go between the ones
// that are there.
//
// On its own it's just the card. With an <ItemTooltip.Trigger> among its children, the trigger is
// rendered in its place, and the card appears while it's hovered, following the pointer:
//   <ItemTooltip name="Multiply II" …>
//     <ItemTooltip.Trigger><Image … /></ItemTooltip.Trigger>
//   </ItemTooltip>
//
// `children` is the escape hatch: its own section, for whatever doesn't fit the others, e.g. a cost:
//   <ItemTooltip.RowHeading>Cost</ItemTooltip.RowHeading>
//   <ItemTooltip.Stats stats={[{ label: "Regular ghostly ink", value: 2 }]} />
export function ItemTooltip({
  name,
  type,
  image,
  stats = [],
  children,
  effects = [],
  requires,
  flavour,
}: {
  name: string;
  /** What it is, under the name, e.g. "Alteration glyph". */
  type?: string;
  image?: string;
  /** "Label: value" lines. Values can be anything, e.g. an item's icon and how many; say what the icon is in the label. */
  stats?: Stat[];
  /** A section after the stats, for anything else, and the trigger; see above. */
  children?: React.ReactNode;
  effects?: React.ReactNode[];
  requires?: { skill: string; level: number };
  /** Italic closing text, like the item's examine. */
  flavour?: React.ReactNode;
}) {
  // The trigger goes outside the card; the rest is the card's own section.
  const all = Children.toArray(children);
  const trigger = all.find((child) => isValidElement(child) && child.type === Trigger);
  const section = all.filter((child) => child !== trigger);
  const card = (
    <div className="item-tooltip">
      <div className="item-tooltip-header">
        {image && <Image src={image} alt="" aria-hidden width={32} height={32} className="size-8 object-contain" />}
        <span className="item-tooltip-name">{name}</span>
        {type && <span className="item-tooltip-type">{type}</span>}
      </div>
      {stats.length > 0 && (
        <div className="item-tooltip-section">
          <Stats stats={stats} />
        </div>
      )}
      {section.length > 0 && <div className="item-tooltip-section">{section}</div>}
      {effects.length > 0 && (
        <ul className="item-tooltip-section">
          {effects.map((effect, index) => (
            <li key={index} className="item-tooltip-effect">
              {effect}
            </li>
          ))}
        </ul>
      )}
      {requires && (
        <p className="item-tooltip-section item-tooltip-requires">
          Requires <strong>{requires.skill}</strong> level <strong>{requires.level}</strong>
        </p>
      )}
      {flavour && <p className="item-tooltip-section item-tooltip-flavour">{flavour}</p>}
    </div>
  );
  if (!isValidElement<React.ComponentProps<typeof Trigger>>(trigger)) return card;
  const { children: content, ...triggerProps } = trigger.props;
  return (
    <FollowTooltip trigger={content} triggerProps={triggerProps}>
      {card}
    </FollowTooltip>
  );
}

/** "Label: value" lines, as in `stats`, for use in `children`. */
function Stats({ stats }: { stats: Stat[] }) {
  return (
    <dl className="item-tooltip-stats">
      {stats.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A small heading over lines in `children`, e.g. "Cost". */
function RowHeading({ children }: { children: React.ReactNode }) {
  return <p className="subheading mb-0.5">{children}</p>;
}

/**
 * What shows the tooltip when hovered or focused, among an <ItemTooltip>'s children. It must be a
 * direct child: the tooltip finds it by type, so wrapped in another component it isn't found. Other
 * attributes go on the element around it, e.g. a role and click handler to make it a button.
 */
function Trigger({ children }: { children?: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return children;
}

ItemTooltip.Trigger = Trigger;
ItemTooltip.Stats = Stats;
ItemTooltip.RowHeading = RowHeading;
