import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { getBoardDiagnostics } from "./boardDiagnostics";

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

describe("board diagnostics", () => {
  it("returns no diagnostics for acyclic boards", () => {
    expect(getBoardDiagnostics(board)).toEqual([]);
  });

  it("returns structured cycle diagnostics", () => {
    expect(
      getBoardDiagnostics({
        ...board,
        flows: [
          ...board.flows,
          { id: "savings-income", source: "savings", target: "income", amount: 100, frequency: "monthly" },
        ],
      }),
    ).toEqual([
      {
        code: "graph.cycle",
        severity: "error",
        message: "Cycle detected. MoneyFlow cannot determine a stable evaluation order for this loop.",
        nodeIds: ["income", "checking", "savings"],
        flowIds: ["income-checking", "checking-savings", "savings-income"],
      },
    ]);
  });

  it("returns one diagnostic per detected cycle", () => {
    expect(
      getBoardDiagnostics({
        nodes: [
          { id: "a", name: "A", position: { x: 0, y: 0 } },
          { id: "b", name: "B", position: { x: 100, y: 0 } },
          { id: "c", name: "C", position: { x: 0, y: 100 } },
          { id: "d", name: "D", position: { x: 100, y: 100 } },
        ],
        externalInflows: [],
        flows: [
          { id: "a-b", source: "a", target: "b", amount: 1, frequency: "monthly" },
          { id: "b-a", source: "b", target: "a", amount: 1, frequency: "monthly" },
          { id: "c-d", source: "c", target: "d", amount: 1, frequency: "monthly" },
          { id: "d-c", source: "d", target: "c", amount: 1, frequency: "monthly" },
        ],
      }).map((diagnostic) => diagnostic.flowIds),
    ).toEqual([
      ["a-b", "b-a"],
      ["c-d", "d-c"],
    ]);
  });
});
