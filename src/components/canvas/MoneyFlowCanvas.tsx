import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  type Connection,
  type NodeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import type { BoardState } from "../../models/board";
import { MoneyNodeCard } from "../nodes/MoneyNodeCard";
import {
  toReactFlowEdges,
  toReactFlowNodes,
  type MoneyFlowNode,
} from "../../engine/graph/reactFlowAdapter";

const nodeTypes = {
  moneyNode: MoneyNodeCard,
};

type MoneyFlowCanvasProps = {
  board: BoardState;
  draftFlowIds: string[];
  viewportRevision: number;
  onConnectNodes: (source: string, target: string) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onSelectFlow: (flowId: string | null) => void;
  onSelectNode: (nodeId: string | null) => void;
};

export function MoneyFlowCanvas({
  board,
  draftFlowIds,
  viewportRevision,
  onConnectNodes,
  onMoveNode,
  onSelectFlow,
  onSelectNode,
}: MoneyFlowCanvasProps) {
  const boardNodes = useMemo(() => toReactFlowNodes(board), [board]);
  const edges = useMemo(() => toReactFlowEdges(board, draftFlowIds), [board, draftFlowIds]);
  const [flowNodes, setFlowNodes] = useState<MoneyFlowNode[]>(boardNodes);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    setFlowNodes((currentNodes) =>
      boardNodes.map((node) => {
        const currentNode = currentNodes.find((item) => item.id === node.id);

        return currentNode
          ? { ...currentNode, ...node, position: node.position }
          : node;
      }),
    );
  }, [boardNodes]);

  useEffect(() => {
    if (!flowInstance || boardNodes.length === 0) return;

    window.requestAnimationFrame(() => {
      void flowInstance.fitView({ padding: 0.2, duration: 200 });
    });
  }, [boardNodes.length, flowInstance, viewportRevision]);

  const handleConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      onConnectNodes(connection.source, connection.target);
    }
  };

  const handleNodesChange = (changes: NodeChange[]) => {
    setFlowNodes((currentNodes) =>
      applyNodeChanges(changes, currentNodes) as MoneyFlowNode[],
    );

    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        onMoveNode(change.id, change.position);
      }
    });
  };

  return (
    <section className="canvas-stage" aria-label="MoneyFlow canvas">
      <ReactFlow
        nodes={flowNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onConnect={handleConnect}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onEdgeClick={(_, edge) => onSelectFlow(edge.id)}
        onPaneClick={() => onSelectNode(null)}
        onInit={setFlowInstance}
        fitView
        onNodesChange={handleNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </section>
  );
}
