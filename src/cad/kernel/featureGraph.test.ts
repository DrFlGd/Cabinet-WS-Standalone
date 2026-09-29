import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildCabinetDocument } from '../cabinetModel';
import type { CadPart } from '../types';
import { utilityStarter } from '../utilityStarters';
import { buildFeatureGraph } from './featureGraph';
import { classifyEdgeRole, classifyFaceRole, semanticFaceId } from './semanticTopology';

describe('v0.6 exact CAD feature graph', () => {
  it('gives every modeled part a semantic blank/reference and assembly transform', () => {
    const document = buildCabinetDocument(utilityStarter('default').parameters);
    const graph = buildFeatureGraph(document);

    for (const part of document.parts) {
      const features = graph.partFeatures[part.id];
      expect(features.length, part.id).toBeGreaterThanOrEqual(2);
      expect(features.some(feature => feature.kind === 'assembly-transform'), part.id).toBe(true);
      expect(
        features.some(feature => feature.kind === (part.category === 'hardware' ? 'hardware-reference' : 'panel-blank')),
        part.id,
      ).toBe(true);
    }
    expect(graph.featureCount).toBeGreaterThan(document.parts.length * 2 - 1);
  });

  it('registers exact toe-kick, dado, line-boring, and back-rabbet intent', () => {
    const source = utilityStarter('utility_door_base').parameters;
    const document = buildCabinetDocument({
      ...source,
      sideToeKickCutout: 'both',
      joineryStyle: 'dado',
      shelfStyle: 'adjustable',
      shelfCount: 3,
      backStyle: 'panel',
      backInset: 6,
    });
    const graph = buildFeatureGraph(document);

    for (const id of ['carcass:left', 'carcass:right']) {
      const features = graph.partFeatures[id];
      expect(features.some(feature => feature.semanticRole === 'toe-kick'), id).toBe(true);
      expect(features.some(feature => feature.kind === 'dado'), id).toBe(true);
      expect(features.some(feature => feature.id === `feature:${id}:bottom-dado`), id).toBe(true);
      expect(features.some(feature => feature.semanticRole === 'line-boring'), id).toBe(true);
      expect(features.some(feature => feature.kind === 'rabbet' && feature.semanticRole === 'back-rabbet'), id).toBe(true);
    }
  });

  it('records hardware as a semantic reference rather than pretending it is fabricated stock', () => {
    const source = utilityStarter('utility_3_drawer_base').parameters;
    const document = buildCabinetDocument({
      ...source,
      drawerMount: 'metal_slides',
      drawerSlideId: 'generic_side_mount_12_7_450',
    });
    const graph = buildFeatureGraph(document);
    const hardware = document.parts.find(part => part.category === 'hardware');

    expect(hardware).toBeTruthy();
    expect(graph.partFeatures[hardware!.id].some(feature => feature.kind === 'hardware-reference')).toBe(true);
    expect(graph.partFeatures[hardware!.id].some(feature => feature.kind === 'panel-blank')).toBe(false);
  });

  it('maps Replicad mesh groups using OpenCascade shape hashes, not array indices', () => {
    const source = readFileSync('src/cad/kernel/geometry.worker.ts', 'utf8');
    expect(source).toContain('Number(face.hashCode)');
    expect(source).toContain('Number(edge.hashCode)');
    expect(source).not.toContain('faces.map((face, rawFaceId)');
    expect(source).not.toContain('edges.map((edge, rawEdgeId)');
  });

  it('does not promote simplified purchased-hardware envelopes to exact B-Rep bodies', () => {
    const source = readFileSync('src/cad/kernel/types.ts', 'utf8');
    expect(source).toContain("part.category !== 'hardware'");
  });
});

describe('v0.6 semantic topology', () => {
  const left: CadPart = {
    id: 'carcass:left',
    name: 'Left Side',
    category: 'carcass',
    material: 'Sheet stock',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 19, y: 600, z: 900 },
    color: '#fff',
    visible: true,
  };

  it('names cabinet faces by stable domain roles, not kernel indices', () => {
    expect(classifyFaceRole(left, [19, 300, 450], [1, 0, 0])).toBe('inside');
    expect(classifyFaceRole(left, [0, 300, 450], [-1, 0, 0])).toBe('outside');
    expect(classifyFaceRole(left, [9.5, 0, 450], [0, -1, 0])).toBe('front');
    expect(classifyFaceRole(left, [9.5, 300, 900], [0, 0, 1])).toBe('top');
    expect(classifyFaceRole(left, [13, 300, 450], [-1, 0, 0])).toMatch(/^machining-x-negative-/);

    const face = semanticFaceId(left, 37, [19, 300, 450], [1, 0, 0]);
    expect(face.id).toBe('face:carcass:left:inside');
    expect(face.rawFaceId).toBe(37);
  });

  it('assigns cabinet-semantic edge roles', () => {
    expect(classifyEdgeRole(left, [0, 0, 900], [19, 0, 900])).toBe('front-top');
    expect(classifyEdgeRole(left, [0, 600, 0], [19, 600, 0])).toBe('back-bottom');
  });
});
