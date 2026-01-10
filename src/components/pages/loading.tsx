import { BackButton } from "~/components/provider/platform/context";

export const Loading = () => {
  return (
    <>
      <BackButton />
      <div className="my-32 flex w-full flex-col items-center justify-center gap-2">
        <div className="text-hint animate-pulse text-xl leading-tight font-medium tracking-wide duration-1000">
          Loading...
        </div>
      </div>
    </>
  );
};
