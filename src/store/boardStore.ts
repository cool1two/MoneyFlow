import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addFlow,
  addNode,
  createEmptyBoard,
  deleteFlow,
  deleteNode,
  moveNode,
  renameNode,
  updateExternalInflow,
  updateFlow,
} from "../engine/graph/boardMutations";
import { mockBoard } from "../data/mockBoard";
import type { BoardState, ExternalInflow, MoneyFlow } from "../models/board";

type BoardStore = {
  board: BoardState;
  selectedFlowId: string | null;
  selectedNodeId: string | null;
  addFlow: (source: string, target: string) => void;
  addNode: () => void;
  clearBoard: () => void;
  deleteSelectedFlow: () => void;
  deleteSelectedNode: () => void;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;
  newBoard: () => void;
  renameNode: (nodeId: string, name: string) => void;
  replaceBoard: (board: BoardState) => void;
  resetDemoBoard: () => void;
  selectFlow: (flowId: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  updateExternalInflow: (target: string, updates: Pick<ExternalInflow, "amount" | "frequency">) => void;
  updateFlow: (flowId: string, updates: Pick<MoneyFlow, "amount" | "frequency">) => void;
};

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      board: mockBoard,
      selectedFlowId: null,
      selectedNodeId: null,
      addFlow: (source, target) =>
        set((state) => ({ board: addFlow(state.board, source, target) })),
      addNode: () => set((state) => ({ board: addNode(state.board) })),
      clearBoard: () => set({ board: createEmptyBoard(), selectedFlowId: null, selectedNodeId: null }),
      deleteSelectedFlow: () =>
        set((state) => {
          if (!state.selectedFlowId) return state;

          return {
            board: deleteFlow(state.board, state.selectedFlowId),
            selectedFlowId: null,
          };
        }),
      deleteSelectedNode: () =>
        set((state) => {
          if (!state.selectedNodeId) return state;

          return {
            board: deleteNode(state.board, state.selectedNodeId),
            selectedFlowId: null,
            selectedNodeId: null,
          };
        }),
      moveNode: (nodeId, position) =>
        set((state) => ({ board: moveNode(state.board, nodeId, position) })),
      newBoard: () => set({ board: createEmptyBoard(), selectedFlowId: null, selectedNodeId: null }),
      renameNode: (nodeId, name) =>
        set((state) => ({ board: renameNode(state.board, nodeId, name) })),
      replaceBoard: (board) => set({ board, selectedFlowId: null, selectedNodeId: null }),
      resetDemoBoard: () => set({ board: mockBoard, selectedFlowId: null, selectedNodeId: null }),
      selectFlow: (flowId) => set({ selectedFlowId: flowId, selectedNodeId: null }),
      selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedFlowId: null }),
      updateExternalInflow: (target, updates) =>
        set((state) => ({ board: updateExternalInflow(state.board, target, updates) })),
      updateFlow: (flowId, updates) =>
        set((state) => {
          const board = updateFlow(state.board, flowId, updates);

          return {
            board,
            selectedFlowId: board.flows.some((flow) => flow.id === flowId)
              ? state.selectedFlowId
              : null,
          };
        }),
    }),
    { name: "moneyflow-board" },
  ),
);
