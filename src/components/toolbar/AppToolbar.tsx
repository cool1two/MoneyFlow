import { useRef } from "react";
import { downloadBoardFile } from "../../browser/downloadBoardFile";
import { parseBoardFile } from "../../engine/persistence/boardFile";
import type { BoardState } from "../../models/board";

type AppToolbarProps = {
  board: BoardState;
  canDeleteNode: boolean;
  canDeleteTransfer: boolean;
  onAddNode: () => void;
  onClearBoard: () => void;
  onDeleteNode: () => void;
  onDeleteTransfer: () => void;
  onNewBoard: () => void;
  onReplaceBoard: (board: BoardState) => void;
  onResetDemo: () => void;
  versionLabel: string;
};

export function AppToolbar({
  board,
  canDeleteNode,
  canDeleteTransfer,
  onAddNode,
  onClearBoard,
  onDeleteNode,
  onDeleteTransfer,
  onNewBoard,
  onReplaceBoard,
  onResetDemo,
  versionLabel,
}: AppToolbarProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const canExportBoard = board.nodes.length > 0;

  const handleImportBoard = async (file: File | undefined) => {
    if (!file) return;

    try {
      onReplaceBoard(parseBoardFile(await file.text()));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to import board.");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Early POC</p>
        <h1>MoneyFlow</h1>
      </div>
      <div className="topbar-actions">
        <button className="toolbar-button" type="button" onClick={onNewBoard}>
          New board
        </button>
        <button className="toolbar-button" type="button" onClick={onAddNode}>
          Add node
        </button>
        <button className="toolbar-button subtle" type="button" onClick={onClearBoard}>
          Clear board
        </button>
        <button className="toolbar-button subtle" type="button" onClick={onResetDemo}>
          Reset demo
        </button>
        <button
          className="toolbar-button subtle"
          type="button"
          onClick={() => downloadBoardFile(board)}
          disabled={!canExportBoard}
        >
          Export JSON
        </button>
        <input
          ref={importInputRef}
          className="file-input"
          type="file"
          accept="application/json,.json"
          onChange={(event) => void handleImportBoard(event.target.files?.[0])}
        />
        <button
          className="toolbar-button subtle"
          type="button"
          onClick={() => importInputRef.current?.click()}
        >
          Import JSON
        </button>
        <button
          className="toolbar-button danger"
          type="button"
          onClick={onDeleteNode}
          disabled={!canDeleteNode}
        >
          Delete node
        </button>
        <button
          className="toolbar-button danger"
          type="button"
          onClick={onDeleteTransfer}
          disabled={!canDeleteTransfer}
        >
          Delete transfer
        </button>
        <span className="status-pill">{versionLabel}</span>
      </div>
    </header>
  );
}
