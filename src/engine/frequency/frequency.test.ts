import { describe, expect, it } from "vitest";
import { toMonthlyAmount } from "./frequency";

describe("toMonthlyAmount", () => {
  it.each([
    [120, "daily", 3650],
    [120, "weekly", 520],
    [120, "biweekly", 260],
    [120, "semimonthly", 240],
    [120, "monthly", 120],
    [120, "quarterly", 40],
    [120, "yearly", 10],
  ] as const)("converts %s %s to monthly", (amount, frequency, expected) => {
    expect(toMonthlyAmount(amount, frequency)).toBeCloseTo(expected, 5);
  });
});
