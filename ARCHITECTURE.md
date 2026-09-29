# Cabinet WS Standalone architecture

## Core rule

The CAD document owns cabinet meaning. Three.js owns visualization and interaction,
not cabinet truth.

Do not store durable cabinet identity in mesh UUIDs, scene ordering, OpenCascade
face indexes, or renderer state.

## v0.7 modeling flow

```text
CabinetParameters
      |
      v
buildCabinetDocument()
      |
      +--> stable CadPart / HardwareInstance records
      |       id / material / position / size / metadata
      |
      +--> immediate analytical preview
      |       |
      |       v
      |    Three.js
      |
      +--> buildFeatureGraph()
              |
              v
      WorkerGeometryKernel
              |
              +--> Replicad / OpenCascade B-Rep
              |       panel blanks
              |       profile cutouts
              |       dado / rabbet / pocket booleans
              |       drilling / hole patterns
              |
              +--> semantic topology map
              |       stable face / edge / feature IDs
              |
              +--> per-part tessellation cache
                      |
                      v
                   Three.js
```

The analytical model is intentionally retained. It is the cheap interaction preview
while a worker rebuild is running and the fallback for any part whose exact rebuild
reports an error. Once a matching exact result returns, its tessellation replaces the
preview for that part.

## GeometryKernel boundary

The renderer talks to the kernel through a small asynchronous boundary:

```ts
interface GeometryKernel {
  rebuild(document: CabinetDocument, dirtyIds?: string[]): Promise<KernelResult>;
  tessellate(bodyIds?: string[]): TessellatedPart[];
  exportStep(bodyIds?: string[]): Promise<ArrayBuffer>;
  dispose(): void;
}
```

The browser/Electron renderer never receives live OpenCascade objects. The worker
returns transferable/plain tessellation and semantic-topology records. STEP is
generated inside the worker and returned as bytes for the desktop save dialog.

### Rebuild behavior

- Each rebuild has a monotonically increasing request ID.
- Older pending rebuilds are rejected/superseded when a newer edit arrives.
- The worker yields between parts so queued edits can invalidate stale work.
- The client compares part/feature signatures and sends dirty part IDs.
- Unchanged tessellations are served from the worker cache.
- Exact-result errors are returned as diagnostics and surfaced in Properties.
- During any rebuild the viewport returns to the current analytical preview instead
  of displaying exact geometry from an older parameter state.

## Feature graph

The feature graph is generated from cabinet semantics and is not persisted as raw
kernel state. Current feature vocabulary includes:

- panel blank
- dado
- rabbet
- groove
- pocket
- hole
- hole pattern
- hardware reference
- assembly transform

Chamfer/bevel and edge-treatment IDs are reserved in the type system but their
geometry/manufacturing behavior is deferred.

A feature has a stable cabinet-facing ID such as a part-local dado or back-rabbet
operation. Manufacturing work should consume these registered features rather than
reverse-engineering operations from tessellated triangles.

## Semantic topology

OpenCascade can reorder topology whenever a boolean or dimension changes, so raw
kernel indexes are never user-facing identities.

The worker classifies generated topology into stable names such as:

- `carcass:left`
- `face:carcass:left:inside`
- `face:carcass:left:front`
- `edge:carcass:left:front-top`
- semantic `feature:...` IDs from the feature graph

Raw face/edge IDs are kept only long enough to map tessellation groups to these
semantic names. Selection, future measurements, dimensions, constraints, and
manufacturing references should bind to the semantic identity.

## Exact geometry currently covered

For the Utility Cabinet v0.6 proof of concept the kernel creates exact bodies for
fabricated cabinet parts. Purchased hardware remains simplified semantic reference geometry. It also applies the machining intent already present in the
semantic cabinet model, including:

- panel/profile extrusion
- toe-kick side profiles
- dado/pocket subtraction
- applied-back rabbet proof geometry on cabinet sides
- adjustable-shelf line boring and other registered drilling
- semantic purchased-hardware references remain preview-only; they are deliberately excluded from the exact body set

STEP export writes the exact assembly with stable part names and millimeter units.

The applied-back rabbet is currently a kernel proof operation on the side panels;
the existing analytical applied-back envelope has not yet been redesigned around a
full production rabbet construction recipe. That construction-detail refinement
belongs with the broader cabinet manufacturing work rather than being hidden as a
false parity claim.

## Direct interaction boundary

v0.7 adds direct manipulation without changing cabinet ownership. Width/height/depth overlays and W/D/H drag handles call the same `CabinetParameters` update/history path used by Properties. The analytical document rebuild is immediate; exact OpenCascade work remains asynchronous in the worker.

Multi-selection, isolate/hide state, clipping, display mode, camera projection, and the right-click part menu are editor/viewport state. They must not become durable cabinet identity or substitute renderer transforms for persistent cabinet parameters. A direct manipulation is only a real model edit when it changes semantic document data and therefore participates in undo/redo and exact rebuilds.

The current Utility model does not persist arbitrary shelf coordinates, so v0.7 intentionally does not fake shelf dragging by moving Three.js meshes independently of the document. Future shelf/divider manipulation must first establish the corresponding semantic parameter/constraint model.

## Three.js responsibilities

Three.js remains responsible for:

- viewport rendering
- camera/orbit interaction
- part highlighting
- raycasting
- display of semantic face/edge selection
- cheap preview geometry while exact work runs

It is not responsible for manufacturing truth or boolean geometry.

## Next architectural layer

The next work extends the same boundary rather than replacing it: semantic measurement tools, persistent movable shelf/divider constraints, then the Phase 8 drawer/door/face-frame model. Manufacturing and measurement consumers should continue to bind to semantic parts/features/topology rather than renderer objects or transient OpenCascade indexes.
