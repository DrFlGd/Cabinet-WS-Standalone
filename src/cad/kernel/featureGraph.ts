import type { CabinetDocument, CadPart } from '../types';
import type { CadFeature, FeatureGraph } from './types';

export function buildFeatureGraph(document: CabinetDocument): FeatureGraph {
  const partFeatures: Record<string, CadFeature[]> = {};
  let featureCount = 0;

  for (const part of document.parts) {
    const features = featuresForPart(document, part);
    partFeatures[part.id] = features;
    featureCount += features.length;
  }

  return {
    documentId: document.id,
    partFeatures,
    featureCount,
  };
}

export function featuresForPart(document: CabinetDocument, part: CadPart): CadFeature[] {
  const features: CadFeature[] = [];

  if (part.category === 'hardware') {
    features.push({
      id: `feature:${part.id}:hardware-reference`,
      partId: part.id,
      kind: 'hardware-reference',
      label: 'Purchased hardware reference',
      parameters: {
        manufacturer: String(part.metadata?.manufacturer ?? ''),
        model: String(part.metadata?.model ?? ''),
      },
      size: { ...part.size },
    });
  } else {
    features.push({
      id: `feature:${part.id}:blank`,
      partId: part.id,
      kind: 'panel-blank',
      label: 'Panel blank',
      parameters: {
        material: part.material,
        width: part.size.x,
        depth: part.size.y,
        height: part.size.z,
      },
      size: { ...part.size },
    });
  }

  const profileHoles = part.geometry?.holes ?? [];
  const circleHoles = profileHoles.filter(hole => hole.kind === 'circle');
  const rectHoles = profileHoles.filter(hole => hole.kind === 'rect');

  if (circleHoles.length >= 2) {
    features.push({
      id: `feature:${part.id}:hole-pattern:profile`,
      partId: part.id,
      kind: 'hole-pattern',
      label: circleHoles.length >= 8 ? 'Line boring pattern' : 'Hole pattern',
      semanticRole: circleHoles.length >= 8 ? 'line-boring' : 'profile-holes',
      axis: part.geometry?.axis === 'x' ? 'x' : 'z',
      parameters: {
        count: circleHoles.length,
        centersU: circleHoles.map(hole => hole.u),
        centersV: circleHoles.map(hole => hole.v),
        radii: circleHoles.map(hole => hole.radius),
      },
    });
  } else {
    circleHoles.forEach((hole, index) => {
      features.push({
        id: `feature:${part.id}:hole:profile:${index + 1}`,
        partId: part.id,
        kind: 'hole',
        label: 'Profile hole',
        axis: part.geometry?.axis === 'x' ? 'x' : 'z',
        position: profilePointToLocal(part, hole.u, hole.v),
        parameters: { radius: hole.radius },
      });
    });
  }

  rectHoles.forEach((hole, index) => {
    features.push({
      id: `feature:${part.id}:pocket:profile:${index + 1}`,
      partId: part.id,
      kind: 'pocket',
      label: 'Profile cutout',
      semanticRole: 'through-cutout',
      axis: part.geometry?.axis === 'x' ? 'x' : 'z',
      position: profilePointToLocal(part, hole.u, hole.v),
      parameters: {
        width: hole.width,
        height: hole.height,
      },
    });
  });

  if (isToeKickProfile(part)) {
    features.push({
      id: `feature:${part.id}:toe-kick-pocket`,
      partId: part.id,
      kind: 'pocket',
      label: 'Toe-kick side cutout',
      semanticRole: 'toe-kick',
      parameters: {
        toeKickHeight: document.parameters.toeKickHeight,
        toeKickDepth: document.parameters.toeKickDepth,
      },
    });
  }

  (part.renderFeatures ?? []).forEach((feature, index) => {
    features.push({
      id: `feature:${part.id}:${feature.kind}:${index + 1}`,
      partId: part.id,
      kind: feature.kind === 'slot' ? 'pocket' : feature.kind === 'drill' ? 'hole' : feature.kind,
      label: renderFeatureLabel(feature.kind),
      semanticRole: feature.kind,
      position: { ...feature.position },
      size: { ...feature.size },
      axis: inferFeatureAxis(feature.size),
      parameters: {
        width: feature.size.x,
        depth: feature.size.y,
        height: feature.size.z,
      },
    });
  });

  const rabbet = backRabbetForPart(document, part);
  if (rabbet) features.push(rabbet);

  features.push({
    id: `feature:${part.id}:assembly-transform`,
    partId: part.id,
    kind: 'assembly-transform',
    label: 'Assembly placement',
    position: { ...part.position },
    parameters: {
      x: part.position.x,
      y: part.position.y,
      z: part.position.z,
    },
  });

  return features;
}

function profilePointToLocal(part: CadPart, u: number, v: number) {
  return part.geometry?.axis === 'x'
    ? { x: 0, y: u, z: v }
    : { x: u, y: v, z: 0 };
}

function isToeKickProfile(part: CadPart) {
  if (part.id !== 'carcass:left' && part.id !== 'carcass:right') return false;
  const outline = part.geometry?.outline;
  if (!outline || outline.length <= 4) return false;
  const uniqueU = new Set(outline.map(point => point.u));
  const uniqueV = new Set(outline.map(point => point.v));
  return uniqueU.size > 2 && uniqueV.size > 2;
}

function renderFeatureLabel(kind: CadPart['renderFeatures'][number]['kind']) {
  switch (kind) {
    case 'dado': return 'Dado';
    case 'rabbet': return 'Rabbet';
    case 'slot': return 'Slot';
    case 'drill': return 'Drilling';
  }
}

function inferFeatureAxis(size: CadPart['size']): 'x' | 'y' | 'z' {
  const values = [
    ['x', size.x] as const,
    ['y', size.y] as const,
    ['z', size.z] as const,
  ].sort((a, b) => a[1] - b[1]);
  return values[0][0];
}

function backRabbetForPart(document: CabinetDocument, part: CadPart): CadFeature | null {
  const p = document.parameters;
  if (p.backStyle !== 'panel') return null;
  if (part.id !== 'carcass:left' && part.id !== 'carcass:right') return null;

  const back = document.parts.find(candidate => candidate.id === 'back');
  if (!back) return null;

  const depth = Math.max(1, Math.min(part.size.x / 2, p.dadoDepth));
  const y = Math.max(0, back.position.y - part.position.y - 0.2);
  const width = Math.min(part.size.y - y, back.size.y + 0.4);
  if (width <= 0) return null;

  return {
    id: `feature:${part.id}:back-rabbet`,
    partId: part.id,
    kind: 'rabbet',
    label: 'Back rabbet',
    semanticRole: 'back-rabbet',
    position: {
      x: part.id === 'carcass:left' ? part.size.x - depth : 0,
      y,
      z: Math.max(0, back.position.z - part.position.z),
    },
    size: {
      x: depth,
      y: width,
      z: Math.min(part.size.z, back.size.z),
    },
    parameters: {
      depth,
      backThickness: back.size.y,
      inset: p.backInset,
    },
  };
}
