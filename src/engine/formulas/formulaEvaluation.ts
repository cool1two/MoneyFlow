import type { DerivedBoardState } from "../analysis/derivedBoardState";
import { getFlowFormulaContexts } from "./flowFormulaContext";
import {
  getFormulaLayerDiagnostics,
  type FormulaDiagnostic,
  type FormulaLayer,
} from "./formulaLayer";
import { evaluateFlowFormulaRule } from "./formulaRule";
import type { FlowFormulaResult } from "./formulaResult";

export type FormulaLayerEvaluation =
  | {
      status: "ready";
      results: FlowFormulaResult[];
      diagnostics: FormulaDiagnostic[];
    }
  | {
      status: "blocked";
      results: [];
      diagnostics: FormulaDiagnostic[];
    };

export function evaluateFormulaLayer(
  derived: DerivedBoardState,
  formulaLayer: FormulaLayer,
): FormulaLayerEvaluation {
  const formulaLayerDiagnostics = getFormulaLayerDiagnostics(derived.board, formulaLayer);

  if (formulaLayerDiagnostics.length > 0) {
    return {
      status: "blocked",
      results: [],
      diagnostics: formulaLayerDiagnostics,
    };
  }

  if (derived.evaluation.status === "blocked") {
    return {
      status: "blocked",
      results: [],
      diagnostics: [
        {
          code: "formula.blockedByCycle",
          severity: "error",
          message: "Formula evaluation is blocked by a cycle in the visible graph.",
        },
      ],
    };
  }

  const results = getFlowFormulaContexts(derived, formulaLayer).map((context) =>
    evaluateFlowFormulaRule(context),
  );
  const diagnostics = results.flatMap((result) => result.diagnostics);

  if (diagnostics.length > 0) {
    return {
      status: "blocked",
      results: [],
      diagnostics,
    };
  }

  return {
    status: "ready",
    results,
    diagnostics: [],
  };
}
