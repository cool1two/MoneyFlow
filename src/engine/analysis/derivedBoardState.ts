import type { BoardState } from "../../models/board";
import type { BoardDiagnostic } from "./boardDiagnostics";
import { getBoardDiagnostics } from "./boardDiagnostics";
import { getEvaluationPlan } from "./evaluationPlan";
import type { NodeEvaluationContext } from "./nodeEvaluationContext";
import { getNodeEvaluationContexts } from "./nodeEvaluationContext";
import type { MonthlyMoneyFlow, MoneyNodeTotals } from "../graph/boardTotals";
import { getMonthlyFlows, getNodeTotals } from "../graph/boardTotals";

export type DerivedMoneyNode = BoardState["nodes"][number] & {
  totals: MoneyNodeTotals;
};

export type DiagnosticSummary = {
  hasErrors: boolean;
  bySeverity: Record<BoardDiagnostic["severity"], BoardDiagnostic[]>;
  byCode: Partial<Record<BoardDiagnostic["code"], BoardDiagnostic[]>>;
};

export type DerivedBoardState = {
  board: BoardState;
  nodes: DerivedMoneyNode[];
  flows: MonthlyMoneyFlow[];
  nodeEvaluationContexts: NodeEvaluationContext[];
  diagnostics: BoardDiagnostic[];
  diagnosticSummary: DiagnosticSummary;
  evaluation:
    | {
        status: "ready";
        nodeIds: string[];
      }
    | {
        status: "blocked";
        nodeIds: [];
      };
};

export function deriveBoardState(board: BoardState): DerivedBoardState {
  const evaluationPlan = getEvaluationPlan(board);
  const diagnostics = getBoardDiagnostics(board);
  const derived: DerivedBoardState = {
    board,
    nodes: board.nodes.map((node) => ({
      ...node,
      totals: getNodeTotals(board, node.id),
    })),
    flows: getMonthlyFlows(board),
    diagnostics,
    diagnosticSummary: summarizeDiagnostics(diagnostics),
    evaluation:
      evaluationPlan.status === "ready"
        ? { status: "ready", nodeIds: evaluationPlan.nodeIds }
        : { status: "blocked", nodeIds: [] },
    nodeEvaluationContexts: [],
  };

  return {
    ...derived,
    nodeEvaluationContexts: getNodeEvaluationContexts(derived),
  };
}

function summarizeDiagnostics(diagnostics: BoardDiagnostic[]): DiagnosticSummary {
  const bySeverity: DiagnosticSummary["bySeverity"] = {
    info: [],
    warning: [],
    error: [],
  };
  const byCode: DiagnosticSummary["byCode"] = {};

  for (const diagnostic of diagnostics) {
    bySeverity[diagnostic.severity].push(diagnostic);
    byCode[diagnostic.code] = [...(byCode[diagnostic.code] ?? []), diagnostic];
  }

  return {
    hasErrors: bySeverity.error.length > 0,
    bySeverity,
    byCode,
  };
}
