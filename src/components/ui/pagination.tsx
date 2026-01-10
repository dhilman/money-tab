import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

interface PaginationProps {
  total: number;
  current: number;
}

export const Pagination = ({ total, current }: PaginationProps) => {
  if (total <= 1) return null;
  return (
    <div className="flex w-fit items-center gap-2 rounded-full bg-hint/10 px-2.5 py-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-full",
            i === current ? "bg-foreground" : "bg-hint/30",
          )}
        />
      ))}
    </div>
  );
};

export function useInView(onInView: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onInView();
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [onInView]);

  return ref;
}
