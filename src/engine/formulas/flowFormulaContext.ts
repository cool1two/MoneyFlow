import type { MonthlyMoneyFlow } from "../graph/boardTotals";
import type { DerivedBoardState } from "../analysis/derivedBoardState";
import type { NodeEvaluationContext } from "../analysis/nodeEvaluationContext";
import type { FlowFormula, FormulaLayer } from "./formulaLayer";

export type FlowFormulaVariables = {
  targetExternalInflow: number;
  targetIncomingBeforeThisFlow: number;
  targetOutgoing: number;
  targetRemainingBeforeThisFlow: number;
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
      targetExternalInflow: targetNode.totals.externalInflow,
      targetIncomingBeforeThisFlow: targetNode.totals.inflow - flow.monthlyAmount,
      targetOutgoing: targetNode.totals.outflow,
      targetRemainingBeforeThisFlow:
        targetNode.totals.externalInflow +
        targetNode.totals.inflow -
        flow.monthlyAmount -
        targetNode.totals.outflow,
      currentAmount: flow.monthlyAmount,
    },
  };
}
