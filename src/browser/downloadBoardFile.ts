import type { BoardState } from "../models/board";
import { createBoardFile } from "../engine/persistence/boardFile";
import type { FormulaLayer } from "../engine/formulas/formulaLayer";

export function downloadBoardFile(board: BoardState, formulas: FormulaLayer) {
  const file = createBoardFile(board, formulas);
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "moneyflow-board.json";
  link.click();
  URL.revokeObjectURL(url);
}
