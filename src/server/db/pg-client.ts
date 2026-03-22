import postgres from "postgres";
import { env } from "~/env.mjs";

export const pgClient = postgres(env.DATABASE_URL);
