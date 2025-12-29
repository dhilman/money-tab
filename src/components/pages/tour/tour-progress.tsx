import { Bento } from "~/components/bento-box";
import { useTourCtx } from "~/components/pages/tour/tour-provider";
import { Pagination } from "~/components/ui/pagination";

export const TourProgress = () => {
  const { page } = useTourCtx();

  return (
    <Bento className="flex w-full items-center justify-center py-2.5">
      <Pagination total={3} current={page} />
    </Bento>
  );
};
