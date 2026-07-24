import type { BoardState } from "../../models/board";
import { assertValidBoard } from "../graph/boardValidation";
import {
  createEmptyFormulaLayer,
  getFormulaLayerDiagnostics,
  type FormulaLayer,
} from "../formulas/formulaLayer";
import {
  moneyFlowDocumentV1Schema,
  moneyFlowDocumentV2Schema,
} from "./documentSchema";

export type MoneyFlowDocument = {
  version: 2;
  board: BoardState;
  formulas: FormulaLayer;
};

export function createBoardFile(
  board: BoardState,
  formulas: FormulaLayer = createEmptyFormulaLayer(),
): MoneyFlowDocument {
  return {
    version: 2,
    board,
    formulas,
  };
}

export function parseBoardFile(text: string): MoneyFlowDocument {
  let input: unknown;

  try {
    input = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Invalid MoneyFlow JSON document.");
  }

  const version = getDocumentVersion(input);
  const document =
    version === 1
      ? migrateVersion1(input)
      : version === 2
        ? parseVersion2(input)
        : undefined;

  if (!document) {
    throw new Error("Unsupported MoneyFlow board file.");
  }

  assertValidBoard(document.board);
  const formulaDiagnostics = getFormulaLayerDiagnostics(
    document.board,
    document.formulas,
  );

  if (formulaDiagnostics.length > 0) {
    throw new Error(formulaDiagnostics[0].message);
  }

  return document;
}

function getDocumentVersion(input: unknown): unknown {
  return typeof input === "object" && input !== null && "version" in input
    ? input.version
    : undefined;
}

function migrateVersion1(input: unknown): MoneyFlowDocument {
  const parsed = moneyFlowDocumentV1Schema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid MoneyFlow version 1 document structure.");
  }

  return {
    version: 2,
    board: parsed.data.board,
    formulas: createEmptyFormulaLayer(),
  };
}

function parseVersion2(input: unknown): MoneyFlowDocument {
  const parsed = moneyFlowDocumentV2Schema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid MoneyFlow version 2 document structure.");
  }

  return parsed.data;
}
