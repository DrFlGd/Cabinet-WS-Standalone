# Cabinet WS Standalone architecture

## Ownership

The CAD document owns cabinet meaning. Three.js owns visualization and interaction.
Durable identity must not depend on mesh UUIDs, scene order or raw OpenCascade
face/edge indexes. OpenSCAD is a migration reference, not the production runtime.

The processing flow is:

1. Project/editor state: family recipe plus canonical native parameters.
2. Family adapters and generators: semantic parts, hardware and construction intent.
3. Feature graph: stable part-local manufacturing features.
4. Worker kernel: exact bodies, semantic topology and tessellation.
5. Consumers: viewport, measurements, Design Health, shop documentation,
   manufacturing operations and production planning.

## Project state and family editing

Schema v3 persists `family`, optional `starterId`, `familyValues`, canonical
`parameters`, name, millimeter storage units and display units. Schema v1/v2 projects
migrate as Utility documents. Web imports accept all seven legacy family identities
and hydrate sparse recipes before adapting native geometry.

`familyCatalog.ts` owns starter recipes and recipe-to-native adaptation.
`familySettings.ts` owns schema controls/dependencies, computed expressions and
native-to-recipe synchronization. These modules must not import editor or renderer
state. `familyModel.ts` dispatches semantic generation:

- Shop Cart, Utility, Benchtop, Stackable and Kitchen share the cabinet generator.
- Stackable carries interface intent on its owning side panels and adds its separate
  base part; the detailed radiused mating side profile remains a parity gap.
- Drawer and Equipment Stand have dedicated generators.

The recipe and native model are related but not interchangeable: some recipe fields
are compatibility-only, and some native parameters have no recipe equivalent.
Synchronization projects differences against the recipe's adapted native model.
It does not unconditionally rewrite recipe-only alternatives such as equipment
`top_style`, automatic back styles, or legacy joinery aliases.

A family edit compares the recipe's old and new adapted native models and updates
only affected canonical parameters. This preserves unrelated native edits, including
shelf positions and manually edited section trees. Family mode changes still apply
the dimensions/structure produced by the newly selected mode. All edits use one
history operation, and nested parameter arrays are cloned in history snapshots.

Native dimension edits invert drawer inside-clear/enclosure calculations. An
arbitrary modular-grid drawer resize switches to outside-box sizing; a native
resize of an equipment-sized stand switches to manual sizing. These transitions
are explicit persisted recipe changes and participate in undo/redo. Kitchen nominal
depth inversion includes both face-frame thickness and segmented-frame back dado.

Manual Layout owns `section_nodes`; it is not duplicated as a raw family array
editor. Canonical layout transitions synchronize back to recipe layout mode.
Output/System fields retain compatibility values; native export commands remain
authoritative. Runtime validation currently sanitizes native parameters and bounds
individual controls; full schema-derived recipe validation remains future work.

## Exact geometry boundary

`WorkerGeometryKernel` exposes asynchronous `rebuild`, `tessellate`, `exportStep`
and `dispose`. Live OpenCascade objects never cross the worker boundary. Responses
contain plain tessellation/topology records or STEP bytes.

Rebuilds use increasing request IDs, dirty-part signatures and a tessellation cache.
Older rebuilds are superseded; the worker yields between parts. The UI uses the
current analytical preview while rebuilding instead of showing old exact geometry.
Failed parts retain preview fallback with diagnostics. The cache currently has no
eviction policy; bounding it is a known performance task.

The feature vocabulary includes panel blanks, profiles, dados, rabbets, grooves,
pockets, holes/patterns, hardware references and assembly transforms. Chamfer/bevel
and edge-treatment kinds are reserved; their exact behavior is not complete.

For the shared-cabinet baseline tab/slot joint, the semantic horizontal member owns
the retained mating tabs in its finished profile. The side-panel feature graph owns
matching through-slot receivers, including fit clearance and full-thickness machining
depth. Preview profile geometry, exact worker construction, manufacturing projection,
and STEP export therefore derive from the same semantic part/feature intent. Detailed
reference tab count/width/placement policies and additional joined members remain
separate parity work.

