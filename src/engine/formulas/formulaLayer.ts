import type { BoardState } from "../../models/board";
import type { FlowFormulaRule } from "./formulaRule";

export type FlowFormula = {
  id: string;
  flowId: string;
  rule: FlowFormulaRule;
};

export type FormulaLayer = {
  version: 1;
  flowFormulas: FlowFormula[];
};

export type FormulaLayerValidationResult = {
  valid: boolean;
  errors: string[];
};

export type FormulaDiagnostic = {
  code:
    | "formula.blankId"
    | "formula.duplicateId"
    | "formula.blankFlowId"
    | "formula.unknownFlow"
    | "formula.duplicateFlowFormula"
    | "formula.invalidRule"
    | "formula.invalidResult"
    | "formula.blockedByCycle";
  severity: "error";
  message: string;
  formulaId?: string;
  flowId?: string;
};

export function createEmptyFormulaLayer(): FormulaLayer {
  return {
    version: 1,
    flowFormulas: [],
  };
}

export function validateFormulaLayer(
  board: BoardState,
  formulaLayer: FormulaLayer,
): FormulaLayerValidationResult {
  const diagnostics = getFormulaLayerDiagnostics(board, formulaLayer);

  return {
    valid: diagnostics.length === 0,
    errors: diagnostics.map((diagnostic) => diagnostic.message),
  };
}

export function getFormulaLayerDiagnostics(
  board: BoardState,
  formulaLayer: FormulaLayer,
): FormulaDiagnostic[] {
  const diagnostics: FormulaDiagnostic[] = [];
  const flowIds = new Set(board.flows.map((flow) => flow.id));
  const formulaIds = new Set<string>();
  const formulaFlowIds = new Set<string>();

  for (const formula of formulaLayer.flowFormulas) {
    const formulaLabel = formatFormulaId(formula.id);

    if (!formula.id.trim()) {
      diagnostics.push({
        code: "formula.blankId",
        severity: "error",
        message: "Formula id cannot be blank.",
        flowId: formula.flowId,
      });
    }
    if (formulaIds.has(formula.id)) {
      diagnostics.push({
        code: "formula.duplicateId",
        severity: "error",
        message: `Duplicate formula id: ${formula.id}.`,
        formulaId: formula.id,
        flowId: formula.flowId,
      });
    }
    formulaIds.add(formula.id);

    if (!formula.flowId.trim()) {
      diagnostics.push({
        code: "formula.blankFlowId",
        severity: "error",
        message: `Formula ${formulaLabel} flow id cannot be blank.`,
        formulaId: formula.id,
      });
    }
    if (!flowIds.has(formula.flowId)) {
      diagnostics.push({
        code: "formula.unknownFlow",
        severity: "error",
        message: `Formula ${formulaLabel} references an unknown flow.`,
        formulaId: formula.id,
        flowId: formula.flowId,
      });
    }
    if (formulaFlowIds.has(formula.flowId)) {
      diagnostics.push({
        code: "formula.duplicateFlowFormula",
        severity: "error",
        message: `Flow ${formula.flowId} cannot have multiple formulas.`,
        formulaId: formula.id,
        flowId: formula.flowId,
      });
    }
    formulaFlowIds.add(formula.flowId);

    if (!isValidFlowFormulaRule(formula.rule)) {
      diagnostics.push({
        code: "formula.invalidRule",
        severity: "error",
        message: `Formula ${formulaLabel} contains an invalid rule.`,
        formulaId: formula.id,
        flowId: formula.flowId,
      });
    }
  }

  return diagnostics;
}

function formatFormulaId(formulaId: string) {
  return formulaId.trim() ? formulaId : "(blank)";
}

function isValidFlowFormulaRule(rule: FlowFormulaRule): boolean {
  switch (rule.type) {
    case "fixedAmount":
      return isNonNegativeFinite(rule.amount);
    case "percentOfTargetRemainingBeforeThisFlow":
      return isNonNegativeFinite(rule.percent);
    case "targetRemainingBeforeThisFlow":
      return true;
    case "cappedAmount":
      return isNonNegativeFinite(rule.amount) && isNonNegativeFinite(rule.max);
    case "min":
    case "max":
      return rule.rules.length > 0 && rule.rules.every(isValidFlowFormulaRule);
  }
}

function isNonNegativeFinite(value: number) {
  return Number.isFinite(value) && value >= 0;
}
