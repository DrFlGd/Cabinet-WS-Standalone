# Prototype architecture

## Core rule

The CAD document owns cabinet meaning. Three.js only owns visualization.

Do not store cabinet truth in mesh UUIDs, scene graph ordering, or renderer state.

## Current flow

```text
CabinetParameters
      |
      v
buildCabinetDocument()
      |
      +--> stable CadPart records
      |      id / material / position / size / metadata
      |
      +--> Tree + Properties UI
      |
      +--> CadViewport
             |
             +--> Three.js meshes
```

## Target flow

```text
CabinetDocument
      |
      v
Feature / dependency graph
      |
      v
GeometryKernel (worker)
      |
      +--> B-Rep bodies + semantic topology
      |
      +--> tessellation cache
              |
              v
           Three.js
```

## Why semantic IDs matter

A geometry kernel may recreate its topology every time a cabinet dimension changes. The application therefore needs stable domain IDs such as:

- `carcass:left`
- `face:carcass:left:inside`
- `feature:carcass:left:bottom-dado`
- `door:1`

Selection, BOM rows, machining, dimensions, constraints, visibility, and saved references should attach to these semantic IDs rather than kernel-generated topology numbers.

## Proposed kernel interface

A future `GeometryKernel` should provide operations like:

```ts
interface GeometryKernel {
  rebuild(document: CabinetDocument, dirtyIds?: string[]): Promise<KernelResult>;
  tessellate(bodyIds: string[]): Promise<TessellatedPart[]>;
  exportStep(bodyIds?: string[]): Promise<ArrayBuffer>;
  dispose(): void;
}
```

`KernelResult` should map stable part/face/edge names to the corresponding generated topology.

## Cabinet-specific feature model

Do not begin with a general-purpose sketch solver. Cabinet manufacturing gets high value from a smaller feature vocabulary:

- panel blank
- dado
- rabbet
- groove
- pocket
- hole
- hole pattern
- chamfer/bevel
- edge banding
- face drilling
- hardware reference
- transform / assembly placement

These features should be both geometry-producing and manufacturing-aware.
