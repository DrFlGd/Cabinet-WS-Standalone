# Cabinet WS Standalone migration roadmap

This roadmap tracks the migration of useful Cabinet Workshop web features into
Cabinet WS Standalone while preserving the standalone application's CAD-first
architecture.

The goal is **feature parity where it benefits cabinet design and manufacturing**,
not a line-for-line port of the web application.

The web application remains a reference implementation during migration,
especially for parameter behavior, validation, hardware defaults, manufacturing
reports and regression geometry.

---

## Migration principles

### Port domain behavior, not the old interaction architecture

Good candidates to port directly:

- cabinet-family terminology and defaults
- starter/preset data
- unit handling
- hardware catalogs and hardware metadata
- validation rules
- save-file compatibility logic
- manufacturing terminology and report semantics
- assembly and BOM domain knowledge

Features that should be reimplemented for the standalone CAD architecture:

- exact geometry generation
- component selection
- section editing
- machining geometry
- design health
- fit solving
- exploded assembly visualization
- manufacturing review
- project persistence and desktop file handling

Features that should **not** become architectural dependencies:

- browser OpenSCAD WASM rendering
- regex-based OpenSCAD source configuration
- the web schematic geometry model as CAD truth
- browser-localStorage as the primary project system
- source-ZIP/OpenSCAD export as the primary manufacturing path

The legacy OpenSCAD engine should remain available as a **reference and regression
oracle** until the standalone geometry/manufacturing implementation is proven.

---

# Phase 0 — Establish the standalone baseline

**Status: mostly complete**

Purpose: make the standalone repository a reliable place to iterate.

### Current capabilities

- [x] React + TypeScript desktop UI
- [x] Electron desktop shell
- [x] real-time Three.js viewport
- [x] stable semantic part IDs
- [x] component tree
- [x] cabinet properties panel
- [x] click selection
- [x] explode control
- [x] basic parametric base cabinet
- [x] portable JSON project format
- [x] Windows executable packaging
- [x] CI build workflow
- [x] tag-driven GitHub Releases

### Remaining baseline work

- [ ] add a dependency lockfile and switch CI to deterministic installs
- [ ] add smoke tests for the Electron packaged app
- [x] add a project-schema migration framework before the file format grows
- [ ] add application version/about information to the desktop UI
- [ ] add crash/error boundary UI around the modeling workspace

### Definition of done

A fresh checkout builds reproducibly, CI verifies it, and a tagged release produces
a runnable Windows artifact.

---

# Phase 1 — Project compatibility, units and editor foundations

**Recommended first migration phase**

Purpose: bring across foundational behavior before adding more cabinet geometry.

## 1.1 Units

Port the mature unit behavior from Cabinet Workshop.

- [x] millimeter / inch display preference
- [x] internal storage remains millimeters
- [x] precision-preserving unit conversion
- [ ] dimensional-field metadata instead of guessing field type
- [x] unit preference persisted in project/UI settings
- [x] dimensional formatting helpers
- [x] unit conversion regression tests

**Reference:** web `lib/units.ts`, `app/DimensionInput.tsx`

## 1.2 Project files

- [x] define standalone project schema v2
- [x] schema-version migrations
- [x] robust runtime validation
- [x] recent-project list
- [x] autosave / recovery file
- [x] dirty-document tracking
- [x] confirm destructive New/Open actions when dirty
- [x] native desktop Open / Save / Save As dialogs
- [ ] drag-and-drop project opening
- [x] maintain portable JSON format

## 1.3 Import legacy Cabinet Workshop projects

- [ ] import web `.cabinet.json` v1/v2 documents
- [ ] map seven legacy family IDs into standalone cabinet types
- [ ] preserve supported parameter values
- [ ] report unsupported legacy settings instead of silently dropping them
- [ ] migration summary dialog after import
- [ ] fixture tests using real saved web-version projects

Do **not** make the standalone save format identical to the old web format. Legacy
files are an import source; the standalone document needs room for parts, features,
semantic topology, visibility and future assemblies.

## 1.4 Undo / redo

- [x] command/history model for parameter edits
- [x] undo/redo keyboard shortcuts
- [x] coalesce continuous dimension edits into one history operation
- [x] preserve selection when possible
- [x] test New/Open/history boundaries

### Definition of done

A user can create, edit, save, reopen and recover a cabinet reliably in either mm
or inches, and can import representative Cabinet Workshop projects.

---

# Phase 2 — Cabinet-family parity

