import { env } from "~/env.mjs";

const description = "Manage subscriptions and shared expenses";

export const MetaTags = () => {
  return (
    <>
      <meta name="application-name" content="MoneyTab" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="MoneyTab" />
      <meta name="description" content={description} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/icons/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#2B5797" />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="theme-color" content="#FFFFFF" />

      <link rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />
      <link
        rel="apple-touch-icon"
        sizes="152x152"
        href="/icons/touch-icon-ipad.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/icons/touch-icon-iphone-retina.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="167x167"
        href="/icons/touch-icon-ipad-retina.png"
      />

      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/icons/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/icons/favicon-16x16.png"
      />
      <link rel="manifest" href="/manifest.json" />
      {/* <link
        rel="mask-icon"
        href="/icons/safari-pinned-tab.svg"
        color="#5bbad5"
      /> */}
      <link rel="shortcut icon" href="/favicon.ico" />
      {/* <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"
      /> */}

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:url" content={env.NEXT_PUBLIC_BASE_URL} />
      <meta name="twitter:title" content="MoneyTab" />
      <meta name="twitter:description" content={description} />
      <meta
        name="twitter:image"
        content={`${env.NEXT_PUBLIC_BASE_URL}/bento.png`}
      />
      {/* <meta name="twitter:creator" content="@" /> */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="MoneyTab" />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="MoneyTab" />
      <meta property="og:url" content={env.NEXT_PUBLIC_BASE_URL} />
      <meta
        property="og:image"
        content={`${env.NEXT_PUBLIC_BASE_URL}/bento.png`}
      />
    </>
  );
};
