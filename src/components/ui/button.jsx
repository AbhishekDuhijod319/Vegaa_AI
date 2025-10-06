import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/85",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80",
        outline:
          "border bg-background text-foreground hover:bg-muted active:bg-muted/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost:
          "bg-transparent text-foreground hover:bg-muted active:bg-muted/80",
        link: "text-primary underline underline-offset-4",
      },
      size: {
        default: "h-12 md:h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-11 md:h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 md:h-11 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-12 md:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
const Button = React.forwardRef(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
