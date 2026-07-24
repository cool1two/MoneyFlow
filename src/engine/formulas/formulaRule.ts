import type { FlowFormulaContext } from "./flowFormulaContext";
import {
  createFlowFormulaFailure,
  createFlowFormulaSuccess,
  type FlowFormulaResult,
} from "./formulaResult";

export type FlowFormulaRule =
  | {
      type: "fixedAmount";
      monthlyAmount: number;
    }
  | {
      type: "percentOfTargetRemainingBeforeThisFlow";
      percent: number;
    }
  | {
      type: "targetRemainingBeforeThisFlow";
    }
  | {
      type: "cappedAmount";
      monthlyAmount: number;
      maxMonthlyAmount: number;
    }
  | {
      type: "min";
      rules: FlowFormulaRule[];
    }
  | {
      type: "max";
      rules: FlowFormulaRule[];
    };

export function evaluateFlowFormulaRule(
  context: FlowFormulaContext,
): FlowFormulaResult {
  const monthlyAmount = evaluateRuleAmount(context.formula.rule, context);

  if (monthlyAmount === undefined) {
    return createFlowFormulaFailure(context.formula.id, context.formula.flowId, [
      {
        code: "formula.invalidRule",
        severity: "error",
        message: `Formula ${context.formula.id} contains an invalid rule.`,
        formulaId: context.formula.id,
        flowId: context.formula.flowId,
      },
    ]);
  }

  return createFlowFormulaSuccess(
    context.formula.id,
    context.formula.flowId,
    monthlyAmount,
  );
}

function evaluateRuleAmount(
  rule: FlowFormulaRule,
  context: FlowFormulaContext,
): number | undefined {
  switch (rule.type) {
    case "fixedAmount":
      return rule.monthlyAmount;
    case "percentOfTargetRemainingBeforeThisFlow":
      return context.variables.targetRemainingBeforeThisFlow * rule.percent;
    case "targetRemainingBeforeThisFlow":
      return context.variables.targetRemainingBeforeThisFlow;
    case "cappedAmount":
      return Math.min(rule.monthlyAmount, rule.maxMonthlyAmount);
    case "min": {
      const amounts = rule.rules.map((item) => evaluateRuleAmount(item, context));
      if (amounts.some((amount) => amount === undefined)) return undefined;
      return Math.min(...(amounts as number[]));
    }
    case "max": {
      const amounts = rule.rules.map((item) => evaluateRuleAmount(item, context));
      if (amounts.some((amount) => amount === undefined)) return undefined;
      return Math.max(...(amounts as number[]));
    }
  }
}
