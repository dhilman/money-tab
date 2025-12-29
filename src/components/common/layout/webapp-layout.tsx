import { cn } from "~/lib/utils";

interface WebAppMainProps {
  className?: string;
  children: React.ReactNode;
}

export const WebAppMain = ({ className, children }: WebAppMainProps) => {
  return (
    <div
      className={cn("relative mx-auto h-fit w-full max-w-xl py-10", className)}
    >
      {children}
    </div>
  );
};
