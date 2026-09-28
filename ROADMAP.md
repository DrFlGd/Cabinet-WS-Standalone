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
- [ ] add a project-schema migration framework before the file format grows
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

- [ ] millimeter / inch display preference
- [ ] internal storage remains millimeters
- [ ] precision-preserving unit conversion
- [ ] dimensional-field metadata instead of guessing field type
- [ ] unit preference persisted in project/UI settings
- [ ] dimensional formatting helpers
- [ ] unit conversion regression tests

**Reference:** web `lib/units.ts`, `app/DimensionInput.tsx`

## 1.2 Project files

- [ ] define standalone project schema v2
- [ ] schema-version migrations
- [ ] robust runtime validation
- [ ] recent-project list
- [ ] autosave / recovery file
- [ ] dirty-document tracking
- [ ] confirm destructive New/Open actions when dirty
- [ ] native desktop Open / Save / Save As dialogs
- [ ] drag-and-drop project opening
- [ ] maintain portable JSON format

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

- [ ] command/history model for parameter edits
- [ ] undo/redo keyboard shortcuts
- [ ] coalesce continuous dimension edits into one history operation
- [ ] preserve selection when possible
- [ ] test New/Open/history boundaries

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

- [ ] **Utility cabinet** — reference implementation
- [ ] **Kitchen cabinet** — richest conventional cabinet behavior
- [ ] **Shop cart**
- [ ] **Benchtop cabinet**
- [ ] **Stackable cabinet**
- [ ] **Standalone drawer**
- [ ] **Equipment stand**

For every family:

- [ ] parameter defaults
- [ ] parameter dependencies/visibility
- [ ] starter configurations
- [ ] part generation
- [ ] semantic part IDs
- [ ] basic BOM parity
- [ ] legacy project import
- [ ] regression fixtures against the web/OpenSCAD implementation

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

- [ ] strongly typed parameter definitions
- [ ] runtime project validation from the same schema
- [ ] generated property controls
- [ ] validation messages
- [ ] dependency-aware visibility
- [ ] advanced-setting presentation

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

- [ ] leaf / horizontal split / vertical split
- [ ] proportional sizing
- [ ] fixed clear-opening sizing
- [ ] drawers / doors / open sections
- [ ] shelves
- [ ] panel / rail / no-divider construction
- [ ] nested layouts
- [ ] validation constraints
- [ ] legacy mixed-bay conversion

**Reference:** web `lib/sections.ts`

## 4.2 Desktop section editor

Do not simply reproduce the SVG editor.

- [ ] tree/property editing
- [ ] direct divider handles in 3D/front orthographic view
- [ ] numeric clear-opening dimensions
- [ ] split selected opening left/right
- [ ] split selected opening top/bottom
- [ ] collapse subtree
- [ ] selected subtree highlighting
- [ ] live dimension annotations
- [ ] undoable drag operations

## 4.3 Cross-engine regression

Until the standalone kernel becomes authoritative:

- [ ] compare section rectangle resolution against web TypeScript
- [ ] compare selected legacy designs against OpenSCAD dimensions/BOM
- [ ] preserve old section-layout imports

### Definition of done

A user can build nested cabinet opening layouts more naturally in Standalone than
in the web application while preserving legacy section behavior.

---

# Phase 5 — Hardware and cabinet intelligence

Purpose: move the web hardware knowledge into first-class CAD objects.

## 5.1 Hardware catalog

Port:

- [ ] drawer-slide presets
- [ ] hinge presets
- [ ] manufacturer/model metadata
- [ ] verification/source status
- [ ] family compatibility
- [ ] hardware search/filtering

**Reference:** web `lib/hardware.json`, `lib/equipment-hardware.json`,
`app/HardwarePicker.tsx`

## 5.2 Hardware as semantic CAD components

Instead of only applying parameter patches:

- [ ] HardwareDefinition
- [ ] HardwareInstance
- [ ] mounting references
- [ ] drilling patterns
- [ ] keepout volumes
- [ ] required clearances
- [ ] optional simplified 3D reference geometry
- [ ] purchased-hardware BOM rows

## 5.3 Dependency-aware controls

Port the useful rules from web `lib/settings.ts`:

- [ ] joinery-dependent controls
- [ ] drawer-mount-dependent controls
- [ ] hinge-dependent controls
- [ ] face-frame-dependent controls
- [ ] front-style-dependent controls
- [ ] hide controls that do not affect the current design

### Definition of done

Selecting a supported hinge or slide updates actual cabinet geometry, drilling,
clearances and BOM data—not merely UI values.

---

# Phase 6 — Real CAD kernel and feature history

Purpose: cross the line from analytical display solids into exact CAD.

This is the pivotal architecture phase.

## 6.1 GeometryKernel abstraction

- [ ] worker-based geometry service
- [ ] asynchronous rebuild requests
- [ ] cancellation/stale-result handling
- [ ] tessellation cache
- [ ] dirty-part rebuild support
- [ ] error diagnostics surfaced in UI

## 6.2 Replicad / OpenCascade proof of concept

Start only with the Utility Cabinet:

- [ ] exact panel B-Rep bodies
- [ ] toe-kick side profile
- [ ] bottom dado
- [ ] back rabbet
- [ ] shelf line boring
- [ ] STEP export
- [ ] Three.js tessellation
- [ ] face/edge selection

