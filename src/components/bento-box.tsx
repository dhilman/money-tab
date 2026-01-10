import React from "react";
import { cn } from "~/lib/utils";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const Bento = ({ className, children, ...props }: Props) => {
  return (
    <div
      className={cn("flex w-full flex-col items-center gap-1 px-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface BentoContentProps<T extends React.ElementType> {
  as?: T;
  className?: string;
  children: React.ReactNode;
}

export const BentoContent = <T extends React.ElementType>({
  as,
  className,
  ...props
}: BentoContentProps<T> &
  Omit<React.ComponentPropsWithRef<T>, keyof BentoContentProps<T>>) => {
  const Component = as || "div";
  return (
    <Component
      className={cn("bg-background flex w-full flex-col rounded-xl", className)}
      {...props}
    />
  );
};

interface BentoHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const BentoHeader = ({ className, children }: BentoHeaderProps) => {
  return (
    <div
      className={cn(
        "flex h-8 w-full items-center rounded-t-xl pl-2",
        "text-hint text-sm font-medium uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
};

interface BentoFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const BentoFooter = ({ className, children }: BentoFooterProps) => {
  return (
    <div className={cn("flex w-full items-center justify-center", className)}>
      {children}
    </div>
  );
};

export const EmptyBox = ({ className, children, ...props }: Props) => {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-xl select-none",
        "text-hint px-3 py-5 text-center text-sm",
        "bg-background",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
