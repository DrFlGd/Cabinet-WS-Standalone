import { describe, expect, it } from 'vitest';
import { edgeOverlayTreatment, surfaceDepthTreatment } from './viewportRendering';

describe('viewport depth layering', () => {
  it('separates only the intentional shaded-edge overlay from its owning face', () => {
    expect(surfaceDepthTreatment('shaded-edges')).toEqual({
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    expect(surfaceDepthTreatment('shaded')).toEqual({
      polygonOffset: false,
      polygonOffsetFactor: 0,
      polygonOffsetUnits: 0,
    });
    expect(surfaceDepthTreatment('wireframe')).toEqual({
      polygonOffset: false,
      polygonOffsetFactor: 0,
      polygonOffsetUnits: 0,
    });
  });

  it('keeps edge overlays depth-tested while avoiding line-to-line depth writes', () => {
    expect(edgeOverlayTreatment()).toEqual({
      depthTest: true,
      depthWrite: false,
      renderOrder: 2,
    });
  });
});
