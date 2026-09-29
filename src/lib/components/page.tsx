/**
 * A page: its title (under an `eyebrow`, if it has one) in a header that stays at the top as the page scrolls,
 * over its content. The header always spans the page; the content is up to 1024px wide and centred, or as wide
 * as the page with `fullWidth`. `className` goes on the content, e.g. for its gap.
 */
export function Page({
  title,
  eyebrow,
  fullWidth,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* The content frame's texture, lined up with it from the same corner, so it only shows as sticky once
          something scrolls under it. */}
      <header className="sticky top-0 z-10 p-4 [background:var(--texture-panel),var(--color-ink-900)]">
        {eyebrow && <p className="subheading">{eyebrow}</p>}
        <h1 className="h1">{title}</h1>
      </header>
      <div className={`flex w-full flex-col px-4 pb-12 ${fullWidth ? "" : "mx-auto max-w-5xl"} ${className ?? ""}`}>
        {children}
      </div>
    </>
  );
}
