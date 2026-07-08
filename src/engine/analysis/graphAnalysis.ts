import type { BoardState, MoneyFlow } from "../../models/board";

export type GraphCycle = {
  nodeIds: string[];
  flowIds: string[];
};

export type GraphAnalysis = {
  incoming: Map<string, MoneyFlow[]>;
  outgoing: Map<string, MoneyFlow[]>;
  rootNodeIds: string[];
  leafNodeIds: string[];
  topologicalNodeIds: string[];
  cycles: GraphCycle[];
  hasCycles: boolean;
};

export function buildGraphAnalysis(board: BoardState): GraphAnalysis {
  const incoming = createNodeFlowMap(board);
  const outgoing = createNodeFlowMap(board);

  for (const flow of board.flows) {
    outgoing.get(flow.source)?.push(flow);
    incoming.get(flow.target)?.push(flow);
  }

  const cycles = findCycles(board, outgoing);

  return {
    incoming,
    outgoing,
    rootNodeIds: board.nodes
      .filter((node) => (incoming.get(node.id)?.length ?? 0) === 0)
      .map((node) => node.id),
    leafNodeIds: board.nodes
      .filter((node) => (outgoing.get(node.id)?.length ?? 0) === 0)
      .map((node) => node.id),
    topologicalNodeIds: cycles.length > 0 ? [] : getTopologicalNodeIds(board, incoming, outgoing),
    cycles,
    hasCycles: cycles.length > 0,
  };
}

function createNodeFlowMap(board: BoardState) {
  return new Map(board.nodes.map((node) => [node.id, [] as MoneyFlow[]]));
}

function getTopologicalNodeIds(
  board: BoardState,
  incoming: Map<string, MoneyFlow[]>,
  outgoing: Map<string, MoneyFlow[]>,
) {
  const incomingCounts = new Map(
    board.nodes.map((node) => [node.id, incoming.get(node.id)?.length ?? 0]),
  );
  const readyNodeIds = board.nodes
    .filter((node) => incomingCounts.get(node.id) === 0)
    .map((node) => node.id);
  const orderedNodeIds: string[] = [];

  while (readyNodeIds.length > 0) {
    const nodeId = readyNodeIds.shift()!;
    orderedNodeIds.push(nodeId);

    for (const flow of outgoing.get(nodeId) ?? []) {
      const nextIncomingCount = (incomingCounts.get(flow.target) ?? 0) - 1;
      incomingCounts.set(flow.target, nextIncomingCount);

      if (nextIncomingCount === 0) readyNodeIds.push(flow.target);
    }
  }

  return orderedNodeIds;
}

function findCycles(board: BoardState, outgoing: Map<string, MoneyFlow[]>) {
  const cycles: GraphCycle[] = [];
  const cycleKeys = new Set<string>();
  const visitingNodeIds = new Set<string>();
  const visitedNodeIds = new Set<string>();

  const visit = (nodeId: string, nodePath: string[], flowPath: string[]) => {
    if (visitingNodeIds.has(nodeId)) {
      const cycleStart = nodePath.indexOf(nodeId);
      const cycleNodeIds = nodePath.slice(cycleStart);
      const cycleFlowIds = flowPath.slice(cycleStart);
      const cycleKey = getCycleKey(cycleNodeIds);

      if (!cycleKeys.has(cycleKey)) {
        cycleKeys.add(cycleKey);
        cycles.push({ nodeIds: cycleNodeIds, flowIds: cycleFlowIds });
      }

      return;
    }

    if (visitedNodeIds.has(nodeId)) return;

    visitingNodeIds.add(nodeId);

    for (const flow of outgoing.get(nodeId) ?? []) {
      visit(flow.target, [...nodePath, nodeId], [...flowPath, flow.id]);
    }

    visitingNodeIds.delete(nodeId);
    visitedNodeIds.add(nodeId);
  };

  for (const node of board.nodes) {
    visit(node.id, [], []);
  }

  return cycles;
}

function getCycleKey(nodeIds: string[]) {
  if (nodeIds.length === 0) return "";

  const rotations = nodeIds.map((_, index) => [
    ...nodeIds.slice(index),
    ...nodeIds.slice(0, index),
  ]);

  return rotations
    .map((rotation) => rotation.join(">"))
    .sort()[0];
}
