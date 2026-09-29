# Cabinet WS Standalone

A CAD-first prototype for dedicated cabinet-making software with a worker-based OpenCascade/Replicad exact-geometry path.

This repository is intentionally separate from Cabinet Workshop. The goal is a desktop cabinet CAD application with a persistent document model, real-time 3D editing, stable part identity, manufacturing-aware parts, and an exact worker-based B-Rep geometry kernel.

## Prototype features

- React desktop-style workspace with Manual Layout, collapsible Hardware/Parts drawers, realtime 3D viewport, searchable Properties panel, and toolbar.
- Seven native cabinet families in v0.13—Shop Cart, Utility, Benchtop Drawers, Stackable, Kitchen, Standalone Drawer, and Equipment Stand—with all 110 shipped Cabinet Workshop examples available from the family/example browser.
- Stable semantic part IDs such as `carcass:left`, `shelf:1`, and `door:2`.
- Direct part/face selection in the Three.js viewport, Shift-click exact edge selection, Ctrl-click multi-selection, semantic distance/face/angle measurements, movable shelves/section dividers, contextual part actions, and editable cabinet dimensions.
- Hide/show/isolate parts, exploded view, clipping, shaded/edge/wireframe display modes, perspective/orthographic cameras, iso/front/right/top views, persistent shelf handles, and 3D section-divider handles.
- Versioned schema-v3 cabinet projects with automatic v1/v2 migration, persisted family/starter identity, retained legacy family recipe values, and runtime parameter validation.
- Millimeter or inch display with millimeter-native geometry and precision-preserving conversion.
- Native Electron New/Open/Save/Save As, recent projects, dirty-state protection, and recovery autosave.
- Undo/redo with coalesced continuous parameter edits and keyboard shortcuts, including one-step undo for applied fit-solver results.
- Exact STEP assembly export plus Shop Docs cut-list/assembly reports, Phase 11 DXF/SVG/drilling manufacturing exports, and Phase 12 sheet-nesting/registration outputs.

## v0.13 Seven-family and example-catalog parity

v0.13 removes the Utility-only product boundary. The editor can switch among all seven Cabinet Workshop families: **Shop Cart, Utility Cabinet, Benchtop Drawers, Stackable Cabinet, Kitchen Cabinet, Standalone Drawer, and Equipment Stand**. The family browser exposes every shipped legacy example: **110 starters total** (6 Shop Cart, 11 Utility, 8 Benchtop, 6 Stackable, 57 Kitchen, 7 Standalone Drawer, and 15 Equipment Stand).

The original legacy starter recipes are retained as data and resolved against their family defaults before adaptation. Schema v3 stores `family`, `starterId`, and the original `familyValues` recipe alongside the canonical Standalone parameters. This means a saved project remains traceable to the family-specific recipe even when a legacy-only setting does not yet have a dedicated Standalone control.

Shop Cart, Utility, Benchtop, Stackable, and Kitchen recipes adapt into the existing semantic cabinet generator so they immediately inherit bounded layouts, native parts, the exact OpenCascade path, Design Health, BOM/shop documentation, Phase 11 manufacturing, and Phase 12 production planning. Stackable modules add semantic stack-interface/base parts.

Standalone Drawer and Equipment Stand use dedicated native family generators rather than pretending they are ordinary Utility carcasses. Drawer recipes support enclosure/outside/inside/modular-grid sizing, semantic box members, captured-bottom machining intent, optional divider grids, decorative fronts, and slide references. Equipment Stand recipes generate semantic sides, trays, cheeks/lips, upper bays, panel/structural/stretcher backs, skeletonized side cutouts, and French-cleat rails where the recipe calls for them.

Legacy Cabinet Workshop imports now accept all seven numeric/string family IDs. Old Standalone schema-v1/v2 projects migrate to schema v3 as Utility projects without changing their existing canonical parameters.

