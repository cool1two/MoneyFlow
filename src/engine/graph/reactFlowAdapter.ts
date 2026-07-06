import type { Edge, Node } from "@xyflow/react";
import type { BoardState } from "../../models/board";
import { formatMoney } from "../../utils/formatMoney";
import { getMonthlyFlows, getNodeTotals } from "./boardTotals";

export type MoneyNodeData = {
  name: string;
  inflow: number;
  externalInflow: number;
  outflow: number;
};

export type MoneyFlowNode = Node<MoneyNodeData, "moneyNode">;

const formatFrequency = (frequency: string) =>
  frequency.replace(/^./, (letter) => letter.toUpperCase());

export function toReactFlowNodes(board: BoardState): MoneyFlowNode[] {
  return board.nodes.map((node) => ({
    id: node.id,
    type: "moneyNode",
    position: node.position,
    data: { name: node.name, ...getNodeTotals(board, node.id) },
  }));
}

export function toReactFlowEdges(board: BoardState): Edge[] {
  const monthlyFlows = getMonthlyFlows(board);
  const maxMonthlyFlow = Math.max(...monthlyFlows.map((flow) => flow.monthlyAmount));

  return monthlyFlows.map((flow) => ({
    id: flow.id,
    source: flow.source,
    target: flow.target,
    label: `${formatMoney(flow.monthlyAmount)}/mo (${formatMoney(flow.amount)} ${formatFrequency(flow.frequency)})`,
    animated: true,
    type: "smoothstep",
    style: { strokeWidth: Math.max(2, Math.round((flow.monthlyAmount / maxMonthlyFlow) * 9)) },
  }));
}
