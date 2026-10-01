# Family parity audit

This audit compares Cabinet WS Standalone with Cabinet Workshop as a behavioral
reference. It is an evidence baseline for future parity work, not a claim that the
legacy implementation should be copied architecturally.

**Audit origin base:** `5a03133fac30644e0d7cb035f2d8a7b147e1bef3` (v0.14.1)  
**Current implementation checkpoint:** v0.14.4 integration  
**Cabinet Workshop reference:** `2255216ef7808895ec404bf34a0fb8f8a7b8abe4`

The machine-readable setting inventory is
[`src/cad/data/familyCapabilityMatrix.json`](src/cad/data/familyCapabilityMatrix.json).
Frozen reference cases are in
[`src/cad/data/familyParityReferenceFixtures.json`](src/cad/data/familyParityReferenceFixtures.json).
Audit status changes made alongside geometry work are limited to behavior proven by focused regression coverage.

## Status model

Every one of the 1,678 retained family setting definitions has one matrix row.

- **geometry-driving** — consumed by the current recipe adapter, helper mapping, family
  generator, or layout converter on a geometry/layout path. This includes indirect
  ownership such as measured stock resolved through `thicknessFromValues` and
  `section_nodes`/mixed-bay values resolved through `sectionsFromWebValues`. It means
  the control has native behavior; it does not mean that behavior has been independently
  proven equivalent to Cabinet Workshop.
- **manufacturing-driving** — consumed on a machining or manufacturing-hardware
  path. Exact operation/depth parity is still separately verifiable.
- **compatibility-only** — retained legacy Output/System recipe state. Standalone's
  native viewport, file, export, and production commands remain authoritative.
- **unsupported** — no current adapter/generator behavior was found, or the audit
  confirmed that the value is metadata-only/no-op where the reference changes
  construction.

`parity: known-gap` records a concrete independently confirmed mismatch. All other
rows remain `unverified`; they are not implicitly marked verified.

| Family | Fields | Geometry-driving | Manufacturing-driving | Compatibility-only | Unsupported | Known-gap rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Shop Cart | 310 | 122 | 21 | 45 | 122 | 25 |
| Utility | 310 | 122 | 21 | 45 | 122 | 25 |
| Benchtop | 222 | 92 | 10 | 37 | 83 | 21 |
| Stackable | 277 | 101 | 21 | 46 | 109 | 25 |
| Kitchen | 299 | 125 | 22 | 45 | 107 | 25 |
| Standalone Drawer | 161 | 85 | 8 | 26 | 42 | 6 |
| Equipment Stand | 99 | 53 | 6 | 10 | 30 | 13 |
| **Total** | 1678 | 700 | 109 | 254 | 615 | 140 |

These counts are control-ownership coverage, not construction-parity percentages.
Many unsupported fields are intentionally presentation/export compatibility data,
while others materially affect reference geometry or machining.

## Independent reference fixtures

The committed fixtures pin the reference commit and the evidence path so parity
claims can be reviewed without depending on mutable `main`.

1. **Utility modular-grid fit target.** Cabinet Workshop's recorded target report
   resolves a 42 mm, 10 × 8 modular target to a 520 × 384 × 900 mm cabinet with
   422 × 338 × 116.8 mm drawer inside-clear dimensions. Standalone currently retains
   the target controls without applying that envelope solve.
2. **Drawer corner joinery.** Cabinet Workshop distinguishes butt, screw, dado,
   and tab-slot construction between each drawer side and the box front/back.
   Standalone now preserves those recipe values and implements screw pilot guides
   plus blind dado receivers/mating-member extension in both shared-cabinet drawers
   and the dedicated Drawer family. Integration now adds matching drawer-side slots
   and front/back tabs without rabbet substitution.
3. **Drawer divider mounting.** Cabinet Workshop changes machining between
   freestanding, bottom-only, and bottom-plus-perimeter divider grids and uses
   independent groove depths. Standalone now generates opposing interlocks and the selected bottom/perimeter
   grooves with independent depths.
4. **Equipment Stand French cleats.** Cabinet Workshop constructs an angle-dependent
   cleat profile. Standalone currently stores `cleatAngle` metadata on rectangular
   rails, and the dedicated Equipment Stand document has no purchased hardware
   instances.

Behavioral regression tests exercise those Standalone outcomes. They are expected to
change when the corresponding gaps are implemented.

## Joinery coverage checkpoint

The release integration implements shared contact-based mating joints. Each receiver
and its mating extension comes from the same resolved joint; machining features carry
source-part ownership into exact CAD and manufacturing output.

