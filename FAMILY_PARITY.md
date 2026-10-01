# Family parity audit

This audit compares Cabinet WS Standalone with Cabinet Workshop as a behavioral
reference. It is an evidence baseline for future parity work, not a claim that the
legacy implementation should be copied architecturally.

**Audit origin base:** `5a03133fac30644e0d7cb035f2d8a7b147e1bef3` (v0.14.1)  
**Current implementation checkpoint:** `85552dddaeacfb9f84c8e7725fbe56dd31cfcffb` (v0.14.3) plus the focused joinery changes on this branch  
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
| Shop Cart | 310 | 85 | 22 | 45 | 158 | 42 |
| Utility | 310 | 85 | 22 | 45 | 158 | 42 |
| Benchtop | 222 | 56 | 10 | 37 | 119 | 38 |
| Stackable | 277 | 64 | 22 | 46 | 145 | 42 |
| Kitchen | 299 | 88 | 23 | 45 | 143 | 42 |
| Standalone Drawer | 161 | 61 | 9 | 26 | 65 | 16 |
| Equipment Stand | 99 | 43 | 6 | 10 | 40 | 20 |
| **Total** | **1,678** | **482** | **114** | **254** | **828** | — |

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
   and the dedicated Drawer family. Tab-slot intent is preserved without rabbet
   substitution, but matching drawer-side slots and front/back tabs remain missing.
3. **Drawer divider mounting.** Cabinet Workshop changes machining between
   freestanding, bottom-only, and bottom-plus-perimeter divider grids and uses
   independent groove depths. Standalone currently generates divider pieces but
   does not vary drawer machining for those settings.
4. **Equipment Stand French cleats.** Cabinet Workshop constructs an angle-dependent
   cleat profile. Standalone currently stores `cleatAngle` metadata on rectangular
   rails, and the dedicated Equipment Stand document has no purchased hardware
   instances.

Behavioral regression tests exercise those Standalone outcomes. They are expected to
change when the corresponding gaps are implemented.

## Joinery coverage checkpoint

The table below is a construction checklist, not a percentage score. **Implemented**
means the current semantic generator owns both the stated geometry or machining
operation and its mating relationship. **Partial** means some receiver/operation
intent exists but the reference construction is not complete. **Verified (focused)**
means the committed regression suite checks the reference formula/relationship; it
does not replace real OpenCascade or saved-project parity validation.

| Family | Mating part pair | Butt | Screw | Dado | Tab-slot |
| --- | --- | --- | --- | --- | --- |
| Shop Cart / Utility / Benchtop / Stackable / Kitchen | outer side ↔ joined bottom | Implemented baseline | Partial — side pilot pattern exists but does not yet own all reference screw controls | Partial — side receiver path exists; full mating/tolerance parity not established | **Implemented limited baseline** — v0.14.3 outer-side/bottom tabs + matching side slots with fit clearance; reference count/width/placement policy still missing |
| Shop Cart / Utility / Benchtop / Stackable / Kitchen | outer side ↔ full top / top stretchers | Butt assembly exists | Partial side drilling only | Missing complete mating dado construction | Missing |
| Shop Cart / Utility / Benchtop / Stackable / Kitchen | outer side ↔ fixed shelf / horizontal divider | Butt assembly exists | Missing reference screw construction | Partial receiver machining; matching reference mating construction not proven | Missing |
| Shop Cart / Utility / Benchtop / Stackable / Kitchen | outer side ↔ drawer separator/stretcher | Butt assembly exists | Missing | Partial where represented as horizontal divider; reference separator policy not complete | Missing |
| Shop Cart / Utility / Benchtop / Stackable / Kitchen | drawer side ↔ box front/back | Implemented | **Implemented; verified (focused)** — measured side stock, reference edge-margin placement, through DRILL operations | **Implemented; verified (focused)** — independent depth/clearance, mirrored side receivers, front/back extension, DADO_GROOVE operations | **Missing** — intent/clearance retained; no substitute geometry |
| Shop Cart / Utility / Benchtop / Stackable / Kitchen | drawer walls ↔ captured bottom | Existing groove construction | independent of corner screw mode | Existing captured-bottom groove; exact reference depth/fit parity still unverified | independent of corner tab-slot mode; bottom groove remains separate |
| Shop Cart / Utility / Benchtop / Stackable / Kitchen | drawer bottom/walls ↔ organizer dividers | Pieces exist | — | Missing reference bottom/perimeter mounting grooves and independent depths | Missing reference interlock/mounting behavior |
| Standalone Drawer | side ↔ box front/back | Implemented | **Implemented; verified (focused)** | **Implemented; verified (focused)** | **Missing** — preserved as explicit coverage warning |
| Standalone Drawer | walls ↔ captured bottom | Existing groove construction | independent | Existing groove construction; full reference parity unverified | independent |
| Standalone Drawer | bottom/walls ↔ organizer dividers | Pieces exist | — | Missing bottom/perimeter mounting grooves and custom placement | Missing interlock/mounting behavior |
| Equipment Stand | frame/cleat members | Family-specific frame construction; not covered by drawer work | Reference-specific fastener behavior remains unverified | No drawer dado scope | Reference frame/tab policy remains unsupported/known-gap |

Additional reference carcass joints remain outside this slice: structural-back tongues/
receivers, toe-kick joints, rear stretchers, detailed top/shelf/separator tab policy,
slot corner relief, and per-location tab-count/width overrides. The v0.14.3
outer-side/bottom tab-slot joint must not be generalized into a claim of complete
tab-slot parity.

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

- Drawer corner screw and dado now preserve distinct reference intent and drive
  measured-stock geometry/machining. Finish drawer tab-slot by adding true
  front/back tab profiles and matching side slots; do not substitute rabbet or
  proxy solids.
- Implement divider mounting, custom divider placement, groove depths/clearances,
  and interlock orientation before treating divider manufacturing output as parity.
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