This milestone ports **the families and shipped example catalog**, not the web application's entire 99–310-field presentation layer. The shared native Properties surface remains the primary editor; family-only legacy values that do not yet have a redesigned control remain retained in `familyValues` and continue to drive the family adapter where implemented. OpenSCAD remains reference/oracle code only and is not reintroduced into the production runtime.

## v0.12 Sheet nesting and production planning

v0.12 adds the first Phase 12 production-planning layer downstream of the Phase 11 manufacturing model. The new **Production** tab in Shop Docs defines sheet stock by material/thickness, editable sheet dimensions, grain direction, sheet margin, optional stock quantity, and explicitly entered remnants.

The nesting engine uses a deterministic largest-first free-rectangle heuristic. It groups parts by compatible material/thickness, preserves semantic part IDs and Phase 10 part numbers, honors grain-required orientation, optionally permits 90° rotation when grain allows it, prefers remnants when requested, opens additional sheets when required, and reserves a clearance equal to the largest configured part spacing, kerf allowance, or primary tool diameter. The result is reproducible but is not presented as a globally optimal nesting solver.

Every placement retains its source `partId`, stable `partNumber`, sheet ID, X/Y placement, rotation, grain relationship, and all source Phase 11 manufacturing operation IDs. Sheet-level SVG/DXF transforms the registered manufacturing operations into the nested sheet coordinate system and adds readable part-number labels. Registration JSON provides the trace:

```text
Cabinet part -> BOM part number -> manufacturing operation -> sheet placement
```

Stock remnants are never invented automatically. Users add available remnants explicitly; the planner can then consume them before full sheets. Default full-sheet dimensions are editable planning defaults and are not persisted into the cabinet project in this slice.

v0.12 also introduces typed tool-library, machine-profile, postprocessor, tool-assignment, and compensation-intent contracts. Toolpath planning registers downstream tool and inside/outside/center compensation intent against nested semantic operations, but the bundled postprocessor deliberately has `emitsMachineMotion: false`.

**No G-code is emitted in v0.12.** Actual compensated path generation plus a verified machine/postprocessor implementation remains the unfinished final Phase 12 step. This avoids presenting nominal DXF geometry as safe machine motion.

## v0.11 Manufacturing geometry

v0.11 turns the registered cabinet feature graph into a native manufacturing-operation model. Each fabricated part is projected into a part-local 2D machining plane with an explicit thickness axis and exposes normalized **CUT, POCKET, DADO/GROOVE, DRILL, ENGRAVE, and EDGE** operations. Operations retain stable semantic part/feature identity, machining-face metadata, depth/through state, and millimeter-native geometry.

The **Manufacturing** tab in Shop Docs adds per-part review and export. A user can inspect all operations or one operation layer at a time, see the exact registered face/depth metadata, export a complete per-part DXF, export an individual operation-layer DXF, save a true-scale SVG, generate drilling CSV maps, and save JSON manufacturing metadata.

DXF files declare millimeter units through `$INSUNITS=4`. SVG files use millimeter width/height, a matching numeric view box, and `data-scale="1"`; previews are only scaled by the UI for viewing. Drilling maps report part/operation IDs, U/V centers, diameter, machining face, depth, and through state.

Manufacturing review carries current Design Health warnings/errors. Designs with blocking errors cannot produce a reviewed package. For a non-blocked snapshot, the user must explicitly mark the current manufacturing signature reviewed before exporting a ZIP. The package contains a manifest, manufacturing/issues JSON, per-part DXF/SVG/drilling/metadata files, and per-operation-layer DXF/SVG files.

These exports are **manufacturing geometry, not CNC toolpaths**. v0.11 deliberately does not add nesting, tool diameter/kerf compensation, feeds/speeds, machine profiles, postprocessors, or G-code; those belong to Phase 12.

## v0.10 BOM, cut list, and assembly documentation

v0.10 adds a native **Shop Docs** workspace generated directly from the current semantic `CabinetDocument`, registered feature graph, purchased-hardware instances, and Design Health result. It does not parse OpenSCAD report text.

