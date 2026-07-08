import type { BoardState } from "../../models/board";
import type { GraphCycle } from "./graphAnalysis";
import { buildGraphAnalysis } from "./graphAnalysis";

export type EvaluationPlan =
  | {
      status: "ready";
      nodeIds: string[];
      cycles: [];
    }
  | {
      status: "blocked";
      nodeIds: [];
      cycles: GraphCycle[];
    };

export function getEvaluationPlan(board: BoardState): EvaluationPlan {
  const analysis = buildGraphAnalysis(board);

  if (analysis.hasCycles) {
    return {
      status: "blocked",
      nodeIds: [],
      cycles: analysis.cycles,
    };
  }

  return {
    status: "ready",
    nodeIds: analysis.topologicalNodeIds,
    cycles: [],
  };
}
