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

v0.8 extends that rule to shelves and section dividers. Simple shelves persist normalized positions in cabinet parameters; section shelves persist an optional normalized position list on their owning section node. 3D divider handles modify adjacent bounded-section weights through editor history. No shelf or divider drag survives only as a renderer transform.

## v0.8 construction and measurement boundary

Drawer joinery, bottom construction, organizer grids, and face frames are generated as semantic `CadPart` records plus registered cut features. Captured-bottom grooves and drawer rabbets enter the same feature graph consumed by the exact worker; face-frame stiles/rails are fabricated bodies rather than decorative viewport overlays.

Semantic measurement is read-only over exact output. Distance resolves semantic face centers/edge midpoints, face size uses the selected tessellation face group, and angle uses semantic face normals. Measurement state is not persisted and cannot mutate geometry.

The bounded section tree remains the source of opening truth. Face-frame-aware UI dimensions show the usable frame-clear opening while preserving the underlying carcass section constraints. New section nodes may persist an optional shelf-position array; legacy 12-field nodes remain accepted and are migrated/defaulted in memory.

## v0.9 validation and solver boundary

Design Health is a pure semantic consumer. It reads the current `CabinetDocument`,
regenerates the cabinet feature graph, consumes hardware definitions/keepout
envelopes, bounded-section constraints, and current exact-kernel diagnostics, and
returns categorized checks plus coverage/readiness. It does not depend on Three.js
objects, raw OpenCascade topology indexes, or OpenSCAD report text.

Current native checks cover document/interface integrity, joinery residual stock,
section feasibility, hardware compatibility/support, shelf-to-hardware keepout
collisions, registered drilling edge distance, overlapping subtractive machining
envelopes, and exact-kernel diagnostics. Because checks bind to semantic part and
feature IDs, later manufacturing/BOM UIs can link warnings directly to the same
entities.

The Fit Solver is also document-native. A target resolves to a proposed
`Partial<CabinetParameters>` plus requested/achieved values, explanation lines,
warnings, and feasibility. The UI never mutates geometry directly: applying a
feasible solution sends the parameter patch through `sanitizeParameters()` inside
one editor-history edit. The resulting document then follows the normal analytical
preview -> exact worker rebuild -> Design Health reevaluation cycle. Infeasible
drawer slide limits and unsupported cabinet envelope sizes are reported rather than
silently clamped.

## v0.10 shop-documentation boundary

Shop documentation is a derived semantic view, not persisted document state. The
Phase 10 generator consumes the current `CabinetDocument`, regenerates the registered
feature graph, and receives the current Design Health/readiness result. It produces
stable shop part numbers, BOM/cut-list rows, material groups, hardware checklists,
assembly groups, CSV data, and printable HTML.

Shop part numbers are deterministic projections of semantic part IDs. They do not
depend on Three.js UUIDs, raw OpenCascade topology ordering, dimensions, or row
position, so CAD selection and BOM selection can share the same `partId`.

Finished and blank sizes in Phase 10 are body/panel-blank **envelopes**. A toe-kick
profile, hole pattern, dado, rabbet, groove, or pocket remains registered feature
intent summarized alongside the part; Phase 10 does not pretend those envelopes are
operation-layer manufacturing geometry. Phase 11 owns per-operation DXF/SVG,
machining-face metadata, and profile/drilling maps.

Grain direction and edge-banding requirements are semantic shop-documentation
inference from panel orientation and exposed cabinet role. No hidden edge-band stock,
thickness, or manufacturer data is invented. When those become explicit cabinet
parameters later, the report layer should consume them instead of inference.

Assembly steps and checklist state are editor/report concerns. The interactive
assembly review reuses semantic part selection and the existing exploded viewport;
the printable packet generates a separate schematic isometric SVG with stable part
callouts. Native Electron text export only receives already-generated CSV/HTML and
writes it through a save dialog.

## v0.11 manufacturing-geometry boundary

Phase 11 is another derived semantic layer. `buildManufacturingModel()` consumes the
current `CabinetDocument`, Phase 10 shop part numbers, the regenerated feature graph,
and Phase 9 Design Health. It projects each fabricated part into a part-local
millimeter machining plane whose U/V axes are explicit and whose remaining axis is
the stock-thickness axis.

Registered features become normalized CUT, POCKET, DADO/GROOVE, DRILL, ENGRAVE,
and EDGE operations. Operations carry stable part/feature identity, machining-face
semantic IDs, depth/through state, and simple 2D primitives. Outer/profile geometry
comes from semantic panel profiles, not tessellated Three.js or OpenCascade triangles.

DXF and SVG are presentation/export encodings of that operation model. DXF declares
millimeters with `$INSUNITS=4`; SVG uses millimeter dimensions and scale 1. Drilling
maps and JSON metadata preserve the same part-local coordinate frame and semantic
face/depth information.

The reviewed manufacturing package is a snapshot artifact, not persisted cabinet
state. A package is blocked while Design Health readiness is `blocked`; otherwise
the exact manufacturing signature must be explicitly reviewed in the UI. A ZIP
contains manifests/reports plus per-part and per-layer DXF/SVG/drilling/metadata.

No Phase 11 file is a CNC toolpath. There is no cutter compensation, kerf, feeds,
speeds, nesting, work offset, machine profile, postprocessor, or G-code generation.
Those concerns belong to Phase 12 and must consume these registered operations
rather than reverse-engineer them from exported graphics.

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

Phase 12 should consume the Phase 11 operation model for sheet stock, grain-aware
nesting, rotation constraints, kerf/tool diameter, remnants, and machine/postprocessor
profiles. Toolpaths must remain downstream of explicit machine/tool configuration;
the project should not infer CNC motion from Three.js meshes or generic DXF alone.
