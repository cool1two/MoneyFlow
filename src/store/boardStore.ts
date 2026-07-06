import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockBoard } from "../data/mockBoard";
import type { BoardState } from "../models/board";

const createId = (prefix: string) => {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
};

type BoardStore = {
  board: BoardState;
  selectedNodeId: string | null;
  addFlow: (source: string, target: string) => void;
  addNode: () => void;
  deleteSelectedNode: () => void;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;
  renameNode: (nodeId: string, name: string) => void;
  selectNode: (nodeId: string | null) => void;
};

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      board: mockBoard,
      selectedNodeId: null,
      addFlow: (source, target) =>
        set((state) => ({
          board: {
            ...state.board,
            flows: [
              ...state.board.flows,
              {
                id: createId("flow"),
                source,
                target,
                amount: 100,
                frequency: "monthly",
              },
            ],
          },
        })),
      addNode: () =>
        set((state) => {
          const nodeNumber = state.board.nodes.length + 1;

          return {
            board: {
              ...state.board,
              nodes: [
                ...state.board.nodes,
                {
                  id: createId("node"),
                  name: `New Node ${nodeNumber}`,
                  position: { x: 140 + nodeNumber * 32, y: 120 + nodeNumber * 24 },
                },
              ],
            },
          };
        }),
      deleteSelectedNode: () =>
        set((state) => {
          if (!state.selectedNodeId) return state;

          return {
            board: {
              ...state.board,
              nodes: state.board.nodes.filter((node) => node.id !== state.selectedNodeId),
              flows: state.board.flows.filter(
                (flow) =>
                  flow.source !== state.selectedNodeId && flow.target !== state.selectedNodeId,
              ),
              externalInflows: state.board.externalInflows.filter(
                (inflow) => inflow.target !== state.selectedNodeId,
              ),
            },
            selectedNodeId: null,
          };
        }),
      moveNode: (nodeId, position) =>
        set((state) => ({
          board: {
            ...state.board,
            nodes: state.board.nodes.map((node) =>
              node.id === nodeId ? { ...node, position } : node,
            ),
          },
        })),
      renameNode: (nodeId, name) =>
        set((state) => ({
          board: {
            ...state.board,
            nodes: state.board.nodes.map((node) =>
              node.id === nodeId ? { ...node, name } : node,
            ),
          },
        })),
      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    }),
    { name: "moneyflow-board" },
  ),
);
