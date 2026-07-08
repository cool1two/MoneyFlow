import type { BoardState } from "../../models/board";
import { parseBoardState } from "../graph/boardValidation";

export type BoardFile = {
  version: 1;
  board: BoardState;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function createBoardFile(board: BoardState): BoardFile {
  return {
    version: 1,
    board,
  };
}

export function parseBoardFile(text: string): BoardState {
  const file = JSON.parse(text) as unknown;

  if (!isRecord(file) || file.version !== 1 || !("board" in file)) {
    throw new Error("Unsupported MoneyFlow board file.");
  }

  return parseBoardState(file.board);
}
