import { describe, expect, it } from "vitest";
import {
  createFlowFormulaFailure,
  createFlowFormulaSuccess,
} from "./formulaResult";

describe("formula result", () => {
  it("creates successful flow formula results for finite non-negative amounts", () => {
    expect(createFlowFormulaSuccess("formula-savings", "checking-savings", 250)).toEqual({
      status: "success",
      formulaId: "formula-savings",
      flowId: "checking-savings",
      amount: 250,
      diagnostics: [],
    });
  });

  it("rejects negative formula results", () => {
    expect(createFlowFormulaSuccess("formula-savings", "checking-savings", -1)).toEqual({
      status: "failure",
      formulaId: "formula-savings",
      flowId: "checking-savings",
      amount: null,
      diagnostics: [
        {
          code: "formula.invalidResult",
          severity: "error",
          message: "Formula formula-savings produced an invalid transfer amount.",
          formulaId: "formula-savings",
          flowId: "checking-savings",
        },
      ],
    });
  });

  it("rejects non-finite formula results", () => {
    expect(createFlowFormulaSuccess("formula-savings", "checking-savings", Number.NaN).status).toBe(
      "failure",
    );
  });

  it("wraps explicit formula failures", () => {
    expect(
      createFlowFormulaFailure("formula-savings", "checking-savings", [
        {
          code: "formula.invalidRule",
          severity: "error",
          message: "Formula formula-savings contains an invalid rule.",
          formulaId: "formula-savings",
          flowId: "checking-savings",
        },
      ]),
    ).toEqual({
      status: "failure",
      formulaId: "formula-savings",
      flowId: "checking-savings",
      amount: null,
      diagnostics: [
        {
          code: "formula.invalidRule",
          severity: "error",
          message: "Formula formula-savings contains an invalid rule.",
          formulaId: "formula-savings",
          flowId: "checking-savings",
        },
      ],
    });
  });
});
