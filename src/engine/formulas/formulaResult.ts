import type { FormulaDiagnostic } from "./formulaLayer";

export type FlowFormulaSuccess = {
  status: "success";
  formulaId: string;
  flowId: string;
  monthlyAmount: number;
  diagnostics: [];
};

export type FlowFormulaFailure = {
  status: "failure";
  formulaId: string;
  flowId: string;
  monthlyAmount: null;
  diagnostics: FormulaDiagnostic[];
};

export type FlowFormulaResult = FlowFormulaSuccess | FlowFormulaFailure;

export function createFlowFormulaSuccess(
  formulaId: string,
  flowId: string,
  monthlyAmount: number,
): FlowFormulaResult {
  if (!Number.isFinite(monthlyAmount) || monthlyAmount < 0) {
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
    monthlyAmount,
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
    monthlyAmount: null,
    diagnostics,
  };
}
