# Changelog

All notable changes to Cabinet WS Standalone are recorded here.

The project follows milestone versions while the standalone CAD architecture is being built. Entries describe user-visible behavior, file-format changes, compatibility work, testing, packaging, and deliberate deferrals.

## [0.6.0] - 2026-09-28

### Added

- Worker-based `GeometryKernel` implementation using Replicad and OpenCascade WebAssembly.
- Asynchronous exact rebuild requests with monotonically increasing request IDs and stale-result cancellation.
- Dirty-part signature tracking plus a per-part exact tessellation cache.
- Cabinet-native feature graph generated from semantic parts instead of reverse-engineering manufacturing intent from Three.js meshes.
- First-class feature records for panel blanks, dadoes, rabbets, grooves, pockets, holes, hole patterns, hardware references, and assembly transforms.
- Exact B-Rep bodies for the Utility Cabinet reference family.
- Exact extrusion of side profiles, including toe-kick side cutouts.
- Exact subtraction of registered dado/pocket and drilling features.
- Applied-back rabbet proof geometry on cabinet side B-Reps.
- Exact adjustable-shelf line boring and other registered hole patterns.
- Semantic face and edge identity mapped from transient OpenCascade topology, including IDs such as `face:carcass:left:inside` and `edge:carcass:left:front-top`.
- Three.js rendering from exact OpenCascade tessellations while retaining the analytical geometry as a responsive/failure fallback.
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
