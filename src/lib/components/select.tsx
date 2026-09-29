"use client";

import { useField } from "./field";

/** A dropdown (.select in globals.css), labelled and described by the Field around it. */
export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={`select ${className ?? ""}`} {...useField()} {...props} />;
}
