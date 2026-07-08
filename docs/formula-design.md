# MoneyFlow Formula Design Notes

Status: Milestone 6 planning note. Do not implement formulas from this document
until the graph engine contract is reviewed.

## Core Rule

Visible graph topology defines financial dependencies.

Formulas must not create hidden node-to-node dependencies. A formula may only
use data available through the current node's visible graph context:

- External inflows on the node.
- Incoming transfers from visible upstream nodes.
- Outgoing transfers to visible downstream nodes.
- Current node totals.
- Engine-provided constants and functions.

If a financial relationship depends on another node, that relationship must be
represented by a visible edge on the board.

## Engine Boundary

Formula evaluation belongs entirely in the engine.

Allowed inputs:

- `BoardState`
- `DerivedBoardState`
- `NodeEvaluationContext`
- Engine-owned formula definitions

Allowed outputs:

- Updated derived values.
- Structured diagnostics.
- Simulation results.

React components, Zustand stores, and React Flow objects must not evaluate
formulas.

## Dependency Ordering

Formula evaluation must use the graph analysis layer:

- `buildGraphAnalysis`
- `getEvaluationPlan`
- `deriveBoardState`
- `getNodeEvaluationContexts`

Acyclic boards can evaluate in topological order.

Cyclic boards must return diagnostics and avoid producing misleading formula
results until a cycle strategy is explicitly designed.

## Formula Scope

Early formula support should be local and constrained.

Good candidates:

- Calculate a transfer from the target node's incoming context.
- Split available node balance by percentage.
- Cap a transfer at a maximum amount.
- Calculate remaining after required outgoing transfers.

Initial flow formula variables:

- `externalInflow`: monthly external inflow on the target node.
- `incoming`: monthly incoming transfer total on the target node.
- `outgoing`: monthly outgoing transfer total on the target node.
- `remaining`: target node `externalInflow + incoming - outgoing`.
- `currentAmount`: current monthly amount of the visible flow being calculated.

Avoid:

- Free-form references to arbitrary node IDs.
- Hidden dependency graphs inferred from formula strings.
- Formula behavior that depends on React Flow state.
- Formula behavior that changes board topology invisibly.

## Diagnostics

Formula errors should become structured engine diagnostics suitable for later
inspector and canvas display.

Potential diagnostic codes:

- `formula.syntax`
- `formula.unsupportedReference`
- `formula.blockedByCycle`
- `formula.invalidResult`
- `formula.negativeTransfer`

Diagnostics should include relevant node IDs, flow IDs, and a concise message.

## Open Questions

- Should formulas live on flows, nodes, or both?

  Current answer: start with flow formulas only. The current product behavior
  already treats transfer amount as data defined from the receiving node's
  perspective, and flow formulas map cleanly to "calculate this visible
  transfer." Node formulas can wait until there is a concrete use case that
  cannot be represented by visible transfers.

- Should formulas produce transfer amounts only, or can they produce derived
  annotations?

  Current answer: formulas should produce transfer amounts only for the first
  implementation. Derived annotations can be added later as read-only outputs,
  but they should not be part of the first formula contract.

  Current result contract: formula success returns a finite non-negative
  transfer amount. Invalid, negative, or non-finite results become structured
  formula diagnostics.

- Should formulas be stored in canonical `BoardState`, or in a future formula
  layer that references BoardState IDs?

  Current answer: use a separate formula layer that references BoardState IDs.
  `BoardState` should remain the canonical visible money graph. Formula
  definitions can become a companion engine-owned layer so import/export can
  version it explicitly without turning every board object into an expression
  container.

- What small expression language is safest for POC work?
- Should MathJS remain the parser, or should formula scope be smaller?
