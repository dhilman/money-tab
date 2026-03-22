import { describe, expect, test } from "vitest";
import { DateOrDateTimeStr } from "~/server/api/handlers/zod_schema";

describe("parse date or date time", () => {
  test("date-only string returns date with null time", () => {
    const result = DateOrDateTimeStr.parse("2021-01-01");
    expect(result.date).toEqual(new Date("2021-01-01"));
    expect(result.time).toBeNull();
  });

  test("date-only string (20th)", () => {
    const result = DateOrDateTimeStr.parse("2021-01-20");
    expect(result.date).toEqual(new Date("2021-01-20"));
    expect(result.time).toBeNull();
  });

  test("datetime string returns date with time", () => {
    const result = DateOrDateTimeStr.parse("2021-01-20T12:00:00");
    expect(result.date).toBeInstanceOf(Date);
    expect(result.time).toBe("12:00:00");
  });

  test("datetime string with Z", () => {
    const result = DateOrDateTimeStr.parse("2021-01-20T12:00:00Z");
    expect(result.date).toBeInstanceOf(Date);
    expect(result.time).toBe("12:00:00");
  });

  test("datetime string with timezone offset", () => {
    const result = DateOrDateTimeStr.parse("2021-01-20T12:00:00+03:00");
    expect(result.date).toBeInstanceOf(Date);
    expect(result.time).toBe("09:00:00");
  });

  test("invalid string throws", () => {
    expect(() => DateOrDateTimeStr.parse("hello")).toThrowError();
  });
});