Purpose: reproduce the major design families from the web version in the new
semantic document model.

Target families from Cabinet Workshop:

1. Utility cabinet
2. Shop cart
3. Benchtop cabinet
4. Stackable cabinet
5. Kitchen cabinet
6. Standalone drawer
7. Equipment stand

## 2.1 Create a shared cabinet construction model

Before implementing all seven frontends:

- [ ] common carcass parameters
- [ ] floor / wall mounting
- [ ] toe kick / flat base behavior
- [ ] back styles
- [ ] top/stretchers/worktop
- [ ] overlay / inset front relationships
- [ ] material/stock definitions
- [ ] common clearances
- [ ] common shelf representation
- [ ] common semantic part naming

## 2.2 Port one family at a time

Recommended order:

- [x] **Utility cabinet** — reference implementation
- [ ] **Kitchen cabinet** — richest conventional cabinet behavior
- [ ] **Shop cart**
- [ ] **Benchtop cabinet**
- [ ] **Stackable cabinet**
- [ ] **Standalone drawer**
- [ ] **Equipment stand**

For every family:

- [x] parameter defaults *(Utility)*
- [x] parameter dependencies/visibility *(Utility)*
- [x] starter configurations *(supported Utility starters; mixed-bay starters deferred to v0.4)*
- [x] part generation *(Utility semantic prototype geometry)*
- [x] semantic part IDs *(Utility)*
- [x] basic BOM parity *(Utility regression fixtures)*
- [x] legacy project import *(Utility web projects)*
- [x] regression fixtures against the web/OpenSCAD implementation *(Utility schema/geometry contract fixtures)*

### Definition of done

All seven web-version families can be opened or created in Standalone with
equivalent principal cabinet dimensions and part counts.

---

# Phase 3 — Settings system and starter catalog

Purpose: port the powerful web configuration system without rebuilding the giant
`page.tsx` component.

## 3.1 Typed parameter schema

Replace ad-hoc parameter fields with a typed standalone schema.

Each parameter should describe:

- key
- type
- unit
- label
- description/help
- valid range/options
- default
- advanced/basic
- category/group
- dependency/visibility rule
- affected model nodes

- [x] strongly typed parameter definitions *(Utility)*
- [ ] runtime project validation from the same schema
- [x] generated property controls *(Utility)*
- [ ] validation messages
- [x] dependency-aware visibility *(Utility)*
- [x] advanced-setting presentation *(Utility baseline)*

**Reference:** web `lib/schema.json`, `lib/settings.ts`

## 3.2 Starter designs

The web version currently contains roughly 110 starters, including the standard
kitchen recipe catalog.

- [ ] define standalone starter format
- [ ] port general starters
- [ ] port standard kitchen configurations
- [ ] starter browser with search/categories
- [ ] preview metadata
- [ ] apply starter as one undoable operation
- [ ] tests validating every starter produces a valid model

**Reference:** web schemas and `catalog/kitchen-standard-recipes.json`

### Definition of done

Standalone exposes the useful breadth of web configuration without duplicating
web-specific presentation logic.

---

# Phase 4 — Section / bay layout editor

Purpose: port one of the strongest web-version cabinet-layout features and improve
it with direct CAD interaction.

## 4.1 Section data model

Port the bounded section tree concept:

- [x] leaf / horizontal split / vertical split
- [x] proportional sizing
- [x] fixed clear-opening sizing
- [x] drawers / doors / open sections
- [x] shelves
- [x] panel / rail / no-divider construction
- [x] nested layouts
- [x] validation constraints
- [x] legacy mixed-bay conversion

**Reference:** web `lib/sections.ts`

## 4.2 Desktop section editor

Do not simply reproduce the SVG editor.

- [x] tree/property editing
- [x] direct divider handles in a dedicated front-elevation view
- [x] numeric clear-opening dimensions
- [x] split selected opening left/right
- [x] split selected opening top/bottom
- [x] collapse subtree
- [x] selected subtree highlighting
- [x] live dimension annotations
- [x] undoable drag operations

## 4.3 Cross-engine regression

Until the standalone kernel becomes authoritative:

- [x] compare section rectangle resolution against web TypeScript
- [x] compare selected legacy designs against web/OpenSCAD-derived starter dimensions and semantic part counts
- [x] preserve old section-layout imports

### Definition of done

A user can build nested cabinet opening layouts more naturally in Standalone than
in the web application while preserving legacy section behavior.

---

# Phase 5 — Hardware and cabinet intelligence

