import { Background, Controls, MiniMap, ReactFlow, type Connection, type NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MoneyNodeCard } from "./components/nodes/MoneyNodeCard";
import { useBoardStore } from "./store/boardStore";
import { toReactFlowEdges, toReactFlowNodes } from "./engine/graph/reactFlowAdapter";

const nodeTypes = {
  moneyNode: MoneyNodeCard,
};


export default function App() {
  const board = useBoardStore((state) => state.board);
  const selectedNodeId = useBoardStore((state) => state.selectedNodeId);
  const addFlow = useBoardStore((state) => state.addFlow);
  const addNode = useBoardStore((state) => state.addNode);
  const deleteSelectedNode = useBoardStore((state) => state.deleteSelectedNode);
  const moveNode = useBoardStore((state) => state.moveNode);
  const renameNode = useBoardStore((state) => state.renameNode);
  const selectNode = useBoardStore((state) => state.selectNode);
  const selectedNode = board.nodes.find((node) => node.id === selectedNodeId);
  const nodes = toReactFlowNodes(board);
  const edges = toReactFlowEdges(board);

  const handleNodesChange = (changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        moveNode(change.id, change.position);
      }
    });
  };

  const handleConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      addFlow(connection.source, connection.target);
    }
  };

  return (
    <main className="canvas-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Early POC</p>
          <h1>MoneyFlow</h1>
        </div>
        <div className="topbar-actions">
          <button className="toolbar-button" type="button" onClick={addNode}>
            Add node
          </button>
          <button
            className="toolbar-button danger"
            type="button"
            onClick={deleteSelectedNode}
            disabled={!selectedNodeId}
          >
            Delete node
          </button>
          <span className="status-pill">Frequency normalized</span>
        </div>
      </header>

      {selectedNode && (
        <aside className="selected-node-editor" aria-label="Selected node editor">
          <label htmlFor="selected-node-name">Node name</label>
          <input
            id="selected-node-name"
            value={selectedNode.name}
            onChange={(event) => renameNode(selectedNode.id, event.target.value)}
          />
        </aside>
      )}

      <section className="canvas-stage" aria-label="MoneyFlow canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onConnect={handleConnect}
          onNodeClick={(_, node) => selectNode(node.id)}
          onPaneClick={() => selectNode(null)}
          fitView
          onNodesChange={handleNodesChange}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </section>
    </main>
  );
}
