import type { ExternalInflow } from "../../models/board";
import { toMonthlyAmount } from "../frequency/frequency";
import type { MonthlyMoneyFlow, MoneyNodeTotals } from "../graph/boardTotals";
import type { DerivedBoardState } from "./derivedBoardState";

export type MonthlyExternalInflow = ExternalInflow & {
  monthlyAmount: number;
};

export type NodeEvaluationContext = {
  nodeId: string;
  externalInflows: MonthlyExternalInflow[];
  incomingTransfers: MonthlyMoneyFlow[];
  outgoingTransfers: MonthlyMoneyFlow[];
  totals: MoneyNodeTotals;
};

export function getNodeEvaluationContext(
  derived: DerivedBoardState,
  nodeId: string,
): NodeEvaluationContext | undefined {
  const node = derived.nodes.find((item) => item.id === nodeId);
  if (!node) return undefined;

  return {
    nodeId,
    externalInflows: derived.board.externalInflows
      .filter((inflow) => inflow.target === nodeId)
      .map((inflow) => ({
        ...inflow,
        monthlyAmount: toMonthlyAmount(inflow.amount, inflow.frequency),
      })),
    incomingTransfers: derived.flows.filter((flow) => flow.target === nodeId),
    outgoingTransfers: derived.flows.filter((flow) => flow.source === nodeId),
    totals: node.totals,
  };
}

export function getNodeEvaluationContexts(
  derived: DerivedBoardState,
): NodeEvaluationContext[] {
  return derived.nodes.map((node) => getNodeEvaluationContext(derived, node.id)!);
}
