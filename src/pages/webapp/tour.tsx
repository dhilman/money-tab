import {
  TourPage1,
  TourPage2,
  TourPage3,
} from "~/components/pages/tour/tour-pages";
import {
  TourProvider,
  useTourCtx,
} from "~/components/pages/tour/tour-provider";
import { webAppPage } from "~/components/provider/webapp-provider";

const PAGE_CONTENTS = [TourPage1, TourPage2, TourPage3];

export default webAppPage(Page);
function Page() {
  return (
    <TourProvider numPages={PAGE_CONTENTS.length}>
      <Tour />
    </TourProvider>
  );
}

const Tour = () => {
  const { page, onPrev, onNext } = useTourCtx();
  const PageContent = PAGE_CONTENTS[page];

  if (!PageContent) return null;

  return (
    <>
      <PageContent />
      <div className="fixed top-0 left-0 z-10 h-full w-1/3" onClick={onPrev} />
      <div className="fixed top-0 right-0 z-10 h-full w-2/3" onClick={onNext} />
    </>
  );
};
