import { Background, Controls, MiniMap, ReactFlow, type NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MoneyNodeCard } from "./components/nodes/MoneyNodeCard";
import { useBoardStore } from "./store/boardStore";
import { toReactFlowEdges, toReactFlowNodes } from "./engine/graph/reactFlowAdapter";

const nodeTypes = {
  moneyNode: MoneyNodeCard,
};


export default function App() {
  const board = useBoardStore((state) => state.board);
  const moveNode = useBoardStore((state) => state.moveNode);
  const nodes = toReactFlowNodes(board);
  const edges = toReactFlowEdges(board);

  const handleNodesChange = (changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        moveNode(change.id, change.position);
      }
    });
  };

  return (
    <main className="canvas-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Early POC</p>
          <h1>MoneyFlow</h1>
        </div>
        <span className="status-pill">Frequency normalized</span>
      </header>

      <section className="canvas-stage" aria-label="MoneyFlow canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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
