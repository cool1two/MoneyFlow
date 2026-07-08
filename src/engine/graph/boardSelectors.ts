import type { BoardState } from "../../models/board";

export function getNodeById(board: BoardState, nodeId: string | null) {
  if (!nodeId) return undefined;

  return board.nodes.find((node) => node.id === nodeId);
}

export function getExternalInflowForNode(board: BoardState, nodeId: string) {
  return board.externalInflows.find((inflow) => inflow.target === nodeId);
}

export function getIncomingFlowsForNode(board: BoardState, nodeId: string) {
  return board.flows.filter((flow) => flow.target === nodeId);
}

export function getConnectedFlowIdsForNode(board: BoardState, nodeId: string) {
  return board.flows
    .filter((flow) => flow.source === nodeId || flow.target === nodeId)
    .map((flow) => flow.id);
}

export function hasFlow(board: BoardState, flowId: string) {
  return board.flows.some((flow) => flow.id === flowId);
}

export function filterExistingFlowIds(board: BoardState, flowIds: string[]) {
  return flowIds.filter((flowId) => hasFlow(board, flowId));
}

export function getNodeName(board: BoardState, nodeId: string) {
  return board.nodes.find((node) => node.id === nodeId)?.name ?? "Unknown node";
}

export function isRootNode(board: BoardState, nodeId: string) {
  return getIncomingFlowsForNode(board, nodeId).length === 0;
}
