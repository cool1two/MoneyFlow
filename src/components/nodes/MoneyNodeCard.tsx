import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MoneyFlowNode } from "../../engine/graph/reactFlowAdapter";
import { formatMoney } from "../../utils/formatMoney";

export function MoneyNodeCard({ data }: NodeProps<MoneyFlowNode>) {
  const remaining = data.externalInflow + data.inflow - data.outflow;

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
