import { ThemeProvider } from "next-themes";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { type AppPropsWithLayout } from "~/components/common/layout/types";
import { AnalyticsProvider } from "~/components/provider/analytics/analytics-provider";
import "~/lib/i18n";
import "~/styles/animations.css";
import "~/styles/globals.css";
import { api } from "~/utils/api";

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        {/* <MetaTags /> */}
        <meta
          name="viewport"
          content="width=device-width, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <AnalyticsProvider>
        <ThemeProvider attribute="class" defaultTheme="system">
          {getLayout(<Component {...pageProps} />)}
          <Toaster position="top-center" />
        </ThemeProvider>
      </AnalyticsProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
