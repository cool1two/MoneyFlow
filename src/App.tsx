import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toMonthlyAmount, type Frequency } from "./engine/frequency/frequency";

type MoneyNodeData = {
  name: string;
  inflow: number;
  externalInflow: number;
  outflow: number;
};

type MoneyNode = Node<MoneyNodeData, "moneyNode">;

type MoneyFlow = {
  id: string;
  source: string;
  target: string;
  amount: number;
  frequency: Frequency;
};

const nodeNames: Record<string, string> = {
  salary: "Salary",
  checking: "Checking",
  rent: "Rent",
  savings: "Savings",
  groceries: "Groceries",
};

const nodePositions: Record<string, { x: number; y: number }> = {
  salary: { x: 60, y: 150 },
  checking: { x: 380, y: 130 },
  rent: { x: 740, y: 20 },
  savings: { x: 740, y: 230 },
  groceries: { x: 740, y: 440 },
};

const externalInflows: Record<string, number> = {
  salary: toMonthlyAmount(3000, "biweekly"),
};

const mockFlows: MoneyFlow[] = [
  { id: "salary-checking", source: "salary", target: "checking", amount: 6500, frequency: "monthly" },
  { id: "checking-rent", source: "checking", target: "rent", amount: 1950, frequency: "monthly" },
  { id: "checking-savings", source: "checking", target: "savings", amount: 900, frequency: "monthly" },
  { id: "checking-groceries", source: "checking", target: "groceries", amount: 180, frequency: "weekly" },
];

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const formatFrequency = (frequency: Frequency) =>
  frequency.replace(/^./, (letter) => letter.toUpperCase());

const monthlyFlows = mockFlows.map((flow) => ({
  ...flow,
  monthlyAmount: toMonthlyAmount(flow.amount, flow.frequency),
}));

function totalsForNode(id: string) {
  return monthlyFlows.reduce(
    (totals, flow) => {
      if (flow.target === id) totals.inflow += flow.monthlyAmount;
      if (flow.source === id) totals.outflow += flow.monthlyAmount;
      return totals;
    },
    { inflow: externalInflows[id] ?? 0, externalInflow: externalInflows[id] ?? 0, outflow: 0 },
  );
}

function MoneyNodeCard({ data }: NodeProps<MoneyNode>) {
  const remaining = data.inflow - data.outflow;

  return (
    <article className="money-node-card">
      <Handle className="money-node-handle" type="target" position={Position.Left} />
      <Handle className="money-node-handle" type="source" position={Position.Right} />
      <header>
        <span>{data.name}</span>
        <strong>{formatMoney(remaining)}</strong>
      </header>
      <dl>
        {data.externalInflow > 0 && (
          <div className="external-inflow">
            <dt>External</dt>
            <dd>{formatMoney(data.externalInflow)}</dd>
          </div>
        )}
        <div>
          <dt>Inflow</dt>
          <dd>{formatMoney(data.inflow)}</dd>
        </div>
        <div>
          <dt>Outflow</dt>
          <dd>{formatMoney(data.outflow)}</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd className={remaining < 0 ? "negative" : "positive"}>
            {formatMoney(remaining)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

const nodeTypes = {
  moneyNode: MoneyNodeCard,
};

const initialNodes: MoneyNode[] = Object.entries(nodeNames).map(([id, name]) => {
  const totals = totalsForNode(id);

  return {
    id,
    type: "moneyNode",
    position: nodePositions[id],
    data: { name, ...totals },
  };
});

const maxMonthlyFlow = Math.max(...monthlyFlows.map((flow) => flow.monthlyAmount));

const initialEdges: Edge[] = monthlyFlows.map((flow) => ({
  id: flow.id,
  source: flow.source,
  target: flow.target,
  label: `${formatMoney(flow.monthlyAmount)}/mo (${formatMoney(flow.amount)} ${formatFrequency(flow.frequency)})`,
  animated: true,
  type: "smoothstep",
  style: { strokeWidth: Math.max(2, Math.round((flow.monthlyAmount / maxMonthlyFlow) * 9)) },
}));

export default function App() {
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
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          fitView
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
