import pino from "pino";
import { env } from "~/env.mjs";

const isDev = env.NODE_ENV === "development";

const logger = pino({
  browser: {
    // Needed because of edge runtime
    write: (o) => console.log(JSON.stringify(o)),
  },
  level: isDev ? "debug" : "info",
});

export default logger;
