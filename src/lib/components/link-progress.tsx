"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useRef } from "react";

/**
 * A thin gold bar along the bottom of a link while its page loads. Put it inside a next/link (whose
 * status it reads) that's `relative`. It creeps most of the way over 5 s, slowing as it goes, then
 * shoots to the end and fades once the page is there. It's seen only while it runs, so it leaves no
 * trace. With reduced motion it's simply full while loading and gone after. `current`: the link is to
 * the page that's showing, so clicking it goes nowhere and shows nothing.
 */
export function LinkProgress({ current }: { current?: boolean }) {
  const { pending } = useLinkStatus();
  const bar = useRef<HTMLSpanElement>(null);
  const creeping = useRef<Animation | null>(null);
  useEffect(() => {
    const el = bar.current;
    // A finish still plays: the page it was loading becomes current as it arrives.
    if (!el || (pending && current)) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.width = pending ? "100%" : "0%";
      el.style.opacity = pending ? "1" : "0";
      return;
    }
    if (pending) {
      creeping.current = el.animate([{ width: "0%", opacity: 1 }, { width: "90%", opacity: 1 }], {
        duration: 5000,
        easing: "cubic-bezier(0.1, 0.7, 0.3, 1)",
        fill: "forwards",
      });
    } else if (creeping.current) {
      // From wherever it got to, not where the creep would have ended.
      const from = getComputedStyle(el).width;
      creeping.current.cancel();
      creeping.current = null;
      el.animate(
        [
          { width: from, opacity: 1 },
          { width: "100%", opacity: 1, offset: 0.5 },
          { width: "100%", opacity: 0 },
        ],
        { duration: 400, easing: "ease-out" },
      );
    }
  }, [pending, current]);
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-1 bottom-0 h-0.5 overflow-hidden rounded-full">
      <span ref={bar} className="block h-full w-0 bg-gold-400" />
    </span>
  );
}
