"use client";

import { useId } from "react";

/**
 * A group of fields, checkboxes or radio buttons under a subheading, with `help` or an `error` about
 * the whole group under it. The group is described by them, and marked invalid while there's an error.
 */
export function Fieldset({
  legend,
  help,
  error,
  className,
  children,
}: {
  legend: React.ReactNode;
  help?: React.ReactNode;
  error?: React.ReactNode;
  /** Lays out the fields, e.g. "flex flex-col gap-3". */
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ");
  return (
    <fieldset aria-describedby={describedBy || undefined} aria-invalid={error ? true : undefined}>
      <legend className="subheading mb-3">{legend}</legend>
      <div className={className}>{children}</div>
      {help && (
        <p id={`${id}-help`} className="body-sm mt-1 text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="body-sm mt-1 text-blood-300">
          {error}
        </p>
      )}
    </fieldset>
  );
}
