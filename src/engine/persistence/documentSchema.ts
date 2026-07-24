import { z } from "zod";
import type { BoardState } from "../../models/board";
import type { FormulaLayer } from "../formulas/formulaLayer";
import type { FlowFormulaRule } from "../formulas/formulaRule";
import { assertValidBoard } from "../graph/boardValidation";

const frequencySchema = z.enum([
  "daily",
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const boardStateSchema: z.ZodType<BoardState> = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
    }),
  ),
  flows: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      amount: z.number(),
      frequency: frequencySchema,
    }),
  ),
  externalInflows: z.array(
    z.object({
      id: z.string(),
      target: z.string(),
      amount: z.number(),
      frequency: frequencySchema,
    }),
  ),
});

export const flowFormulaRuleSchema: z.ZodType<FlowFormulaRule> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("fixedAmount"),
      monthlyAmount: z.number(),
    }),
    z.object({
      type: z.literal("percentOfTargetRemainingBeforeThisFlow"),
      percent: z.number(),
    }),
    z.object({
      type: z.literal("targetRemainingBeforeThisFlow"),
    }),
    z.object({
      type: z.literal("cappedAmount"),
      monthlyAmount: z.number(),
      maxMonthlyAmount: z.number(),
    }),
    z.object({
      type: z.literal("min"),
      rules: z.array(flowFormulaRuleSchema),
    }),
    z.object({
      type: z.literal("max"),
      rules: z.array(flowFormulaRuleSchema),
    }),
  ]),
);

export const formulaLayerSchema: z.ZodType<FormulaLayer> = z.object({
  version: z.literal(1),
  flowFormulas: z.array(
    z.object({
      id: z.string(),
      flowId: z.string(),
      rule: flowFormulaRuleSchema,
    }),
  ),
});

export const moneyFlowDocumentV1Schema = z.object({
  version: z.literal(1),
  board: boardStateSchema,
});

export const moneyFlowDocumentV2Schema = z.object({
  version: z.literal(2),
  board: boardStateSchema,
  formulas: formulaLayerSchema,
});

export function parseBoardState(value: unknown): BoardState {
  const parsed = boardStateSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error("Invalid MoneyFlow board structure.");
  }

  const board: BoardState = {
    ...parsed.data,
    externalInflows: parsed.data.externalInflows.filter((inflow) => inflow.amount > 0),
  };

  assertValidBoard(board);
  return board;
}
