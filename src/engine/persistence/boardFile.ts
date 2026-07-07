import type { BoardState } from "../../models/board";
import type { Frequency } from "../frequency/frequency";

export type BoardFile = {
  version: 1;
  board: BoardState;
};

const frequencies: Frequency[] = [
  "daily",
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
  "quarterly",
  "yearly",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isFrequency = (value: unknown): value is Frequency =>
  isString(value) && frequencies.includes(value as Frequency);

function assertBoardState(value: unknown): BoardState {
  if (!isRecord(value)) throw new Error("Invalid MoneyFlow board structure.");

  const { nodes, flows, externalInflows } = value;

  if (!Array.isArray(nodes) || !Array.isArray(flows) || !Array.isArray(externalInflows)) {
    throw new Error("Invalid MoneyFlow board structure.");
  }

  const nodeIds = new Set<string>();

  for (const node of nodes) {
    if (!isRecord(node) || !isString(node.id) || !isString(node.name)) {
      throw new Error("Invalid node in MoneyFlow board file.");
    }

    if (!isRecord(node.position) || !isNumber(node.position.x) || !isNumber(node.position.y)) {
      throw new Error("Invalid node position in MoneyFlow board file.");
    }

    if (nodeIds.has(node.id)) throw new Error("Duplicate node id in MoneyFlow board file.");
    nodeIds.add(node.id);
  }

  for (const flow of flows) {
    if (
      !isRecord(flow) ||
      !isString(flow.id) ||
      !isString(flow.source) ||
      !isString(flow.target) ||
      !isNumber(flow.amount) ||
      !isFrequency(flow.frequency)
    ) {
      throw new Error("Invalid flow in MoneyFlow board file.");
    }

    if (!nodeIds.has(flow.source) || !nodeIds.has(flow.target)) {
      throw new Error("Flow references an unknown node in MoneyFlow board file.");
    }
  }

  for (const inflow of externalInflows) {
    if (
      !isRecord(inflow) ||
      !isString(inflow.id) ||
      !isString(inflow.target) ||
      !isNumber(inflow.amount) ||
      !isFrequency(inflow.frequency)
    ) {
      throw new Error("Invalid external inflow in MoneyFlow board file.");
    }

    if (!nodeIds.has(inflow.target)) {
      throw new Error("External inflow references an unknown node in MoneyFlow board file.");
    }
  }

  return value as BoardState;
}

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

  return assertBoardState(file.board);
}

export function downloadBoardFile(board: BoardState) {
  const file = createBoardFile(board);
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