**Status: implemented for the Utility Cabinet reference family in v0.5**

Purpose: move the web hardware knowledge into first-class CAD objects.

## 5.1 Hardware catalog

Port:

- [x] drawer-slide presets *(74 Utility-compatible profiles)*
- [x] hinge presets *(10 Utility-compatible profiles)*
- [x] manufacturer/model metadata
- [x] verification/source status
- [x] family compatibility
- [x] hardware search/filtering

**Reference:** web `lib/hardware.json`, `lib/equipment-hardware.json`,
`app/HardwarePicker.tsx`

## 5.2 Hardware as semantic CAD components

Instead of only applying parameter patches:

- [x] HardwareDefinition
- [x] HardwareInstance
- [x] mounting references
- [x] drilling patterns
- [x] keepout volumes
- [x] required clearances
- [x] optional simplified 3D reference geometry
- [x] purchased-hardware BOM rows

## 5.3 Dependency-aware controls

Port the useful rules from web `lib/settings.ts`:

- [x] joinery-dependent controls
- [x] drawer-mount-dependent controls
- [x] hinge-dependent controls
- [ ] face-frame-dependent controls *(deferred until Phase 8 introduces face frames)*
- [x] front-style-dependent controls
- [x] hide controls that do not affect the current design

### Definition of done

Selecting a supported hinge or slide updates actual cabinet geometry, drilling,
clearances and BOM data—not merely UI values. **Met for Utility Cabinet in v0.5.**

---

# Phase 6 — Real CAD kernel and feature history

**Status: implemented for the Utility Cabinet reference family in v0.6**

Purpose: cross the line from analytical display solids into exact CAD.

This is the pivotal architecture phase.

## 6.1 GeometryKernel abstraction

- [x] worker-based geometry service
- [x] asynchronous rebuild requests
- [x] cancellation/stale-result handling
- [x] tessellation cache
- [x] dirty-part rebuild support
- [x] error diagnostics surfaced in UI

The analytical cabinet generator remains the immediate interaction preview. A parameter
edit invalidates the displayed exact result, then the worker replaces preview parts
with the matching OpenCascade tessellation when the rebuild completes. A failed exact
part remains usable through the preview path and reports a diagnostic instead of
taking down the editor.

## 6.2 Replicad / OpenCascade proof of concept

Utility Cabinet:

- [x] exact fabricated panel/component B-Rep bodies *(purchased hardware remains reference geometry)*
- [x] toe-kick side profile
- [x] bottom/shelf/divider dado subtraction from registered joinery features
- [x] applied-back rabbet proof on cabinet sides
- [x] shelf line boring
- [x] STEP assembly export
- [x] Three.js tessellation
- [x] face/edge selection

## 6.3 Semantic topology

- [x] stable part identity such as `carcass:left`
- [x] `face:carcass:left:inside`
- [x] `face:carcass:left:front`
- [x] `edge:carcass:left:front-top`
- [x] semantic feature IDs generated from cabinet operations

Raw OpenCascade face/edge indices are transient worker data only. User-facing
selection stores domain IDs derived from part role and geometric orientation.

## 6.4 Cabinet feature vocabulary

First-class feature graph:

- [x] panel blank
- [x] dado
- [x] rabbet
- [x] groove operation support
- [x] pocket
- [x] hole
- [x] hole pattern
- [ ] chamfer/bevel *(reserved in the feature type; geometry operation deferred)*
- [ ] edge treatment *(reserved in the feature type; manufacturing behavior deferred)*
- [x] hardware reference
- [x] assembly transform

### Definition of done

At least one complete cabinet family is generated as exact B-Rep geometry,
selectable by semantic face/part identity, and exportable as STEP.
**Met for the Utility Cabinet in v0.6, with analytical preview fallback during
worker rebuilds and exact-kernel errors.**

---

# Phase 7 — Direct CAD interaction

**Status: complete for the Utility Cabinet interaction baseline in v0.8**

Purpose: make the standalone product materially better than the web configurator.

- [x] editable width/height/depth overlays
- [x] drag overall width/height/depth handles
- [x] drag shelf positions *(persistent Simple/section shelf-position data; no renderer-only offset)*
- [x] drag section dividers directly in the 3D viewport *(updates the bounded section tree through editor history)*
- [x] direct selection of parts and semantic faces/edges
- [x] isolate selected
- [x] hide/show selected
- [x] multi-select with Ctrl-click
- [x] selection breadcrumb
- [x] part context menu
- [x] measure distance from semantic face/edge references
- [x] measure face size from the selected exact tessellation face group
- [x] measure angle from exact semantic face normals
- [x] section/clipping plane
- [x] wireframe / shaded / shaded-with-edges modes
- [x] orthographic/perspective camera switch
- [x] iso/front/right/top orientation controls

