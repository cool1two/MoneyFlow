import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { getEvaluationPlan } from "./evaluationPlan";

const board: BoardState = {
  nodes: [
    { id: "income", name: "Income", position: { x: 0, y: 0 } },
    { id: "checking", name: "Checking", position: { x: 300, y: 0 } },
    { id: "savings", name: "Savings", position: { x: 600, y: 0 } },
  ],
  externalInflows: [
    { id: "paycheck", target: "income", amount: 3000, frequency: "monthly" },
  ],
  flows: [
    { id: "income-checking", source: "income", target: "checking", amount: 3000, frequency: "monthly" },
    { id: "checking-savings", source: "checking", target: "savings", amount: 500, frequency: "monthly" },
  ],
};

describe("evaluation plan", () => {
  it("returns visible-edge evaluation order for acyclic boards", () => {
    expect(getEvaluationPlan(board)).toEqual({
      status: "ready",
      nodeIds: ["income", "checking", "savings"],
      cycles: [],
    });
  });

  it("returns deterministic evaluation order for multiple roots", () => {
    expect(
      getEvaluationPlan({
        nodes: [
          { id: "income-a", name: "Income A", position: { x: 0, y: 0 } },
          { id: "income-b", name: "Income B", position: { x: 0, y: 100 } },
          { id: "bills", name: "Bills", position: { x: 300, y: 0 } },
          { id: "savings", name: "Savings", position: { x: 300, y: 100 } },
        ],
        externalInflows: [],
        flows: [
          { id: "income-a-bills", source: "income-a", target: "bills", amount: 100, frequency: "monthly" },
          { id: "income-b-savings", source: "income-b", target: "savings", amount: 200, frequency: "monthly" },
        ],
      }),
    ).toEqual({
      status: "ready",
      nodeIds: ["income-a", "income-b", "bills", "savings"],
      cycles: [],
    });
  });

  it("blocks evaluation when visible graph edges create a cycle", () => {
    expect(
      getEvaluationPlan({
        ...board,
        flows: [
          ...board.flows,
          { id: "savings-income", source: "savings", target: "income", amount: 100, frequency: "monthly" },
        ],
      }),
    ).toEqual({
      status: "blocked",
      nodeIds: [],
      cycles: [
        {
          nodeIds: ["income", "checking", "savings"],
          flowIds: ["income-checking", "checking-savings", "savings-income"],
        },
      ],
    });
  });
});
