import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  cn(
    "group w-full flex items-center justify-center gap-2 text-sm font-medium rounded-lg",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "select-none disabled:pointer-events-none disabled:opacity-50",
    "transition-colors duration-200"
  ),
  {
    variants: {
      variant: {
        accent: "bg-primary text-primary-foreground",
        default: "bg-background text-primary",
        inverted: "bg-foreground text-background",
        secondary: "text-primary bg-primary/10 active:bg-primary/20",
        hint: "bg-hint/10 text-foreground active:bg-hint/20",
        ghost: "text-primary disabled:text-hint active:bg-primary/10",
        danger: "text-red-500 bg-red-50 hover:bg-red-100",
      },
      size: {
        xs: "h-6 px-3 gap-1.5 text-xs w-fit rounded-md",
        sm: "h-8 rounded-md px-3 text-xs gap-1.5",
        md: "h-10 rounded-md px-4",
        lg: "h-12 rounded-xl px-2 text-base",
        icon: "h-9 w-9 border border-hint/10 bg-background text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const buttonIconVariants = cva(
  "shrink-0 flex items-center justify-center rounded-full",
  {
    variants: {
      size: {
        default: "h-8 w-8",
        lg: "h-10 w-10",
      },
      variant: {
        primary: "bg-primary text-primary-foreground",
        none: "",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "none",
    },
  }
);

interface ButtonIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonIconVariants> {}

const ButtonIcon = React.forwardRef<HTMLDivElement, ButtonIconProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(buttonIconVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

ButtonIcon.displayName = "ButtonIcon";

export { Button, ButtonIcon, buttonVariants };