The BOM/cut-list view assigns deterministic shop part numbers from stable semantic part IDs, groups material/stock thickness, reports finished and rectangular blank envelopes, records grain direction, inferred exposed-edge banding requirements, purchased hardware quantities, and registered machining summaries. Selecting a BOM row selects the same semantic CAD part; selecting a CAD part highlights and scrolls to its BOM row.

Cut-list and purchased-hardware CSV exports remain millimeter-native. Printable BOM/cut-list HTML uses the current display units and can be saved through the native Electron file dialog, then printed or saved as PDF.

The Assembly view groups the cabinet into practical build stages, carries the same stable part callouts, includes a purchased-hardware checklist, and can highlight each step in the live CAD viewport while reusing the existing exploded isometric view. A printable assembly packet includes those steps plus a generated schematic exploded SVG.

Phase 10 intentionally treats **blank and finished dimensions as semantic body/panel envelopes**. Profiled parts and registered machining are summarized, but operation-layer/profile manufacturing geometry remains Phase 11. Edge-banding requirements are inferred from exposed cabinet roles; v0.10 does not invent an edge-band material/thickness specification that is not yet a cabinet parameter.

## v0.9 Design Health and fitting

v0.9 replaces the old web application's OpenSCAD-report validation dependency with a native semantic **Design Health** engine. The live viewport panel evaluates cabinet/document integrity, joinery/material residual stock, bounded section feasibility, selected hardware compatibility and verification support, shelf/hardware keepout collisions, machining edge distance, overlapping subtractive feature envelopes, exact-kernel diagnostics, validation coverage, and manufacturing readiness.

Checks are generated from the same `CabinetDocument`, registered feature graph, hardware definitions/keepouts, and exact-kernel diagnostics used by the editor. They do not parse OpenSCAD `ECHO` text and do not reverse-engineer manufacturing intent from Three.js meshes. Errors block manufacturing readiness; warnings put the design into review status; the coverage section records which validation surfaces were checked, partial, or not applicable.

The integrated **Fit Solver** adds three target-driven workflows:

- **Drawer** — solve cabinet width/depth from requested usable drawer interior while honoring drawer stock, slide side clearance, rear construction, face-frame opening deductions, and selected slide-length limits.
- **Equipment** — solve the outside cabinet envelope from an equipment W/H/D target plus side, vertical, and depth clearances.
- **Modules** — solve cabinet width or height from module pitch, count, and edge margin.

Every solver result explains its calculation and reports the achieved dimensions before application. Results outside the supported Utility envelope, or drawer targets that exceed the selected slide's usable length, are marked infeasible rather than silently clamped. Applying a feasible result updates semantic cabinet parameters through the editor history as one undoable operation, after which Design Health immediately reevaluates the solved cabinet.

## v0.8 Cabinet depth and interaction completion

v0.8 folds the unfinished direct-interaction work from v0.7 into the practical-cabinetry milestone. Adjustable/fixed shelf positions are now persistent semantic parameters, so gold shelf handles edit the document instead of moving a Three.js mesh independently. Blue section-divider handles update the bounded section tree through the same undo/history path used by Manual Layout. The v0.7 pointer-coordinate regression in the direct manipulation path is also corrected.

The viewport adds semantic **Distance**, **Face**, and **Angle** measurement modes. Measurements bind to exact-kernel semantic faces and edges: distance uses semantic reference centers, face size is calculated from the selected exact tessellation face group, and angle uses exact semantic face normals. Measurement state remains editor state; cabinet geometry remains owned by the document and exact worker kernel.

Drawer construction now supports equal, graduated, and custom-weighted fronts in both Simple and section-driven layouts, configurable box/front registration, butt/rabbet/lock-rabbet construction intent, captured or applied bottoms, slide clearances/drilling, and internal divider grids. Captured-bottom grooves and drawer rabbets are registered feature operations so the exact kernel receives machining intent rather than reverse-engineering it from display meshes.

