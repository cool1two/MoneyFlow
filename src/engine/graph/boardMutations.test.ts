import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import {
  addFlow,
  commitFlow,
  deleteFlow,
  deleteNode,
  moveNode,
  renameNode,
  updateExternalInflow,
  updateFlow,
} from "./boardMutations";

const board: BoardState = {
  nodes: [
    { id: "income", name: "Income", position: { x: 0, y: 0 } },
    { id: "buffer", name: "Buffer", position: { x: 300, y: 0 } },
  ],
  externalInflows: [
    { id: "paycheck", target: "income", amount: 3000, frequency: "monthly" },
  ],
  flows: [
    { id: "income-buffer", source: "income", target: "buffer", amount: 500, frequency: "monthly" },
  ],
};

describe("board mutations", () => {
  it("adds zero amount flows", () => {
    const nextBoard = addFlow(board, "buffer", "income");
    const flow = nextBoard.flows.at(-1);

    expect(flow).toMatchObject({
      source: "buffer",
      target: "income",
      amount: 0,
      frequency: "monthly",
    });
  });

  it("rejects self-loop flows", () => {
    expect(() => addFlow(board, "income", "income")).toThrow(
      "Flow",
    );
  });

  it("rejects flows with unknown node references", () => {
    expect(() => addFlow(board, "income", "missing")).toThrow(
      "unknown target node",
    );
  });

  it("updates flows", () => {
    const nextBoard = updateFlow(board, "income-buffer", {
      amount: 250,
      frequency: "weekly",
    });

    expect(nextBoard.flows.find((flow) => flow.id === "income-buffer")).toMatchObject({
      amount: 250,
      frequency: "weekly",
    });
  });

  it("deletes committed zero flows on commit", () => {
    const zeroBoard = updateFlow(board, "income-buffer", {
      amount: 0,
      frequency: "monthly",
    });

    expect(zeroBoard.flows).toHaveLength(1);
    expect(commitFlow(zeroBoard, "income-buffer").flows).toHaveLength(0);
  });

  it("deletes nodes and connected graph references", () => {
    const nextBoard = deleteNode(board, "income");

    expect(nextBoard.nodes).toHaveLength(1);
    expect(nextBoard.flows).toHaveLength(0);
    expect(nextBoard.externalInflows).toHaveLength(0);
  });

  it("updates node position and name", () => {
    const movedBoard = moveNode(board, "income", { x: 10, y: 20 });
    const renamedBoard = renameNode(movedBoard, "income", "Main Income");

    expect(renamedBoard.nodes[0]).toMatchObject({
      name: "Main Income",
      position: { x: 10, y: 20 },
    });
  });

  it("updates or creates external inflows", () => {
    const updatedBoard = updateExternalInflow(board, "income", {
      amount: 4000,
      frequency: "biweekly",
    });
    const createdBoard = updateExternalInflow(updatedBoard, "buffer", {
      amount: 100,
      frequency: "monthly",
    });

    expect(updatedBoard.externalInflows[0]).toMatchObject({ amount: 4000, frequency: "biweekly" });
    expect(createdBoard.externalInflows).toHaveLength(2);
  });

  it("does not create zero external inflows", () => {
    const nextBoard = updateExternalInflow(board, "buffer", {
      amount: 0,
      frequency: "monthly",
    });

    expect(nextBoard.externalInflows).toHaveLength(1);
  });

  it("removes external inflows when amount is zero", () => {
    const nextBoard = updateExternalInflow(board, "income", {
      amount: 0,
      frequency: "monthly",
    });

    expect(nextBoard.externalInflows).toHaveLength(0);
  });

  it("deletes flows directly", () => {
    expect(deleteFlow(board, "income-buffer").flows).toHaveLength(0);
  });
});
