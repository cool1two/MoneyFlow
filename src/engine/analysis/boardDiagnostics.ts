import type { BoardState } from "../../models/board";
import { buildGraphAnalysis } from "./graphAnalysis";

export type BoardDiagnosticSeverity = "info" | "warning" | "error";

export type BoardDiagnostic = {
  code: "graph.cycle";
  severity: BoardDiagnosticSeverity;
  message: string;
  nodeIds: string[];
  flowIds: string[];
};

export function getBoardDiagnostics(board: BoardState): BoardDiagnostic[] {
  const analysis = buildGraphAnalysis(board);

  return analysis.cycles.map((cycle) => ({
    code: "graph.cycle",
    severity: "error",
    message: "Cycle detected. MoneyFlow cannot determine a stable evaluation order for this loop.",
    nodeIds: cycle.nodeIds,
    flowIds: cycle.flowIds,
  }));
}
