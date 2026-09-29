"use client";

import { useId } from "react";

/**
 * Something loading, for as long as it takes: a small progress bar (.progress-sm) bent into a ring, its track
 * in the slot frame's colours round the sunken fill, with a stretch of its gold running round it, its tail
 * fading out. Its length is --spinner-tail (see .spinner). The gold's lit from outside, as the bar's is from above. `label` says what's loading.
 */
export function Spinner({
  label = "Loading",
  size = "md",
  className,
}: {
  label?: string;
  /** 48px, 64px or 96px across. */
  size?: "md" | "lg" | "xl";
  className?: string;
}) {
  const id = useId();
  return (
    <span role="status" aria-label={label} className={`spinner spinner-${size} ${className ?? ""}`}>
      {/* The still part: the bar is 10 wide, its 2px frame each side round a 6px sunken fill. */}
      <svg viewBox="0 0 48 48" aria-hidden>
        <defs>
          <linearGradient id={`${id}-frame`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2c2924" />
            <stop offset="1" stopColor="#504c47" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="19" fill="none" strokeWidth="10" stroke={`url(#${id}-frame)`} />
        <circle cx="24" cy="24" r="19" fill="none" strokeWidth="6" className="spinner-fill" />
      </svg>
      {/* The gold, 1px inside the fill, in its own drawing, in a box that turns as a whole: the browser can turn
          that off the main thread, so it keeps going while the page is busy, as it is just as the calculator
          shows. */}
      <span className="spinner-turn">
        <svg viewBox="0 0 48 48" aria-hidden>
          <defs>
            {/* Across the gold's width, from r 17 (dark) to 21 (light): the bar's gradient, bent. */}
            <radialGradient id={`${id}-gold`} gradientUnits="userSpaceOnUse" cx="24" cy="24" r="24">
              <stop offset={17 / 24} style={{ stopColor: "var(--color-gold-800)" }} />
              <stop offset={19.4 / 24} style={{ stopColor: "var(--color-gold-500)" }} />
              <stop offset={21 / 24} style={{ stopColor: "var(--color-gold-200)" }} />
            </radialGradient>
          </defs>
          <circle
            cx="24"
            cy="24"
            r="19"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength={100}
            stroke={`url(#${id}-gold)`}
            className="spinner-gold"
          />
        </svg>
      </span>
    </span>
  );
}
