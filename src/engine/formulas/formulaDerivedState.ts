import type { MoneyNodeTotals, MonthlyMoneyFlow } from "../graph/boardTotals";
import type { DerivedBoardState, DerivedMoneyNode } from "../analysis/derivedBoardState";
import type { FormulaLayerEvaluation } from "./formulaEvaluation";
import type { FlowFormulaResult, FlowFormulaSuccess } from "./formulaResult";

export type FormulaDerivedState =
  | {
      status: "ready";
      nodes: DerivedMoneyNode[];
      flows: MonthlyMoneyFlow[];
    }
  | {
      status: "blocked";
      nodes: [];
      flows: [];
    };

export function applyFormulaResultsToDerivedState(
  derived: DerivedBoardState,
  evaluation: FormulaLayerEvaluation,
): FormulaDerivedState {
  if (evaluation.status === "blocked") {
    return {
      status: "blocked",
      nodes: [],
      flows: [],
    };
  }

  const formulaAmountsByFlowId = new Map(
    evaluation.results
      .filter(isSuccessfulFormulaResult)
      .map((result) => [result.flowId, result.amount]),
  );
  const flows = derived.flows.map((flow) => {
    const formulaAmount = formulaAmountsByFlowId.get(flow.id);

    return formulaAmount === undefined
      ? flow
      : { ...flow, amount: formulaAmount, monthlyAmount: formulaAmount };
  });

  return {
    status: "ready",
    nodes: derived.nodes.map((node) => ({
      ...node,
      totals: getNodeTotalsFromMonthlyFlows(derived, flows, node.id),
    })),
    flows,
  };
}

function isSuccessfulFormulaResult(
  result: FlowFormulaResult,
): result is FlowFormulaSuccess {
  return result.status === "success";
}

function getNodeTotalsFromMonthlyFlows(
  derived: DerivedBoardState,
  flows: MonthlyMoneyFlow[],
  nodeId: string,
): MoneyNodeTotals {
  return flows.reduce(
    (totals, flow) => {
      if (flow.target === nodeId) totals.inflow += flow.monthlyAmount;
      if (flow.source === nodeId) totals.outflow += flow.monthlyAmount;
      return totals;
    },
    {
      externalInflow:
        derived.nodes.find((node) => node.id === nodeId)?.totals.externalInflow ?? 0,
      inflow: 0,
      outflow: 0,
    },
  );
}
