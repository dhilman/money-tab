import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

const iconContainerVariants = cva("shrink-0 flex items-center justify-center", {
  variants: {
    size: {
      xs: "h-5 w-5",
      sm: "h-6 w-6",
      md: "h-8 w-8",
      lg: "h-9 w-9",
      xl: "h-10 w-10",
      "2xl": "h-12 w-12",
      "3xl": "h-16 w-16",
      "4xl": "h-20 w-20",
    },
    variant: {
      accent: "bg-primary text-primary-foreground",
      hint: "bg-hint/10 text-hint",
      "primary-gradient":
        "bg-gradient-to-br from-primary/90 to-primary/60 text-primary-foreground",
    },
    round: {
      true: "rounded-full",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface IconContainerProps
  extends VariantProps<typeof iconContainerVariants> {
  className?: string;
  children: React.ReactNode;
}

export const IconContainer = ({
  className,
  size,
  variant,
  round,
  children,
}: IconContainerProps) => {
  return (
    <div
      className={cn(iconContainerVariants({ size, variant, round }), className)}
    >
      {children}
    </div>
  );
};

const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "h-3 w-3",
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
      xl: "h-5 w-5",
      "2xl": "h-6 w-6",
      "3xl": "h-8 w-8",
      "4xl": "h-10 w-10",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface IconProps extends VariantProps<typeof iconContainerVariants> {
  className?: string;
  Icon: LucideIcon;
}

export const Icon = ({ Icon, ...props }: IconProps) => {
  return (
    <IconContainer {...props}>
      <Icon className={iconVariants({ size: props.size })} />
    </IconContainer>
  );
};
