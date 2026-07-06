# MoneyFlow Project Brief

Status: Early proof of concept.

MoneyFlow is an offline-first visual financial modeler, not a traditional
budget tracker. The graph is the product: users create a whiteboard of money
nodes connected by proportional cash-flow ribbons to answer "what happens if"
questions.

## Supplement: Product Name

The project name is MoneyFlow going forward. Earlier references to FlowBudget
should be treated as historical working-title language.

## Fixed Decisions

- No user accounts, authentication, backend, or cloud database.
- Offline-first browser storage.
- JSON import/export similar to Excalidraw.
- Manual whiteboard layout, not automatic Sankey layout.
- Sankey-inspired ribbons are for rendering only.
- GitHub Pages deployment target.
- React, TypeScript, and Vite.

## POC Priorities

1. Infinite whiteboard with draggable nodes.
2. Money-flow edges between nodes.
3. Monthly frequency normalization.
4. Simple formula support without `eval()`.
5. Local persistence.
6. JSON import/export.

## Initial Technical Direction

- React + TypeScript + Vite for the application shell.
- React Flow for canvas/node editing.
- Zustand for client state.
- MathJS for formula parsing.
- LocalStorage is acceptable for POC persistence.
- Dexie/IndexedDB can be introduced after the model stabilizes.

## POC Boundary

This phase optimizes for speed and learning. Hard-coded sample data,
temporary state shapes, and minimal validation are acceptable while proving
the graph-modeling loop. Productionization should add stronger data schemas,
error handling, validation, accessibility polish, tests, and storage migration.

## Original Source

The original handoff brief is preserved in `project.html` at the repository
root. It contains the full product notes, open questions, risks, suggested
phases, and UX direction.
