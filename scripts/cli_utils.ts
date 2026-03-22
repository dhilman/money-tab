import { confirm, select } from "@inquirer/prompts";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { env } from "~/env.mjs";
import { schema } from "~/server/db";

const ENV_FILES = {
  dev: "./.env",
  staging: "./.envs/.env.staging",
  prod: "./.envs/.env.prod",
} as const;

export function createDbClient(_name: "main" | "monitor", vars: typeof env) {
  const client = postgres(vars.DATABASE_URL);
  const db = drizzle(client, { schema: schema });
  return { db, config: { url: vars.DATABASE_URL } };
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
