import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { deriveBoardState } from "../analysis/derivedBoardState";
import {
  getFlowFormulaContext,
  getFlowFormulaContexts,
} from "./flowFormulaContext";
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
  ],
};

describe("flow formula context", () => {
  it("builds formula variables from the target node context", () => {
    const context = getFlowFormulaContext(
      deriveBoardState(board),
      formulaLayer.flowFormulas[0],
    );

    expect(context?.formula.id).toBe("formula-savings");
    expect(context?.flow.id).toBe("checking-savings");
    expect(context?.sourceNode.nodeId).toBe("checking");
    expect(context?.targetNode.nodeId).toBe("savings");
    expect(context?.variables).toEqual({
      targetExternalInflow: 0,
      targetIncomingBeforeThisFlow: 100,
      targetOutgoing: 0,
      targetRemainingBeforeThisFlow: 100,
      currentAmount: 500,
    });
  });

  it("returns undefined when the formula references a missing flow", () => {
    expect(
      getFlowFormulaContext(deriveBoardState(board), {
        id: "missing",
        flowId: "missing",
        rule: { type: "targetRemainingBeforeThisFlow" },
      }),
    ).toBeUndefined();
  });

  it("returns contexts for all formulas with visible flow references", () => {
    expect(
      getFlowFormulaContexts(deriveBoardState(board), {
        version: 1,
        flowFormulas: [
          ...formulaLayer.flowFormulas,
          {
            id: "formula-checking",
            flowId: "income-checking",
            rule: { type: "targetRemainingBeforeThisFlow" },
          },
          {
            id: "formula-missing",
            flowId: "missing",
            rule: { type: "targetRemainingBeforeThisFlow" },
          },
        ],
      }).map((context) => context.formula.id),
    ).toEqual(["formula-savings", "formula-checking"]);
  });
});
