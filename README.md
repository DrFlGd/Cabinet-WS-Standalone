# Cabinet WS Standalone

A CAD-first prototype for dedicated cabinet-making software.

This repository is intentionally separate from Cabinet Workshop. The goal is a desktop cabinet CAD application with a persistent document model, real-time 3D editing, stable part identity, manufacturing-aware parts, and a future B-Rep geometry kernel.

## Prototype features

- React desktop-style workspace with model tree, realtime 3D viewport, properties panel, and toolbar.
- Utility Cabinet v0.4 model with typed settings plus bounded nested section/bay layouts, direct front-elevation divider editing, and section-driven semantic 3D parts.
- Stable semantic part IDs such as `carcass:left`, `shelf:1`, and `door:2`.
- Direct click selection in the Three.js viewport.
- Hide/show parts, exploded view, fit-to-model, and iso/front/right/top views.
- Versioned schema-v2 cabinet projects with automatic v1 migration and runtime validation.
- Millimeter or inch display with millimeter-native geometry and precision-preserving conversion.
- Native Electron New/Open/Save/Save As, recent projects, dirty-state protection, and recovery autosave.
- Undo/redo with coalesced continuous parameter edits and keyboard shortcuts.
- Browser development mode plus an Electron desktop wrapper.

## v0.4 Sections scope

v0.4 keeps the Utility Cabinet as the reference family and adds the bounded section/bay model from Cabinet Workshop. Section trees support nested left/right and top/bottom splits, proportional or fixed clear-opening sizes, drawers, doors, open/shelf regions, panel/rail/no-divider construction, and equal/graduated/custom drawer-front sizing.

The standalone editor exposes a dedicated front-elevation manipulation surface beside the 3D viewport. Users can select openings/subtrees, drag dividers, enter fixed clear dimensions, split openings horizontally or vertically, create three-column layouts, edit section contents, and collapse subtrees. Section edits are undoable and drive semantic 3D divider, shelf, door, and drawer-front bodies.

The three previously deferred wide Utility starters now use this section model. Cabinet Workshop Utility imports preserve valid `section_nodes` directly and convert legacy `mixed_bays` data—including drawer sizing recipes—into the standalone tree. Invalid section data is reported and safely falls back to the simple Utility layout.

The current Three.js solids still express semantic construction rather than exact machining geometry. Divider joinery booleans remain part of the future B-Rep kernel milestone; hinge and slide intelligence is the v0.5 target.

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

The staged migration plan for bringing Cabinet Workshop web features into this standalone CAD application is tracked in [ROADMAP.md](ROADMAP.md). Every milestone and notable compatibility/build change is recorded in [CHANGELOG.md](CHANGELOG.md); update it as part of every release-sized change.

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

## Editor shortcuts

- `Ctrl+S` — Save
- `Ctrl+Shift+S` — Save As
- `Ctrl+Z` — Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` — Redo

Standalone project geometry is always stored in millimeters. Switching the UI to inches changes only presentation and input conversion; it does not round-trip or rewrite the underlying geometry values.

## Production build

Build the renderer:

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

## Build a Windows executable locally

The project uses Electron Builder to create a portable Windows x64 executable.

From Windows:

```powershell
npm install
npm run desktop:dist
```

The packaged application is written to `release/` with a name similar to:

```text
Cabinet-WS-Standalone-0.4.0-Windows-x64.exe
```

The executable is currently unsigned, so Windows SmartScreen may identify it as an unknown publisher during prototype development.

## Automated Windows builds

`.github/workflows/windows-package.yml` builds the current project on a GitHub-hosted Windows runner.

On pushes to `main` and pull requests it:

1. installs Node.js 24,
2. installs npm dependencies,
3. runs the regression test suite,
4. runs the TypeScript/Vite production build,
5. packages the Electron application as a portable Windows executable, and
6. uploads the executable as the `cabinet-ws-standalone-windows` workflow artifact.

This is useful for testing development builds without setting up a local Windows build environment.

## Publish a named GitHub release

Named releases are published by `.github/workflows/release.yml`. The workflow supports explicit `v*` tags and a `release-request.json` file on `main`.

The requested version must exactly match `package.json`. For example, to publish `0.4.0`:

1. Set `"version": "0.4.0"` in `package.json` and push that change.
2. Set `"version": "0.4.0"` in `release-request.json` and push it to `main`.
3. The **Publish Windows Release** workflow reruns tests, builds the Windows executable, creates the `v0.4.0` tag/release, and attaches the executable, ZIP, checksums, and generated release notes.

An explicit matching `v0.4.0` tag remains supported as an alternative. If the tag/request and `package.json` disagree, the workflow fails instead of publishing a mislabeled build.

The release assets are:

- `Cabinet-WS-Standalone-0.4.0-Windows-x64.exe`
- `Cabinet-WS-Standalone-0.4.0-Windows-x64.zip`
- `SHA256SUMS.txt`

## Build verification

The prototype has been compiled successfully on a GitHub-hosted Windows runner with Node.js 24. The TypeScript/Vite production build and Electron portable packaging both completed successfully.

The normal build workflow and Windows packaging workflow remain in the repository so later changes can be compiler-checked automatically.

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
