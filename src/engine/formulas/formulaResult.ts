import type { FormulaDiagnostic } from "./formulaLayer";

export type FlowFormulaSuccess = {
  status: "success";
  formulaId: string;
  flowId: string;
  amount: number;
  diagnostics: [];
};

export type FlowFormulaFailure = {
  status: "failure";
  formulaId: string;
  flowId: string;
  amount: null;
  diagnostics: FormulaDiagnostic[];
};

export type FlowFormulaResult = FlowFormulaSuccess | FlowFormulaFailure;

export function createFlowFormulaSuccess(
  formulaId: string,
  flowId: string,
  amount: number,
): FlowFormulaResult {
  if (!Number.isFinite(amount) || amount < 0) {
    return createFlowFormulaFailure(formulaId, flowId, [
      {
        code: "formula.invalidResult",
        severity: "error",
        message: `Formula ${formulaId} produced an invalid transfer amount.`,
        formulaId,
        flowId,
      },
    ]);
  }

  return {
    status: "success",
    formulaId,
    flowId,
    amount,
    diagnostics: [],
  };
}

export function createFlowFormulaFailure(
  formulaId: string,
  flowId: string,
  diagnostics: FormulaDiagnostic[],
): FlowFormulaResult {
  return {
    status: "failure",
    formulaId,
    flowId,
    amount: null,
    diagnostics,
  };
}
