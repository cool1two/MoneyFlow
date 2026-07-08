import type { BoardState } from "../../models/board";
import type { Frequency } from "../frequency/frequency";

const frequencies: Frequency[] = [
  "daily",
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
  "quarterly",
  "yearly",
];

export type BoardValidationResult = {
  valid: boolean;
  errors: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isKnownFrequency = (frequency: string) =>
  frequencies.includes(frequency as Frequency);

const isFrequency = (value: unknown): value is Frequency =>
  isString(value) && isKnownFrequency(value);

export function parseBoardState(value: unknown): BoardState {
  if (!isRecord(value)) throw new Error("Invalid MoneyFlow board structure.");

  const { nodes, flows, externalInflows } = value;

  if (!Array.isArray(nodes) || !Array.isArray(flows) || !Array.isArray(externalInflows)) {
    throw new Error("Invalid MoneyFlow board structure.");
  }

  const board: BoardState = {
    nodes: nodes.map((node) => {
      if (!isRecord(node) || !isString(node.id) || !isString(node.name)) {
        throw new Error("Invalid node in MoneyFlow board file.");
      }

      if (!isRecord(node.position) || !isNumber(node.position.x) || !isNumber(node.position.y)) {
        throw new Error("Invalid node position in MoneyFlow board file.");
      }

      return {
        id: node.id,
        name: node.name,
        position: { x: node.position.x, y: node.position.y },
      };
    }),
    flows: flows.map((flow) => {
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

      return {
        id: flow.id,
        source: flow.source,
        target: flow.target,
        amount: flow.amount,
        frequency: flow.frequency,
      };
    }),
    externalInflows: externalInflows.map((inflow) => {
      if (
        !isRecord(inflow) ||
        !isString(inflow.id) ||
        !isString(inflow.target) ||
        !isNumber(inflow.amount) ||
        !isFrequency(inflow.frequency)
      ) {
        throw new Error("Invalid external inflow in MoneyFlow board file.");
      }

      return {
        id: inflow.id,
        target: inflow.target,
        amount: inflow.amount,
        frequency: inflow.frequency,
      };
    }),
  };

  assertValidBoard(board);

  return board;
}

export function validateBoard(board: BoardState): BoardValidationResult {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const flowIds = new Set<string>();
  const externalInflowIds = new Set<string>();

  for (const node of board.nodes) {
    if (!node.id.trim()) errors.push("Node id cannot be blank.");
    if (!node.name.trim()) errors.push(`Node ${node.id} name cannot be blank.`);
    if (nodeIds.has(node.id)) errors.push(`Duplicate node id: ${node.id}.`);
    nodeIds.add(node.id);

    if (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)) {
      errors.push(`Node ${node.id} has an invalid position.`);
    }
  }

  for (const flow of board.flows) {
    if (!flow.id.trim()) errors.push("Flow id cannot be blank.");
    if (flowIds.has(flow.id)) errors.push(`Duplicate flow id: ${flow.id}.`);
    flowIds.add(flow.id);

    if (!nodeIds.has(flow.source)) errors.push(`Flow ${flow.id} has an unknown source node.`);
    if (!nodeIds.has(flow.target)) errors.push(`Flow ${flow.id} has an unknown target node.`);
    if (flow.source === flow.target) errors.push(`Flow ${flow.id} cannot connect a node to itself.`);
    if (flow.amount < 0) errors.push(`Flow ${flow.id} amount cannot be negative.`);
    if (!Number.isFinite(flow.amount)) errors.push(`Flow ${flow.id} amount must be finite.`);
    if (!isKnownFrequency(flow.frequency)) errors.push(`Flow ${flow.id} has an unknown frequency.`);
  }

  for (const inflow of board.externalInflows) {
    if (!inflow.id.trim()) errors.push("External inflow id cannot be blank.");
    if (externalInflowIds.has(inflow.id)) {
      errors.push(`Duplicate external inflow id: ${inflow.id}.`);
    }
    externalInflowIds.add(inflow.id);

    if (!nodeIds.has(inflow.target)) {
      errors.push(`External inflow ${inflow.id} has an unknown target node.`);
    }
    if (inflow.amount < 0) errors.push(`External inflow ${inflow.id} amount cannot be negative.`);
    if (!Number.isFinite(inflow.amount)) {
      errors.push(`External inflow ${inflow.id} amount must be finite.`);
    }
    if (!isKnownFrequency(inflow.frequency)) {
      errors.push(`External inflow ${inflow.id} has an unknown frequency.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidBoard(board: BoardState) {
  const result = validateBoard(board);

  if (!result.valid) {
    throw new Error(result.errors[0] ?? "Invalid MoneyFlow board.");
  }
}
