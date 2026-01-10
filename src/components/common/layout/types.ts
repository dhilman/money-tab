import { type NextPage } from "next";
import { type AppProps } from "next/app";
import { type ReactElement } from "react";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement<any>) => ReactElement<any>;
};

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
