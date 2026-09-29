"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"
import { useField } from "@/lib/components/field"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      {...useField()}
      className={cn("input", className)}
      {...props}
    />
  )
}

export { Input }
