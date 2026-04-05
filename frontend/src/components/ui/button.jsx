import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        outline:
          "border bg-background text-foreground shadow-sm hover:bg-muted hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-accent-foreground",
        link: "text-primary underline underline-offset-4",
      },
      size: {
        default: "h-12 md:h-11 px-6 py-2 has-[>svg]:px-4",
        sm: "h-10 md:h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-2.5",
        lg: "h-14 md:h-12 rounded-2xl px-8 text-base has-[>svg]:px-5",
        icon: "size-12 md:size-11",
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
    loading,
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
