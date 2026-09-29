# Cabinet WS Standalone

A CAD-first prototype for dedicated cabinet-making software with a worker-based OpenCascade/Replicad exact-geometry path.

This repository is intentionally separate from Cabinet Workshop. The goal is a desktop cabinet CAD application with a persistent document model, real-time 3D editing, stable part identity, manufacturing-aware parts, and an exact worker-based B-Rep geometry kernel.

## Prototype features

- React desktop-style workspace with Manual Layout, collapsible Hardware/Parts drawers, realtime 3D viewport, searchable Properties panel, and toolbar.
- Utility Cabinet v0.6 model with bounded sections, first-class hardware, and exact OpenCascade/Replicad B-Rep generation behind the realtime editor.
- Stable semantic part IDs such as `carcass:left`, `shelf:1`, and `door:2`.
- Direct part/face selection in the Three.js viewport, Shift-click exact edge selection, and contextual editable settings for the selected part.
- Hide/show parts, exploded view, fit-to-model, and iso/front/right/top views.
- Versioned schema-v2 cabinet projects with automatic v1 migration and runtime validation.
- Millimeter or inch display with millimeter-native geometry and precision-preserving conversion.
- Native Electron New/Open/Save/Save As, recent projects, dirty-state protection, and recovery autosave.
- Undo/redo with coalesced continuous parameter edits and keyboard shortcuts.
- Exact STEP assembly export from the toolbar, plus browser development mode and an Electron desktop wrapper.

## v0.6.1 Workspace organization

The left editing workspace is organized as **Hardware | Manual Layout | Parts**. Manual Layout stays central and visible; Hardware is a collapsible drawer on its left and Parts is a collapsible drawer on its right. Either drawer can be opened independently without consuming vertical space from the layout editor.

All Simple-mode layout choices now live directly under Manual Layout Editor: **Layout mode, Contents, Drawer rows, Doors, and Shelf panels**. In Sections/Bays mode, the per-opening layout controls remain in the same editor. These layout decisions are intentionally removed from the right-side Properties surface so there is one place to change cabinet layout.

The right **Properties** panel has an always-visible search field. With no search text it behaves contextually when a part is selected. Entering a search searches all currently applicable non-layout properties regardless of part selection, including labels, descriptions, groups, values, and option names.

The Hardware drawer retains the full v0.5/v0.6 searchable catalog, verification/source information, compatibility feedback, and preset application.

## v0.6 Exact CAD kernel

v0.6 introduces the first production-oriented geometry boundary. The Utility Cabinet document is converted into a cabinet-native feature graph and rebuilt asynchronously in a Web Worker using **Replicad + OpenCascade**. The existing analytical geometry remains the immediate interaction preview; once the matching exact rebuild completes, its tessellation replaces the preview in Three.js.

The kernel currently creates exact B-Rep bodies for fabricated Utility cabinet parts and applies registered profile/cutting features such as toe-kick side profiles, dado/pocket subtraction, an applied-back rabbet proof operation, and shelf/drilling patterns. Unchanged part tessellations are cached, edits identify dirty parts, stale worker rebuilds are discarded, and exact failures fall back per-part to preview geometry with diagnostics shown in Properties.

Purchased slide/hinge envelopes remain semantic preview references in v0.6; they are not promoted to exact manufacturer B-Reps. Exact topology is mapped back to cabinet-semantic identities rather than exposing raw OpenCascade indexes. Clicking exact geometry selects a semantic face; **Shift-click** targets semantic edges. IDs follow forms such as `face:carcass:left:inside` and `edge:carcass:left:front-top`.

The toolbar now includes **STEP**, which exports the exact cabinet assembly in millimeters. In Electron this opens a native Save dialog. STEP generation occurs inside the geometry worker; the renderer receives only the resulting bytes.

The applied-back rabbet is deliberately described as a proof operation: the side-panel B-Rep carries the rabbet, but the existing applied-back construction recipe has not yet been redesigned to extend the back panel into that rabbet. Chamfer/bevel and edge-treatment feature kinds are reserved for later milestones rather than being represented as completed geometry.

## v0.5.2 Manual Layout workspace

Manual Layout Editor is the default left-side workspace. The Layout mode selector lives at the top of that editor: **Simple cabinet** exposes its layout controls there, while **Sections / bays** activates the manual opening/divider canvas in the same place.

The generated Parts browser is a secondary drawer immediately to the right of Manual Layout. It starts collapsed for maximum layout/viewport space and can be expanded when individual generated parts need to be selected, hidden, or inspected. Opening Parts expands the left workspace horizontally rather than shrinking the Manual Layout editor vertically.

## v0.5.1 Editing usability

The Section Layout editor is collapsible. When closed, the left rail returns to a compact model-navigation layout. When opened, the left workspace widens and the front-elevation editor receives most of the column so nested bays and divider handles are easier to work with.

Part selection is now an editing action as well as an inspection action. Clicking a drawer, door, shelf, carcass panel, worktop, divider, or hardware component in the 3D viewport/model tree populates the right Properties panel with the cabinet parameters that generate that part. Section-generated parts link directly back to their source node in Section Layout. Read-only generated dimensions and semantic metadata remain available below those controls.

## v0.5 Hardware scope

v0.5 turns the web application's hardware knowledge into first-class standalone CAD data for the Utility Cabinet reference family. The generated standalone catalog currently carries all 84 Utility-compatible profiles from Cabinet Workshop: 74 drawer-slide profiles and 10 concealed-hinge profiles, with manufacturer/model/source and verification status preserved.

The left Hardware drawer includes the searchable hardware catalog. Applying a preset is one undoable parameter operation, after which the copied dimensions remain editable. Profiles marked as manufacturer-partial intentionally keep unsupported drilling disabled; Standalone does not invent a hole choice when a manufacturer product exposes multiple valid mounting options.

Hardware is now represented as semantic `HardwareDefinition` and `HardwareInstance` objects with mounting references, keepout envelopes, required clearances, drilling data, and simplified realtime reference bodies. Metal-slide side clearance changes drawer-box width, slide length limits drawer-box depth, encoded slide drilling reaches drawer/cabinet mounting members, and concealed hinges add cup/plate drilling intent. Purchased hardware is grouped separately from fabricated cabinet-part BOM rows.

Compatibility checks currently catch slide-depth conflicts, hinge-cup breakthrough, hardware assigned to layouts without relevant drawers/doors, catalog-family incompatibility, and hinge/front-application mismatches. Legacy Cabinet Workshop Utility files preserve supported slide/hinge values and are matched back to a catalog profile when possible.

Face-frame-specific hardware rules remain deferred until face frames exist in the standalone construction model. Exact B-Rep bores/pockets and collision solids remain part of v0.6; v0.5 records manufacturing intent and realtime reference geometry without pretending those preview solids are final machining geometry.

## Geometry status

v0.6 has an exact B-Rep path for the Utility Cabinet using Replicad/OpenCascade in a worker. Three.js continues to provide the interactive analytical preview while exact work is rebuilding or when a specific exact part reports an error.

The architecture is:

```text
CabinetDocument
  -> cabinet feature/component graph
  -> geometry worker
  -> OpenCascade / Replicad B-Rep bodies
  -> semantic topology + tessellation cache
  -> Three.js viewport
  -> STEP now / manufacturing features, DXF and CNC in later milestones
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
