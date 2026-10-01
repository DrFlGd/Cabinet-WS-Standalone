import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import opencascade from 'replicad-opencascadejs';
import { exportSTEP, measureVolume, setOC } from 'replicad';
import { buildCabinetDocument, DEFAULT_PARAMETERS } from '../cabinetModel';
import { buildFamilyCabinetDocument } from '../familyModel';
import { familyStarter, parametersFromFamilyValues } from '../familyCatalog';
import { buildFeatureGraph } from './featureGraph';
import { buildExactShape, safeDelete } from './exactShape';
import type { CabinetDocument, CadPart } from '../types';
import { utilityStarter } from '../utilityStarters';
import { serializeDocument, parseDocument } from '../documentIO';
import { tabSpans } from '../joineryPolicy';

beforeAll(async () => {
  const require = createRequire(import.meta.url);
  const OC = await opencascade({ locateFile: () => join(dirname(require.resolve('replicad-opencascadejs')), 'replicad_single.wasm') });
  setOC(OC);
}, 60_000);

async function verifySolids(document: CabinetDocument, parts: CadPart[]) {
  const graph = buildFeatureGraph(document);
  const shapes: { shape: any; name: string }[] = [];
  try {
    for (const part of parts) {
      const diagnostics: any[] = [];
      let shape = buildExactShape(part, graph.partFeatures[part.id], diagnostics);
      expect(diagnostics, part.id).toEqual([]);
      expect(measureVolume(shape), part.id).toBeGreaterThan(0);
      shape = shape.translate([part.position.x, part.position.y, part.position.z]);
      shapes.push({ shape, name: part.id });
    }
    for (let i = 0; i < shapes.length; i++) for (let j = i + 1; j < shapes.length; j++) {
      const a = parts[i], b = parts[j];
      if (!(['x', 'y', 'z'] as const).every(axis =>
        Math.min(a.position[axis] + a.size[axis], b.position[axis] + b.size[axis]) - Math.max(a.position[axis], b.position[axis]) > 1e-5)) continue;
      const common = shapes[i].shape.clone().intersect(shapes[j].shape.clone());
      try { expect(Math.abs(measureVolume(common)), `${a.id} intersects ${b.id}`).toBeLessThan(.01); }
      finally { safeDelete(common); }
    }
    const step = await exportSTEP(shapes, { unit: 'MM', modelUnit: 'MM' }).text();
    expect(step).toContain('ISO-10303-21');
    expect(step).toContain('MANIFOLD_SOLID_BREP');
  } finally { shapes.forEach(s => safeDelete(s.shape)); }
}

describe('complete mating joinery', () => {
  it('matches reference adaptive/fixed/custom tab spacing', () => {
    expect(tabSpans(600)).toEqual([{ start: 92.5, end: 127.5 }, { start: 282.5, end: 317.5 }, { start: 472.5, end: 507.5 }]);
    expect(tabSpans(90)).toEqual([{ start: 27.5, end: 62.5 }]);
    expect(tabSpans(400, { tab_count_mode: 'fixed', joint_tab_count: 2 })).toHaveLength(2);
    expect(tabSpans(400, { top_tab_placement: 'custom', top_tab_custom_centers: [45, 320] }, 'top'))
      .toEqual([{ start: 27.5, end: 62.5 }, { start: 302.5, end: 337.5 }]);
  });
  for (const style of ['dado', 'tab_slot', 'screw'] as const) {
    it(`builds nonintersecting ${style} carcass joints and STEP including top/shelf/back/toe kick`, async () => {
      const document = buildCabinetDocument({ ...DEFAULT_PARAMETERS, joineryStyle: style,
        topStyle: 'full', backStyle: 'structural_panel', shelfStyle: 'fixed', shelfCount: 1,
        cabinetContents: 'doors', layoutMode: 'legacy' });
      const parts = document.parts.filter(p => ['carcass', 'back', 'shelf'].includes(p.category));
      const left = parts.find(p => p.id === 'carcass:left')!;
      for (const id of ['carcass:bottom', 'carcass:top', 'shelf:1', 'back', 'toe-kick']) {
        expect(left.renderFeatures?.some(f => f.sourcePartId === id), id).toBe(true);
      }
      await verifySolids(document, parts);
    }, 60_000);
  }
  it('models drawer tabs, captured bottom and mounted interlocking dividers as nonintersecting solids', async () => {
    const starter = familyStarter('drawer');
    const values = { ...starter.values, drawer_joinery_style: 'tab_slot', drawer_bottom_joinery: 'dado',
      include_drawer_divider_grid: true, drawer_divider_columns: 3, drawer_divider_rows: 2,
      drawer_divider_mounting: 'bottom_and_perimeter' };
    const document = buildFamilyCabinetDocument(parametersFromFamilyValues('drawer', values), 'Drawer test', 'mm',
      { family: 'drawer', familyValues: values });
    expect(parseDocument(serializeDocument(document)).parts).toEqual(document.parts);
    const parts = document.parts.filter(p => p.category === 'drawer' || p.category === 'divider');
    expect(parts.filter(p => p.category === 'divider')).toHaveLength(3);
    const front = parts.find(p => p.id === 'drawer:1:box:front')!;
    expect(front.position.x).toBe(0);
    expect(front.size.x).toBe(document.parameters.width);
    await verifySolids(document, parts);
  }, 60_000);
  it('does not machine fixed joinery into adjustable shelves', () => {
    const doc = buildCabinetDocument({ ...DEFAULT_PARAMETERS, cabinetContents: 'doors', shelfCount: 2,
      joineryStyle: 'tab_slot', shelfStyle: 'adjustable', layoutMode: 'legacy' });
    expect(doc.parts.flatMap(p => p.renderFeatures ?? []).some(f => f.sourcePartId?.startsWith('shelf:'))).toBe(false);
  });
  it('joins section partitions and their shelves without cutting through neighboring bays', async () => {
    const starter = utilityStarter('utility_wide_3_section_drawers');
    const document = buildCabinetDocument({ ...starter.parameters, joineryStyle: 'tab_slot' });
    expect(document.parts.some(p => p.category === 'divider')).toBe(true);
    await verifySolids(document, document.parts.filter(p => ['carcass', 'divider', 'shelf'].includes(p.category)));
  }, 60_000);
});
