import { confirm, select } from "@inquirer/prompts";
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import type { env } from "~/env.mjs";
import { schema } from "~/server/db";

const ENV_FILES = {
  dev: "./.env",
  staging: "./.envs/.env.staging",
  prod: "./.envs/.env.prod",
} as const;

export function createDbClient(name: "main" | "monitor", vars: typeof env) {
  function getConfig() {
    switch (name) {
      case "main":
        return { url: vars.DATABASE_URL, authToken: vars.DATABASE_TOKEN };
      case "monitor":
        return {
          url: vars.MONITOR_DATABASE_URL,
          authToken: vars.MONITOR_DATABASE_TOKEN,
        };
    }
  }

  const config = getConfig();
  const db = drizzle(createClient(config), { schema: schema });
  return { db, config };
}

export async function selectEnv() {
  const name = await select({
    message: "Select environment",
    choices: [
      { name: "Development", value: "dev" as const },
      { name: "Staging", value: "staging" as const },
      { name: "Production", value: "prod" as const },
    ],
  });
  const path = ENV_FILES[name];
  const vars = config({ path }).parsed as unknown as typeof env;
  return { envName: name, env: vars };
}

export async function confirmOrExit(message: string) {
  const confirmed = await confirm({
    message,
    default: false,
  });
  if (!confirmed) {
    console.log("Cancelled");
    process.exit(0);
  }
}
