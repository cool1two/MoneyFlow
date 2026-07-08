# MoneyFlow

MoneyFlow is an offline-first visual financial modeler. It is not a transaction
tracker or traditional budgeting app. The graph is the product: users model
money moving between boxes to answer "what happens if" questions.

## Do Not Lose This Context

- No authentication.
- No backend.
- No cloud database.
- Offline-first browser storage.
- Manual whiteboard layout.
- React Flow is a renderer, not the domain source of truth.
- BoardState is the canonical model.
- The graph engine owns board rules, selectors, calculations, validation, and
  import/export parsing.
- Do not pivot toward bank integrations or transaction tracking.

## Architectural Decision Record
1. Visible graph topology defines financial dependencies.

- MoneyFlow does not create hidden dependencies through node-to-node formula references. The graph itself is the dependency graph. All financial computation should be explainable by traversing visible edges on the board.

## Current POC

The current POC includes:

- Vite + React + TypeScript.
- React Flow canvas.
- Draggable money nodes.
- Add, rename, move, and delete nodes.
- Link and delete transfers between nodes.
- Node-perspective transfer editing through incoming transfers.
- External deposits on root nodes.
- Monthly normalization for daily, weekly, biweekly, semimonthly, monthly,
  quarterly, and yearly values.
- Proportional animated flow edges.
- Zustand UI coordination.
- localStorage persistence centered on BoardState.
- Export/import of versioned BoardState JSON.
- Import validation and invalid JSON fixtures.
- Engine tests for frequency, totals, selectors, validation, mutations, and
  import/export.

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

The forwarded development URL is:

```txt
http://localhost:5173/MoneyFlow/
```

Run type checks:

```bash
npm run typecheck
```

Run tests:

```bash
npm run test
```

Build production assets:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Architecture

```txt
src/models/                    Domain types
src/data/mockBoard.ts          POC board source data
src/engine/analysis/           Graph analysis, diagnostics, simulation contracts
src/engine/frequency/          Frequency normalization
src/engine/formulas/           Formula layer contracts
src/engine/graph/              Board mutations, selectors, totals, validation
src/engine/persistence/        Versioned BoardState file parsing
src/engine/graph/reactFlowAdapter.ts
                                BoardState to React Flow view adapter
src/browser/                   Browser-only file download behavior
src/components/canvas/         React Flow canvas composition
src/components/inspector/      Node and transfer editing panel
src/components/nodes/          React Flow node component
src/components/toolbar/        Board actions and import/export UI
src/store/                     Zustand board/UI coordination
src/utils/                     Formatting helpers
```

The architectural constitution is in `docs/constitution.txt`. In short:
BoardState is canonical, the graph engine is the product, and React Flow is
replaceable renderer infrastructure.

Formula design notes are in `docs/formula-design.md`. Formulas must not create
hidden node-to-node dependencies; visible graph topology defines financial
dependencies.

## BoardState

BoardState contains:

- `nodes`: named boxes with manual positions.
- `flows`: transfers between nodes with amount and frequency.
- `externalInflows`: deposits into nodes from outside the graph.

BoardState does not contain React Flow nodes, React Flow edges, zoom, pan,
selection, or draft editing state.

## Import/Export

Exported files are versioned JSON:

```ts
type BoardFile = {
  version: 1;
  board: BoardState;
};
```

Import validates structure, supported frequencies, node references, self-loops,
duplicate IDs, negative values, and other BoardState rules before replacing the
current board.

Invalid import fixtures live in `docs/import-fixtures/`.

## GitHub Pages

Vite is configured with:

```ts
base: "/MoneyFlow/"
```

This supports deployment under the repository path on GitHub Pages.

## POC Notes

This is still proof-of-concept code. The current priority is architecture and
learning speed, not production hardening.

Current intentional limits:

- No backend or sync.
- No formulas yet.
- No Sankey renderer yet.
- No themes or visual polish pass yet.
- localStorage persistence is suitable for POC work.
- Accessibility and error presentation are not production-ready.

Next architecture direction:

1. Continue moving business rules into the graph engine.
2. Keep persistence centered on BoardState.
3. Expand tests where they accelerate refactoring confidence.
4. Only add formulas after the engine boundary remains stable.

## Milestone 7 Consideration: Zod

Zod is a good candidate for runtime schema parsing at the import/export
boundary. It could replace some hand-written structural checks in
`parseBoardState` and `parseBoardFile`, while preserving TypeScript-friendly
parsed output.

Recommended scope:

- Use Zod for untrusted JSON parsing.
- Use Zod for BoardState file/schema version parsing.
- Use Zod to support future schema migrations.
- Keep graph meaning in the MoneyFlow engine.

Do not use Zod as the graph engine. Zod can validate shape, but MoneyFlow must
continue to own graph rules, diagnostics, cycle detection, evaluation ordering,
financial meaning, formulas, and simulation.
