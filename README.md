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

The staged migration plan for bringing Cabinet Workshop web features into this standalone CAD application is tracked in [ROADMAP.md](ROADMAP.md).

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
Cabinet-WS-Standalone-0.1.0-Windows-x64.exe
```

The executable is currently unsigned, so Windows SmartScreen may identify it as an unknown publisher during prototype development.

## Automated Windows builds

`.github/workflows/windows-package.yml` builds the current project on a GitHub-hosted Windows runner.

On pushes to `main` and pull requests it:

1. installs Node.js 24,
2. installs npm dependencies,
3. runs the TypeScript/Vite production build,
4. packages the Electron application as a portable Windows executable, and
5. uploads the executable as the `cabinet-ws-standalone-windows` workflow artifact.

This is useful for testing development builds without setting up a local Windows build environment.

## Publish a named GitHub release

Tagged versions are published automatically by `.github/workflows/release.yml`.

The release tag **must exactly match the version in `package.json`**. For example, to publish version `0.2.0`:

1. Update `package.json`:

   ```json
   "version": "0.2.0"
   ```

2. Commit and push the version change:

   ```bash
   git add package.json
   git commit -m "Release v0.2.0"
   git push origin main
   ```

3. Create and push the matching tag:

   ```bash
   git tag -a v0.2.0 -m "Cabinet WS Standalone v0.2.0"
   git push origin v0.2.0
   ```

Pushing the tag starts the **Publish Windows Release** workflow. It builds the application from that tagged commit and creates a GitHub Release named:

```text
Cabinet WS Standalone v0.2.0
```

The release contains:

- `Cabinet-WS-Standalone-0.2.0-Windows-x64.exe`
- `Cabinet-WS-Standalone-0.2.0-Windows-x64.zip`
- `SHA256SUMS.txt`
- automatically generated GitHub release notes

If the tag is `v0.2.0` but `package.json` contains a different version, the release workflow fails intentionally rather than publishing a mislabeled executable.

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
