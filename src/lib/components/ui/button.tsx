import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Styles live in src/app/globals.css (.btn-*) so they share the design tokens.
const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      danger: "btn-danger",
    },
    size: {
      default: "btn-md",
      xs: "btn-xs",
      sm: "btn-sm",
      fill: "btn-fill",
      lg: "btn-lg",
      icon: "btn-icon",
      "icon-sm": "btn-icon-sm",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
})

function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
