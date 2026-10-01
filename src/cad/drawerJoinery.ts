import type { CadPart, CadRenderFeature, DrawerJoineryStyle } from './types';

export type DrawerCornerJoineryOptions = {
  style: DrawerJoineryStyle;
  wallThickness: number;
  boxDepth: number;
  boxHeight: number;
  dadoDepth: number;
  dadoFitClearance: number;
  screwHoleDiameter: number;
  screwEdgeMargin: number;
  bottomCaptured: boolean;
  bottomGrooveZ: number;
  bottomThickness: number;
  frontPartId: string;
  backPartId: string;
};

export function effectiveDrawerDadoDepth(wallThickness: number, requestedDepth: number) {
  return Math.min(
    Math.max(0, requestedDepth),
    Math.max(0, wallThickness - 0.5),
  );
}

export function drawerCrossPanelSpan(
  style: DrawerJoineryStyle,
  outerWidth: number,
  wallThickness: number,
  dadoDepth: number,
) {
  const innerWidth = Math.max(1, outerWidth - 2 * wallThickness);
  if (style !== 'dado') {
    return { offsetX: wallThickness, width: innerWidth };
  }

  const depth = effectiveDrawerDadoDepth(wallThickness, dadoDepth);
  return {
    offsetX: wallThickness - depth,
    width: innerWidth + 2 * depth,
  };
}

export function drawerScrewHeights({
  boxHeight,
  edgeMargin,
  diameter,
  bottomCaptured,
  bottomGrooveZ,
  bottomThickness,
}: {
  boxHeight: number;
  edgeMargin: number;
  diameter: number;
  bottomCaptured: boolean;
  bottomGrooveZ: number;
  bottomThickness: number;
}) {
  const low = Math.max(
    edgeMargin,
    bottomCaptured
      ? bottomGrooveZ + bottomThickness + diameter / 2 + 2
      : edgeMargin,
  );
  const high = boxHeight - edgeMargin;

  if (high - low >= diameter + 4) return [low, high];
  return [(low + high) / 2];
}

export function drawerSideCornerFeatures(
  side: 'left' | 'right',
  options: DrawerCornerJoineryOptions,
): CadRenderFeature[] {
  const {
    style,
    wallThickness,
    boxDepth,
    boxHeight,
    dadoDepth,
    dadoFitClearance,
    screwHoleDiameter,
    screwEdgeMargin,
    bottomCaptured,
    bottomGrooveZ,
    bottomThickness,
    frontPartId,
    backPartId,
  } = options;

  if (style === 'butt' || style === 'tab_slot') return [];

  if (style === 'screw') {
    const diameter = Math.max(0.1, screwHoleDiameter);
    const heights = drawerScrewHeights({
      boxHeight,
      edgeMargin: screwEdgeMargin,
      diameter,
      bottomCaptured,
      bottomGrooveZ,
      bottomThickness,
    });
    const yCenters = [wallThickness / 2, boxDepth - wallThickness / 2];

    return yCenters.flatMap((y, jointIndex) =>
      heights.map(z => ({
        kind: 'drill' as const,
        sourcePartId: jointIndex === 0 ? frontPartId : backPartId,
        position: {
          x: 0,
          y: y - diameter / 2,
          z: z - diameter / 2,
        },
        size: { x: wallThickness, y: diameter, z: diameter },
      })),
    );
  }

  if (style === 'dado') {
    const depth = effectiveDrawerDadoDepth(wallThickness, dadoDepth);
    const clearance = Math.max(0, dadoFitClearance);
    const x = side === 'left' ? wallThickness - depth : 0;

    return [
      {
        kind: 'dado',
        sourcePartId: frontPartId,
        position: { x, y: -clearance / 2, z: -clearance / 2 },
        size: {
          x: depth,
          y: wallThickness + clearance,
          z: boxHeight + clearance,
        },
      },
      {
        kind: 'dado',
        sourcePartId: backPartId,
        position: {
          x,
          y: boxDepth - wallThickness - clearance / 2,
          z: -clearance / 2,
        },
        size: {
          x: depth,
          y: wallThickness + clearance,
          z: boxHeight + clearance,
        },
      },
    ];
  }

  const rabbetDepth = Math.min(
    Math.max(2, wallThickness * 0.45),
    Math.max(2, wallThickness - 1),
  );
  const features: CadRenderFeature[] = [
    {
      kind: 'rabbet',
      sourcePartId: frontPartId,
      position: { x: 0, y: 0, z: 0 },
      size: { x: wallThickness, y: rabbetDepth, z: boxHeight },
    },
    {
      kind: 'rabbet',
      sourcePartId: backPartId,
      position: { x: 0, y: boxDepth - rabbetDepth, z: 0 },
      size: { x: wallThickness, y: rabbetDepth, z: boxHeight },
    },
  ];

  if (style === 'lock_rabbet') {
    features.push({
      kind: 'slot',
      sourcePartId: frontPartId,
      position: {
        x: 0,
        y: rabbetDepth,
        z: boxHeight * 0.25,
      },
      size: {
        x: wallThickness,
        y: Math.min(wallThickness, 4),
        z: Math.max(3, wallThickness * 0.5),
      },
    });
  }

  return features;
}
