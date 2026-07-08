import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import {
  filterExistingFlowIds,
  getConnectedFlowIdsForNode,
  getIncomingFlowsForNode,
  getNodeById,
  getNodeName,
  hasFlow,
  isRootNode,
} from "./boardSelectors";

const board: BoardState = {
  nodes: [
    { id: "income", name: "Income", position: { x: 0, y: 0 } },
    { id: "checking", name: "Checking", position: { x: 300, y: 0 } },
    { id: "rent", name: "Rent", position: { x: 600, y: 0 } },
  ],
  externalInflows: [
    { id: "paycheck", target: "income", amount: 3000, frequency: "monthly" },
  ],
  flows: [
    { id: "income-checking", source: "income", target: "checking", amount: 3000, frequency: "monthly" },
    { id: "checking-rent", source: "checking", target: "rent", amount: 1200, frequency: "monthly" },
  ],
};

describe("board selectors", () => {
  it("finds nodes and names", () => {
    expect(getNodeById(board, "income")?.name).toBe("Income");
    expect(getNodeById(board, null)).toBeUndefined();
    expect(getNodeName(board, "missing")).toBe("Unknown node");
  });

  it("selects incoming and connected flows", () => {
    expect(getIncomingFlowsForNode(board, "checking").map((flow) => flow.id)).toEqual([
      "income-checking",
    ]);
    expect(getConnectedFlowIdsForNode(board, "checking")).toEqual([
      "income-checking",
      "checking-rent",
    ]);
  });

  it("detects root nodes from graph structure", () => {
    expect(isRootNode(board, "income")).toBe(true);
    expect(isRootNode(board, "checking")).toBe(false);
  });

  it("filters flow ids against the board", () => {
    expect(hasFlow(board, "checking-rent")).toBe(true);
    expect(hasFlow(board, "missing")).toBe(false);
    expect(filterExistingFlowIds(board, ["income-checking", "missing"])).toEqual([
      "income-checking",
    ]);
  });
});
