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

  it("keeps deterministic order for disconnected components and multiple roots", () => {
    const disconnectedBoard: BoardState = {
      nodes: [
        { id: "income-a", name: "Income A", position: { x: 0, y: 0 } },
        { id: "income-b", name: "Income B", position: { x: 0, y: 100 } },
        { id: "bills", name: "Bills", position: { x: 300, y: 0 } },
        { id: "savings", name: "Savings", position: { x: 300, y: 100 } },
        { id: "standalone", name: "Standalone", position: { x: 600, y: 0 } },
      ],
      externalInflows: [],
      flows: [
        { id: "income-a-bills", source: "income-a", target: "bills", amount: 100, frequency: "monthly" },
        { id: "income-b-savings", source: "income-b", target: "savings", amount: 200, frequency: "monthly" },
      ],
    };
    const analysis = buildGraphAnalysis(disconnectedBoard);

    expect(analysis.rootNodeIds).toEqual(["income-a", "income-b", "standalone"]);
    expect(analysis.leafNodeIds).toEqual(["bills", "savings", "standalone"]);
    expect(analysis.topologicalNodeIds).toEqual([
      "income-a",
      "income-b",
      "standalone",
      "bills",
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

  it("detects multiple independent cycles", () => {
    const multiCycleBoard: BoardState = {
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
    };

    expect(buildGraphAnalysis(multiCycleBoard).cycles).toEqual([
      { nodeIds: ["a", "b"], flowIds: ["a-b", "b-a"] },
      { nodeIds: ["c", "d"], flowIds: ["c-d", "d-c"] },
    ]);
  });

  it("detects cycles in downstream subgraphs", () => {
    const downstreamCycleBoard: BoardState = {
      nodes: [
        { id: "root", name: "Root", position: { x: 0, y: 0 } },
        { id: "a", name: "A", position: { x: 100, y: 0 } },
        { id: "b", name: "B", position: { x: 200, y: 0 } },
        { id: "c", name: "C", position: { x: 300, y: 0 } },
      ],
      externalInflows: [],
      flows: [
        { id: "root-a", source: "root", target: "a", amount: 1, frequency: "monthly" },
        { id: "a-b", source: "a", target: "b", amount: 1, frequency: "monthly" },
        { id: "b-c", source: "b", target: "c", amount: 1, frequency: "monthly" },
        { id: "c-a", source: "c", target: "a", amount: 1, frequency: "monthly" },
      ],
    };

    expect(buildGraphAnalysis(downstreamCycleBoard).cycles).toEqual([
      { nodeIds: ["a", "b", "c"], flowIds: ["a-b", "b-c", "c-a"] },
    ]);
  });
});
