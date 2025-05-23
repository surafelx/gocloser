import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-bounce",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-md hover:shadow-lg hover:shadow-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:scale-105 active:scale-95 shadow-md hover:shadow-lg hover:shadow-destructive/20",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:scale-105 active:scale-95 shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "gradient-blue text-white hover:scale-105 active:scale-95 shadow-md hover:shadow-lg hover:shadow-primary/30",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-full px-4",
        lg: "h-11 rounded-full px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

