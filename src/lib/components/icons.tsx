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
