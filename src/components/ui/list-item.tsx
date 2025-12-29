import { LoadingText } from "~/components/provider/states-provider";
import { cn } from "~/lib/utils";

interface ListItemProps<T extends React.ElementType> {
  as?: T;
  className?: string;
  children: React.ReactNode;
}

export const ListItem = <T extends React.ElementType = "div">({
  as,
  className,
  children,
  ...props
}: ListItemProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof ListItemProps<T>>) => {
  const Component = as || "div";
  return (
    <Component
      className={cn(
        "group flex w-full items-center rounded-xl pl-4 text-left focus-visible:z-10",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

interface ListItemLeftProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export const ListItemLeft = ({
  children,
  className,
  size = "md",
}: ListItemLeftProps) => {
  return (
    <div
      className={cn(
        "shrink-0",
        size === "sm" && "w-[40px]",
        size === "md" && "w-[50px]",
        className
      )}
    >
      {children}
    </div>
  );
};

interface ListItemIconContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}

export const ListItemIconContainer = ({
  children,
  className,
  size = "md",
}: ListItemIconContainerProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full",
        size === "md" && "h-7 w-7 p-1",
        size === "lg" && "h-[30px] w-[30px] p-1",
        size === "xl" && "h-10 w-10 p-2",
        className
      )}
    >
      {children}
    </div>
  );
};

interface ListItemBodyProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const ListItemBody = ({
  children,
  className,
  size = "lg",
}: ListItemBodyProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-1 items-center truncate border-b-[0.5px] py-2.5 pr-4 group-last:border-0",
        size === "sm" && "h-[44px]",
        size === "md" && "h-[48px]",
        size === "lg" && "h-[60px]",
        className
      )}
    >
      {children}
    </div>
  );
};

interface ListItemIconProps {
  icon: React.ComponentType<{ className?: string }>;
  size?: "md" | "lg" | "xl";
  className?: string;
  iconClassName?: string;
}

export const ListItemIcon = ({
  icon: Icon,
  size = "md",
  className,
  iconClassName,
}: ListItemIconProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        size === "md" && "h-7 w-7 p-1",
        size === "lg" && "h-[30px] w-[30px] p-1",
        size === "xl" && "h-10 w-10 p-2",
        className
      )}
    >
      <Icon className={cn("h-full w-full", iconClassName)} />
    </div>
  );
};

export const ListItemLoading = () => {
  return (
    <ListItem>
      <ListItemBody className="justify-between" size="sm">
        <LoadingText text="Loading loading..." />
        <LoadingText text="Loading..." />
      </ListItemBody>
    </ListItem>
  );
};
