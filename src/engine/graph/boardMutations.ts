import type { BoardState, ExternalInflow, MoneyFlow } from "../../models/board";
import { assertValidBoard } from "./boardValidation";

const createId = (prefix: string) => {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
};

export function createEmptyBoard(): BoardState {
  return {
    nodes: [],
    flows: [],
    externalInflows: [],
  };
}

export function addNode(board: BoardState): BoardState {
  const nodeNumber = board.nodes.length + 1;

  return {
    ...board,
    nodes: [
      ...board.nodes,
      {
        id: createId("node"),
        name: `New Node ${nodeNumber}`,
        position: { x: 140 + nodeNumber * 32, y: 120 + nodeNumber * 24 },
      },
    ],
  };
}

export function addFlow(board: BoardState, source: string, target: string): BoardState {
  const nextBoard: BoardState = {
    ...board,
    flows: [
      ...board.flows,
      {
        id: createId("flow"),
        source,
        target,
        amount: 0,
        frequency: "monthly",
      },
    ],
  };

  assertValidBoard(nextBoard);

  return nextBoard;
}

export function deleteNode(board: BoardState, nodeId: string): BoardState {
  return {
    ...board,
    nodes: board.nodes.filter((node) => node.id !== nodeId),
    flows: board.flows.filter(
      (flow) => flow.source !== nodeId && flow.target !== nodeId,
    ),
    externalInflows: board.externalInflows.filter((inflow) => inflow.target !== nodeId),
  };
}

export function deleteFlow(board: BoardState, flowId: string): BoardState {
  return {
    ...board,
    flows: board.flows.filter((flow) => flow.id !== flowId),
  };
}

export function commitFlow(board: BoardState, flowId: string): BoardState {
  const flow = board.flows.find((item) => item.id === flowId);

  if (flow && flow.amount <= 0) {
    return deleteFlow(board, flowId);
  }

  return board;
}

export function moveNode(
  board: BoardState,
  nodeId: string,
  position: { x: number; y: number },
): BoardState {
  return {
    ...board,
    nodes: board.nodes.map((node) =>
      node.id === nodeId ? { ...node, position } : node,
    ),
  };
}

export function updateExternalInflow(
  board: BoardState,
  target: string,
  updates: Pick<ExternalInflow, "amount" | "frequency">,
): BoardState {
  const existingInflow = board.externalInflows.find((inflow) => inflow.target === target);

  if (updates.amount <= 0) {
    return {
      ...board,
      externalInflows: board.externalInflows.filter((inflow) => inflow.target !== target),
    };
  }

  if (!existingInflow) {
    return {
      ...board,
      externalInflows: [
        ...board.externalInflows,
        { id: createId("external"), target, ...updates },
      ],
    };
  }

  return {
    ...board,
    externalInflows: board.externalInflows.map((inflow) =>
      inflow.id === existingInflow.id ? { ...inflow, ...updates } : inflow,
    ),
  };
}

export function updateFlow(
  board: BoardState,
  flowId: string,
  updates: Pick<MoneyFlow, "amount" | "frequency">,
): BoardState {
  return {
    ...board,
    flows: board.flows.map((flow) =>
      flow.id === flowId ? { ...flow, ...updates } : flow,
    ),
  };
}

export function renameNode(board: BoardState, nodeId: string, name: string): BoardState {
  return {
    ...board,
    nodes: board.nodes.map((node) =>
      node.id === nodeId ? { ...node, name } : node,
    ),
  };
}
