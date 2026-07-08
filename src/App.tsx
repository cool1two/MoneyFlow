import "@xyflow/react/dist/style.css";
import { MoneyFlowCanvas } from "./components/canvas/MoneyFlowCanvas";
import { InspectorPanel } from "./components/inspector/InspectorPanel";
import { AppToolbar } from "./components/toolbar/AppToolbar";
import { useBoardStore } from "./store/boardStore";

const versionLabel = "Milestone 6.0.0";

export default function App() {
  const board = useBoardStore((state) => state.board);
  const draftFlowIds = useBoardStore((state) => state.draftFlowIds);
  const selectedFlowId = useBoardStore((state) => state.selectedFlowId);
  const selectedNodeId = useBoardStore((state) => state.selectedNodeId);
  const viewportRevision = useBoardStore((state) => state.viewportRevision);
  const addFlow = useBoardStore((state) => state.addFlow);
  const addNode = useBoardStore((state) => state.addNode);
  const clearBoard = useBoardStore((state) => state.clearBoard);
  const commitFlow = useBoardStore((state) => state.commitFlow);
  const deleteSelectedFlow = useBoardStore((state) => state.deleteSelectedFlow);
  const deleteSelectedNode = useBoardStore((state) => state.deleteSelectedNode);
  const moveNode = useBoardStore((state) => state.moveNode);
  const newBoard = useBoardStore((state) => state.newBoard);
  const renameNode = useBoardStore((state) => state.renameNode);
  const replaceBoard = useBoardStore((state) => state.replaceBoard);
  const resetDemoBoard = useBoardStore((state) => state.resetDemoBoard);
  const selectFlow = useBoardStore((state) => state.selectFlow);
  const selectNode = useBoardStore((state) => state.selectNode);
  const updateExternalInflow = useBoardStore((state) => state.updateExternalInflow);
  const updateFlow = useBoardStore((state) => state.updateFlow);

  return (
    <main className="canvas-shell">
      <AppToolbar
        board={board}
        canDeleteNode={Boolean(selectedNodeId)}
        canDeleteTransfer={Boolean(selectedFlowId)}
        onAddNode={addNode}
        onClearBoard={clearBoard}
        onDeleteNode={deleteSelectedNode}
        onDeleteTransfer={deleteSelectedFlow}
        onNewBoard={newBoard}
        onReplaceBoard={replaceBoard}
        onResetDemo={resetDemoBoard}
        versionLabel={versionLabel}
      />

      <div className="workspace">
        <MoneyFlowCanvas
          board={board}
          draftFlowIds={draftFlowIds}
          viewportRevision={viewportRevision}
          onConnectNodes={addFlow}
          onMoveNode={moveNode}
          onSelectFlow={selectFlow}
          onSelectNode={selectNode}
        />
        <InspectorPanel
          board={board}
          selectedNodeId={selectedNodeId}
          onCommitFlow={commitFlow}
          onRenameNode={renameNode}
          onUpdateExternalInflow={updateExternalInflow}
          onUpdateFlow={updateFlow}
        />
      </div>
    </main>
  );
}
