import { type RefObject, useEffect, useEffectEvent } from "react";
import { FRAME_MS, springPath } from "@/lib/spring";

/** Swipes starting this close to the left edge are the browser's (back, on iOS and Android). */
const EDGE = 20;
/**
 * How far a touch moves before it counts as a sideways drag or an up-and-down scroll. A sideways drag
 * moves the page from there on, so this much of a pull does nothing: a little resistance.
 */
const LOCK = 35;
/** A flick faster than this (px/ms) opens or closes it however far it went. */
const FLICK = 0.5;

/** Whether the touch started in something that scrolls or drags sideways itself. */
function ownsSidewaysTouch(target: Element) {
  if (target.closest("input, textarea, select")) return true;
  for (let el: Element | null = target; el; el = el.parentElement) {
    const { overflowX } = getComputedStyle(el);
    if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth) return true;
  }
  return false;
}

/**
 * Drags `page` sideways to open or close the phone drawer under it (#mobile-sidebar). The page follows
 * the finger, and on letting go springs open or shut, bouncing by as much as the distance it had to go.
 * Opening from closed counts as open from the moment the drag goes sideways, so the drawer's entry
 * plays as it's revealed; letting go short of halfway shuts it again.
 *
 * The finger moves the page directly (inline `translate`), not through React state, so dragging renders
 * nothing. The spring is a precomputed animation of `translate`, which runs off the main thread.
 */
export function useDrawerSwipe(
  page: RefObject<HTMLElement | null>,
  { enabled, open, setOpen }: { enabled: boolean; open: boolean; setOpen: (open: boolean) => void },
) {
  // Read fresh on each touch, without re-subscribing: opening mid-drag mustn't drop the drag.
  const isOpen = useEffectEvent(() => open);
  const changeOpen = useEffectEvent((next: boolean) => setOpen(next));
  useEffect(() => {
    const el = page.current;
    if (!enabled || !el) return;

    let drag: { x: number; y: number; from: number; width: number; sideways: boolean } | null = null;
    let position = 0;
    let velocity = 0;
    let last = { x: 0, time: 0 };
    let springing = false;

    const moveTo = (x: number, width: number) => {
      position = Math.min(Math.max(x, 0), width);
      el.style.translate = `${position}px 0`;
      el.style.setProperty("--drawer-progress", String(position / width));
    };

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const drawer = document.getElementById("mobile-sidebar");
      if (springing || event.touches.length !== 1 || !drawer || touch.clientX < EDGE) return;
      if (ownsSidewaysTouch(event.target as Element)) return;
      // The drawer's open width: it's screen-wide, padded on the right (see .mobile-sidebar).
      const width = drawer.offsetWidth - parseFloat(getComputedStyle(drawer).paddingRight);
      drag = { x: touch.clientX, y: touch.clientY, from: isOpen() ? width : 0, width, sideways: false };
      last = { x: touch.clientX, time: event.timeStamp };
      velocity = 0;
    };

    const onMove = (event: TouchEvent) => {
      if (!drag) return;
      const touch = event.touches[0];
      const dx = touch.clientX - drag.x;
      const dy = touch.clientY - drag.y;
      if (!drag.sideways) {
        if (Math.abs(dx) < LOCK && Math.abs(dy) < LOCK) return;
        // Up and down is a scroll, and a closed drawer can't open leftwards: not ours.
        if (Math.abs(dy) >= Math.abs(dx) || (!isOpen() && dx < 0)) {
          drag = null;
          return;
        }
        drag.sideways = true;
        // The page moves from here, not from where the touch began.
        drag.x = touch.clientX;
        // Held where the finger has it: no CSS transition, and the dim follows the drag.
        el.style.transition = "none";
        el.dataset.dragging = "";
        if (!isOpen()) changeOpen(true);
      }
      event.preventDefault();
      if (event.timeStamp > last.time) velocity = (touch.clientX - last.x) / (event.timeStamp - last.time);
      last = { x: touch.clientX, time: event.timeStamp };
      moveTo(drag.from + touch.clientX - drag.x, drag.width);
    };

    const onEnd = () => {
      if (!drag?.sideways) {
        drag = null;
        return;
      }
      const { width } = drag;
      drag = null;
      const opening = velocity > FLICK || (velocity > -FLICK && position > width / 2);
      const to = opening ? width : 0;
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Shutting, it bounces off closed instead of passing it.
      // The finger's speed carries into the spring.
      const path = still ? [position, to] : springPath(position, to, { velocity, floor: opening ? undefined : 0 });
      // Under the spring, the page is already where it ends: Safari shows what's under it for a frame when
      // the drawer opens or shuts mid-spring (as the menu button shows or hides), so it snapped back to
      // where the finger let go.
      moveTo(to, width);
      springing = true;
      const spring = el.animate(
        path.map((x) => ({ translate: `${x}px 0`, "--drawer-progress": String(Math.min(x / width, 1)) })),
        { duration: still ? 0 : path.length * FRAME_MS, easing: "linear", fill: "forwards" },
      );
      spring.finished.then(() => {
        if (!opening) changeOpen(false);
        // Once React has the drawer's state on the page, its CSS takes over from exactly here.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            spring.cancel();
            el.style.removeProperty("translate");
            el.style.removeProperty("transition");
            el.style.removeProperty("--drawer-progress");
            delete el.dataset.dragging;
            springing = false;
          }),
        );
      });
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    // Not passive: a sideways drag stops the page scrolling under it.
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [page, enabled]);
}
