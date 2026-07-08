import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { parseBoardState, validateBoard } from "./boardValidation";

const validBoard: BoardState = {
  nodes: [
    { id: "income", name: "Income", position: { x: 0, y: 0 } },
    { id: "rent", name: "Rent", position: { x: 300, y: 0 } },
  ],
  flows: [
    { id: "income-rent", source: "income", target: "rent", amount: 1200, frequency: "monthly" },
  ],
  externalInflows: [
    { id: "paycheck", target: "income", amount: 3000, frequency: "biweekly" },
  ],
};

describe("validateBoard", () => {
  it("accepts a valid board", () => {
    expect(validateBoard(validBoard)).toEqual({ valid: true, errors: [] });
  });

  it("rejects duplicate node ids", () => {
    const result = validateBoard({
      ...validBoard,
      nodes: [...validBoard.nodes, { id: "income", name: "Duplicate", position: { x: 1, y: 1 } }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Duplicate node id: income.");
  });

  it("rejects duplicate flow ids", () => {
    const result = validateBoard({
      ...validBoard,
      flows: [
        ...validBoard.flows,
        { id: "income-rent", source: "rent", target: "income", amount: 1, frequency: "monthly" },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Duplicate flow id: income-rent.");
  });

  it("rejects duplicate external inflow ids", () => {
    const result = validateBoard({
      ...validBoard,
      externalInflows: [
        ...validBoard.externalInflows,
        { id: "paycheck", target: "rent", amount: 500, frequency: "monthly" },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Duplicate external inflow id: paycheck.");
  });

  it("rejects self loops", () => {
    const result = validateBoard({
      ...validBoard,
      flows: [{ id: "loop", source: "income", target: "income", amount: 1, frequency: "monthly" }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Flow loop cannot connect a node to itself.");
  });

  it("rejects unknown flow references", () => {
    const result = validateBoard({
      ...validBoard,
      flows: [{ id: "bad", source: "income", target: "missing", amount: 1, frequency: "monthly" }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Flow bad has an unknown target node.");
  });

  it("rejects negative amounts", () => {
    const result = validateBoard({
      ...validBoard,
      flows: [{ id: "negative", source: "income", target: "rent", amount: -1, frequency: "monthly" }],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Flow negative amount cannot be negative.");
  });

  it("strips legacy draft flags while parsing board state", () => {
    expect(
      parseBoardState({
        ...validBoard,
        flows: [{ ...validBoard.flows[0], isDraft: true }],
      }).flows[0],
    ).toEqual(validBoard.flows[0]);
  });

  it("strips zero external inflows while parsing board state", () => {
    expect(
      parseBoardState({
        ...validBoard,
        externalInflows: [
          ...validBoard.externalInflows,
          { id: "zero-deposit", target: "rent", amount: 0, frequency: "monthly" },
        ],
      }).externalInflows,
    ).toEqual(validBoard.externalInflows);
  });
});
