# Cabinet WS Standalone

A desktop cabinet-design application built with React, Electron, Three.js, and a
worker-based Replicad/OpenCascade geometry kernel. Cabinet Workshop is the reference
for migrated behavior; OpenSCAD is not a runtime dependency.

The package version is **0.14.1**. Release history is listed in [CHANGELOG.md](CHANGELOG.md).
This is a development application: controls/catalog coverage does not imply that
every legacy construction or machining option has verified native geometry parity.

## Current capabilities

- Seven cabinet families: Shop Cart, Utility, Benchtop Drawers, Stackable, Kitchen,
  Standalone Drawer, and Equipment Stand.
- All 110 shipped example recipes and 1,678 family field definitions.
- Family settings with dependencies, search, advanced controls, dimensions, arrays,
  and computed values; contextual Native model controls remain available.
- Central Manual Layout editor with sections/bays, shelf/divider editing, and
  independent Hardware and Parts drawers. Drawer and Equipment Stand use dedicated
  generators rather than the shared section editor.
- Interactive 3D selection, dimensions, measurements, clipping, hide/isolate,
  projection/display modes, and exploded views.
- Semantic parts and hardware, asynchronous exact geometry, and STEP assembly export.
- Native Design Health, fit solving, BOM/cut-list and assembly reports, manufacturing
  DXF/SVG/drilling files, reviewed manufacturing packages, and sheet nesting.
- Schema-v3 project files, v1/v2 migration, legacy web import, native file dialogs,
  recent projects, dirty-state protection, autosave/recovery, and undo/redo.
- Millimeter-native geometry with millimeter/inch input and display.

## Editing and project compatibility

`familyValues` retains family-specific recipe data; `parameters` stores the native
model. Native edits synchronize mapped differences into the recipe. A family edit
updates the native parameters affected by that recipe change while retaining
unrelated native settings, including shelf positions and manual section edits.
Save/reopen retains recipe-only choices instead of rewriting them to approximate
native equivalents. Sparse web recipes are hydrated before geometry is derived.

An arbitrary native resize of a modular-grid drawer switches its sizing basis to
**outside box**. Resizing an equipment-sized stand switches it to **manual** sizing.
These transitions retain the requested envelope and are undoable. Inside-clear and
enclosure drawer sizing retain their basis using inverse dimension calculations.
Changing the family sizing mode explicitly uses that mode's recipe dimensions.

Manual Layout owns section-node editing. Output/System recipe values remain
compatibility data; native Save, STEP, Shop Docs, and production actions govern
Standalone outputs.

STEP export is all-or-nothing for requested fabricated bodies: a missing body or
failed machining cut rejects the export with a diagnostic. Purchased hardware
reference envelopes are excluded from the exact assembly. Preview fallback remains
available for interactive inspection; it does not make a failed export successful.

## Known limits

- Family schemas and starters are ported, but full dimensional/construction and
  machining parity is not established. See [FAMILY_PARITY.md](FAMILY_PARITY.md)
  for the independent capability audit, frozen reference fixtures, and prioritized gaps.
- Equipment Stand cleat angles are currently metadata on rectangular rails;
  exact bevels and purchased slide/runner hardware integration remain incomplete.
- The applied-back rabbet remains a proof operation; back-panel construction needs
  reconciliation. Chamfer/bevel and edge-treatment feature geometry is deferred.
- Hardware catalog coverage originated with 84 Utility-compatible profiles;
  verified family-specific and face-frame mounting coverage needs expansion.
- Sheet nesting is a deterministic heuristic, not a global optimizer. Stock,
  remnants, tools, and nesting settings are transient editor state and can reset
  when the model changes; they are not persisted in the project file.
- No compensated toolpaths or G-code are generated. Nominal manufacturing geometry
  and nesting clearance are not machine motion.
- Windows packages are unsigned. Packaged-app interaction/smoke testing and an
  application error boundary remain outstanding.

See [ROADMAP.md](ROADMAP.md) for the prioritized backlog and acceptance criteria,
[ARCHITECTURE.md](ARCHITECTURE.md) for ownership/contracts, and
[CHANGELOG.md](CHANGELOG.md) for release history. Record every notable change in the
changelog; keep historical milestone descriptions out of the current-status docs.

## Development

Use Node.js 24 and npm 10+ (CI uses Node 24).

```bash
npm install
npm run dev
```

For the Electron development application:

```bash
npm run desktop:dev
```

Validation and production renderer build:

```bash
npm test
npm run build
npm run desktop
```

The production desktop loads `dist/index.html` locally. Tests cover semantic/model
behavior and selected integration contracts; passing them does not substitute for
running the packaged application. A dependency lockfile and `npm ci` remain backlog
items; the current `std-env` override addresses the known dependency-resolution failure.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |

## Windows builds and releases

On Windows, `npm run desktop:dist` creates a portable x64 executable in `release/`.
Its filename uses the version in `package.json`, for example
`Cabinet-WS-Standalone-0.14.1-Windows-x64.exe`.

The Build and Windows Package workflows run tests and production builds for pushes
to `main` and pull requests. Windows Package also uploads the executable as the
`cabinet-ws-standalone-windows` artifact. It currently packages but does not launch
or interact with the executable.

The Publish Windows Release workflow accepts a matching `v*` tag or a change to
`release-request.json` on `main`. The requested version must match `package.json`.
A named release includes the executable, ZIP, `SHA256SUMS.txt`, and release notes.
Development artifacts can be newer than the latest named release; inspect the
commit and package version when reporting a bug. Updating code or documentation
alone does not publish a named release.
