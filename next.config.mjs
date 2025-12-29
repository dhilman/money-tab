/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /**
   * If you have the "experimental: { appDir: true }" setting enabled, then you
   * must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  experimental: {
    scrollRestoration: true,
  },

  async redirects() {
    return [
      {
        source: "/webapp/tx/apps_empty",
        destination: "/webapp",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/tonconnect-manifest.json",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "*",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      // Telegram Web App Script
      {
        source: "/api/telegram-web-app.js",
        destination: "https://telegram.org/js/telegram-web-app.js",
      },
    ];
  },
};
export default config;
