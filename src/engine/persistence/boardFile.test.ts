import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { createEmptyFormulaLayer, type FormulaLayer } from "../formulas/formulaLayer";
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

const formulas: FormulaLayer = {
  version: 1,
  flowFormulas: [
    {
      id: "rent-formula",
      flowId: "income-rent",
      rule: { type: "fixedAmount", monthlyAmount: 1250 },
    },
  ],
};

describe("board file persistence", () => {
  it("creates a version 2 document containing board and formula state", () => {
    expect(createBoardFile(board, formulas)).toEqual({
      version: 2,
      board,
      formulas,
    });
  });

  it("round trips a version 2 document without losing formulas", () => {
    const document = createBoardFile(board, formulas);

    expect(parseBoardFile(JSON.stringify(document))).toEqual(document);
  });

  it("migrates a version 1 file to version 2 with an empty formula layer", () => {
    expect(parseBoardFile(JSON.stringify({ version: 1, board }))).toEqual({
      version: 2,
      board,
      formulas: createEmptyFormulaLayer(),
    });
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

  it("distinguishes structural parsing from board semantic validation", () => {
    expect(() =>
      parseBoardFile(
        JSON.stringify({
          version: 2,
          board: { ...board, flows: "not-an-array" },
          formulas: createEmptyFormulaLayer(),
        }),
      ),
    ).toThrow("Invalid MoneyFlow version 2 document structure.");

    expect(() =>
      parseBoardFile(
        JSON.stringify({
          version: 2,
          board: {
            ...board,
            flows: [
              {
                id: "semantic-error",
                source: "income",
                target: "missing",
                amount: 1,
                frequency: "monthly",
              },
            ],
          },
          formulas: createEmptyFormulaLayer(),
        }),
      ),
    ).toThrow("Flow semantic-error has an unknown target node.");
  });

  it("rejects formula references to missing flows after structural parsing", () => {
    expect(() =>
      parseBoardFile(
        JSON.stringify({
          version: 2,
          board,
          formulas: {
            version: 1,
            flowFormulas: [
              {
                id: "missing-formula",
                flowId: "missing",
                rule: { type: "fixedAmount", monthlyAmount: 1 },
              },
            ],
          },
        }),
      ),
    ).toThrow("Formula missing-formula references an unknown flow.");
  });

  it("rejects multiple formulas targeting the same flow", () => {
    expect(() =>
      parseBoardFile(
        JSON.stringify({
          version: 2,
          board,
          formulas: {
            version: 1,
            flowFormulas: [
              {
                id: "formula-one",
                flowId: "income-rent",
                rule: { type: "fixedAmount", monthlyAmount: 1 },
              },
              {
                id: "formula-two",
                flowId: "income-rent",
                rule: { type: "fixedAmount", monthlyAmount: 2 },
              },
            ],
          },
        }),
      ),
    ).toThrow("Flow income-rent cannot have multiple formulas.");
  });
});
