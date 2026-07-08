import type { MonthlyMoneyFlow } from "../graph/boardTotals";
import type { DerivedBoardState } from "../analysis/derivedBoardState";
import type { NodeEvaluationContext } from "../analysis/nodeEvaluationContext";
import type { FlowFormula, FormulaLayer } from "./formulaLayer";

export type FlowFormulaVariables = {
  externalInflow: number;
  incoming: number;
  outgoing: number;
  remaining: number;
  currentAmount: number;
};

export type FlowFormulaContext = {
  formula: FlowFormula;
  flow: MonthlyMoneyFlow;
  sourceNode: NodeEvaluationContext;
  targetNode: NodeEvaluationContext;
  variables: FlowFormulaVariables;
};

export function getFlowFormulaContexts(
  derived: DerivedBoardState,
  formulaLayer: FormulaLayer,
): FlowFormulaContext[] {
  return formulaLayer.flowFormulas.flatMap((formula) => {
    const context = getFlowFormulaContext(derived, formula);

    return context ? [context] : [];
  });
}

export function getFlowFormulaContext(
  derived: DerivedBoardState,
  formula: FlowFormula,
): FlowFormulaContext | undefined {
  const flow = derived.flows.find((item) => item.id === formula.flowId);
  if (!flow) return undefined;

  const sourceNode = derived.nodeEvaluationContexts.find(
    (context) => context.nodeId === flow.source,
  );
  const targetNode = derived.nodeEvaluationContexts.find(
    (context) => context.nodeId === flow.target,
  );

  if (!sourceNode || !targetNode) return undefined;

  return {
    formula,
    flow,
    sourceNode,
    targetNode,
    variables: {
      externalInflow: targetNode.totals.externalInflow,
      incoming: targetNode.totals.inflow,
      outgoing: targetNode.totals.outflow,
      remaining:
        targetNode.totals.externalInflow +
        targetNode.totals.inflow -
        targetNode.totals.outflow,
      currentAmount: flow.monthlyAmount,
    },
  };
}
