# Changelog

All notable changes to Cabinet WS Standalone are recorded here.

The project follows milestone versions while the standalone CAD architecture is being built. Entries describe user-visible behavior, file-format changes, compatibility work, testing, packaging, and deliberate deferrals.

## [Unreleased]

### Added

- Add a dismissible, keyboard-accessible Viewer Help dialog covering navigation,
  selection, measurements, direct-edit handles, display units, and editor shortcuts.

### Changed

- Remove always-visible viewer helper objects from ordinary viewing: cabinet W/D/H
  drag cubes now appear only while Alt is held, and shelf/divider drag handles appear
  only for the selected editable part.
- Face selection now shows axis-appropriate Width/Height/Depth for aligned
  rectangular planar faces, intrinsic long/short sides for rotated rectangles,
  maximum span for other planar faces, and an explicitly approximate span for
  non-planar faces; area remains secondary and follows the selected display units.
- Remove ordinary Semantic Topology selection details, the persistent click-instruction
  bubble, and the normal Exact CAD status badge. Loading and geometry-error feedback
  remains visible when actionable.
- Simplify normal viewport status text while preserving existing STEP export readiness
  rules and kernel diagnostics on error.

### Testing

- Add regression coverage for rotated planar-face dimensions, non-rectangular and
  non-planar face presentation, display-unit formatting, mode-specific helper
  visibility, Help content/accessibility, and removal of persistent technical UI.

### Compatibility

- No saved-project/schema, family/native synchronization, Manual Layout, undo/redo,
  geometry-generation, or STEP export behavior changes.


## [0.14.2] - 2026-09-29

### Added

- Add a machine-readable family capability matrix covering all 1,678 retained settings with geometry-driving, manufacturing-driving, compatibility-only, or unsupported ownership status.
- Add frozen Cabinet Workshop reference fixtures for Utility modular fit solving, Standalone Drawer joinery/divider machining, and Equipment Stand French-cleat construction.
- Add a prioritized family-parity audit documenting confirmed gaps and verification boundaries.

- Added React root/modeling-workspace error boundaries with an actionable recovery
  screen instead of allowing renderer failures to leave a blank workspace.
- Added Electron renderer-crash handling that keeps recovery data and offers Reload
  workspace or Close; clean exit and application shutdown bypass the crash prompt.
- Added an About dialog backed by Electron runtime application/version information,
  with package metadata as the browser-preview fallback.

### Changed

- Recovery autosave now flushes when the document becomes hidden and makes a
  best-effort flush on unload, matching the reference application's lifecycle intent.
- Atomic project/recovery writes use unique staging filenames, and recovery writes
  and clears share one per-destination operation queue so a pending write cannot
  recreate stale recovery data after a clear.
- Version text in the workspace now comes from package metadata instead of duplicated
  hard-coded release strings.

### Testing

- Add behavioral gap regressions that compare Standalone outcomes with independent reference expectations instead of treating starter construction alone as parity evidence.
- Add behavioral ownership regressions for helper-resolved measured drawer stock/thickness and Kitchen `section_nodes`, preventing indirect runtime mappings from being mislabeled unsupported.
- Lock the current Utility fit-target no-op, drawer joinery mode collapse, divider-mounting machining no-op, and rectangular French-cleat behavior so later fixes must update the audit explicitly.

- Added behavioral tests for renderer crash/reload decisions, crash-dialog fallback,
  browser and desktop recovery storage, concurrent atomic recovery writes, ordered
  write/clear recovery operations, error-boundary fallback rendering, and
  About/version rendering.
- Packaged Windows crash/recovery interaction remains unverified; CI packaging is not
  described as an application smoke test.

### Compatibility

- The capability matrix records ownership and known gaps; unmarked settings remain unverified.

- No saved-project schema change. Existing schema-v3 files and v1/v2 migrations are
  unchanged.
- Recovery continues to use the existing `recovery.cabinetws.json` desktop file and
  browser recovery key; no recovery-data migration is required.

### Release scope

