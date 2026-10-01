import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import opencascade from 'replicad-opencascadejs';
import { exportSTEP, setOC } from 'replicad';
import { familyStarter, parametersFromFamilyValues } from '../familyCatalog';
import { buildFamilyCabinetDocument } from '../familyModel';
import { buildFeatureGraph } from './featureGraph';
import { buildExactShape, safeDelete } from './exactShape';

const require = createRequire(import.meta.url);

beforeAll(async () => {
  const jsPath = require.resolve('replicad-opencascadejs');
  const wasmPath = join(dirname(jsPath), 'replicad_single.wasm');
  const OC = await opencascade({
    locateFile: () => wasmPath,
  });
  setOC(OC);
}, 60_000);

describe('real OpenCascade drawer joinery', () => {
  it('cuts screw and dado side solids and exports them to STEP', async () => {
    const starter = familyStarter('drawer');
    const cases = [
      {
        label: 'screw',
        values: {
          ...starter.values,
          drawer_stock: 'custom_mm',
          custom_drawer_material_thickness: 9,
          drawer_joinery_style: 'screw',
          drawer_screw_hole_diameter: 3,
          drawer_screw_edge_margin: 15,
        },
      },
      {
        label: 'dado',
        values: {
          ...starter.values,
          drawer_stock: 'custom_mm',
          custom_drawer_material_thickness: 9,
          drawer_joinery_style: 'dado',
          drawer_dado_depth: 3.5,
          drawer_dado_fit_clearance: 0.4,
        },
      },
    ] as const;

    const shapes: { shape: any; name: string; color: string }[] = [];
    try {
      for (const testCase of cases) {
        const parameters = parametersFromFamilyValues('drawer', testCase.values);
        const document = buildFamilyCabinetDocument(parameters, testCase.label, 'mm', {
          family: 'drawer',
          starterId: null,
          familyValues: testCase.values,
        });
        const left = document.parts.find(part => part.id === 'drawer:1:box:left')!;
        const graph = buildFeatureGraph(document);
        const diagnostics: { severity: 'warning' | 'error'; code: string; message: string; partId?: string; featureId?: string }[] = [];
        const shape = buildExactShape(left, graph.partFeatures[left.id], diagnostics);

        expect(diagnostics, testCase.label).toEqual([]);
        expect(shape.faces.length, testCase.label).toBeGreaterThan(6);
        shapes.push({ shape, name: `drawer-left-${testCase.label}`, color: left.color });
      }

      const blob = exportSTEP(shapes, { unit: 'MM', modelUnit: 'MM' });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(bytes.byteLength).toBeGreaterThan(1000);
      expect(new TextDecoder().decode(bytes.slice(0, 96))).toContain('ISO-10303-21');
    } finally {
      shapes.forEach(entry => safeDelete(entry.shape));
    }
  }, 60_000);
});
