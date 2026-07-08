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

export function toReactFlowEdges(board: BoardState, draftFlowIds: string[] = []): Edge[] {
  const monthlyFlows = getMonthlyFlows(board);
  const maxMonthlyFlow = Math.max(1, ...monthlyFlows.map((flow) => flow.monthlyAmount));
  const draftFlowIdSet = new Set(draftFlowIds);

  return monthlyFlows.map((flow) => ({
    id: flow.id,
    source: flow.source,
    target: flow.target,
    label: draftFlowIdSet.has(flow.id) || flow.amount <= 0
      ? "Set inflow"
      : `${formatMoney(flow.monthlyAmount)}/mo (${formatMoney(flow.amount)} ${formatFrequency(flow.frequency)})`,
    animated: true,
    type: "smoothstep",
    style: {
      strokeWidth:
        flow.monthlyAmount > 0
          ? Math.max(2, Math.round((flow.monthlyAmount / maxMonthlyFlow) * 9))
          : 2,
    },
  }));
}
