# Cabinet WS Standalone

A CAD-first prototype for dedicated cabinet-making software.

This repository is intentionally separate from Cabinet Workshop. The goal is a desktop cabinet CAD application with a persistent document model, real-time 3D editing, stable part identity, manufacturing-aware parts, and a future B-Rep geometry kernel.

## Prototype features

- React desktop-style workspace with model tree, realtime 3D viewport, properties panel, and toolbar.
- Parametric cabinet regeneration for dimensions, stock, shelves, drawers, doors, toe kick, and front gaps.
- Stable semantic part IDs such as `carcass:left`, `shelf:1`, and `door:2`.
- Direct click selection in the Three.js viewport.
- Hide/show parts, exploded view, fit-to-model, and iso/front/right/top views.
- JSON save/open for prototype cabinet documents.
- Browser development mode plus an Electron desktop wrapper.

## Geometry status

The current prototype uses parametric rectangular panel solids. It is intentionally **not yet a production B-Rep kernel**.

The target architecture is:

```text
CabinetDocument
  -> cabinet feature/component graph
  -> geometry worker
  -> OpenCascade / Replicad B-Rep bodies
  -> tessellated meshes
  -> Three.js viewport
  -> manufacturing features / STEP / DXF / CNC
```

The editor talks in terms of persistent cabinet parts rather than Three.js mesh UUIDs, so the solid generator can be replaced without rewriting selection, the model tree, saved documents, or property editing. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

- Node.js 22+ (Node 24 recommended)
- npm 10+

## Browser development

```bash
npm install
npm run dev
```

Open the address Vite prints, normally `http://localhost:5173`.

## Desktop development

```bash
npm install
npm run desktop:dev
```

This starts Vite and launches Electron against the development server.

## Production build

```bash
npm install
npm run build
```

The renderer is written to `dist/`.

Then launch that production build in Electron with:

```bash
npm run desktop
```

Electron loads `dist/index.html` locally, so no web server is required for the production desktop run.

## Verification note

The domain/document TypeScript was compiler-checked while creating this prototype. A full dependency install/build could not be completed in the creation environment because package download timed out. Run `npm install && npm run build` on a normal networked development machine as the first verification step.

## Recommended next milestones

1. Move cabinet regeneration into a Web Worker.
2. Add a `GeometryKernel` interface and a Replicad/OpenCascade implementation.
3. Reproduce the carcass as B-Rep bodies and boolean joinery while retaining current semantic part IDs.
4. Add semantic faces/edges such as `face:carcass:left:inside`.
5. Add dado, rabbet, groove, pocket, hole, and hole-pattern feature history.
6. Add direct dimension handles in the viewport.
7. Add manufacturing features to parts instead of deriving intent from display geometry.
8. Add STEP and DXF export plus vendor hardware reference geometry.
9. Add sheet-goods nesting and CNC operation planning.
10. Add signed desktop packaging after the geometry architecture stabilizes.
