import type { Frequency } from "../engine/frequency/frequency";

export type MoneyNode = {
  id: string;
  name: string;
  position: { x: number; y: number };
};

export type MoneyFlow = {
  id: string;
  source: string;
  target: string;
  amount: number;
  frequency: Frequency;
  isDraft?: boolean;
};

export type ExternalInflow = {
  id: string;
  target: string;
  amount: number;
  frequency: Frequency;
};

export type BoardState = {
  nodes: MoneyNode[];
  flows: MoneyFlow[];
  externalInflows: ExternalInflow[];
};
