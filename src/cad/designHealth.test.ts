import { describe, expect, it } from 'vitest';
import { buildCabinetDocument } from './cabinetModel';
import { analyzeDesignHealth } from './designHealth';
import { cloneSectionNodes } from './sections';
import { utilityStarter } from './utilityStarters';

describe('native Design Health', () => {
  it('blocks dado and drawer-groove breakthrough from semantic material data', () => {
    const base = utilityStarter('utility_3_drawer_base').parameters;
    const document = buildCabinetDocument({
      ...base,
      carcassStock: 'custom_mm',
      materialThickness: 6,
      joineryStyle: 'dado',
      dadoDepth: 8,
      drawerMaterialThickness: 6,
      drawerBottomStyle: 'captured',
      drawerBottomGrooveDepth: 7,
    });

    const report = analyzeDesignHealth(document, { kernelStatus: 'ready' });
    expect(report.readiness).toBe('blocked');
    expect(report.checks.some(check => check.id === 'carcass-dado-breakthrough')).toBe(true);
    expect(report.checks.some(check => check.id === 'drawer-bottom-groove-breakthrough')).toBe(true);
  });

  it('surfaces slide depth and hinge breakthrough compatibility', () => {
    const drawer = buildCabinetDocument({
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerMount: 'metal_slides',
      metalSlideLength: 900,
      metalSlideFrontSetback: 20,
      depth: 400,
    });
    const drawerReport = analyzeDesignHealth(drawer, { kernelStatus: 'ready' });
    expect(drawerReport.checks.some(check => check.title === 'Drawer slide depth conflict')).toBe(true);

    const door = buildCabinetDocument({
      ...utilityStarter('utility_door_base').parameters,
      hingeStyle: 'euro_35mm',
      doorThickness: 12,
      hingeCupDepth: 13,
    });
    const doorReport = analyzeDesignHealth(door, { kernelStatus: 'ready' });
    expect(doorReport.checks.some(check => check.title === 'Hinge cup breakthrough')).toBe(true);
  });

  it('detects impossible fixed section dimensions', () => {
    const base = utilityStarter('utility_wide_mixed_base').parameters;
    const nodes = cloneSectionNodes(base.sectionNodes);
    const children = nodes
      .map((node, index) => ({ node, index }))
      .filter(entry => entry.node[0] === 0);
    children[0].node[3] = 'mm';
    children[0].node[4] = base.width * 0.9;
    children[1].node[3] = 'weight';
    children[1].node[4] = 1;

    const document = buildCabinetDocument({
      ...base,
      layoutMode: 'sections',
      sectionNodes: nodes,
    });
    const report = analyzeDesignHealth(document, { kernelStatus: 'ready' });
    expect(report.checks.some(check => check.title === 'Impossible section dimensions')).toBe(true);
  });

  it('detects shelf/hardware keepout collisions', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('utility_door_base').parameters,
      hingeStyle: 'euro_35mm',
      shelfCount: 1,
    });
    const shelf = document.parts.find(part => part.category === 'shelf')!;
    const hardware = document.hardware[0];
    expect(hardware).toBeTruthy();
    hardware.keepout = {
      position: { ...shelf.position },
      size: { ...shelf.size },
    };

    const report = analyzeDesignHealth(document, { kernelStatus: 'ready' });
    expect(report.checks.some(check => check.title === 'Shelf / hardware collision')).toBe(true);
  });

  it('checks machining edge distance and overlapping subtractive intent', () => {
    const document = buildCabinetDocument({
      ...utilityStarter('utility_door_base').parameters,
      hingeStyle: 'euro_35mm',
      hingeCupCenterFromDoorEdge: 10,
    });
    const left = document.parts.find(part => part.id === 'carcass:left')!;
    left.renderFeatures = [
      ...(left.renderFeatures ?? []),
      {
        kind: 'slot',
        position: { x: 0, y: 80, z: 120 },
        size: { x: left.size.x, y: 40, z: 12 },
      },
      {
        kind: 'rabbet',
        position: { x: 0, y: 90, z: 124 },
        size: { x: left.size.x, y: 30, z: 10 },
      },
    ];

    const report = analyzeDesignHealth(document, { kernelStatus: 'ready' });
    expect(report.checks.some(check => check.title === 'Low machining edge distance')).toBe(true);
    expect(report.checks.some(check => check.title === 'Overlapping machining')).toBe(true);
  });

  it('checks semantic IDs, mounting references, and exact-kernel diagnostics', () => {
    const document = buildCabinetDocument(utilityStarter('default').parameters);
    document.parts.push({ ...document.parts[0] });
    if (document.hardware[0]) {
      document.hardware[0].mountingReference = { partId: 'missing:mount', face: 'inside' };
    }

    const report = analyzeDesignHealth(document, {
      kernelStatus: 'error',
      kernelDiagnostics: [{
        severity: 'error',
        code: 'BOOLEAN_FAILED',
        message: 'Exact subtraction failed.',
        partId: 'carcass:left',
      }],
    });

    expect(report.checks.some(check => check.title === 'Duplicate semantic part ID')).toBe(true);
    expect(report.checks.some(check => check.title === 'Exact CAD diagnostic')).toBe(true);
    expect(report.coverage.find(item => item.id === 'exact-kernel')?.status).toBe('partial');
    expect(report.readiness).toBe('blocked');
  });
});
