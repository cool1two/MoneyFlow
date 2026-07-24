import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { deriveBoardState } from "../analysis/derivedBoardState";
import { evaluateFormulaLayer } from "./formulaEvaluation";
import { applyFormulaResultsToDerivedState } from "./formulaDerivedState";
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
    { id: "checking-savings", source: "checking", target: "savings", amount: 500, frequency: "monthly" },
  ],
};

const formulaLayer: FormulaLayer = {
  version: 1,
  flowFormulas: [
    {
      id: "formula-savings",
      flowId: "checking-savings",
      rule: { type: "fixedAmount", monthlyAmount: 800 },
    },
  ],
};

describe("formula derived state", () => {
  it("applies formula amounts to a derived projection without mutating BoardState", () => {
    const derived = deriveBoardState(board);
    const formulaDerived = applyFormulaResultsToDerivedState(
      derived,
      evaluateFormulaLayer(derived, formulaLayer),
    );

    expect(formulaDerived.status).toBe("ready");
    if (formulaDerived.status !== "ready") throw new Error("Expected ready formula state.");

    expect(formulaDerived.flows.find((flow) => flow.id === "checking-savings")).toMatchObject({
      amount: 500,
      monthlyAmount: 800,
    });
    expect(formulaDerived.nodes.find((node) => node.id === "checking")?.totals).toEqual({
      externalInflow: 0,
      inflow: 2500,
      outflow: 800,
    });
    expect(formulaDerived.nodes.find((node) => node.id === "savings")?.totals).toEqual({
      externalInflow: 0,
      inflow: 800,
      outflow: 0,
    });
    expect(board.flows.find((flow) => flow.id === "checking-savings")?.amount).toBe(500);
    expect(derived.flows.find((flow) => flow.id === "checking-savings")?.monthlyAmount).toBe(500);
  });

  it("returns a blocked projection when formula evaluation is blocked", () => {
    expect(
      applyFormulaResultsToDerivedState(deriveBoardState(board), {
        status: "blocked",
        results: [],
        diagnostics: [
          {
            code: "formula.unknownFlow",
            severity: "error",
            message: "Formula formula-missing references an unknown flow.",
          },
        ],
      }),
    ).toEqual({
      status: "blocked",
      nodes: [],
      flows: [],
      diagnostics: [
        {
          code: "formula.unknownFlow",
          severity: "error",
          message: "Formula formula-missing references an unknown flow.",
        },
      ],
    });
  });
});
