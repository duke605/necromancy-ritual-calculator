"use client";

import { useId, useRef } from "react";

/** Gap between the pointer and the tooltip. */
const OFFSET = 16;

/**
 * Shows `children` while `trigger` is hovered, following the pointer, or while it's focused, under it.
 * A manual popover, so it's in the top layer over everything; pointer events pass through it, so it
 * never covers what it describes. It moves by direct style updates, not React state: following the
 * pointer renders nothing. Escape hides it, and screen readers read it as the trigger's description.
 *
 * A touch has no hover, so a tap shows it where tapped, and the next tap hides it and does what a click
 * does (`triggerProps.onClick`, e.g. opening a dialog). Tapping elsewhere hides it too.
 */
export function FollowTooltip({
  trigger,
  triggerProps,
  children,
}: {
  trigger: React.ReactNode;
  /** More attributes for the element around the trigger, e.g. a role and click handler to make it a button. */
  triggerProps?: React.HTMLAttributes<HTMLSpanElement>;
  children: React.ReactNode;
}) {
  const id = useId();
  const tip = useRef<HTMLDivElement>(null);
  // Set by a touch's press, for its click: where it was, and whether the tooltip was already showing
  // (the press focuses the trigger, which would otherwise show it first).
  const tap = useRef<{ x: number; y: number; showing: boolean }>(null);

  // Beside the point, flipped to its other side where it would run off the screen.
  const place = (x: number, y: number) => {
    const el = tip.current;
    if (!el) return;
    const { offsetWidth: width, offsetHeight: height } = el;
    const left = x + OFFSET + width > innerWidth ? x - OFFSET - width : x + OFFSET;
    const top = y + OFFSET + height > innerHeight ? y - OFFSET - height : y + OFFSET;
    el.style.translate = `${Math.max(left, 0)}px ${Math.max(top, 0)}px`;
  };
  const show = () => {
    if (!tip.current?.matches(":popover-open")) tip.current?.showPopover();
  };
  const hide = () => {
    if (tip.current?.matches(":popover-open")) tip.current.hidePopover();
  };

  return (
    <>
      <span
        {...triggerProps}
        className={`inline-block ${triggerProps?.className ?? ""}`}
        tabIndex={0}
        aria-describedby={id}
        // Touches are left to the click: a touch "enters" when pressed and "leaves" when lifted.
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          show();
          place(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => event.pointerType !== "touch" && place(event.clientX, event.clientY)}
        onPointerLeave={(event) => event.pointerType !== "touch" && hide()}
        onPointerDown={(event) => {
          const showing = !!tip.current?.matches(":popover-open");
          tap.current = event.pointerType === "touch" ? { x: event.clientX, y: event.clientY, showing } : null;
        }}
        onClick={(event) => {
          const touch = tap.current;
          tap.current = null;
          if (touch && !touch.showing) {
            show();
            place(touch.x, touch.y);
            return;
          }
          hide();
          triggerProps?.onClick?.(event);
        }}
        // Only focus from the keyboard: a press focuses it too (a tap's handled by the click), and so does a
        // dialog it opened handing focus back as it closes, which would bring the tooltip back.
        onFocus={(event) => {
          if (!event.currentTarget.matches(":focus-visible")) return;
          show();
          const { left, bottom } = event.currentTarget.getBoundingClientRect();
          place(left, bottom - OFFSET / 2);
        }}
        onBlur={hide}
        onKeyDown={(event) => {
          if (event.key === "Escape") hide();
          triggerProps?.onKeyDown?.(event);
        }}
      >
        {trigger}
      </span>
      <div ref={tip} id={id} popover="manual" className="follow-tooltip">
        {children}
      </div>
    </>
  );
}
