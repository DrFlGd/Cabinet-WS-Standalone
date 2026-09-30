import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildCabinetDocument, stockThickness } from './cabinetModel';
import { analyzeDesignHealth } from './designHealth';
import {
  buildManufacturingModel,
  manufacturingPackageEntries,
  operationLayerDxf,
  reviewedManufacturingZip,
} from './manufacturing';
import { buildShopDocumentation } from './shopDocs';
import { utilityStarter } from './utilityStarters';

function modelFor(parameters = utilityStarter('default').parameters) {
  const document = buildCabinetDocument(parameters);
  const health = analyzeDesignHealth(document, { kernelStatus: 'ready' });
  const docs = buildShopDocumentation(document, health);
  return { document, health, docs, manufacturing: buildManufacturingModel(document, docs, health) };
}

describe('Phase 11 manufacturing geometry', () => {
  it('projects fabricated parts into millimeter-native machining planes', () => {
    const { manufacturing } = modelFor();
    const left = manufacturing.parts.find(part => part.partId === 'carcass:left')!;

    expect(manufacturing.units).toBe('mm');
    expect(manufacturing.scale).toBe(1);
    expect(left.metadata.units).toBe('mm');
    expect(left.metadata.scale).toBe(1);
    expect(left.plane.thicknessAxis).toBe('x');
    expect(left.plane.uAxis).toBe('y');
    expect(left.plane.vAxis).toBe('z');
    expect(left.operations.some(operation => operation.kind === 'CUT')).toBe(true);
    expect(left.operations.some(operation => operation.kind === 'ENGRAVE')).toBe(true);
    expect(left.operations.some(operation => operation.kind === 'EDGE')).toBe(true);
  });

  it('maps registered joinery and drilling features to operation kinds with face/depth metadata', () => {
    const starter = utilityStarter('utility_door_base');
    const parameters = {
      ...starter.parameters,
      joineryStyle: 'dado' as const,
      shelfStyle: 'adjustable' as const,
      shelfCount: 2,
      hardwareDrillingMode: 'recommended' as const,
    };
    const { manufacturing } = modelFor(parameters);
    const operations = manufacturing.parts.flatMap(part => part.operations);

    expect(operations.some(operation => operation.kind === 'DADO_GROOVE')).toBe(true);
    expect(operations.some(operation => operation.kind === 'DRILL')).toBe(true);
    expect(operations.filter(operation => operation.kind === 'DRILL').every(operation => operation.face.semanticId.startsWith('face:'))).toBe(true);
    expect(operations.filter(operation => operation.kind === 'DADO_GROOVE').some(operation => operation.depthMm !== null)).toBe(true);
  });

  it('exports tab-slot receivers as through cuts at the full side thickness', () => {
    const { manufacturing } = modelFor({
      ...utilityStarter('default').parameters,
      joineryStyle: 'tab_slot',
      dadoFitClearance: 0.6,
    });
    const left = manufacturing.parts.find(part => part.partId === 'carcass:left')!;
    const receivers = left.operations.filter(operation => operation.label === 'Tab/slot receiver');

    expect(receivers).toHaveLength(2);
    expect(receivers.every(operation => operation.kind === 'CUT')).toBe(true);
    expect(receivers.every(operation => operation.through)).toBe(true);
    expect(receivers.every(operation => operation.depthMm === left.plane.thicknessMm)).toBe(true);
    expect(receivers.every(operation => operation.face.side === 'through')).toBe(true);

    const bottom = manufacturing.parts.find(part => part.partId === 'carcass:bottom')!;
    const profile = bottom.operations.find(operation => operation.sourceKind === 'panel-profile')!;
    expect(profile.kind).toBe('CUT');
    expect(profile.geometry[0]?.type).toBe('polyline');
    if (profile.geometry[0]?.type !== 'polyline') throw new Error('Expected tabbed bottom profile polyline');
    expect(profile.geometry[0].points.length).toBeGreaterThan(4);
  });

  it('exports valid DXF unit metadata and operation layers', () => {
    const { manufacturing } = modelFor({
      ...utilityStarter('default').parameters,
      joineryStyle: 'dado',
    });
    const part = manufacturing.parts.find(candidate => candidate.operationCounts.DADO_GROOVE > 0)!;
    const layer = operationLayerDxf(part, 'DADO_GROOVE');

    expect(part.dxf).toContain('$INSUNITS');
    expect(part.dxf).toContain('\r\n70\r\n4\r\n');
    expect(part.dxf).toContain('LWPOLYLINE');
    expect(layer).toContain('DADO-GROOVE');
    expect(layer).not.toContain('\r\n8\r\nDRILL\r\n');
  });

  it('exports true-scale SVG dimensions and drilling maps', () => {
    const { manufacturing } = modelFor({
      ...utilityStarter('utility_door_base').parameters,
      shelfStyle: 'adjustable',
      shelfCount: 2,
    });
    const drilled = manufacturing.parts.find(part => part.operationCounts.DRILL > 0)!;

    expect(drilled.svg).toContain('data-units="mm"');
    expect(drilled.svg).toContain('data-scale="1"');
    expect(drilled.svg).toContain('mm" height="');
    expect(drilled.svg).toContain('<polygon');
    expect(drilled.drillingCsv).toContain('DIAMETER_MM');
    expect(drilled.drillingCsv).toContain('FACE');
    expect(drilled.drillingCsv.split('\r\n').length).toBeGreaterThan(2);
  });

  it('builds a reviewed package with per-part geometry, layers, metadata and reports', () => {
    const { manufacturing } = modelFor();
    expect(manufacturing.readiness).not.toBe('blocked');

    const entries = manufacturingPackageEntries(manufacturing, '2026-09-29T12:00:00.000Z');
    expect(entries.some(entry => entry.path === 'manifest.json')).toBe(true);
    expect(entries.some(entry => entry.path === 'reports/manufacturing.json')).toBe(true);
    expect(entries.some(entry => /parts\/.+\.dxf$/.test(entry.path))).toBe(true);
    expect(entries.some(entry => /parts\/.+\.svg$/.test(entry.path))).toBe(true);
    expect(entries.some(entry => /layers\/cut\.dxf$/.test(entry.path))).toBe(true);
    expect(entries.some(entry => /drilling\.csv$/.test(entry.path))).toBe(true);

    const zip = reviewedManufacturingZip(manufacturing, '2026-09-29T12:00:00.000Z');
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const decoded = new TextDecoder().decode(zip);
    expect(decoded).toContain('manifest.json');
    expect(decoded).toContain('README.txt');
  });

  it('blocks reviewed packages while Design Health is blocked', () => {
    const defaults = utilityStarter('default').parameters;
    const thickness = stockThickness(defaults.carcassStock, defaults.materialThickness);
    const document = buildCabinetDocument({
      ...defaults,
      joineryStyle: 'dado',
      dadoDepth: thickness,
    });
    const health = analyzeDesignHealth(document, { kernelStatus: 'ready' });
    const docs = buildShopDocumentation(document, health);
    const manufacturing = buildManufacturingModel(document, docs, health);

    expect(manufacturing.readiness).toBe('blocked');
    expect(manufacturing.issues.some(issue => issue.severity === 'error')).toBe(true);
    expect(() => reviewedManufacturingZip(manufacturing, '2026-09-29T12:00:00.000Z')).toThrow(/blocked/i);
  });

  it('keeps manufacturing geometry independent of renderer or OpenSCAD report text', () => {
    const source = requireSource('src/cad/manufacturing.ts');
    expect(source).not.toMatch(/THREE|mesh UUID|ECHO:/);
    expect(source).toContain("buildFeatureGraph(document)");
    expect(source).toContain("units: 'mm'");
  });
});

function requireSource(path: string) {
  return readFileSync(path, 'utf8');
}
