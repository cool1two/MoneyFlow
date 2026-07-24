import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { deriveBoardState } from "../analysis/derivedBoardState";
import { evaluateFormulaLayer } from "./formulaEvaluation";
import type { FormulaLayer } from "./formulaLayer";

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
    { id: "income-checking", source: "income", target: "checking", amount: 2500, frequency: "monthly" },
    { id: "income-savings", source: "income", target: "savings", amount: 100, frequency: "monthly" },
    { id: "checking-savings", source: "checking", target: "savings", amount: 500, frequency: "monthly" },
  ],
};

const formulaLayer: FormulaLayer = {
  version: 1,
  flowFormulas: [
    {
      id: "formula-savings",
      flowId: "checking-savings",
      rule: { type: "percentOfTargetRemainingBeforeThisFlow", percent: 0.25 },
    },
    {
      id: "formula-checking",
      flowId: "income-checking",
      rule: { type: "fixedAmount", monthlyAmount: 1200 },
    },
  ],
};

describe("formula layer evaluation", () => {
  it("evaluates a multi-flow chain independently against one baseline", () => {
    expect(evaluateFormulaLayer(deriveBoardState(board), formulaLayer)).toEqual({
      status: "ready",
      diagnostics: [],
      results: [
        {
          status: "success",
          formulaId: "formula-savings",
          flowId: "checking-savings",
          monthlyAmount: 25,
          diagnostics: [],
        },
        {
          status: "success",
          formulaId: "formula-checking",
          flowId: "income-checking",
          monthlyAmount: 1200,
          diagnostics: [],
        },
      ],
    });
  });

  it("blocks evaluation when the formula layer is invalid", () => {
    expect(
      evaluateFormulaLayer(deriveBoardState(board), {
        version: 1,
        flowFormulas: [
          {
            id: "formula-missing",
            flowId: "missing",
            rule: { type: "fixedAmount", monthlyAmount: 100 },
          },
        ],
      }),
    ).toEqual({
      status: "blocked",
      results: [],
      diagnostics: [
        {
          code: "formula.unknownFlow",
          severity: "error",
          message: "Formula formula-missing references an unknown flow.",
          formulaId: "formula-missing",
          flowId: "missing",
        },
      ],
    });
  });

  it("blocks evaluation when the visible graph has a cycle", () => {
    const evaluation = evaluateFormulaLayer(
        deriveBoardState({
          ...board,
          flows: [
            ...board.flows,
            { id: "savings-income", source: "savings", target: "income", amount: 100, frequency: "monthly" },
          ],
        }),
        formulaLayer,
      );

    expect(evaluation.status).toBe("blocked");
    expect(evaluation.results).toEqual([]);
    expect(evaluation.diagnostics).toMatchObject([
      {
        code: "graph.cycle",
        nodeIds: ["income", "checking", "savings"],
        flowIds: ["income-checking", "checking-savings", "savings-income"],
      },
      {
        code: "formula.blockedByCycle",
        severity: "error",
        message: "Formula evaluation is blocked by a cycle in the visible graph.",
      },
    ]);
  });
});