Face frames are first-class fabricated parts with semantic stiles, rails, center stiles/rails, stock thickness/width controls, frame-aware front placement, paired-door center-stile allowance, and frame-clear dimensions in Manual Layout. Existing overlay/inset fronts, door counts, reveals/gaps, hinge cup/plate drilling, paired doors, and purchased-hardware references remain integrated. Manufacturer-specific face-frame hinge classifications are not invented where the hardware catalog does not provide them.

Saved projects remain schema-v2 JSON. New v0.8 parameter fields default during load, and legacy 12-field section nodes remain valid while new nodes may carry an optional persistent shelf-position field.

## v0.7 Direct CAD interaction

v0.7 moves the first high-frequency cabinet edits onto the CAD viewport while preserving the semantic document model. Width, height, and depth are editable in an in-viewport dimension strip and through turquoise W/D/H drag handles. Those edits call the same parameter/history path as the Properties panel, so they remain undoable and trigger the same worker-owned exact rebuild.

Selection is now additive with **Ctrl-click**. The viewport and Parts browser show multi-selection, and selected parts can be isolated, hidden, or restored from the toolbar or a right-click part menu. A selection breadcrumb remains visible over the viewport while Properties continues to edit the primary selected part.

Viewport inspection now includes a Z clipping plane, **Shaded**, **Shaded + edges**, and **Wireframe** display modes, plus **Perspective** and **Orthographic** camera projection. These are presentation/inspection state only; they are not persisted as cabinet geometry and do not alter the exact B-Rep model.

v0.8 subsequently adds persistent shelf placement, viewport-native section-divider dragging, and semantic measurements without changing this document/kernel ownership rule.

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

v0.8 retains the exact B-Rep path introduced in v0.6 for the Utility Cabinet using Replicad/OpenCascade in a worker. Three.js continues to provide the interactive analytical preview while exact work is rebuilding or when a specific exact part reports an error.

The architecture is:

```text
CabinetDocument
  -> cabinet feature/component graph
  -> geometry worker
  -> OpenCascade / Replicad B-Rep bodies
  -> semantic topology + tessellation cache
  -> Three.js viewport
  -> STEP + feature-driven DXF/SVG/drilling + sheet nesting now / verified postprocessed CNC motion later in Phase 12
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
Cabinet-WS-Standalone-0.12.0-Windows-x64.exe
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

The requested version must exactly match `package.json`. For example, to publish `0.12.0`:

1. Set `"version": "0.12.0"` in `package.json` and push that change.
2. Set `"version": "0.12.0"` in `release-request.json` and push it to `main`.
3. The **Publish Windows Release** workflow reruns tests, builds the Windows executable, creates the `v0.12.0` tag/release, and attaches the executable, ZIP, checksums, and generated release notes.

An explicit matching `v0.12.0` tag remains supported as an alternative. If the tag/request and `package.json` disagree, the workflow fails instead of publishing a mislabeled build.

The release assets are:

- `Cabinet-WS-Standalone-0.12.0-Windows-x64.exe`
- `Cabinet-WS-Standalone-0.12.0-Windows-x64.zip`
- `SHA256SUMS.txt`

## Build verification

The prototype has been compiled successfully on a GitHub-hosted Windows runner with Node.js 24. The TypeScript/Vite production build and Electron portable packaging both completed successfully.

The normal build workflow and Windows packaging workflow remain in the repository so later changes can be compiler-checked automatically.

## Recommended next milestones

1. Complete the remaining Phase 12 CNC step with compensated path generation and a verified explicit machine/postprocessor profile before enabling G-code.
2. Expand family-specific native property schemas where workflows need controls beyond the retained v0.13 recipe data.
3. Extend the hardware catalog with explicit manufacturer-verified face-frame hinge/mounting metadata.
4. Add deterministic dependency installs, packaged-app smoke tests, error boundaries, and signed desktop packaging.
