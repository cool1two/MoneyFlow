# MoneyFlow

MoneyFlow is an offline-first visual financial modeler. It is not a transaction tracker or traditional budgeting app. The graph is the product: users model money moving between boxes to answer "what happens if" questions.

## Do Not Lose This Context

- No authentication.
- No backend.
- No cloud database.
- Offline-first browser storage.
- Manual whiteboard layout.
- React Flow is a view layer, not the domain source of truth.
- The domain board model owns nodes, flows, external inflows, and calculations.
- Do not pivot toward bank integrations or transaction tracking.

## Current POC

The current POC includes:

- Vite + React + TypeScript.
- React Flow canvas.
- Money nodes with inflow, outflow, external inflow, and remaining totals.
- Monthly normalization for daily, weekly, biweekly, semimonthly, monthly, quarterly, and yearly values.
- Proportional animated flow edges.
- Zustand board state.
- localStorage persistence for board layout/state.
- Frequency unit tests.

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
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
src/models/              Domain types
src/data/mockBoard.ts    POC board source data
src/engine/frequency/    Frequency normalization
src/engine/graph/        Board calculations and React Flow adapter
src/components/nodes/    React Flow node components
src/store/               Zustand board store
src/utils/               Formatting helpers
```

## GitHub Pages

Vite is configured with:

```ts
base: "/MoneyFlow/"
```

This supports deployment under the repository path on GitHub Pages.

## POC Notes

This is still proof-of-concept code. Some shortcuts are intentional:

- Mock board data is static.
- localStorage has no schema validation or migrations.
- Import/export UI is not implemented yet.
- Add/edit/delete nodes and flows are not implemented yet.
- Formula support is intentionally deferred.

Next milestone:

1. Add/edit/delete nodes.
2. Add/edit/delete flows.
3. Export JSON.
4. Import JSON.
5. Tighten board model as the source of truth.
