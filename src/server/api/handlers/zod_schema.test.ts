import { describe, expect, test } from "vitest";
import { DateOrDateTimeStrAsSql } from "~/server/api/handlers/zod_schema";

describe("parse date or date time", () => {
  const testCases: {
    input: string;
    expected: string;
    error?: string;
  }[] = [
    { input: "2021-01-01", expected: "2021-01-01" },
    { input: "2021-01-20", expected: "2021-01-20" },
    { input: "2021-01-20T12:00:00", expected: "2021-01-20 12:00:00" },
    { input: "2021-01-20T12:00:00Z", expected: "2021-01-20 12:00:00" },
    { input: "2021-01-20T12:00:00+03:00", expected: "2021-01-20 09:00:00" },
    { input: "hello", expected: "", error: "Invalid input" },
  ];

  testCases.forEach((tc) => {
    test(tc.input, () => {
      if (tc.error) {
        expect(() => DateOrDateTimeStrAsSql.parse(tc.input)).toThrowError(
          tc.error,
        );
      } else {
        expect(DateOrDateTimeStrAsSql.parse(tc.input)).toBe(tc.expected);
      }
    });
  });
});
