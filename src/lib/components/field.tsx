"use client";

import { createContext, use, useId } from "react";

type FieldProps = { id: string; "aria-describedby"?: string; "aria-invalid"?: true };
const FieldContext = createContext<FieldProps | null>(null);

/**
 * The id, description and invalid state from the Field around a control, if there is one, for the
 * control to spread onto its element. (Context, not cloning the child: a child passed from a server
 * page reaches a client component as a lazy reference, which can't be cloned.)
 */
export function useField() {
  return use(FieldContext) ?? {};
}

/**
 * A control with its label above it: an optional `hint` beside the label, and under the control `help`
 * and an `error`. The control (Input, NumberInput or Select, which read useField) gets the label's id,
 * is described by the hint, help and error (so screen readers read them after its name), and is marked
 * invalid while there's an error.
 *
 * Clicking the label of a <select> opens its list: a label only focuses a select, though the browser
 * shows it hovered while the label is, so it looks like the click should open it.
 */
export function Field({
  label,
  hint,
  help,
  error,
  children,
}: {
  label: React.ReactNode;
  /** Short, beside the label, e.g. "Golden ratio: 12". */
  hint?: React.ReactNode;
  /** Under the control, e.g. "Per item, in coins". */
  help?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ");
  const field: FieldProps = { id, "aria-describedby": describedBy || undefined, "aria-invalid": error ? true : undefined };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="body-sm flex gap-2">
        <label
          htmlFor={id}
          className="text-muted-foreground"
          onClick={() => {
            const target = document.getElementById(id);
            if (target instanceof HTMLSelectElement && !target.disabled) target.showPicker();
          }}
        >
          {label}
        </label>
        {hint && (
          <span id={`${id}-hint`} className="text-ash-400">
            {hint}
          </span>
        )}
      </div>
      {/* Help and error sit close under the control: they're about it, not the next field. */}
      <div className="flex flex-col gap-0.5">
        <FieldContext value={field}>{children}</FieldContext>
        {help && (
          <p id={`${id}-help`} className="body-sm text-muted-foreground">
            {help}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="body-sm text-blood-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
