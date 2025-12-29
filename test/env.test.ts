import { describe, expect, test } from "vitest";
import { env } from "~/env.mjs";

describe("env variable", () => {
  test("NODE_ENV", () => {
    const v = env.NEXT_PUBLIC_BASE_URL;
    console.log("public base url", v);
    console.log("NODE_ENV", env.NODE_ENV);
    expect(v).toBeDefined();
  });
});