Physical parts must not be duplicated to improve presentation. Coincident display
depth treatment is reserved for intentional nonphysical overlays such as registered
machining features; overlapping fabricated solids are corrected in the semantic
assembly instead of being offset or depth-biased in Three.js.

Semantic face/edge IDs map generated topology back to cabinet roles. Measurements
bind to these identities: distance uses reference centers/midpoints, face size uses
the selected exact tessellation face group, and angle uses semantic face normals.
They are inspection tools, not a general constraint solver.

## STEP export contract

STEP is generated from a snapshot of the current kernel payload, with semantic
part names and millimeter units. Purchased hardware reference envelopes are excluded.
Explicitly requested unavailable bodies fail the request. An empty assembly fails.

The worker rejects the entire export if any requested body fails or a machining
feature was skipped. It preserves diagnostics and releases assembled shapes in a
`finally` block, including serialization failures. The client also rejects error or
skipped-cut diagnostics before returning bytes. The existing UI error handler shows
the failure and does not open the save dialog for a failed export.

Preview fallback is an interaction aid only; it is not permission to export an
incomplete exact assembly. An in-progress export uses its captured request snapshot,
not subsequent edits.

## Workspace presentation and settings navigation

The desktop shell treats the native 1100 × 700 minimum window as a real supported
workspace rather than a scaled-down desktop. Header, toolbar, left workspace, viewport,
and Properties panel keep independent overflow boundaries. At constrained widths,
expanded Hardware and Parts drawers overlay their owning left workspace instead of
consuming the model viewport; Shop Docs and Production Planning retain their own
scoped layout rules.

Manual Layout and Fit Solver are sibling presentation tabs over the same semantic
document. Both tab surfaces remain mounted while switching so transient solver inputs
and results are not discarded. Applying a feasible fit still uses the existing single
undoable parameter edit. Design Health is outside the tab switch and remains visible
beneath either surface. Drawer and Equipment Stand do not gain a synthetic section
editor; their Layout tab explains the dedicated-generator boundary.

The Properties panel keeps 3D selection separate from browsing state. Explicit Family
or Native category browsing only changes local navigation/scroll state and never
clears the selected semantic part or edits cabinet data. A selected-part return action
restores contextual properties. Search remains scoped to the chosen settings surface,
while category activation clears search and scrolls the results region to its section.

## Direct editing and hardware

Viewport dimensions, shelf movement and section-divider handles update semantic
parameters through the same history path as Properties. Camera, selection,
hide/isolate, clipping, exploded view and display modes remain editor state.

Hardware presets copy editable dimensions/clearances and drilling intent into the
model. Purchased instances carry identity, mounting references, keepout envelopes
and verification status. Reference geometry does not claim manufacturer-exact B-Reps.
Unsupported drilling must not be invented from ambiguous catalog data.

The catalog originated with Utility-compatible profiles. Family-specific coverage
needs explicit verification. Equipment Stand currently has no purchased hardware
instances, and its French-cleat angle is metadata on rectangular rails. These are
known implementation gaps, not completed production geometry.

## Validation and shop documentation

Design Health consumes the semantic document, feature graph, hardware/keepouts,
section constraints and current kernel diagnostics. It returns categorized checks,
coverage and manufacturing readiness without parsing OpenSCAD reports or meshes.
The fit solver proposes parameter patches; applying a feasible result is one
undoable semantic edit.

Shop Docs derives stable part numbers, BOM/cut-list rows, material groups, hardware
lists and assembly reports. Part numbers derive from semantic IDs. Blank/finished
sizes are envelopes; profile/machining detail remains registered feature intent.
Grain and exposed-edge requirements are partly inferred, not complete material/CAM
specifications. Assembly review links to the same semantic selection as the viewport.

## Manufacturing geometry and production planning

