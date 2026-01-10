import { cn } from "~/lib/utils";

interface ListProps {
  className?: string;
  children: React.ReactNode;
}

export const List = ({ className, children }: ListProps) => (
  <ul
    className={cn("flex w-full flex-col rounded-xl bg-background", className)}
  >
    {children}
  </ul>
);

export const Separator = ({ className }: { className?: string }) => {
  return <div className={cn("h-[0.5px] w-full bg-border", className)} />;
};
