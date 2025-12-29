import { cn } from "~/lib/utils";

export const WebAppWrap = ({ children }: { children: React.ReactNode }) => {
  return <div className="h-full w-full flex-1 overflow-hidden">{children}</div>;
};

interface WebAppMainProps {
  className?: string;
  children: React.ReactNode;
}

export const WebAppMainNoScroll = ({
  children,
  className,
}: WebAppMainProps) => {
  return <div className={cn("h-full w-full py-6", className)}>{children}</div>;
};

export const WebAppMainScroll = ({ children, className }: WebAppMainProps) => {
  return (
    <div
      className={cn("h-full min-h-full w-full overflow-y-auto py-6", className)}
    >
      {children}
    </div>
  );
};
