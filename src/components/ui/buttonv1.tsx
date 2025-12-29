import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  cn(
    "group flex items-center justify-center gap-2.5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
    "select-none disabled:pointer-events-none disabled:opacity-50",
    "transition-colors duration-200"
  ),
  {
    variants: {
      variant: {
        default: "bg-background text-primary",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-primary/10 text-primary",
        tertiary:
          "bg-[#747480]/[0.12] dark:bg-[#767680]/[0.24] text-foreground",
        danger: "text-red-500 bg-red-50 hover:bg-red-100",
      },
      size: {
        stack:
          "px-6 pt-[7px] pb-[8px] flex-col gap-0.5 text-xs font-medium rounded-xl",
        badge:
          "px-3 py-[5px] text-[15px] font-semibold uppercase leading-[20px] rounded-full",
        picker: "px-3 py-[5px] rounded-[8.91px] text-base",
        md: "h-[42px] font-semibold text-[15px] leading-[22px] px-[14px] py-2 rounded-[8px]",
        lg: "h-[50px] font-semibold text-base gap-1.5 rounded-[12px]",
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

export const ButtonV1 = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
ButtonV1.displayName = "ButtonV1";