Direct edits continue to update semantic document parameters/section data through the editor history layer. The analytical model responds immediately, then the worker-owned Replicad/OpenCascade kernel replaces it with matching exact tessellation. Measurement consumers bind to semantic topology rather than raw renderer or OpenCascade identities.

### Definition of done

Routine cabinet envelope/layout editing, semantic inspection, selection/isolation, clipping, shelf placement, section-divider manipulation, and measurements are available from the viewport while preserving the CAD-document/kernel boundary. **Met for the Utility Cabinet interaction baseline in v0.8.**

---

# Phase 8 — Drawers, doors and face frames

**Status: implemented for the Utility Cabinet reference family in v0.8**

Purpose: reach feature depth needed for practical cabinetry.

## Drawers

- [x] complete drawer-box assemblies
- [x] equal / graduated / custom drawer heights *(Simple and section layouts)*
- [x] drawer joinery styles *(butt, rabbet, lock-rabbet intent)*
- [x] drawer-bottom construction *(captured groove or applied bottom)*
- [x] slide clearances
- [x] slide drilling
- [x] divider/grid support

## Doors/fronts

- [x] overlay and inset fronts
- [x] door counts
- [x] hinge boring
- [x] reveals/gaps
- [x] paired doors
- [x] drawer-front registration

## Face frames

- [x] stiles
- [x] rails
- [x] center stiles / center rails
- [x] face-frame opening relationships
- [x] face-frame-aware section dimensions and front placement

Face-frame members are semantic fabricated parts and therefore flow through exact B-Rep generation, selection, STEP, and BOM grouping. Existing hinge cup/plate drilling remains available; the application does not invent manufacturer-specific face-frame hinge classifications where the imported hardware catalog lacks explicit metadata.

### Definition of done

Standalone can model common frameless and face-frame Utility cabinet construction with manufacturing-relevant drawer/door geometry, persistent opening relationships, and exact registered drawer machining intent. **Met for the Utility Cabinet reference family in v0.8.**

---

# Phase 9 — Design Health and fitting

**Status: implemented for the Utility Cabinet reference family in v0.9**

Purpose: port the web application's validation/solver concepts, but make them native
to the CAD document.

## 9.1 Design Health

- [x] errors
- [x] warnings
- [x] compatibility
- [x] coverage
- [x] system/interface checks
- [x] manufacturing readiness

The native engine consumes `CabinetDocument`, the semantic feature graph, hardware
definitions/keepouts, bounded section constraints, and exact-kernel diagnostics. It
does not parse OpenSCAD output.

Implemented checks include:

- [x] material too thin for selected dado
- [x] captured drawer-bottom groove residual stock / breakthrough
- [x] hinge cup breakthrough
- [x] slide length incompatible with cabinet depth
- [x] impossible fixed section dimensions
- [x] shelf/hardware collision using hardware keepout envelopes
- [x] insufficient drilling edge distance / machining outside part boundary
- [x] overlapping registered subtractive machining envelopes
- [x] unsupported, reference-only, partial, or ambiguous hardware configuration
- [x] duplicate semantic part/feature IDs
- [x] invalid fabricated body dimensions
- [x] missing hardware mounting references
- [x] exact-kernel diagnostics incorporated into readiness

## 9.2 Fit solving

- [x] fitted drawer targets
- [x] equipment stand targets
- [x] module pitch/count solving
- [x] result explanation
- [x] apply solved result as an undoable operation
- [x] reject unsupported/out-of-envelope results instead of silently relying on parameter clamping

Drawer solving works backward from requested usable interior dimensions through box
stock, slide clearance/length, carcass/rear construction, and face-frame opening
deductions. Equipment solving works from a target W/H/D envelope plus clearances.
Module solving resolves cabinet width or height from pitch × count plus margins.

**Reference:** web `app/DesignHealth.tsx`, `app/FitTargetResult.tsx`,
`lib/manufacturing.ts` were used for product behavior only; Standalone's
implementation is native and OpenSCAD-independent.

### Definition of done

Users receive actionable, categorized design feedback and manufacturing-readiness
status before manufacturing, and can solve/apply supported target dimensions with
an explanation and one-step undo, without OpenSCAD ECHO parsing. **Met for the
Utility Cabinet reference family in v0.9.**

