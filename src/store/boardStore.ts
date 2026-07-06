import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mockBoard } from "../data/mockBoard";
import type { BoardState } from "../models/board";

type BoardStore = {
  board: BoardState;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;
};

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({
      board: mockBoard,
      moveNode: (nodeId, position) =>
        set((state) => ({
          board: {
            ...state.board,
            nodes: state.board.nodes.map((node) =>
              node.id === nodeId ? { ...node, position } : node,
            ),
          },
        })),
    }),
    { name: "moneyflow-board" },
  ),
);
