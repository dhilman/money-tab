import { Bento, BentoContent } from "~/components/bento-box";
import { useUserCtx } from "~/components/pages/user/get/user-provider";
import { UserAvatar } from "~/components/pages/user/user-avatar";
import { usePlatform } from "~/components/provider/platform/context";
import {
  LoadingProvider,
  LoadingText,
} from "~/components/provider/states-provider";

export function UserHeader() {
  const { user, isLoading } = useUserCtx();
  const platform = usePlatform();

  return (
    <Bento>
      <BentoContent className="flex w-full flex-col items-center px-2.5 py-6">
        <UserAvatar user={user} size="6xl" />
        <div className="mt-2.5 text-2xl font-semibold">
          <LoadingProvider
            isLoading={isLoading && !user.name}
            loading={<LoadingText text="user name" />}
          >
            {user.name}
          </LoadingProvider>
        </div>
        {user.username && (
          <button
            className="text-link mt-0.5 text-base font-bold"
            onClick={() => {
              platform.openTgLink(`https://t.me/${user.username as string}`);
            }}
          >
            @{user.username}
          </button>
        )}
      </BentoContent>
    </Bento>
  );
}
