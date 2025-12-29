import { cn } from "~/lib/utils";

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-5 w-5",
  xl: "h-[22px] w-[22px]",
};

const iconContainerSizes = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
  xl: "h-[30px] w-[30px]",
};

type ReactComponentWithClassName = React.ComponentType<{ className?: string }>;

interface IconProps {
  Icon: ReactComponentWithClassName;
  className?: string;
  size?: keyof typeof iconSizes;
}

export const IconV1 = ({
  Icon,
  size = "md" as const,
  className,
}: IconProps) => {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        iconContainerSizes[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
};

interface IconBoxProps {
  className?: string;
  children: React.ReactNode;
}

export const IconBox = ({ className, children }: IconBoxProps) => {
  return (
    <div className={cn("flex shrink-0 items-center justify-center", className)}>
      {children}
    </div>
  );
};