## 6.3 Semantic topology

- [ ] `part:carcass:left`
- [ ] `face:carcass:left:inside`
- [ ] `face:carcass:left:front`
- [ ] `edge:carcass:left:front-top`
- [ ] `feature:carcass:left:bottom-dado`

Never persist raw kernel topology indices as user-facing identity.

## 6.4 Cabinet feature vocabulary

Implement first-class features:

- [ ] panel blank
- [ ] dado
- [ ] rabbet
- [ ] groove
- [ ] pocket
- [ ] hole
- [ ] hole pattern
- [ ] chamfer/bevel
- [ ] edge treatment
- [ ] hardware reference
- [ ] assembly transform

### Definition of done

At least one complete cabinet family is generated as exact B-Rep geometry,
selectable by semantic face/part identity, and exportable as STEP.

---

# Phase 7 — Direct CAD interaction

Purpose: make the standalone product materially better than the web configurator.

- [ ] editable dimension overlays
- [ ] drag overall width/height/depth handles
- [ ] drag shelf positions
- [ ] drag section dividers
- [ ] direct selection of parts/faces/features
- [ ] isolate selected
- [ ] hide/show selected
- [ ] multi-select
- [ ] selection breadcrumb
- [ ] context menu
- [ ] measure distance
- [ ] measure face size
- [ ] measure angle
- [ ] section/clipping plane
- [ ] wireframe / shaded / shaded-with-edges modes
- [ ] orthographic/perspective camera switch
- [ ] view cube or equivalent orientation control

Expensive exact rebuilds should happen in a worker. Dragging may use a cheap preview
and commit exact geometry when necessary.

### Definition of done

Routine cabinet editing can be performed primarily from the viewport rather than
through a long settings form.

---

# Phase 8 — Drawers, doors and face frames

Purpose: reach feature depth needed for practical cabinetry.

## Drawers

- [ ] complete drawer-box assemblies
- [ ] equal / graduated / custom drawer heights
- [ ] drawer joinery styles
- [ ] drawer-bottom construction
- [ ] slide clearances
- [ ] slide drilling
- [ ] divider/grid support

## Doors/fronts

- [ ] overlay and inset fronts
- [ ] door counts
- [ ] hinge boring
- [ ] reveals/gaps
- [ ] paired doors
- [ ] drawer-front registration

## Face frames

- [ ] stiles
- [ ] rails
- [ ] center stiles
- [ ] face-frame opening relationships
- [ ] face-frame-aware section dimensions

### Definition of done

Standalone can model common frameless and face-frame cabinet construction with
manufacturing-relevant drawer/door geometry.

---

# Phase 9 — Design Health and fitting

Purpose: port the web application's validation/solver concepts, but make them native
to the CAD document.

## 9.1 Design Health

Port the categories currently surfaced from OpenSCAD:

- [ ] errors
- [ ] warnings
- [ ] compatibility
- [ ] coverage
- [ ] system/interface checks
- [ ] manufacturing readiness

New checks should work from semantic geometry/features where possible.

Examples:

- material too thin for selected dado
- hinge cup breakthrough
- slide length incompatible with cabinet depth
- impossible fixed section dimensions
- shelf/hardware collision
- insufficient edge distance
- overlapping machining
- unsupported hardware configuration

## 9.2 Fit solving

Port useful target-driven behavior:

- [ ] fitted drawer targets
- [ ] equipment stand targets
- [ ] module pitch/count solving
- [ ] result explanation
- [ ] apply solved result as an undoable operation

**Reference:** web `app/DesignHealth.tsx`, `app/FitTargetResult.tsx`,
`lib/manufacturing.ts`

### Definition of done

Users receive actionable design feedback before manufacturing, without requiring
OpenSCAD ECHO parsing as the long-term implementation.

---

# Phase 10 — BOM, cut list and assembly documentation

Purpose: reach and then exceed current web manufacturing reporting.

## BOM / cut list

- [ ] stable part numbers
- [ ] material grouping
- [ ] finished dimensions
- [ ] blank dimensions
- [ ] grain direction
- [ ] edge-banding requirements
- [ ] purchased hardware
- [ ] machining summary
- [ ] CSV export
- [ ] printable report

## Assembly

Port the useful concepts from web `lib/assembly.ts`:

- [ ] exploded assembly view
- [ ] assembly steps/groups
- [ ] part callouts
- [ ] hardware checklist
- [ ] printable assembly packet
- [ ] selected part ↔ BOM row linking

### Definition of done

The standalone project can produce the shop documentation currently supplied by
the web manufacturing package without depending on OpenSCAD report text.

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

1. units
2. native Open/Save/Save As
3. autosave/recovery
4. dirty state
5. undo/redo
6. versioned project migrations

## v0.3 — Utility cabinet parity

1. typed setting schema
2. utility-cabinet web defaults/controls
3. construction options
4. starter presets
5. legacy utility project import
6. BOM comparison tests

## v0.4 — Sections

1. section tree
2. section validation
3. section-driven model
4. front-view direct manipulation
5. legacy mixed-bay import

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

Start with **v0.2 / Phase 1: units + desktop project lifecycle + undo/redo**.

These are low-risk migrations that immediately improve the standalone editor and
create the infrastructure required for every later feature. After that, use
**Utility Cabinet parity** as the first end-to-end migration target.
