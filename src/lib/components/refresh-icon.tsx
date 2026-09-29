"use client";

import { useEffect, useRef } from "react";

/** One turn while spinning, in milliseconds. */
const TURN = 800;

/**
 * The gold refresh arrow (.icon-refresh), turning while `spinning`. When it stops, it carries on round to
 * where it started, overshooting a little and settling, rather than jumping back.
 */
export function RefreshIcon({ spinning }: { spinning: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !spinning || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spin = el.animate([{ rotate: "0deg" }, { rotate: "360deg" }], { duration: TURN, iterations: Infinity });
    return () => {
      // How far round this turn it got, to finish the turn from there.
      const angle = ((Number(spin.currentTime) % TURN) / TURN) * 360;
      spin.cancel();
      el.animate([{ rotate: `${angle}deg` }, { rotate: "360deg" }], {
        duration: 500,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      });
    };
  }, [spinning]);
  return <span ref={ref} className="icon-refresh" aria-hidden />;
}
