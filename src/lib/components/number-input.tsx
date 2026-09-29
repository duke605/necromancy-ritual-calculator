"use client";

import { useField } from "./field";

/**
 * A number field between − and + buttons, "− 12 +" (leave them off with `steppers={false}`). The
 * buttons step the value the way the arrow keys do, by `step` within `min` and `max`, and fire
 * `onChange` like typing. `shimmer` makes the number shimmer gold, e.g. for a count that's a golden ratio.
 * `end` goes inside the field after the number, e.g. a lock button. `beforeActions` and `afterActions` go
 * inside the field at either end, before the − and after the +, side by side, e.g. buttons that jump the value.
 */
export function NumberInput({
  steppers = true,
  shimmer,
  end,
  beforeActions,
  afterActions,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  steppers?: boolean;
  shimmer?: boolean;
  end?: React.ReactNode;
  beforeActions?: React.ReactNode;
  afterActions?: React.ReactNode;
}) {
  // The field is the button's sibling.
  const step = (button: HTMLButtonElement, by: 1 | -1) => {
    const el = button.parentElement?.querySelector("input");
    if (!el) return;
    if (by > 0) el.stepUp();
    else el.stepDown();
    // stepUp and stepDown change the value without an event; React's onChange listens for this one.
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const { disabled, readOnly } = props;
  const field = useField();
  return (
    <div
      className={`input number-input ${className ?? ""}`}
      data-steppers={steppers || undefined}
      data-shimmer={shimmer || undefined}
      // Its width (see .number-input), kept up while typing in a field that isn't given its value.
      style={{ "--number-digits": String(props.value ?? props.defaultValue ?? "").length || 1 } as React.CSSProperties}
      onInput={(event) =>
        event.currentTarget.style.setProperty(
          "--number-digits",
          String((event.target as HTMLInputElement).value.length || 1),
        )
      }
    >
      {/* The input comes first, so a <label> around this belongs to it, not to a button (a label
          takes the first control inside it). CSS puts − before it on screen. */}
      <input type="number" {...field} {...props} />
      {end && <span className="number-input-end">{end}</span>}
      {/* After the input too, for the label; CSS puts these first on screen. */}
      {beforeActions && (
        <span className="number-input-actions" data-side="before">
          {beforeActions}
        </span>
      )}
      {/* stepUp and stepDown work on a read-only field, so no buttons there. */}
      {steppers &&
        !readOnly &&
        ([-1, 1] as const).map((by) => (
          // For the mouse only, like the browser's own spin buttons: from the keyboard or a screen reader,
          // the arrow keys step the field. Hidden from screen readers (or they'd be read as part of its
          // label), and clicking them leaves the focus in the field.
          <button
            key={by}
            type="button"
            tabIndex={-1}
            aria-hidden
            data-step={by > 0 ? "up" : "down"}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => step(event.currentTarget, by)}
          />
        ))}
      {afterActions && (
        <span className="number-input-actions" data-side="after">
          {afterActions}
        </span>
      )}
    </div>
  );
}
