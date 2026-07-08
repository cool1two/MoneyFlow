import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { createBoardFile, parseBoardFile } from "./boardFile";

const board: BoardState = {
  nodes: [
    { id: "income", name: "Income", position: { x: 0, y: 0 } },
    { id: "rent", name: "Rent", position: { x: 200, y: 0 } },
  ],
  flows: [
    { id: "income-rent", source: "income", target: "rent", amount: 100, frequency: "monthly" },
  ],
  externalInflows: [
    { id: "paycheck", target: "income", amount: 3000, frequency: "monthly" },
  ],
};

describe("board file persistence", () => {
  it("creates a versioned board file", () => {
    expect(createBoardFile(board)).toEqual({ version: 1, board });
  });

  it("parses a valid board file", () => {
    expect(parseBoardFile(JSON.stringify(createBoardFile(board)))).toEqual(board);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseBoardFile("{")).toThrow();
  });

  it("rejects unsupported versions", () => {
    expect(() => parseBoardFile(JSON.stringify({ version: 999, board }))).toThrow(
      "Unsupported MoneyFlow board file.",
    );
  });

  it("rejects invalid board references", () => {
    expect(() =>
      parseBoardFile(
        JSON.stringify({
          version: 1,
          board: {
            ...board,
            flows: [{ id: "bad", source: "income", target: "missing", amount: 1, frequency: "monthly" }],
          },
        }),
      ),
    ).toThrow("Flow bad has an unknown target node.");
  });
});
