"use client";

import { useId } from "react";

/** A line icon, `children` drawn in the gold gradient (as on switches and progress bars), on a 24 by 24 grid. */
function GoldIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="3" x2="0" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--color-gold-200)" />
          <stop offset="0.4" stopColor="var(--color-gold-500)" />
          <stop offset="1" stopColor="var(--color-gold-800)" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke={`url(#${id}-gold)`}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ "--gold": `url(#${id}-gold)` } as React.CSSProperties}
      >
        {children}
      </g>
    </svg>
  );
}

/** GitHub's mark. */
export function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

/** A link that leaves the site: an arrow out of a box. */
export function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <GoldIcon className={className}>
      <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </GoldIcon>
  );
}

/** No waste: someone dropping paper in a bin. */
export function NoWasteIcon({ className }: { className?: string }) {
  return (
    <GoldIcon className={className}>
      {/* The person: head, body, legs, and an arm out over the bin. */}
      <circle cx="7.5" cy="6" r="1.6" stroke="none" style={{ fill: "var(--gold)" }} />
      <path d="M7.5 9v5.5M7.5 14.5l-2 4.5M7.5 14.5l2 4.5M7.5 10.5l4.5-1.5" />
      {/* The paper, falling. */}
      <path d="M13.5 10.5l1.5 1" />
      {/* The bin: lid and body. */}
      <path d="M13 13h6M13.75 13l.75 6h3l.75-6" />
    </GoldIcon>
  );
}
