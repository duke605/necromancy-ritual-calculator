/**
 * A toggle switch (.switch in globals.css): a checkbox, read out as a switch. `select` is for choosing
 * between two options, e.g. "Sync [switch] Add", rather than turning one on and off: the knob stays gold
 * either way, so neither side looks off.
 */
export function Switch({ select, className, ...props }: Omit<React.ComponentProps<"input">, "type"> & { select?: boolean }) {
  return (
    <input
      type="checkbox"
      role="switch"
      className={`switch ${className ?? ""}`}
      data-select={select || undefined}
      {...props}
    />
  );
}
