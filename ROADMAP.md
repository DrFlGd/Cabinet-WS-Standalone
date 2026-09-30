# Cabinet WS Standalone roadmap

This file describes current status and upcoming work. Historical releases and
implementation details belong in [CHANGELOG.md](CHANGELOG.md) and
[ARCHITECTURE.md](ARCHITECTURE.md). The package baseline is v0.14.1.

## Migration rules

- Port domain behavior, not the old web/OpenSCAD interaction architecture.
- The semantic cabinet document owns design truth; Three.js owns presentation.
- Reuse Cabinet Workshop as an independent regression oracle.
- Preserve project compatibility and millimeter-native geometry.
- Distinguish editable/persisted settings from implemented and verified geometry.
- Keep Manual Layout central and avoid duplicate section editors.
- Record each notable change in the changelog.

## Completed baseline

| Area | Current implementation | Qualification |
| --- | --- | --- |
| Editor foundations | Units, native project IO, dirty state, recovery, undo/redo | Packaged crash/recovery testing remains |
| Families/catalog | Seven families and 110 starter recipes | Full construction parity is not established |
| Settings | 1,678 schema fields, dependencies, generated controls, expressions | Schema-driven runtime validation remains |
| Layout | Bounded sections/bays, shelves and divider handles | Dedicated Drawer/Equipment Stand generators do not use the shared section editor |
| Hardware | Semantic definitions, instances, drilling and catalog presets | Catalog began with Utility-compatible hardware |
| Geometry | Worker-based exact bodies, semantic topology, STEP | Known construction/feature gaps remain |
| Inspection | Direct dimensions, selection, clipping, display modes and measurements | Accessibility/performance passes remain |
| Validation | Native Design Health and fit solving | Coverage varies by feature/family |
| Shop documentation | BOM, cut list, hardware lists and assembly reports | Some edge/grain data is inferred |
| Manufacturing | Nominal DXF/SVG/drilling operations and reviewed packages | Not compensated CNC paths |
| Production planning | Grain-aware sheet nesting, remnants and registration | Transient settings; no G-code |

The v0.7 interaction work, v0.13 family/catalog port, and v0.14 native controls are
already implemented. They are not upcoming milestones.

## Stabilization completed in v0.14.1

- [x] preserve unrelated native settings when family controls regenerate parameters
- [x] preserve family-only recipe choices during synchronization/save/reopen
- [x] synchronize section-to-Simple transitions
- [x] correct kitchen segmented-frame depth inversion
- [x] support drawer inverse sizing and explicit modular-grid/native resize transition
- [x] switch equipment sizing to manual on native envelope resize
- [x] hydrate sparse web recipes before adapting their geometry
- [x] isolate mutable nested parameter arrays in history snapshots
- [x] reject partial STEP assemblies and omitted machining cuts
- [x] release export shapes on both success and failure
- [x] add save/edit/history and STEP failure regression coverage
- [x] reconcile current-status documentation

Validation evidence belongs in the pull request. This checklist records implemented
scope, not a claim that the Windows application has been manually verified.

## Next: dependable build and desktop baseline

- [x] Commit a dependency lockfile and switch all CI workflows to `npm ci`.
- [ ] Validate a complete passing run of the packaged Windows EXE in smoke tests: load the geometry worker, open a
  representative project, edit, save/reopen, and export.
- [ ] Add modeling-workspace error boundaries and actionable recovery UI.
- [ ] Exercise autosave/recovery across crashes and migrations; add About/version info.

Acceptance: reproducible installs, green renderer/package checks, and a packaged
application smoke test that verifies a real project workflow.

## Then: verified family parity

Create a capability matrix linking each setting to its owning subsystem and status:
geometry-driving, manufacturing-driving, compatibility-only, or unsupported.

Prioritize:

1. Cross-family dimensions, clear openings, material thickness and native/recipe edits.
2. Construction and machining details: back rabbets, French-cleat bevels, drawer
   joinery, skeletonized sides and stack interfaces.
3. Equipment Stand purchased hardware and manufacturer-verified face-frame mounting.
4. Explicit unsupported-setting feedback instead of controls that imply completed geometry.

Acceptance: representative saved web fixtures evaluated against both implementations
for normalized inputs, dimensions, part counts, BOM dimensions, operations/depths,
and deterministic visual sanity. Building all 110 native starters alone does not
establish cross-engine parity.

## Code organization and performance

- Split application orchestration into project IO, editor commands, exports and
  workspace composition while keeping the same document/history path.
- Consolidate typed per-family adapters and their forward/reverse mapping contracts.
- Derive runtime project validation and useful validation messages from schemas.
- Bound the geometry cache and profile rapid edits, large layouts and long sessions.
- Replace source-text UI assertions with behavioral tests where practical.
- Complete keyboard/accessibility and drag-and-drop project-opening support.

Acceptance: stable public document behavior, focused ownership, measured performance
budgets, and no regression in saved designs or manufacturing output.

## Production workflow completion

- Persist sheet stock, remnants, tools and nesting configuration; preserve compatible
  settings when cabinet geometry changes.
- Finish construction details before declaring their manufacturing output ready.
- Extend explicit edge-band and machining metadata rather than relying on inference.
- Implement compensated tool-center paths and at least one verified, explicit
  machine/postprocessor before enabling G-code.

Nesting spacing/tool diameter currently reserves clearance only. Nominal DXF/SVG
must not be treated as compensated machine motion.

## Later desktop distribution

Signed releases, optional installer, file associations, native recent-file
integration, an update strategy, stress testing and schema migration release notes.
Telemetry/crash reporting requires a deliberate product/privacy decision.

## Later cabinet/furniture expansion

Custom panel outlines/cutouts, a constrained panel sketcher, reusable subassemblies,
multi-cabinet projects, countertops, fillers, end panels, moldings, STEP hardware,
wall/floor references, cabinet-run alignment and collision visualization.

Pursue these after the existing cabinet workflow is dependable; avoid turning the
project into a general mechanical CAD system without a cabinet-specific need.
