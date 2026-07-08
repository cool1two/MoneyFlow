import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { deriveBoardState } from "./derivedBoardState";

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

describe("derived board state", () => {
  it("derives node totals and monthly flows from BoardState", () => {
    const derived = deriveBoardState(board);

    expect(derived.board).toBe(board);
    expect(derived.nodes.find((node) => node.id === "income")?.totals).toEqual({
      externalInflow: 3000,
      inflow: 0,
      outflow: 3000,
    });
    expect(derived.nodes.find((node) => node.id === "checking")?.totals).toEqual({
      externalInflow: 0,
      inflow: 3000,
      outflow: 500,
    });
    expect(derived.flows).toMatchObject([
      { id: "income-checking", monthlyAmount: 3000 },
      { id: "checking-savings", monthlyAmount: 500 },
    ]);
    expect(derived.nodeEvaluationContexts.map((context) => context.nodeId)).toEqual([
      "income",
      "checking",
      "savings",
    ]);
  });

  it("includes ready evaluation order for acyclic boards", () => {
    const derived = deriveBoardState(board);

    expect(derived.evaluation).toEqual({
      status: "ready",
      nodeIds: ["income", "checking", "savings"],
    });
    expect(derived.diagnosticSummary).toEqual({
      hasErrors: false,
      bySeverity: { info: [], warning: [], error: [] },
      byCode: {},
    });
  });

  it("includes diagnostics and blocks evaluation for cyclic boards", () => {
    const derived = deriveBoardState({
      ...board,
      flows: [
        ...board.flows,
        { id: "savings-income", source: "savings", target: "income", amount: 100, frequency: "monthly" },
      ],
    });

    expect(derived.evaluation).toEqual({ status: "blocked", nodeIds: [] });
    expect(derived.diagnostics).toMatchObject([
      {
        code: "graph.cycle",
        severity: "error",
        nodeIds: ["income", "checking", "savings"],
      },
    ]);
    expect(derived.diagnosticSummary.hasErrors).toBe(true);
    expect(derived.diagnosticSummary.bySeverity.error).toHaveLength(1);
    expect(derived.diagnosticSummary.byCode["graph.cycle"]).toHaveLength(1);
  });
});
