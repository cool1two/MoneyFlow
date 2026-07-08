import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addFlow,
  addNode,
  commitFlow,
  createEmptyBoard,
  deleteFlow,
  deleteNode,
  moveNode,
  renameNode,
  updateExternalInflow,
  updateFlow,
} from "../engine/graph/boardMutations";
import {
  filterExistingFlowIds,
  getConnectedFlowIdsForNode,
  hasFlow,
} from "../engine/graph/boardSelectors";
import { parseBoardState } from "../engine/graph/boardValidation";
import { mockBoard } from "../data/mockBoard";
import type { BoardState, ExternalInflow, MoneyFlow } from "../models/board";

type BoardStore = {
  board: BoardState;
  draftFlowIds: string[];
  selectedFlowId: string | null;
  selectedNodeId: string | null;
  viewportRevision: number;
  addFlow: (source: string, target: string) => void;
  addNode: () => void;
  clearBoard: () => void;
  commitFlow: (flowId: string) => void;
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

type PersistedBoardStore = {
  board?: unknown;
};

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      board: mockBoard,
      draftFlowIds: [],
      selectedFlowId: null,
      selectedNodeId: null,
      viewportRevision: 0,
      addFlow: (source, target) =>
        set((state) => {
          const board = addFlow(state.board, source, target);
          const existingFlowIds = new Set(state.board.flows.map((flow) => flow.id));
          const newFlow = board.flows.find((flow) => !existingFlowIds.has(flow.id));

          return {
            board,
            draftFlowIds: newFlow
              ? [...state.draftFlowIds, newFlow.id]
              : state.draftFlowIds,
          };
        }),
      addNode: () => set((state) => ({ board: addNode(state.board) })),
      clearBoard: () =>
        set((state) => ({
          board: createEmptyBoard(),
          draftFlowIds: [],
          selectedFlowId: null,
          selectedNodeId: null,
          viewportRevision: state.viewportRevision + 1,
        })),
      commitFlow: (flowId) =>
        set((state) => {
          const isDraft = state.draftFlowIds.includes(flowId);
          const board = isDraft ? state.board : commitFlow(state.board, flowId);

          return {
            board,
            draftFlowIds: hasFlow(board, flowId)
              ? state.draftFlowIds
              : state.draftFlowIds.filter((id) => id !== flowId),
            selectedFlowId: hasFlow(board, flowId)
              ? state.selectedFlowId
              : null,
          };
        }),
      deleteSelectedFlow: () =>
        set((state) => {
          if (!state.selectedFlowId) return state;

          return {
            board: deleteFlow(state.board, state.selectedFlowId),
            draftFlowIds: state.draftFlowIds.filter((id) => id !== state.selectedFlowId),
            selectedFlowId: null,
          };
        }),
      deleteSelectedNode: () =>
        set((state) => {
          if (!state.selectedNodeId) return state;

          const connectedFlowIds = new Set(
            getConnectedFlowIdsForNode(state.board, state.selectedNodeId),
          );

          return {
            board: deleteNode(state.board, state.selectedNodeId),
            draftFlowIds: state.draftFlowIds.filter((id) =>
              !connectedFlowIds.has(id),
            ),
            selectedFlowId: null,
            selectedNodeId: null,
          };
        }),
      moveNode: (nodeId, position) =>
        set((state) => ({ board: moveNode(state.board, nodeId, position) })),
      newBoard: () =>
        set((state) => ({
          board: createEmptyBoard(),
          draftFlowIds: [],
          selectedFlowId: null,
          selectedNodeId: null,
          viewportRevision: state.viewportRevision + 1,
        })),
      renameNode: (nodeId, name) =>
        set((state) => ({ board: renameNode(state.board, nodeId, name) })),
      replaceBoard: (board) =>
        set((state) => ({
          board,
          draftFlowIds: [],
          selectedFlowId: null,
          selectedNodeId: null,
          viewportRevision: state.viewportRevision + 1,
        })),
      resetDemoBoard: () =>
        set((state) => ({
          board: mockBoard,
          draftFlowIds: [],
          selectedFlowId: null,
          selectedNodeId: null,
          viewportRevision: state.viewportRevision + 1,
        })),
      selectFlow: (flowId) => set({ selectedFlowId: flowId, selectedNodeId: null }),
      selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedFlowId: null }),
      updateExternalInflow: (target, updates) =>
        set((state) => ({ board: updateExternalInflow(state.board, target, updates) })),
      updateFlow: (flowId, updates) =>
        set((state) => {
          const board = updateFlow(state.board, flowId, updates);

          return {
            board,
            draftFlowIds:
              updates.amount > 0
                ? filterExistingFlowIds(
                    board,
                    state.draftFlowIds.filter((id) => id !== flowId),
                  )
                : filterExistingFlowIds(board, state.draftFlowIds),
            selectedFlowId: hasFlow(board, flowId)
              ? state.selectedFlowId
              : null,
          };
        }),
    }),
    {
      name: "moneyflow-board",
      partialize: (state) => ({ board: state.board }),
      merge: (persistedState, currentState) => {
        const persistedBoard = (persistedState as PersistedBoardStore | null)?.board;

        try {
          return {
            ...currentState,
            board: persistedBoard ? parseBoardState(persistedBoard) : currentState.board,
          };
        } catch {
          return currentState;
        }
      },
    },
  ),
);