| Construction | Implemented behavior | Validation |
| --- | --- | --- |
| Shared carcass bottom/top/stretchers, fixed shelves, section dividers, structural back, rear rails and toe-kick | Screw guides; blind dados with mating extensions; tabs with through slots | Real OpenCascade carcass/section solids, pairwise intersection checks, STEP |
| Equipment Stand rectangular frame contacts | Same screw/dado/tab-slot engine; skeleton windows remain separate cutouts | Semantic regressions; specialized mounting hardware remains outside this scope |
| Shared and dedicated drawer corners | Distinct butt/screw/dado/tab-slot construction; mirrored receivers | Real screw/dado cuts and assembled tab-slot drawer solids |
| Captured drawer bottom | Four correctly mirrored grooves and an inserted bottom | Assembled drawer intersection checks |
| Drawer organizer grid | Equal-clear/custom positions, measured thickness, opposing half-lap slots, optional bottom/perimeter dados with independent depths | Mounted-grid solid intersections and save/reopen |
| Tab policies | Adaptive/fixed counts; width/web/margins; location custom/edge-biased/stack-safe centers; receiver fit; closed-corner relief | Reference spacing oracles and manufacturing through-cut regressions |

This is focused construction validation, not certification of every legacy recipe.
Only panels generated by the current family/layout model can participate. Full-width
bottom compatibility, unusual intersections, specialized cleat profiles, and every
possible CNC relief/stacking configuration still need representative shop validation.

## Prioritized parity gaps

### P1 — dimensional and fit behavior

Treat fit/dimension parity as the first implementation target because downstream
part counts, BOM dimensions, machining locations, and saved-project behavior all
depend on the resolved envelope.

- Implement or explicitly reject the cabinet-level fit-target controls
  (`target_dimension_*`, `target_drawer_*`, `target_module_*`,
  `width_basis`, and `depth_basis`).
- Extend representative fixtures across all shared cabinet families for outside
  dimensions, clear openings, stock thickness changes, and native-to-recipe edits.
- Keep the existing Standalone Fit Solver architecture; use Cabinet Workshop only as
  an oracle for normalized inputs and expected dimensions.

### P2 — construction and machining semantics

- Drawer screw/dado/tab-slot and divider machining are implemented; extend the
  focused regression fixtures with additional saved shop projects.
- Validate unusual divider placements and relief/tool combinations against
  additional reference projects.
- Reconcile applied-back rabbet construction with the reference instead of extending
  the current proof operation by assumption.
- The shared-cabinet baseline now retains the mating tabs for the outer-side bottom
  tab/slot joint and applies `joint_fit_clearance` to the matching through-slot
  receiver. Reconcile the remaining reference tab count, width, placement, top/shelf/
  separator, and edge-policy controls before claiming broader tab-slot parity.
- Implement the actual Stackable radiused side mating profile. The former front/rear
  proxy rails were removed because they duplicated the cabinet-bottom solid and the
  reference owns this interface in the side profile; that removal fixes coincident
  geometry but does not establish Stackable interface parity.
- Verify adjustable-shelf line boring, handle drilling, face registration, wood
  runner registration, and related hole-depth/spacing controls.

### P3 — Equipment Stand construction and purchased hardware

- Replace rectangular cleat metadata with verified French-cleat bevel geometry,
  including independent stand/wall cleat widths and stabilizer behavior.
- Add family-specific purchased slide/runner, anti-tip, and wall-fastener coverage
  only from verified hardware data; do not infer ambiguous drilling.
- Carry reference load/travel fields into validation/reporting only where their
  meaning is explicit. They are metadata checks, not structural certification.

### P4 — unsupported-setting feedback

After the construction-driving gaps above have explicit ownership, surface unsupported
settings in the generated Family Settings UI so a retained compatibility value cannot
be mistaken for implemented geometry. Manual Layout remains the sole section/bay
editor, and Output/System compatibility fields should not recreate legacy output
controls.

## Verification boundaries

The matrix is intentionally conservative. Direct references plus explicit indirect
helper/layout ownership identify current behavior, while behavioral regressions cover
representative indirect mappings such as measured drawer stock, Kitchen section
nodes, and the drawer screw/dado formulas above. The committed reference fixtures
prove selected current outcomes. A focused test proving semantic dimensions,
feature-graph registration, or manufacturing depth is labeled separately from real
OpenCascade/STEP validation; neither is silently promoted to full family parity. The
audit does **not** establish packaged Windows interaction, visual equivalence for all
110 starters, complete tab-slot construction, or manufacturer-correct Equipment
Stand hardware.

A full parity sign-off still requires representative saved Cabinet Workshop projects
evaluated against both implementations for normalized inputs, dimensions and clear
openings, semantic/fabricated part counts, BOM dimensions, manufacturing operations
and depths, plus deterministic visual sanity. Packaged-EXE smoke testing remains a
separate desktop-baseline task.
