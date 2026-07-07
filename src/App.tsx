import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  type Connection,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MoneyNodeCard } from "./components/nodes/MoneyNodeCard";
import type { Frequency } from "./engine/frequency/frequency";
import {
  toReactFlowEdges,
  toReactFlowNodes,
  type MoneyFlowNode,
} from "./engine/graph/reactFlowAdapter";
import { downloadBoardFile, parseBoardFile } from "./engine/persistence/boardFile";
import { useBoardStore } from "./store/boardStore";

const nodeTypes = {
  moneyNode: MoneyNodeCard,
};

export default function App() {
  const board = useBoardStore((state) => state.board);
  const selectedFlowId = useBoardStore((state) => state.selectedFlowId);
  const selectedNodeId = useBoardStore((state) => state.selectedNodeId);
  const addFlow = useBoardStore((state) => state.addFlow);
  const addNode = useBoardStore((state) => state.addNode);
  const clearBoard = useBoardStore((state) => state.clearBoard);
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
  const importInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = board.nodes.find((node) => node.id === selectedNodeId);
  const selectedExternalInflow = selectedNode
    ? board.externalInflows.find((inflow) => inflow.target === selectedNode.id)
    : undefined;
  const selectedIncomingFlows = selectedNode
    ? board.flows.filter((flow) => flow.target === selectedNode.id)
    : [];
  const isRootNode = selectedIncomingFlows.length === 0;
  const getNodeName = (nodeId: string) =>
    board.nodes.find((node) => node.id === nodeId)?.name ?? "Unknown node";
  const boardNodes = useMemo(() => toReactFlowNodes(board), [board]);
  const edges = useMemo(() => toReactFlowEdges(board), [board]);
  const [flowNodes, setFlowNodes] = useState<MoneyFlowNode[]>(boardNodes);

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

  const handleNodesChange = (changes: NodeChange[]) => {
    setFlowNodes((currentNodes) =>
      applyNodeChanges(changes, currentNodes) as MoneyFlowNode[],
    );

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

  const handleImportBoard = async (file: File | undefined) => {
    if (!file) return;

    try {
      replaceBoard(parseBoardFile(await file.text()));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to import board.");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
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
          <button className="toolbar-button" type="button" onClick={newBoard}>
            New board
          </button>
          <button className="toolbar-button" type="button" onClick={addNode}>
            Add node
          </button>
          <button className="toolbar-button subtle" type="button" onClick={clearBoard}>
            Clear board
          </button>
          <button className="toolbar-button subtle" type="button" onClick={resetDemoBoard}>
            Reset demo
          </button>
          <button className="toolbar-button subtle" type="button" onClick={() => downloadBoardFile(board)}>
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
            onClick={deleteSelectedNode}
            disabled={!selectedNodeId}
          >
            Delete node
          </button>
          <button
            className="toolbar-button danger"
            type="button"
            onClick={deleteSelectedFlow}
            disabled={!selectedFlowId}
          >
            Delete transfer
          </button>
          <span className="status-pill">Milestone 4.0.1</span>
        </div>
      </header>

      <div className="workspace">
        <section className="canvas-stage" aria-label="MoneyFlow canvas">
          <ReactFlow
            nodes={flowNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onConnect={handleConnect}
            onNodeClick={(_, node) => selectNode(node.id)}
            onEdgeClick={(_, edge) => selectFlow(edge.id)}
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

        <aside className="inspector-panel" aria-label="Inspector panel">
          <header>
            <span>Inspector</span>
          </header>
          {selectedNode ? (
            <div className="inspector-fields">
              <section className="inspector-section">
                <p className="inspector-kicker">Node</p>
                <label htmlFor="selected-node-name">Name</label>
                <input
                  id="selected-node-name"
                  value={selectedNode.name}
                  onChange={(event) => renameNode(selectedNode.id, event.target.value)}
                />
              </section>

              {isRootNode && (
                <section className="inspector-section">
                  <p className="inspector-kicker">Deposits</p>
                  <label htmlFor="selected-node-external-amount">Amount</label>
                  <input
                    id="selected-node-external-amount"
                    type="number"
                    min="0"
                    value={selectedExternalInflow?.amount ?? 0}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) =>
                      updateExternalInflow(selectedNode.id, {
                        amount: Number(event.target.value),
                        frequency: selectedExternalInflow?.frequency ?? "monthly",
                      })
                    }
                  />
                  <label htmlFor="selected-node-external-frequency">Frequency</label>
                  <select
                    id="selected-node-external-frequency"
                    value={selectedExternalInflow?.frequency ?? "monthly"}
                    onChange={(event) =>
                      updateExternalInflow(selectedNode.id, {
                        amount: selectedExternalInflow?.amount ?? 0,
                        frequency: event.target.value as Frequency,
                      })
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="semimonthly">Semi-monthly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </section>
              )}

              {selectedIncomingFlows.length > 0 && (
                <section className="inspector-section">
                  <p className="inspector-kicker">Incoming Transfers</p>
                  {selectedIncomingFlows.map((flow) => (
                    <div className="inflow-editor" key={flow.id}>
                      <span>{getNodeName(flow.source)}</span>
                      <input
                        type="number"
                        min="0"
                        value={flow.amount}
                        onFocus={(event) => event.currentTarget.select()}
                        onChange={(event) =>
                          updateFlow(flow.id, {
                            amount: Number(event.target.value),
                            frequency: flow.frequency,
                          })
                        }
                      />
                      <select
                        value={flow.frequency}
                        onChange={(event) =>
                          updateFlow(flow.id, {
                            amount: flow.amount,
                            frequency: event.target.value as Frequency,
                          })
                        }
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="semimonthly">Semi-monthly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  ))}
                </section>
              )}
            </div>
          ) : (
            <p className="inspector-empty">Select a node to edit it.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
