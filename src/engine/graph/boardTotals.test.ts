import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { getMonthlyFlows, getNodeTotals } from "./boardTotals";

const board: BoardState = {
  nodes: [
    { id: "income", name: "Income", position: { x: 0, y: 0 } },
    { id: "buffer", name: "Buffer", position: { x: 300, y: 0 } },
    { id: "savings", name: "Savings", position: { x: 600, y: 0 } },
  ],
  externalInflows: [
    { id: "paycheck", target: "income", amount: 3000, frequency: "biweekly" },
  ],
  flows: [
    { id: "income-buffer", source: "income", target: "buffer", amount: 250, frequency: "weekly" },
    { id: "buffer-savings", source: "buffer", target: "savings", amount: 500, frequency: "monthly" },
  ],
};

describe("board totals", () => {
  it("normalizes flows into monthly values", () => {
    expect(getMonthlyFlows(board)).toMatchObject([
      { id: "income-buffer", monthlyAmount: 250 * 52 / 12 },
      { id: "buffer-savings", monthlyAmount: 500 },
    ]);
  });

  it("separates external inflow from linked inflow", () => {
    expect(getNodeTotals(board, "income")).toEqual({
      externalInflow: 3000 * 26 / 12,
      inflow: 0,
      outflow: 250 * 52 / 12,
    });
  });

  it("calculates incoming and outgoing linked transfers", () => {
    expect(getNodeTotals(board, "buffer")).toEqual({
      externalInflow: 0,
      inflow: 250 * 52 / 12,
      outflow: 500,
    });
  });
});
