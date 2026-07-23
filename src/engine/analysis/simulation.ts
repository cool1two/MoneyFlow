import type { BoardDiagnostic } from "./boardDiagnostics";
import type { DerivedBoardState } from "./derivedBoardState";
import type { FormulaDerivedState } from "../formulas/formulaDerivedState";
import type { NodeEvaluationContext } from "./nodeEvaluationContext";

export type SimulationNodeSnapshot = {
  nodeId: string;
  externalInflow: number;
  inflow: number;
  outflow: number;
  remaining: number;
};

export type SimulationResult =
  | {
      status: "ready";
      nodes: SimulationNodeSnapshot[];
      diagnostics: BoardDiagnostic[];
    }
  | {
      status: "blocked";
      nodes: [];
      diagnostics: BoardDiagnostic[];
    };

export function simulateDerivedBoard(derived: DerivedBoardState): SimulationResult {
  if (derived.evaluation.status === "blocked") {
    return {
      status: "blocked",
      nodes: [],
      diagnostics: derived.diagnostics,
    };
  }

  const contextsByNodeId = new Map(
    derived.nodeEvaluationContexts.map((context) => [context.nodeId, context]),
  );

  return {
    status: "ready",
    nodes: derived.evaluation.nodeIds.map((nodeId) =>
      toSimulationNodeSnapshot(contextsByNodeId.get(nodeId)!),
    ),
    diagnostics: derived.diagnostics,
  };
}

export function simulateFormulaDerivedState(
  formulaDerived: FormulaDerivedState,
): SimulationResult {
  if (formulaDerived.status === "blocked") {
    return {
      status: "blocked",
      nodes: [],
      diagnostics: [],
    };
  }

  return {
    status: "ready",
    nodes: formulaDerived.nodes.map((node) => ({
      nodeId: node.id,
      externalInflow: node.totals.externalInflow,
      inflow: node.totals.inflow,
      outflow: node.totals.outflow,
      remaining: node.totals.externalInflow + node.totals.inflow - node.totals.outflow,
    })),
    diagnostics: [],
  };
}

function toSimulationNodeSnapshot(
  context: NodeEvaluationContext,
): SimulationNodeSnapshot {
  return {
    nodeId: context.nodeId,
    externalInflow: context.totals.externalInflow,
    inflow: context.totals.inflow,
    outflow: context.totals.outflow,
    remaining: context.totals.externalInflow + context.totals.inflow - context.totals.outflow,
  };
}
