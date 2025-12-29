import { BackButton } from "~/components/provider/platform/context";

export const Loading = () => {
  return (
    <>
      <BackButton />
      <div className="my-32 flex w-full flex-col items-center justify-center gap-2">
        <div className="animate-pulse text-xl font-medium leading-tight tracking-wide text-hint duration-1000">
          Loading...
        </div>
      </div>
    </>
  );
};
