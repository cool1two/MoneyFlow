import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import {
  createEmptyFormulaLayer,
  getFormulaLayerDiagnostics,
  validateFormulaLayer,
  type FormulaLayer,
} from "./formulaLayer";

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

describe("formula layer", () => {
  it("creates an empty formula layer separate from BoardState", () => {
    expect(createEmptyFormulaLayer()).toEqual({
      version: 1,
      flowFormulas: [],
    });
    expect(board).not.toHaveProperty("flowFormulas");
  });

  it("accepts formulas that reference visible flows", () => {
    const formulaLayer: FormulaLayer = {
      version: 1,
      flowFormulas: [
        {
          id: "formula-savings",
          flowId: "checking-savings",
          expression: "available * 0.2",
        },
      ],
    };

    expect(validateFormulaLayer(board, formulaLayer)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("rejects formulas that reference missing flows", () => {
    const formulaLayer: FormulaLayer = {
      version: 1,
      flowFormulas: [
        {
          id: "formula-missing",
          flowId: "missing",
          expression: "available * 0.2",
        },
      ],
    };
    const result = validateFormulaLayer(board, formulaLayer);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Formula formula-missing references an unknown flow.");
    expect(getFormulaLayerDiagnostics(board, formulaLayer)).toEqual([
      {
        code: "formula.unknownFlow",
        severity: "error",
        message: "Formula formula-missing references an unknown flow.",
        formulaId: "formula-missing",
        flowId: "missing",
      },
    ]);
  });

  it("rejects duplicate formula ids and duplicate flow targets", () => {
    const result = validateFormulaLayer(board, {
      version: 1,
      flowFormulas: [
        {
          id: "formula-savings",
          flowId: "checking-savings",
          expression: "available * 0.2",
        },
        {
          id: "formula-savings",
          flowId: "checking-savings",
          expression: "available * 0.3",
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Duplicate formula id: formula-savings.");
    expect(result.errors).toContain("Flow checking-savings cannot have multiple formulas.");
  });

  it("rejects blank formula expressions", () => {
    const result = validateFormulaLayer(board, {
      version: 1,
      flowFormulas: [
        {
          id: "formula-savings",
          flowId: "checking-savings",
          expression: " ",
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Formula formula-savings expression cannot be blank.");
  });

  it("returns structured diagnostics for blank formula ids and flow ids", () => {
    expect(
      getFormulaLayerDiagnostics(board, {
        version: 1,
        flowFormulas: [
          {
            id: " ",
            flowId: " ",
            expression: "available",
          },
        ],
      }),
    ).toEqual([
      {
        code: "formula.blankId",
        severity: "error",
        message: "Formula id cannot be blank.",
        flowId: " ",
      },
      {
        code: "formula.blankFlowId",
        severity: "error",
        message: "Formula (blank) flow id cannot be blank.",
        formulaId: " ",
      },
      {
        code: "formula.unknownFlow",
        severity: "error",
        message: "Formula (blank) references an unknown flow.",
        formulaId: " ",
        flowId: " ",
      },
    ]);
  });
});
