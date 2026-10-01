export type ViewportDepthMode = 'shaded' | 'shaded-edges' | 'wireframe';

export type SurfaceDepthTreatment = {
  polygonOffset: boolean;
  polygonOffsetFactor: number;
  polygonOffsetUnits: number;
};

export function surfaceDepthTreatment(mode: ViewportDepthMode): SurfaceDepthTreatment {
  if (mode !== 'shaded-edges') {
    return {
      polygonOffset: false,
      polygonOffsetFactor: 0,
      polygonOffsetUnits: 0,
    };
  }

  // The exact/preview edge layer is intentionally coplanar with the owning face.
  // Push only the shaded face depth back slightly so visible edges remain stable
  // without moving cabinet geometry or revealing hidden/back-side edges.
  return {
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  };
}

export function edgeOverlayTreatment() {
  return {
    depthTest: true,
    depthWrite: false,
    renderOrder: 2,
  } as const;
}