- Includes recovery/About improvements (#22) and the family-parity audit (#23).
- Defers reproducible installs and packaged Windows workflow smoke coverage (#21).
- Project schema remains v3. Packaged crash/recovery interaction remains unverified.

## [0.14.1] - 2026-09-29

### Fixed

- Preserve unrelated canonical settings during family edits instead of regenerating every native parameter from recipe defaults.
- Synchronize mapped native differences without rewriting family-only recipe alternatives during edits or save/reopen.
- Preserve Simple layout after leaving Sections, and account for segmented face-frame dado depth when synchronizing Kitchen nominal depth.
- Invert Standalone Drawer inside-clear/enclosure dimensions, including face setback and rear clearance; arbitrary native modular-grid resizing switches to outside-box sizing.
- Native Equipment Stand envelope resizing switches to manual sizing so later family edits retain the requested dimensions.
- Native drawer/front/door/face-frame thickness edits select measured stock so nominal recipe choices cannot override the edited values.
- Hydrate sparse legacy web recipes before deriving native geometry.
- Deep-clone nested canonical parameter arrays in undo/redo snapshots.
- Reject STEP export when a requested body is missing or any machining cut failed; retain useful diagnostics instead of silently returning a partial assembly.
- Release assembled STEP shapes after successful export and after build/serialization failure.

### Tests

- Add repeated save/reopen checks for all 110 starters and edit/save/undo/redo sequences across all seven families.
- Add sizing/layout regression cases and STEP worker body/cut/missing-body/serialization failure tests.

### Documentation

- Replace overlapping historical README/architecture/roadmap narratives with current capabilities, ownership contracts, known limits and a prioritized backlog.
- Remove the stale v0.7 next-task instruction and distinguish schema/catalog coverage from verified construction parity.

### Compatibility

- Project schema remains v3; existing v1/v2 migrations remain supported.
- Application/package version advanced to 0.14.1; Windows release includes the portable EXE, ZIP and SHA-256 checksums.
- Production-settings persistence, lockfile/CI hardening, and full geometry parity remain follow-on work.

## [0.14.0] - 2026-09-29

### Added

- Complete native family-settings metadata for all seven Cabinet Workshop families: 1,678 fields total.
- Generated Family Settings controls for option lists, booleans, bounded numeric/dimensional values, text, flat arrays, and nested arrays.
- Millimeter/inch display conversion for family-specific dimension controls.
- Ported dependency-aware inactive rules from the legacy settings model, including joinery, hardware, worktop, face-frame, shelf, stackable, standalone-drawer, and Equipment Stand conditions.
- Search across family setting labels, keys, descriptions, current values, and options.
- Advanced-setting and inactive-setting reveal controls with inactive reasons.
- Read-only expression-backed family controls with trusted built-in recomputation after source edits.
- Recipe hydration for sparse and pre-v3 projects before family editing.
- Reverse synchronization from existing Native model/contextual edits back into mapped `familyValues`.
- Regression coverage for complete field counts, dependency rules, expression updates, representative family-to-model mappings, reverse synchronization, and Manual Layout ownership.

### Changed

- Application/package version advanced to 0.14.0.
- Properties defaults to Family settings when no generated part is selected while retaining a Native model tab and selected-part contextual editing.
- Family field edits now update schema-v3 `familyValues`, regenerate canonical parameters, and rebuild the semantic model as one undoable history operation.
- `section_nodes` remains exclusively edited through Manual Layout rather than a raw array control.
- Benchtop stock aliases such as `custom`, `same_as_carcass`, and `same_as_drawer` now resolve through the family adapter.
- Legacy Output/System settings remain compatibility recipe state; Standalone-native file/export commands remain authoritative.

### Compatibility

- Schema version remains v3.
- v1/v2 projects are hydrated into the Utility family recipe before synchronization, preserving saved canonical dimensions/settings.
- Existing v0.13 schema-v3 projects with partial or stale family recipes are completed from family defaults and synchronized with their canonical parameter state on load.
- OpenSCAD remains reference/oracle code only and is not used to evaluate family settings or generate production geometry.

## [0.13.0] - 2026-09-29

### Added

- Native family identity for all seven Cabinet Workshop families: Shop Cart, Utility Cabinet, Benchtop Drawers, Stackable Cabinet, Kitchen Cabinet, Standalone Drawer, and Equipment Stand.
- Complete retained starter/example catalog with all 110 shipped legacy recipes resolved against their original family defaults.
- Family + example selectors in the main editor, including grouped Kitchen recipe labels and per-family example counts.
- Schema-v3 project fields for durable `family`, optional `starterId`, and retained `familyValues` recipe data alongside canonical Standalone parameters.
- Native family adapter layer for Shop Cart, Utility, Benchtop, Stackable, and Kitchen over the existing semantic cabinet generator.
- Stackable semantic interface/base parts.
- Dedicated native Standalone Drawer generator with enclosure/outside/inside/modular-grid sizing, semantic box parts, captured-bottom machining intent, optional divider grids, decorative fronts, and slide references.
- Dedicated native Equipment Stand generator with trays, cheeks/lips, upper bays, panel/structural/stretcher backs, skeletonized side cutouts, and French-cleat rails.
- Cabinet Workshop import support for all seven numeric/string family identifiers.
- Full-catalog regression coverage that builds all 110 examples as semantic documents and validates representative family construction.
- Shared envelope support for compact Benchtop and Standalone Drawer dimensions below the previous Utility-only sanitizer minimums.

### Changed

- Application/package version advanced to 0.13.0.
- Standalone project persistence advanced from schema v2 to schema v3; existing v1/v2 projects migrate as Utility documents.
- Properties identify the active cabinet family instead of labeling every model as Utility.
- Manual section layout is hidden for dedicated Standalone Drawer and Equipment Stand family generators.
- Legacy starter recipes are retained as source data even when a family-only field does not yet have a redesigned native Properties control.
- The roadmap marks all seven families and all 110 shipped examples ported.

### Compatibility

- Existing Standalone schema-v1/v2 projects remain loadable through migration to schema v3.
- Legacy Cabinet Workshop family projects retain their resolved source recipe in `familyValues` instead of discarding unsupported presentation fields.
- The exact OpenCascade, Design Health, BOM/shop-doc, manufacturing, and production-planning pipelines continue to consume native semantic parts/features; OpenSCAD is not restored as a runtime dependency.
- This milestone provides family/example parity, not a wholesale recreation of the web application's 99–310-field family-specific UI. Shared native controls remain editable and additional family-specific property surfaces can be added incrementally.

## [0.12.0] - 2026-09-29

### Added

- Production tab in Shop Docs for Phase 12 sheet nesting and production planning.
- Material/thickness-specific sheet-stock definitions with editable dimensions, grain axis, margins, optional quantity limits, and explicit user-entered remnants.
- Deterministic largest-first free-rectangle nesting with multi-sheet allocation.
- Grain-aware 0°/90° part orientation and optional rotation control.
- Nesting clearance derived from the maximum configured part spacing, kerf allowance, or primary tool diameter.
- Remnant-first planning mode without inventing remnant availability.
- Stable nested-placement identity carrying semantic part ID, shop part number, sheet ID, X/Y transform, rotation, grain relationship, and Phase 11 operation IDs.
- Sheet-level true-scale millimeter SVG and DXF with transformed manufacturing operations and stable part-number labels.
- Sheet registration JSON linking nested geometry back to source manufacturing features/operations.
- Compact production-plan JSON with stock definitions, sheet utilization, placement transforms, and unplaced-part reasons.
- Typed tool-library, machine-profile, postprocessor, tool-assignment, and compensation-intent contracts.
- Planning-only toolpath registration after sheet placement, including inside/outside/center compensation intent.
- Regression coverage for grain constraints, remnant preference, multi-sheet packing, spacing/kerf/tool clearance, sheet export registration, and the no-G-code architecture boundary.

### Changed

- Application/package version advanced to 0.12.0.
- The roadmap marks the Phase 12 production-planning baseline complete while leaving verified CNC post output explicitly unfinished.
- Shop Docs now includes BOM/Cut List, Assembly, Manufacturing, and Production views.

### Compatibility

- No saved-project schema change. Stock/nesting/tool/machine planning configuration remains editor state in this slice.
- Existing schema-v2 projects can generate a production plan from their Phase 11 manufacturing model after normal load/migration.
- The nesting heuristic is deterministic but not claimed globally optimal.
- No G-code is emitted. Phase 11 geometry remains nominal, and compensated tool-center paths plus a verified machine/postprocessor are still required.

## [0.11.0] - 2026-09-29

### Added

- Native feature-driven manufacturing model for fabricated Utility Cabinet parts.
- Normalized CUT, POCKET, DADO/GROOVE, DRILL, ENGRAVE, and EDGE operation vocabulary with stable part/feature identity.
- Part-local machining planes with explicit U/V/thickness axes, millimeter units, scale 1, machining-face semantic IDs, and depth/through metadata.
- Per-part DXF export and individual operation-layer DXF export with `$INSUNITS=4`.
- True-scale millimeter SVG manufacturing previews and operation-layer SVGs.
- Drilling-map CSV export with semantic IDs, U/V centers, diameter, face, depth, and through state.
- Per-part manufacturing metadata JSON.
- Manufacturing review tab inside Shop Docs with part/layer selection, operation preview, face/depth inspection, and Design Health warning/error display.
- Snapshot-specific explicit review gate; blocking Design Health errors prevent reviewed package export.
- Reviewed manufacturing ZIP containing manifest, issue/manufacturing reports, per-part DXF/SVG/drilling/metadata, and per-layer DXF/SVG files.
- Native Electron save dialogs for DXF, SVG, JSON, and manufacturing ZIP outputs with browser fallbacks.
- Regression coverage for machining-plane projection, operation classification, unit/scale metadata, drilling maps, layer isolation, ZIP packaging, readiness gating, and desktop integration.

### Changed

- Application/package version advanced to 0.11.0.
- Shop Docs now includes BOM/Cut List, Assembly, and Manufacturing views.
- The roadmap marks Phase 11 complete for the Utility Cabinet reference family and advances the production workflow to Phase 12 nesting/CNC.
- Manufacturing outputs are generated directly from semantic parts/features and Design Health instead of the old web OpenSCAD SVG/report pipeline.

### Compatibility

- No saved-project schema change. Manufacturing review selection and review state are derived/editor state.
- Existing schema-v2 projects generate Phase 11 manufacturing output after normal migration into the current semantic cabinet model.
- DXF/SVG files are manufacturing geometry, not CNC toolpaths; no kerf/tool compensation, nesting, postprocessor, or G-code is implied.

## [0.10.0] - 2026-09-28

### Added

- Native Shop Docs workspace with BOM/Cut List and Assembly views.
- Deterministic shop part numbers derived from stable semantic part IDs.
- Fabricated-part cut-list rows with material, finished/body envelope, rectangular blank envelope, panel thickness axis, grain direction, inferred exposed-edge banding requirements, and registered machining summaries.
- Material grouping by stock/material/thickness with part counts and aggregate rectangular blank area.
- Purchased-hardware grouping with quantities, manufacturer/model, verification status, mounting members, instance IDs, and drilling notes.
- Millimeter-native cut-list and purchased-hardware CSV exports.
- Printable BOM/cut-list HTML with material summary, part dimensions, hardware, machining summary, and Design Health/readiness status.
- Semantic assembly groups, stable callouts, purchased-hardware checklist, and live step highlighting in the existing exploded CAD viewport.
- Printable assembly packet with a generated schematic isometric exploded SVG and the same stable part callouts.
- Bidirectional semantic selection between CAD parts and BOM rows, including automatic BOM-row scrolling for a selected CAD part.
- Native Electron CSV/HTML save dialogs with browser-download fallback.
- Phase 10 regression coverage for part-number stability, cut-list semantics, material/hardware grouping, assembly order, printable output, CAD/BOM linking, exploded review, and desktop report export.

### Changed

- Application/package version advanced to 0.10.0.
- The roadmap marks Phase 10 complete for the Utility Cabinet reference family and advances the next major milestone to Phase 11 manufacturing geometry.
- Shop documentation is generated directly from Standalone semantic parts/features and Design Health; the old web OpenSCAD BOM/assembly report pipeline is reference behavior only.

### Compatibility

- No saved-project schema change. Shop Docs search, checklist, selection, and exploded-review state are editor/report state.
- Existing schema-v2 projects generate Phase 10 reports from their migrated semantic cabinet document without rewriting the saved file.
- Phase 10 blank/finished dimensions are semantic rectangular/body envelopes; exact operation-layer profile/drilling geometry remains explicitly deferred to Phase 11.

## [0.9.0] - 2026-09-28

### Added

- Native Design Health engine operating directly on `CabinetDocument`, semantic features, hardware definitions/keepouts, section constraints, and exact-kernel diagnostics.
- Categorized error, warning, compatibility, coverage, system/interface, and manufacturing-readiness reporting in a live viewport panel.
- Material/joinery residual-stock checks for carcass dadoes and captured drawer-bottom grooves.
- Hardware checks for hinge-cup breakthrough, slide-depth conflicts, unsupported/reference-only/partial profiles, ambiguous automatic drilling, and missing mounting references.
- Shelf-versus-hardware keepout collision detection.
- Registered drilling edge-distance checks and detection of machining extending outside a part boundary.
- Overlap detection for registered dado/rabbet/groove/pocket machining envelopes.
- Semantic document checks for duplicate part/feature IDs and invalid fabricated body dimensions.
- Native Fit Solver modes for fitted drawer interiors, equipment envelopes, and module pitch/count.
- Solver requested/achieved values, calculation explanations, feasibility warnings, and supported-envelope validation.
- One-click solver application as one undoable editor-history operation followed by normal exact rebuild and health reevaluation.
- Regression coverage for Design Health categories, collisions, machining checks, fit solving, geometry achievement, infeasible targets, and OpenSCAD-independent integration boundaries.

### Changed

- Application/package version advanced to 0.9.0.
- The roadmap marks Phase 9 complete for the Utility Cabinet reference family and advances the next major milestone to Phase 10 BOM/cut-list/assembly documentation.
- Design validation no longer requires the web application's OpenSCAD `ECHO` parsing model; the old web implementation remains reference behavior only.

### Compatibility

- No saved-project schema change. Design Health state and Fit Solver target inputs are editor state, while applied solutions change only existing semantic cabinet parameters.
- Existing schema-v2 projects continue to load through the same migration/default path.

## [0.8.0] - 2026-09-28

### Added

- Persistent shelf-position data for Simple and section-driven layouts, with gold 3D shelf handles that edit the semantic document through undoable history.
- Blue 3D section-divider handles that rewrite adjacent bounded-section sizing rather than applying renderer-only transforms.
- Semantic exact-topology measurement modes for distance, face size, and face angle.
- Equal, graduated, and custom-weighted drawer-front heights in Simple layout, complementing the existing section-layout modes.
- Drawer-box registration controls plus butt, rabbet, and lock-rabbet construction intent.
- Captured drawer bottoms with registered groove operations and applied-bottom construction.
- Internal drawer organizer column/row grids as fabricated semantic parts.
- First-class face-frame stiles, top/bottom rails, center stiles/rails, stock controls, frame-aware front placement, and frame-clear Manual Layout dimensions.
- Regression suites for v0.8 cabinet construction, semantic measurements, backward defaults, shelf persistence, and direct interaction ownership.

### Fixed

- Corrected the v0.7 viewport pointer-coordinate helper, which recursively called itself and could overflow the stack when direct pointer interaction began.

### Changed

- Application/package version advanced to 0.8.0.
- Drawer/front/frame settings are exposed through the typed Properties schema and selected-part contextual settings.
- Captured-bottom grooves and drawer rabbets flow through the existing feature graph so exact OpenCascade geometry receives the machining intent.
- Legacy 12-field section nodes remain accepted; new nodes may include an optional 13th shelf-position array.
- Phase 7's remaining direct-interaction work is folded into v0.8 and the roadmap advances to Phase 9 Design Health/fitting.

### Compatibility

- No standalone project schema-version bump: schema-v2 JSON remains the save format and all new parameters default during migration/load.
- Existing v0.7 and older schema-v2 projects open with frameless construction, equal drawer heights, centered drawer-box registration, and default captured-bottom settings unless explicitly changed.
- Manufacturer-specific face-frame hinge classifications are not inferred when the hardware catalog does not provide them; existing hinge cup/plate drilling remains semantic/exact intent.

## [0.7.0] - 2026-09-28

### Added

- In-viewport width, height, and depth editors that use the existing unit-aware `DimensionInput` path.
- Turquoise W/D/H drag handles for direct overall cabinet envelope editing; handle drags update semantic cabinet parameters and remain compatible with undo/redo coalescing.
- Ctrl-click additive part selection with multi-selection highlighting in the viewport and Parts browser.
- Selection breadcrumb showing the active multi-selection while Properties continues to edit the primary selected part.
- Toolbar and right-click actions to isolate selected parts, hide selected parts, and restore all parts.
- Right-click viewport part context menu based on stable part IDs.
- Z clipping plane inspection control.
- Shaded, shaded-with-edges, and wireframe viewport modes.
- Perspective and orthographic camera projection modes while retaining iso/front/right/top orientation controls.
- Source-level regression guards covering direct dimension editing, selection actions, clipping, display modes, and projection switching.

### Changed

- Application/package version advanced to 0.7.0.
- Direct viewport edits route through `CabinetParameters` and editor history instead of applying renderer-only transforms.
- Exact geometry remains worker-owned: direct edits use the analytical preview immediately and then receive matching Replicad/OpenCascade tessellation.
- README, roadmap, and architecture documentation now consistently describe the implemented v0.6 exact kernel and v0.7 direct-interaction boundary.

### Compatibility

- No saved-project schema change. Existing schema-v2 projects remain compatible.
- Viewport selection, clipping, display mode, camera projection, and isolation are editor state and do not alter persisted cabinet geometry.

### Deferred

- Arbitrary shelf-position dragging is deferred until shelf positions exist as persistent semantic document parameters; v0.7 does not create renderer-only shelf offsets.
- 3D section-divider dragging and semantic distance/face/angle measurement remain follow-on direct-interaction work.

## [0.6.1] - 2026-09-28

### Changed

- Manual Layout Editor now owns all layout-count/configuration choices for Simple mode: Layout mode, Contents, Drawer rows, Doors, and Shelf panels.
- `Shelf panels` is now classified as a Layout parameter rather than a general Shelf property; shelf construction/style remains in searchable Properties.
- Layout parameters are no longer duplicated in the right-side Properties panel or selected-part contextual controls.
- Added an always-visible **Search properties…** field at the top of the right Properties panel.
- Property search works regardless of current part selection and searches applicable property labels, descriptions, groups, keys, current values, and select-option labels.
- A non-empty property search searches the full currently applicable non-layout property set; clearing it returns to selected-part contextual editing or the full cabinet-property view.
- Moved the searchable Hardware Catalog out of Properties and into a dedicated collapsible drawer on the left side of Manual Layout.
- The left editing workspace is now **Hardware | Manual Layout | Parts**, with Hardware and Parts independently collapsible on opposite sides.
- Opening either secondary drawer expands the left workspace horizontally instead of reducing Manual Layout height.
- Hardware compatibility feedback, catalog search, source/verification metadata, and preset application remain available inside the new Hardware drawer.

### Testing

- Updated interface regression guards to require all Simple layout counts in Manual Layout, a left-side Hardware drawer, a right-side Parts drawer, and a permanently available property search.
- Added guards preventing Layout controls and the Hardware catalog from being reintroduced into the right Properties surface.

### Compatibility

- No saved-project schema change. Existing schema-v2 projects remain compatible.
- Moving `shelfCount` between UI groups changes presentation only; the persisted parameter key and behavior are unchanged.

## [0.6.0] - 2026-09-28

### Added

- Worker-based `GeometryKernel` implementation using Replicad and OpenCascade WebAssembly.
- Asynchronous exact rebuild requests with monotonically increasing request IDs and stale-result cancellation.
- Dirty-part signature tracking plus a per-part exact tessellation cache.
- Cabinet-native feature graph generated from semantic parts instead of reverse-engineering manufacturing intent from Three.js meshes.
- First-class feature records for panel blanks, dadoes, rabbets, grooves, pockets, holes, hole patterns, hardware references, and assembly transforms.
- Exact B-Rep bodies for fabricated parts in the Utility Cabinet reference family; purchased hardware envelopes remain reference geometry.
- Exact extrusion of side profiles, including toe-kick side cutouts.
- Exact subtraction of registered dado/pocket and drilling features.
- Applied-back rabbet proof geometry on cabinet side B-Reps.
- Exact adjustable-shelf line boring and other registered hole patterns.
- Semantic face and edge identity mapped from transient OpenCascade topology, including IDs such as `face:carcass:left:inside` and `edge:carcass:left:front-top`.
- Three.js rendering from exact OpenCascade tessellations for fabricated parts while retaining analytical/reference geometry as a responsive/failure fallback.
- Exact face selection by normal click and semantic edge selection by Shift-click.
- Kernel diagnostics surfaced in the Properties panel instead of allowing a failed exact part to take down the editor.
- STEP assembly export with stable part names and millimeter units.
- Native Electron STEP Save dialog plus browser-download fallback.
- Regression coverage for feature-graph generation, toe-kick/dado/rabbet/line-boring intent, hardware-reference features, and semantic topology classification.
- Source-level integration guards covering the worker WASM path, STEP export, tessellation cache, and desktop save bridge.

### Changed

- Application/package version advanced to 0.6.0.
- Editing remains realtime by immediately displaying the analytical cabinet model after a parameter change; the matching exact B-Rep result replaces it after the worker rebuild completes.
- The viewport status now reports exact-kernel state/body count and semantic-feature count.
- The right Properties panel can display the selected semantic face/edge identity alongside the selected part's editable settings.
- `ARCHITECTURE.md` now describes the implemented worker/kernel boundary rather than a future-only proposal.
- The roadmap marks the Utility Cabinet Phase 6 exact-CAD proof of concept complete and advances the next milestone to v0.7 Direct CAD Interaction.

### Compatibility

- No saved-project schema change. Feature history/topology is regenerated from schema-v2 cabinet semantics and is not persisted as raw OpenCascade state.
- Raw OpenCascade face/edge indexes are never stored as user-facing identity.
- Existing v0.5.x and earlier schema-v2 projects continue to open through the same migration/default path.

### Notes / Deferred

- The applied-back rabbet in v0.6 is an exact side-panel proof operation; the existing analytical back-panel construction recipe has not yet been widened/repositioned into a full production rabbet assembly.
- Chamfer/bevel and edge-treatment feature kinds are reserved in the feature vocabulary but their exact operations are deferred.
- Exact failures intentionally retain the existing per-part analytical preview and report diagnostics.
- DXF, machining review, CNC output, and full manufacturing registration remain later roadmap milestones.

## [0.5.2] - 2026-09-28

### Changed

- Renamed **Front elevation editor** to **Manual Layout Editor**.
- Manual Layout Editor is now always the primary left-side editing workspace instead of appearing only when Sections/Bays mode is active.
- Moved the **Layout mode** selector out of the general Properties panel and to the top of Manual Layout Editor so the layout choice lives with the layout tools.
- Simple Cabinet mode now keeps Manual Layout Editor visible with a concise summary and an in-place path to switch into Sections/Bays.
- Sections/Bays mode activates the existing divider/opening editor in the same primary pane.
- The generated Parts/Model browser moved from below the section editor into a collapsible secondary drawer immediately to its right.
- The Parts drawer defaults collapsed, giving Manual Layout and the 3D viewport more room; opening it expands the left workspace horizontally instead of stealing height from Manual Layout.
- The primary Manual Layout pane is wider than the old left rail and the divider canvas receives a larger working area.
- Existing 3D selection and contextual right-side Properties behavior is preserved.

### Testing

- Updated the desktop-interface regression guard to require Manual Layout Editor, its top-level Layout mode selector, the collapsible Parts drawer, and contextual part editing wiring.
- The general parameter schema is guarded against reintroducing a duplicate Layout mode selector.

### Compatibility

- No project-file schema change. Existing schema-v2 projects keep their stored Simple/Sections layout mode and section tree.

## [0.5.1] - 2026-09-28

### Changed

- Section Layout is now a true collapsible workspace instead of a permanently fixed-height panel in the narrow left rail.
- Collapsed Section Layout returns space to the model tree and realtime viewport.
- Expanded Section Layout widens the left workspace and gives the front-elevation editor substantially more vertical and horizontal room for nested sections and divider dragging.
- Switching into Sections mode opens the layout workspace automatically; it can then be collapsed independently without changing the cabinet layout.
- Selecting a part in the 3D viewport or model tree now keeps the right Properties panel editable instead of replacing it with read-only part metadata.
- The right panel now prioritizes parameter controls related to the selected part:
  - drawer boxes/fronts expose drawer stock, front, and slide controls;
  - doors expose front and hinge controls;
  - hardware instances expose only the matching slide or hinge catalog/settings;
  - carcass, back, shelf, divider, and worktop parts expose their corresponding construction parameters.
- Section-generated drawer/door parts show their source section and provide a direct **Edit this section** action that opens the Section Layout on that node.
- Generated part dimensions and semantic metadata remain visible below the contextual controls for inspection.
- Added an **All cabinet settings** action to return from part-specific editing to the complete Utility parameter view.

### Testing

- Added regression coverage for drawer, door, worktop, and section-generated part-to-setting mappings.
- Added source-level guards for the collapsible Section Layout state and contextual Properties wiring.
- Production TypeScript/Vite build remains part of the release gate.

### Compatibility

- No project-file schema change. Existing v0.5.0 and earlier schema-v2 projects remain compatible.

## [0.5.0] - 2026-09-28

### Added

- First-class `HardwareDefinition` and `HardwareInstance` domain objects for the Utility Cabinet reference family.
- Generated standalone hardware catalog containing all 84 Utility-compatible profiles from the Cabinet Workshop hardware catalog: 74 drawer-slide profiles and 10 concealed-hinge profiles.
- Manufacturer, family, model, source document, geometry-support, and verification-status metadata retained for each imported catalog profile.
- Search/filter UI for hardware manufacturer, family, model, and verification status.
- Hardware picker surfaces catalog verification notes and source-document links instead of presenting reference data as universally verified.
- Semantic mounting references, keepout volumes, required clearances, drilling patterns, and simplified realtime reference geometry for selected hardware.
- Metal drawer-slide instances on both sides of every modeled drawer box.
- Concealed-hinge instances generated per door, with hinge count scaled for door height.
- Slide drilling intent on drawer sides and cabinet mounting members when a selected profile safely encodes drilling.
- Hinge cup and mounting-plate drilling intent for supported concealed-hinge profiles.
- Purchased-hardware BOM grouping, separate from fabricated cabinet-part BOM rows.
- Hardware compatibility feedback for impossible slide depth, hinge-cup breakthrough, missing applicable drawers/doors, family compatibility, and front-mount mismatch.
- Legacy Cabinet Workshop Utility imports now preserve supported slide and hinge dimensions/drilling and attempt to identify the matching standalone catalog profile.
- Regression coverage for catalog completeness, search, geometry changes, drilling, semantic instances, keepouts, purchased-hardware BOM rows, compatibility rules, and legacy hardware import.

### Changed

- Application/package version advanced to 0.5.0.
- Metal slide clearance now directly controls drawer-box outside width.
- Selected slide length now limits rendered drawer-box depth, making hardware selection affect cabinet geometry rather than only metadata.
- Hardware presets are one-time parameter patches: after application, editable standalone hardware dimensions remain authoritative.
- The Properties panel now exposes hardware controls only when the active layout contains relevant drawers or doors.
- The model tree includes purchased hardware as inspectable semantic parts while modeled-body counts continue to exclude purchased hardware.
- The viewport footer reports hardware-instance count separately from fabricated/modelled bodies.

### Compatibility

- Standalone project schema remains version 2; v0.3/v0.4/v0.4.1/v0.4.2 projects migrate through defaults without a file-format break.
- Web projects with metal-slide or concealed-hinge settings are no longer reported as unsupported solely because hardware is present.
- Imported hardware that does not exactly match a catalog profile remains usable as custom hardware with an explicit import warning.

### Deferred

- Face-frame-specific hinge/slide dependencies remain deferred until face-frame construction exists in the standalone model (Phase 8).
- Manufacturer operations intentionally disabled in the source catalog remain disabled; v0.5 does not invent drilling patterns when manufacturer rails or hinge variants allow multiple valid mounting choices.
- Exact B-Rep hardware pockets/bores and collision solids remain part of the geometry-kernel milestone; v0.5 uses semantic machining intent plus realtime reference geometry.

## [0.4.2] - 2026-09-28

### Fixed

- Replaced native Chromium/Electron `<select>` controls across the primary editor with a shared React dropdown/listbox implementation.
- Starter and Recent-project menus no longer depend on a controlled `value=""` native-select reset pattern.
- Property dropdowns for layout, materials, carcass, base, fronts, shelves, and joinery now use the same desktop-safe interaction path.
- Section-editor dropdowns for selected section, sizing mode, contents, drawer-height mode, and divider construction now use the shared control.
- Dropdown menus render in a document-level portal with a high stacking layer so scroll panels and the WebGL viewport cannot clip or cover them.
- Dropdowns close predictably on outside click, scrolling, resize, or Escape and support keyboard opening/selection with arrow keys.

### Testing

- Added a regression guard that prevents native `<select>` controls from being reintroduced into the primary desktop editor surfaces.
- Added a source-level accessibility/portal guard for the shared dropdown component.

### Notes

- No project-file schema changes are required. Existing v0.3/v0.4/v0.4.1 project files remain compatible.

## [0.4.1] - 2026-09-28

### Fixed

- Replaced the viewport's box-only part renderer with support for extruded cabinet profiles and through-cutout paths.
- Side toe-kick notches now alter the rendered side-panel profile when enabled.
- Adjustable shelf-pin drilling now renders as true through-holes in cabinet side panels.
- Screw joinery now renders through-drilling on supported side-panel joints.
- Tab-and-slot joinery now renders through-slots on cabinet side panels.
- Dado joinery now renders visible recessed joint regions on supported bottom, shelf, and horizontal-divider joints.
- Utility drawers now include rendered box sides, box front/back, and drawer bottom instead of only decorative drawer fronts.
- Section-layout drawers now generate the same complete drawer-box visualization.
- Drawer components pull forward with the explode control so their construction can be inspected.

### Changed

- Added reusable profile geometry and machining-feature data to semantic `CadPart` objects without changing saved-project schema v2.
- Updated joinery, drawer-stock, and toe-kick control descriptions to match the geometry that is now visible in the realtime viewport.
- Application/package version advanced to 0.4.1 for the rendering-fix test build.

### Testing

- Added regression coverage for toe-kick side profiles, adjustable shelf holes, screw drilling, tab/slot cutouts, dado visualization, legacy drawer boxes, and section-layout drawer boxes.

### Notes

- Dado recesses in v0.4.1 are a realtime visualization layer rather than final B-Rep subtraction. Exact machining solids remain part of the planned geometry-kernel milestone.
- Hinge cups and manufacturer-specific slide drilling remain part of the hardware milestone because the standalone app does not yet carry those hardware definitions.

## [0.4.0] - 2026-09-28

### Added

- Bounded section-tree domain model ported from Cabinet Workshop, preserving the 31-node and 8-level nesting limits.
- Section leaf, horizontal split, and vertical split nodes with proportional or fixed-mm clear-opening sizing.
- Drawers, paired/single doors, and open/shelf section contents.
- Equal, graduated, and custom-weight drawer-front height recipes inside section leaves.
- Full-depth panel, front rail, and no-divider split construction.
- Nested section resolution into clear-opening rectangles with the same 60 mm minimum-opening rule as the web implementation.
- Section-driven semantic 3D divider, shelf, drawer-front, and door bodies with stable IDs.
- Standalone front-elevation section editor with direct divider dragging, subtree selection highlighting, live opening dimensions, numeric fixed-size editing, split-left/right, split-top/bottom, three-column creation, and subtree collapse.
- Wide 3-section drawer, wide 4-section drawer, and wide mixed Utility starters migrated to the section model.
- Legacy Cabinet Workshop `mixed_bays` conversion into section trees.
- Direct import of valid Cabinet Workshop `section_nodes` trees.
- Preservation of mixed-bay drawer height modes, graduated steps, and custom drawer-height weights.
- Section regression tests covering web rectangle parity, fixed/flexible sizing, validation, subtree collapse, starter geometry, and legacy import conversion.

### Changed

- Application version advanced to 0.4.0.
- Utility layout settings now expose a Simple/Sections mode; switching into Sections converts the current simple layout into a section tree.
- The Utility model now dispatches front/interior generation through either the simple v0.3 layout path or the v0.4 section-driven path.
- Wide mixed-bay starters are no longer deferred; they are first-class section-layout starters.
- Cabinet Workshop Utility imports now retain supported section/mixed-bay structure instead of flattening it into the simple layout.
- The model tree includes semantic divider bodies generated by section splits.
- The roadmap now marks the v0.4 Sections milestone complete.

### Compatibility

- Existing Standalone v1/v2 projects without section data migrate to `layoutMode: "legacy"` and receive a generated default section tree for future editing.
- Existing v0.3 project geometry and simple Utility behavior remain supported.
- Invalid imported section trees fall back to the simple Utility layout with an explicit import warning.

### Deferred

- Direct divider handles inside the Three.js viewport itself; v0.4 provides a dedicated front-elevation manipulation surface beside the 3D viewport.
- Exact divider joinery and machining booleans remain part of the v0.6 B-Rep kernel milestone.
- Hinge/slide hardware behavior remains planned for v0.5.

## [0.3.0] - 2026-09-28

### Added

- First end-to-end Cabinet Workshop family migration: Utility Cabinet.
- Typed Utility parameter schema and generated property controls.
- Utility Cabinet defaults and supported starter configurations from the web engine.
- Nominal and measured carcass/back stock handling.
- Full-top and top-stretcher construction.
- Applied-panel, structural-panel, stretcher, and open rear construction.
- Floor and wall mounting contexts.
- Toe-kick, flat, leveling-foot, and caster bases.
- Joined and full-width bottoms.
- Separate worktops with overhang controls.
- Overlay and inset front relationships.
- Fixed and adjustable shelves.
- Semantic butt, screw, dado, and tab-slot joinery intent.
- Prototype BOM grouping and semantic part metadata.
- Cabinet Workshop Utility project import with explicit unsupported-feature warnings.
- Utility parity regression fixtures based on the web schema and starters.

### Changed

- Application version advanced to 0.3.0.
- The properties panel became schema-driven rather than a hard-coded set of numeric fields.
- The release workflow can publish a verified named release from a version-matched release request on `main`.
- The roadmap now treats Utility Cabinet as the completed reference-family slice.

### Deferred

- Wide mixed-bay Utility starters, pending the v0.4 Sections model.
- Hardware-specific hinge and drawer-slide machining, pending the hardware milestone.
- Exact joinery booleans, pending the B-Rep geometry-kernel milestone.

