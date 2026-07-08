import { useEffect, useState } from "react";
import type { Frequency } from "../../engine/frequency/frequency";
import {
  getExternalInflowForNode,
  getIncomingFlowsForNode,
  getNodeById,
  getNodeName,
  isRootNode,
} from "../../engine/graph/boardSelectors";
import type { BoardState, ExternalInflow, MoneyFlow } from "../../models/board";

type InspectorPanelProps = {
  board: BoardState;
  selectedNodeId: string | null;
  onCommitFlow: (flowId: string) => void;
  onRenameNode: (nodeId: string, name: string) => void;
  onUpdateExternalInflow: (
    target: string,
    updates: Pick<ExternalInflow, "amount" | "frequency">,
  ) => void;
  onUpdateFlow: (
    flowId: string,
    updates: Pick<MoneyFlow, "amount" | "frequency">,
  ) => void;
};

export function InspectorPanel({
  board,
  selectedNodeId,
  onCommitFlow,
  onRenameNode,
  onUpdateExternalInflow,
  onUpdateFlow,
}: InspectorPanelProps) {
  const selectedNode = getNodeById(board, selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="inspector-panel" aria-label="Inspector panel">
        <header>
          <span>Inspector</span>
        </header>
        <p className="inspector-empty">Select a node to edit it.</p>
      </aside>
    );
  }

  const selectedExternalInflow = getExternalInflowForNode(board, selectedNode.id);
  const selectedIncomingFlows = getIncomingFlowsForNode(board, selectedNode.id);

  return (
    <aside className="inspector-panel" aria-label="Inspector panel">
      <header>
        <span>Inspector</span>
      </header>
      <div className="inspector-fields">
        <section className="inspector-section">
          <p className="inspector-kicker">Node</p>
          <label htmlFor="selected-node-name">Name</label>
          <input
            id="selected-node-name"
            value={selectedNode.name}
            onChange={(event) => onRenameNode(selectedNode.id, event.target.value)}
          />
        </section>

        {(isRootNode(board, selectedNode.id) || selectedExternalInflow) && (
          <section className="inspector-section">
            <p className="inspector-kicker">Deposits</p>
            <AmountInput
              id="selected-node-external-amount"
              value={selectedExternalInflow?.amount ?? 0}
              label="Amount"
              onValueChange={(amount) =>
                onUpdateExternalInflow(selectedNode.id, {
                  amount,
                  frequency: selectedExternalInflow?.frequency ?? "monthly",
                })
              }
            />
            <label htmlFor="selected-node-external-frequency">Frequency</label>
            <select
              id="selected-node-external-frequency"
              value={selectedExternalInflow?.frequency ?? "monthly"}
              onChange={(event) =>
                onUpdateExternalInflow(selectedNode.id, {
                  amount: selectedExternalInflow?.amount ?? 0,
                  frequency: event.target.value as Frequency,
                })
              }
            >
              <FrequencyOptions />
            </select>
          </section>
        )}

        {selectedIncomingFlows.length > 0 && (
          <section className="inspector-section">
            <p className="inspector-kicker">Incoming Transfers</p>
            {selectedIncomingFlows.map((flow) => (
              <div className="inflow-editor" key={flow.id}>
                <span>{getNodeName(board, flow.source)}</span>
                <AmountInput
                  value={flow.amount}
                  onBlur={() => onCommitFlow(flow.id)}
                  onValueChange={(amount) =>
                    onUpdateFlow(flow.id, {
                      amount,
                      frequency: flow.frequency,
                    })
                  }
                />
                <select
                  value={flow.frequency}
                  onChange={(event) =>
                    onUpdateFlow(flow.id, {
                      amount: flow.amount,
                      frequency: event.target.value as Frequency,
                    })
                  }
                >
                  <FrequencyOptions />
                </select>
              </div>
            ))}
          </section>
        )}
      </div>
    </aside>
  );
}

type AmountInputProps = {
  id?: string;
  label?: string;
  value: number;
  onBlur?: () => void;
  onValueChange: (value: number) => void;
};

function AmountInput({ id, label, value, onBlur, onValueChange }: AmountInputProps) {
  const [draftValue, setDraftValue] = useState(value > 0 ? String(value) : "");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;

    setDraftValue(value > 0 ? String(value) : "");
  }, [isFocused, value]);

  const handleChange = (rawValue: string) => {
    const normalizedValue = rawValue.replace(/^0+(?=\d)/, "");
    setDraftValue(normalizedValue);
    onValueChange(normalizedValue === "" ? 0 : Number(normalizedValue));
  };

  return (
    <>
      {label && id && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type="number"
        min="0"
        step="0.01"
        value={draftValue}
        placeholder="0"
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
      />
    </>
  );
}

function FrequencyOptions() {
  return (
    <>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="biweekly">Biweekly</option>
      <option value="semimonthly">Semi-monthly</option>
      <option value="monthly">Monthly</option>
      <option value="quarterly">Quarterly</option>
      <option value="yearly">Yearly</option>
    </>
  );
}
