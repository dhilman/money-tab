import { cn } from "~/lib/utils";

interface ListProps {
  className?: string;
  children: React.ReactNode;
}

export const List = ({ className, children }: ListProps) => (
  <ul
    className={cn("bg-background flex w-full flex-col rounded-xl", className)}
  >
    {children}
  </ul>
);

export const Separator = ({ className }: { className?: string }) => {
  return <div className={cn("bg-border h-[0.5px] w-full", className)} />;
};