---

# Phase 10 — BOM, cut list and assembly documentation

**Status: implemented for the Utility Cabinet reference family in v0.10**

Purpose: reach and then exceed current web manufacturing reporting without
depending on OpenSCAD report text.

## BOM / cut list

- [x] stable part numbers
- [x] material grouping
- [x] finished dimensions
- [x] blank dimensions
- [x] grain direction
- [x] edge-banding requirements
- [x] purchased hardware
- [x] machining summary
- [x] CSV export
- [x] printable report

Stable shop part numbers are deterministic projections of semantic part IDs. Material
groups are derived from fabricated part stock/material/thickness. Finished dimensions
and rectangular blank envelopes remain millimeter-native; printable reports can
display inches without changing manufacturing values.

Grain direction and exposed-edge banding requirements are derived from semantic
panel orientation/role. v0.10 does not invent a separate edge-band material or
thickness setting. Profiled parts can share the same rectangular blank/finished
envelope while their registered machining/profile intent is summarized here; exact
operation-layer geometry belongs to Phase 11.

## Assembly

- [x] exploded assembly view
- [x] assembly steps/groups
- [x] part callouts
- [x] hardware checklist
- [x] printable assembly packet
- [x] selected part ↔ BOM row linking

Assembly review reuses the live semantic CAD viewport for exploded/highlighted steps.
The printable packet also contains a schematic isometric exploded SVG whose callouts
use the same stable shop part numbers.

### Definition of done

Standalone produces the Utility Cabinet BOM, cut list, material/hardware summaries,
assembly sequence/checklist, CSVs, and printable shop packets directly from semantic
CAD data/features with no OpenSCAD report parsing. **Met for the Utility Cabinet
reference family in v0.10.**

---

# Phase 11 — Manufacturing geometry

Purpose: replace web operation SVG generation with feature-driven manufacturing
output.

## 11.1 Operation model

Each part exposes registered operations:

- [ ] CUT profile
- [ ] POCKET
- [ ] DADO/GROOVE
- [ ] DRILL
- [ ] ENGRAVE
- [ ] EDGE treatment

## 11.2 2D exports

- [ ] per-part DXF
- [ ] operation-layer DXF
- [ ] SVG preview
- [ ] drilling maps
- [ ] machining-face metadata
- [ ] true scale/unit metadata

## 11.3 Manufacturing review

Port the useful UI concepts from web `ManufacturingExport.tsx`:

- [ ] material summary
- [ ] part dimensions
- [ ] operation preview
- [ ] warnings/errors
- [ ] manufacturing readiness gate
- [ ] reviewed export package

The old browser SVGs were explicitly not CNC toolpaths. Preserve that distinction
until a real CAM/postprocessor layer exists.

### Definition of done

A user can inspect and export registered manufacturing geometry directly from CAD
features with no OpenSCAD worker in the production path.

---

# Phase 12 — Sheet nesting and CNC workflow

Purpose: turn Standalone into cabinet-production software rather than only cabinet
CAD.

- [ ] sheet stock definitions
- [ ] grain-aware nesting
- [ ] kerf/tool diameter
- [ ] part rotation rules
- [ ] margins
- [ ] remnant handling
- [ ] multi-sheet optimization
- [ ] labels/part IDs
- [ ] operation registration between sheet and machining files
- [ ] machine/postprocessor abstraction
- [ ] G-code/post output only after explicit machine/profile support

This phase should use manufacturing intent recorded on features, not reverse-engineer
operations from meshes.

---

# Phase 13 — Advanced cabinet/furniture CAD

Only pursue after the production cabinet workflow is strong.

Potential features:

- [ ] custom shaped panels
- [ ] simple constrained 2D panel sketcher
- [ ] custom cutouts
- [ ] reusable cabinet subassemblies
- [ ] multi-cabinet room/project assemblies
- [ ] countertops/worktops
- [ ] fillers
- [ ] end panels
- [ ] moldings
- [ ] imported STEP hardware/appliances
- [ ] collision/clearance visualization
- [ ] wall/floor references
- [ ] cabinet runs and alignment constraints

Avoid building a general mechanical sketch/feature environment unless these cabinet
and furniture workflows genuinely require it.

---

# Phase 14 — Production desktop quality

