import { describe, expect, it } from "vitest";
import type { BoardState } from "../../models/board";
import { deriveBoardState } from "../analysis/derivedBoardState";
import { getFlowFormulaContext } from "./flowFormulaContext";
import { evaluateFlowFormulaRule } from "./formulaRule";

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

const createContext = (rule: Parameters<typeof getFlowFormulaContext>[1]["rule"]) =>
  getFlowFormulaContext(deriveBoardState(board), {
    id: "formula-savings",
    flowId: "checking-savings",
    rule,
  })!;

describe("formula rule evaluation", () => {
  it("evaluates fixed amount rules", () => {
    expect(evaluateFlowFormulaRule(createContext({ type: "fixedAmount", amount: 125 }))).toMatchObject({
      status: "success",
      amount: 125,
    });
  });

  it("evaluates percentage of target remaining before this flow", () => {
    expect(
      evaluateFlowFormulaRule(
        createContext({ type: "percentOfTargetRemainingBeforeThisFlow", percent: 0.25 }),
      ),
    ).toMatchObject({
      status: "success",
      amount: 25,
    });
  });

  it("evaluates target remaining before this flow", () => {
    expect(evaluateFlowFormulaRule(createContext({ type: "targetRemainingBeforeThisFlow" }))).toMatchObject({
      status: "success",
      amount: 100,
    });
  });

  it("evaluates capped amount rules", () => {
    expect(evaluateFlowFormulaRule(createContext({ type: "cappedAmount", amount: 500, max: 120 }))).toMatchObject({
      status: "success",
      amount: 120,
    });
  });

  it("evaluates min and max rules", () => {
    expect(
      evaluateFlowFormulaRule(
        createContext({
          type: "min",
          rules: [
            { type: "fixedAmount", amount: 80 },
            { type: "targetRemainingBeforeThisFlow" },
          ],
        }),
      ),
    ).toMatchObject({ status: "success", amount: 80 });

    expect(
      evaluateFlowFormulaRule(
        createContext({
          type: "max",
          rules: [
            { type: "fixedAmount", amount: 80 },
            { type: "targetRemainingBeforeThisFlow" },
          ],
        }),
      ),
    ).toMatchObject({ status: "success", amount: 100 });
  });

  it("returns diagnostics for invalid rule results", () => {
    expect(evaluateFlowFormulaRule(createContext({ type: "fixedAmount", amount: -1 }))).toMatchObject({
      status: "failure",
      diagnostics: [{ code: "formula.invalidResult" }],
    });
  });
});
