import { describe, expect, it } from 'vitest';
import { buildCabinetDocument, sanitizeParameters } from './cabinetModel';
import { solveFit } from './fitSolver';
import { utilityStarter } from './utilityStarters';

describe('Phase 9 fit solver', () => {
  it('solves a requested drawer interior back to cabinet envelope', () => {
    const base = {
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerMount: 'metal_slides' as const,
      metalSlideLength: 600,
      metalSlideClearancePerSide: 12.7,
      faceFrameStyle: 'none' as const,
    };
    const target = { mode: 'drawer' as const, insideWidth: 420, insideDepth: 400 };
    const solution = solveFit(base, target);
    expect(solution.feasible).toBe(true);

    const parameters = sanitizeParameters({ ...base, ...solution.patch });
    const document = buildCabinetDocument(parameters);
    const boxFront = document.parts.find(part => part.id === 'drawer:1:box:front')!;
    const boxSide = document.parts.find(part => part.id === 'drawer:1:box:left')!;

    expect(boxFront.size.x).toBeCloseTo(target.insideWidth, 4);
    expect(boxSide.size.y - 2 * parameters.drawerMaterialThickness).toBeCloseTo(target.insideDepth, 4);
  });

  it('reports an infeasible fitted drawer when the slide caps depth', () => {
    const base = {
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerMount: 'metal_slides' as const,
      metalSlideLength: 300,
    };
    const solution = solveFit(base, { mode: 'drawer', insideWidth: 350, insideDepth: 420 });
    expect(solution.feasible).toBe(false);
    expect(solution.patch).toEqual({});
    expect(solution.warnings.some(message => message.includes('selected slide limits'))).toBe(true);
  });

  it('solves an equipment envelope including requested clearances', () => {
    const base = utilityStarter('default').parameters;
    const solution = solveFit(base, {
      mode: 'equipment',
      equipmentWidth: 500,
      equipmentHeight: 600,
      equipmentDepth: 450,
      sideClearance: 25,
      verticalClearance: 20,
      depthClearance: 30,
    });

    expect(solution.feasible).toBe(true);
    expect(solution.achieved['Clear width']).toBe(550);
    expect(solution.achieved['Clear height']).toBe(640);
    expect(solution.achieved['Clear depth']).toBe(480);
    expect(Number(solution.patch.width)).toBeGreaterThan(550);
    expect(Number(solution.patch.height)).toBeGreaterThan(640);
    expect(Number(solution.patch.depth)).toBeGreaterThan(480);
  });

  it('solves module pitch/count on width and height', () => {
    const base = utilityStarter('default').parameters;
    const width = solveFit(base, { mode: 'modules', axis: 'width', pitch: 32, count: 18, margin: 16 });
    const height = solveFit(base, { mode: 'modules', axis: 'height', pitch: 32, count: 20, margin: 16 });

    expect(width.feasible).toBe(true);
    expect(width.achieved['Clear module span']).toBe(608);
    expect(Number(width.patch.width)).toBeGreaterThan(608);

    expect(height.feasible).toBe(true);
    expect(height.achieved['Clear module span']).toBe(672);
    expect(Number(height.patch.height)).toBeGreaterThan(672);
  });

  it('rejects solutions outside supported Utility envelope limits instead of relying on sanitize clamping', () => {
    const base = utilityStarter('default').parameters;
    const solution = solveFit(base, {
      mode: 'equipment',
      equipmentWidth: 4000,
      equipmentHeight: 600,
      equipmentDepth: 450,
      sideClearance: 25,
      verticalClearance: 20,
      depthClearance: 30,
    });
    expect(solution.feasible).toBe(false);
    expect(solution.patch).toEqual({});
    expect(solution.warnings.some(message => message.includes('supported size limits'))).toBe(true);
  });
});