- [ ] signed Windows releases
- [ ] application auto-update strategy
- [ ] recovery after crash
- [ ] telemetry/crash reporting policy if desired
- [ ] installer option in addition to portable build
- [ ] file associations for standalone projects
- [ ] native recent-file integration
- [ ] Windows smoke tests against packaged EXE
- [ ] performance profiling
- [ ] large-project stress tests
- [ ] accessibility/keyboard pass
- [ ] migration/release notes for project schema changes

---

# Feature mapping from Cabinet Workshop web

| Web capability | Standalone destination | Migration approach |
| --- | --- | --- |
| Seven cabinet families | Cabinet document/component generators | Port behavior and validate geometry |
| 110 starters | Starter catalog | Port data, redesign browser |
| `lib/settings.ts` dependency rules | Typed parameter schema | Port rules, simplify where possible |
| Approximate schematic | Three.js CAD viewport | Do not port |
| OpenSCAD exact browser render | GeometryKernel/B-Rep | Replace |
| OpenSCAD WASM workers | CAD worker | Replace |
| Sections/mixed bays | Section feature tree + direct handles | Port model, redesign editor |
| Hardware presets | Hardware definitions/instances | Port and enrich |
| Unit system | Standalone unit layer | Port |
| localStorage projects | Native project/recovery system | Reimplement |
| legacy project parsing | Import/migrations | Port |
| Design Health | Native CAD validation | Reimplement, use old output as oracle |
| Fit target solver | Constraint/target solver | Reimplement |
| BOM/dimension report | Native BOM | Reimplement from semantic parts |
| Manufacturing SVGs | CAD-feature manufacturing exports | Replace |
| Assembly HTML | Assembly workspace/report | Port concepts |
| Source ZIP/OpenSCAD export | Legacy/debug export only | Deprioritize |
| Python/native v5 engine | Regression/reference tool | Keep outside core runtime |

---

# Suggested iteration order

For practical development, work through the following smaller releases instead of
attempting whole phases at once:

## v0.2 — Editor foundation

**Status: implemented**

1. [x] units
2. [x] native Open/Save/Save As
3. [x] autosave/recovery
4. [x] dirty state
5. [x] undo/redo
6. [x] versioned project migrations

## v0.3 — Utility cabinet parity

**Status: implemented**

1. [x] typed setting schema
2. [x] utility-cabinet web defaults/controls
3. [x] construction options
4. [x] supported starter presets
5. [x] legacy Utility project import
6. [x] BOM / semantic geometry comparison tests

## v0.4 — Sections

**Status: implemented**

1. [x] section tree
2. [x] section validation
3. [x] section-driven model
4. [x] front-view direct manipulation
5. [x] legacy mixed-bay import

## v0.5 — Hardware

1. slide catalog
2. hinge catalog
3. hardware instances
4. clearance rules
5. drilling metadata

## v0.6 — Exact CAD kernel

1. GeometryKernel worker
2. Utility Cabinet B-Rep
3. dados/rabbets/holes
4. semantic topology
5. STEP export

## v0.7 — Direct CAD

1. dimensions
2. direct resize
3. shelf/section handles
4. measure tools
5. clipping/isolate/display modes

## v0.8 — Cabinet-family expansion

1. kitchen
2. shop cart
3. benchtop
4. stackable
5. standalone drawer
6. equipment stand

## v0.9 — Manufacturing review

1. Design Health
2. native BOM/cut list
3. assembly report
4. DXF/SVG operations
5. manufacturing package

## v1.0 — Cabinet CAD production baseline

1. drawer/door/face-frame depth
2. hardware-aware machining
3. nesting
4. production exports
5. packaged-app smoke tests
6. migration stability
7. signed Windows release if distribution warrants it

---

# Regression strategy during migration

For each ported web feature, preserve at least one fixture that can be evaluated by
both implementations.

Recommended comparison levels:

1. **Configuration parity** — same normalized inputs.
2. **Dimensional parity** — overall dimensions and important clear openings.
3. **Part parity** — expected semantic parts and counts.
4. **BOM parity** — principal panel dimensions/materials.
5. **Manufacturing parity** — expected operations and depths.
6. **Visual sanity** — deterministic screenshots for key starter cabinets.

The old OpenSCAD engine does not need to remain part of the final application, but
it is extremely valuable as an independent oracle while the replacement engine is
being built.

---

# Next task

Start **v0.7 / Direct CAD interaction** on top of the exact Utility kernel: expose direct semantic face/feature selection more visibly, add editable dimensions/handles and isolate/hide/measurement tools, and keep expensive B-Rep rebuilds in the worker behind responsive interaction previews.
