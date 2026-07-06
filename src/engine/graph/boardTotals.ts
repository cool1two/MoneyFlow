import type { BoardState } from "../../models/board";
import { toMonthlyAmount } from "../frequency/frequency";

export type MoneyNodeTotals = {
  inflow: number;
  externalInflow: number;
  outflow: number;
};

export type MonthlyMoneyFlow = BoardState["flows"][number] & {
  monthlyAmount: number;
};

export function getMonthlyFlows(board: BoardState): MonthlyMoneyFlow[] {
  return board.flows.map((flow) => ({
    ...flow,
    monthlyAmount: toMonthlyAmount(flow.amount, flow.frequency),
  }));
}

export function getNodeTotals(board: BoardState, nodeId: string): MoneyNodeTotals {
  const externalInflow = board.externalInflows
    .filter((inflow) => inflow.target === nodeId)
    .reduce((total, inflow) => total + toMonthlyAmount(inflow.amount, inflow.frequency), 0);

  return getMonthlyFlows(board).reduce(
    (totals, flow) => {
      if (flow.target === nodeId) totals.inflow += flow.monthlyAmount;
      if (flow.source === nodeId) totals.outflow += flow.monthlyAmount;
      return totals;
    },
    { inflow: externalInflow, externalInflow, outflow: 0 },
  );
}
