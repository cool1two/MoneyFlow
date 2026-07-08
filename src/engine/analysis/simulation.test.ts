import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { deriveBoardState } from "./derivedBoardState";
import { simulateDerivedBoard } from "./simulation";

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
    { id: "income-checking", source: "income", target: "checking", amount: 2500, frequency: "monthly" },
    { id: "checking-savings", source: "checking", target: "savings", amount: 500, frequency: "monthly" },
  ],
};

describe("simulation", () => {
  it("returns deterministic node snapshots in evaluation order", () => {
    expect(simulateDerivedBoard(deriveBoardState(board))).toEqual({
      status: "ready",
      diagnostics: [],
      nodes: [
        {
          nodeId: "income",
          externalInflow: 3000,
          inflow: 0,
          outflow: 2500,
          remaining: 500,
        },
        {
          nodeId: "checking",
          externalInflow: 0,
          inflow: 2500,
          outflow: 500,
          remaining: 2000,
        },
        {
          nodeId: "savings",
          externalInflow: 0,
          inflow: 500,
          outflow: 0,
          remaining: 500,
        },
      ],
    });
  });

  it("blocks simulation when derived evaluation is blocked", () => {
    const result = simulateDerivedBoard(
      deriveBoardState({
        ...board,
        flows: [
          ...board.flows,
          { id: "savings-income", source: "savings", target: "income", amount: 100, frequency: "monthly" },
        ],
      }),
    );

    expect(result.status).toBe("blocked");
    expect(result.nodes).toEqual([]);
    expect(result.diagnostics).toMatchObject([{ code: "graph.cycle" }]);
  });
});