`buildManufacturingModel()` projects fabricated parts/features into explicit local
U/V machining planes. CUT, POCKET, DADO/GROOVE, DRILL, ENGRAVE and EDGE operations
carry part/feature identity, face, depth and through state. DXF declares millimeters;
SVG is true-scale. Drilling CSV/JSON retain the same coordinate frame.

Reviewed package export is blocked on Design Health errors and requires review of
the current manufacturing signature. Manufacturing geometry is nominal, not CNC
motion. The applied-back rabbet remains a proof operation requiring construction
reconciliation; reports must not imply verified parity beyond implemented features.

Production planning consumes nominal operations and semantic stock/grain data.
A deterministic free-rectangle heuristic allocates compatible material/thickness
parts to sheets and explicit remnants. Rotation is 0/90 degrees subject to grain.
Clearance is the maximum of configured spacing, kerf allowance and tool diameter.
Placements retain part IDs, shop numbers, operation IDs, sheet identity and transforms.
Sheet DXF/SVG and registration JSON derive from those transforms.

Production configuration is currently transient component state and resets when
its source documentation/manufacturing changes. Persistence and reconciliation are
backlog work. Tool/machine/postprocessor types exist, but compensated tool-center
paths and a verified postprocessor do not. G-code remains disabled.

## Desktop lifecycle and recovery

Electron owns native file access and renderer lifecycle. The renderer keeps a single
recovery document in the Electron user-data directory (or localStorage in browser
preview mode). Recovery is read before autosave is enabled. Dirty documents are
debounced to recovery storage and are also flushed when the document becomes hidden
and when an unload is attempted. Browser preview keeps a dirty `beforeunload` guard;
desktop unload only flushes recovery because Electron owns the actual close decision.

The first native window close (including the window X and application Exit/Quit path)
is intercepted once and forwarded to the renderer only while the preload bridge has
reported an active close listener. Clean documents approve it immediately. Dirty
documents first flush recovery, then use a native Save / Discard / Cancel prompt.
Successful Save and explicit Discard approve a single close retry; Cancel and
cancelled/failed saves reset the pending request and keep the window open.

During startup, root-error fallback, renderer reload, or termination, Electron clears
the listener-ready state. A native close with no registered renderer listener proceeds
without interception, preserving any existing recovery copy. If listener teardown
happens while a close request is pending, the pending flag is released so later X/Exit
attempts are not suppressed. This intentionally avoids a blind timeout that could race
an active Save dialog. Autosave/unload writes are suppressed while an accepted close
is completing so they cannot recreate discarded recovery data. Native recovery write
and clear operations remain serialized per destination, and each write uses a unique
staging filename before rename. A clear queued after a pending write executes after
that write, so stale recovery data cannot be recreated after the clear completes.

The React root and modeling workspace are protected by error boundaries. A workspace
render/lifecycle failure keeps the current recovery copy, attempts one last recovery
write from the current serialized document, and replaces the failed UI with an
actionable reload screen rather than a blank renderer.

Electron listens for abnormal renderer termination. It does not clear recovery data:
the user can reload the workspace, which re-enters the normal recovery flow, or close
the window. Clean exit and application shutdown do not trigger the crash dialog.
The crash handler is dependency-injected and covered by behavioral tests without
requiring a packaged renderer process.

Runtime application information is exposed through a narrow preload IPC method.
The About dialog uses Electron `app.getVersion()` in desktop mode and package
metadata in browser preview, avoiding independently maintained version strings.

## Regression boundaries

Tests should verify document behavior: family/native edit sequences, repeated
save/reopen, legacy hydration, undo/redo, geometry and operation intent. The complete
starter catalog is checked for stable IDs and viable semantic parts; this is not
an independent cross-engine parity proof.

STEP worker tests inject body/cut/serialization failures and check rejection and
cleanup. These tests isolate transaction behavior with mocked geometry APIs; exact
OpenCascade and packaged Electron execution need dedicated integration/smoke checks.
CI currently runs Vitest, TypeScript/Vite builds and Windows portable packaging.
Renderer-crash recovery is exercised with mocked Electron lifecycle objects; packaged
EXE crash/recovery interaction still requires dedicated smoke coverage.
