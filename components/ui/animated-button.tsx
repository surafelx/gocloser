"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/20 transition-all duration-300",
        glow: "bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.5)] hover:shadow-[0_0_25px_rgba(var(--primary),0.7)] transition-all duration-300",
        "3d": "bg-primary text-white transform-gpu hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all duration-200",
        outline3d: "border-2 border-primary bg-transparent text-primary hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all duration-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        spin: "animate-spin",
        ping: "animate-ping",
        pop: "hover:animate-button-pop",
        shake: "hover:animate-shake",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
      responsive: {
        true: "w-full sm:w-auto",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
      fullWidth: false,
      responsive: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  ripple?: boolean;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    animation,
    fullWidth,
    responsive,
    asChild = false,
    loading = false,
    loadingText,
    icon,
    iconPosition = "left",
    ripple = true,
    children,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const [rippleStyle, setRippleStyle] = useState<React.CSSProperties>({});
    const [showRipple, setShowRipple] = useState(false);

    // Handle ripple effect
    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple) return;

      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      setRippleStyle({
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}px`,
        top: `${y}px`,
      });

      setShowRipple(true);
    };

    // Reset ripple after animation completes
    useEffect(() => {
      if (showRipple) {
        const timer = setTimeout(() => {
          setShowRipple(false);
        }, 600);

        return () => clearTimeout(timer);
      }
    }, [showRipple]);

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant,
            size,
            animation,
            fullWidth,
            responsive,
            className
          }),
          loading && "opacity-80 pointer-events-none",
          "relative overflow-hidden"
        )}
        ref={ref}
        onClick={handleRipple}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {loadingText || children}
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="mr-2">{icon}</span>
            )}
            {children}
            {icon && iconPosition === "right" && (
              <span className="ml-2">{icon}</span>
            )}
          </>
        )}

        {/* Ripple effect */}
        {showRipple && ripple && (
          <span
            className="absolute rounded-full bg-white/30 animate-ripple"
            style={rippleStyle}
          />
        )}
      </Comp>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton, buttonVariants };
