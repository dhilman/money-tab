import Link from "next/link";
import { useRouter } from "next/router";
import { BentoContent } from "~/components/bento-box";
import type { NewRoute } from "~/components/router/route";
import { Button } from "~/components/ui/button";

interface StatCardProps {
  title: string;
  route?: NewRoute;
  value: number | undefined | React.ReactNode;
}

export const StatCard = ({ title, route, value }: StatCardProps) => {
  const router = useRouter();
  return (
    <BentoContent className="flex flex-col gap-2 p-4">
      <div className="flex w-full items-center gap-2">
        <div className="text-hint text-sm font-medium">{title}</div>
        {route && (
          <Button size="xs" variant="secondary" className="ml-auto" asChild>
            <Link
              href={{
                ...route,
                query: {
                  ...router.query,
                  ...(route as { query: Record<string, string> })?.query,
                },
              }}
            >
              View
            </Link>
          </Button>
        )}
      </div>
      <div className="text-xl font-semibold">{value ?? 0}</div>
    </BentoContent>
  );
};
