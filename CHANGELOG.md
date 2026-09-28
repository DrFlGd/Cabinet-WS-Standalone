# Changelog

All notable changes to Cabinet WS Standalone are recorded here.

The project follows milestone versions while the standalone CAD architecture is being built. Entries describe user-visible behavior, file-format changes, compatibility work, testing, packaging, and deliberate deferrals.

## [0.4.0] - 2026-09-28

### In progress

- Sections / bay-layout milestone.
- Porting the bounded section tree from Cabinet Workshop into the standalone semantic document model.
- Adding direct front-view divider manipulation and section editing.
- Converting legacy mixed-bay Utility designs into section layouts.
- Making section layouts drive semantic 3D supports, shelves, doors, and drawer fronts.
- Adding cross-engine section regression fixtures.

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
