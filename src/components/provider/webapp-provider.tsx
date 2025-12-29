import { memo } from "react";
import type { NextPageWithLayout } from "~/components/common/layout/types";
import { AuthProvider } from "~/components/provider/auth/auth-provider";
import { PlatformProvider } from "~/components/provider/platform/provider";
import { UsersProvider } from "~/components/provider/users-provider";
import { RouterProvider } from "~/components/router/router";

function Provider(page: React.ReactNode) {
  return (
    <RouterProvider>
      <PlatformProvider>
        <AuthProvider>
          <UsersProvider>{page}</UsersProvider>
        </AuthProvider>
      </PlatformProvider>
    </RouterProvider>
  );
}

export const webAppPage = (Page: React.FC<any>) => {
  const p: NextPageWithLayout = memo((props) => <Page {...props} />);
  p.displayName = "Page";
  p.getLayout = Provider;
  return p;
};
