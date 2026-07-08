import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { buildGraphAnalysis } from "./graphAnalysis";

const board: BoardState = {
  nodes: [
    { id: "income", name: "Income", position: { x: 0, y: 0 } },
    { id: "checking", name: "Checking", position: { x: 300, y: 0 } },
    { id: "rent", name: "Rent", position: { x: 600, y: 0 } },
    { id: "savings", name: "Savings", position: { x: 600, y: 200 } },
  ],
  externalInflows: [
    { id: "paycheck", target: "income", amount: 3000, frequency: "monthly" },
  ],
  flows: [
    { id: "income-checking", source: "income", target: "checking", amount: 3000, frequency: "monthly" },
    { id: "checking-rent", source: "checking", target: "rent", amount: 1200, frequency: "monthly" },
    { id: "checking-savings", source: "checking", target: "savings", amount: 500, frequency: "monthly" },
  ],
};

describe("graph analysis", () => {
  it("builds incoming and outgoing adjacency maps", () => {
    const analysis = buildGraphAnalysis(board);

    expect(analysis.incoming.get("checking")?.map((flow) => flow.id)).toEqual([
      "income-checking",
    ]);
    expect(analysis.outgoing.get("checking")?.map((flow) => flow.id)).toEqual([
      "checking-rent",
      "checking-savings",
    ]);
  });

  it("finds root and leaf nodes", () => {
    const analysis = buildGraphAnalysis(board);

    expect(analysis.rootNodeIds).toEqual(["income"]);
    expect(analysis.leafNodeIds).toEqual(["rent", "savings"]);
  });

  it("returns topological order for acyclic boards", () => {
    const analysis = buildGraphAnalysis(board);

    expect(analysis.hasCycles).toBe(false);
    expect(analysis.cycles).toEqual([]);
    expect(analysis.topologicalNodeIds).toEqual([
      "income",
      "checking",
      "rent",
      "savings",
    ]);
  });

  it("returns cycle diagnostics for cyclic boards", () => {
    const cyclicBoard: BoardState = {
      ...board,
      flows: [
        ...board.flows,
        { id: "savings-income", source: "savings", target: "income", amount: 100, frequency: "monthly" },
      ],
    };
    const analysis = buildGraphAnalysis(cyclicBoard);

    expect(analysis.hasCycles).toBe(true);
    expect(analysis.topologicalNodeIds).toEqual([]);
    expect(analysis.cycles).toEqual([
      {
        nodeIds: ["income", "checking", "savings"],
        flowIds: ["income-checking", "checking-savings", "savings-income"],
      },
    ]);
  });
});
