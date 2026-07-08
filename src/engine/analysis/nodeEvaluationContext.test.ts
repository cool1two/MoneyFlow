import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { deriveBoardState } from "./derivedBoardState";
import {
  getNodeEvaluationContext,
  getNodeEvaluationContexts,
} from "./nodeEvaluationContext";

const board: BoardState = {
  nodes: [
    { id: "income", name: "Income", position: { x: 0, y: 0 } },
    { id: "checking", name: "Checking", position: { x: 300, y: 0 } },
    { id: "savings", name: "Savings", position: { x: 600, y: 0 } },
  ],
  externalInflows: [
    { id: "paycheck", target: "income", amount: 3000, frequency: "monthly" },
    { id: "side-work", target: "income", amount: 250, frequency: "weekly" },
  ],
  flows: [
    { id: "income-checking", source: "income", target: "checking", amount: 3000, frequency: "monthly" },
    { id: "checking-savings", source: "checking", target: "savings", amount: 500, frequency: "monthly" },
  ],
};

describe("node evaluation context", () => {
  it("returns normalized inputs and outputs for a node", () => {
    const context = getNodeEvaluationContext(deriveBoardState(board), "checking");

    expect(context).toEqual({
      nodeId: "checking",
      externalInflows: [],
      incomingTransfers: [
        {
          id: "income-checking",
          source: "income",
          target: "checking",
          amount: 3000,
          frequency: "monthly",
          monthlyAmount: 3000,
        },
      ],
      outgoingTransfers: [
        {
          id: "checking-savings",
          source: "checking",
          target: "savings",
          amount: 500,
          frequency: "monthly",
          monthlyAmount: 500,
        },
      ],
      totals: {
        externalInflow: 0,
        inflow: 3000,
        outflow: 500,
      },
    });
  });

  it("normalizes external inflows individually", () => {
    const context = getNodeEvaluationContext(deriveBoardState(board), "income");

    expect(context?.externalInflows).toMatchObject([
      { id: "paycheck", monthlyAmount: 3000 },
      { id: "side-work", monthlyAmount: 250 * 52 / 12 },
    ]);
    expect(context?.totals.externalInflow).toBe(3000 + 250 * 52 / 12);
  });

  it("returns undefined for missing nodes", () => {
    expect(getNodeEvaluationContext(deriveBoardState(board), "missing")).toBeUndefined();
  });

  it("returns contexts for every node in board order", () => {
    expect(getNodeEvaluationContexts(deriveBoardState(board)).map((context) => context.nodeId)).toEqual([
      "income",
      "checking",
      "savings",
    ]);
  });
});
