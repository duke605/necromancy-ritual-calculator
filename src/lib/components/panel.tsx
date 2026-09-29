import { useId } from "react";

// A game window. `headingLevel` keeps the page outline right wherever the panel is used. `borderless`
// leaves off the frame, keeping the window's height. `header` puts something else in the title bar, such
// as a search field, in place of the title; the title then only names the panel for screen readers.
export function Panel({
  title,
  header,
  headingLevel = 2,
  borderless,
  className,
  children,
}: {
  title: string;
  header?: React.ReactNode;
  headingLevel?: 2 | 3 | 4;
  borderless?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <section
      className={`panel ${borderless ? "panel-borderless" : "frame"} ${className ?? ""}`}
      aria-labelledby={header ? undefined : id}
      aria-label={header ? title : undefined}
    >
      {header ? (
        <div className="panel-title panel-header">{header}</div>
      ) : (
        <Heading id={id} className="panel-title">
          {title}
        </Heading>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
