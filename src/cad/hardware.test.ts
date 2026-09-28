import { describe, expect, it } from 'vitest';
import { buildPurchasedHardwareBom } from './bom';
import { buildCabinetDocument, sanitizeParameters } from './cabinetModel';
import { parseDocumentWithReport } from './documentIO';
import { hardwareCompatibility } from './hardware';
import {
  applyHardwareProfile,
  HARDWARE_CATALOG,
  hardwareDefinition,
  hardwareProfiles,
} from './hardwareCatalog';
import { utilityStarter } from './utilityStarters';

describe('v0.5 hardware catalog and semantic hardware', () => {
  it('ports all Utility-compatible web hardware profiles with source status', () => {
    expect(HARDWARE_CATALOG).toHaveLength(84);
    expect(hardwareProfiles('drawer_slide')).toHaveLength(74);
    expect(hardwareProfiles('hinge')).toHaveLength(10);

    const accuride = hardwareDefinition('accuride_3832e_450');
    expect(accuride).toMatchObject({
      category: 'drawer_slide',
      manufacturer: 'Accuride',
      verification: { verified: true, status: 'manufacturer_partial' },
    });
    expect(accuride?.source.url).toMatch(/^https:\/\//);

    const blum = hardwareDefinition('blum_clip_top_blumotion_110_overlay_reference');
    expect(blum).toMatchObject({
      category: 'hinge',
      manufacturer: 'Blum',
      dimensions: { cupDiameter: 35, cupDepth: 13 },
    });
  });

  it('filters hardware by manufacturer, family, model, and verification text', () => {
    expect(hardwareProfiles('drawer_slide', 'Hettich KA 5632').length).toBeGreaterThanOrEqual(2);
    expect(hardwareProfiles('hinge', 'Blum').length).toBeGreaterThanOrEqual(2);
    expect(hardwareProfiles('drawer_slide', 'manufacturer partial').length).toBeGreaterThan(0);
  });

  it('selected side-mount hardware changes drawer depth and creates purchased slide instances', () => {
    const base = utilityStarter('utility_3_drawer_base').parameters;
    const wood = buildCabinetDocument(base);
    const metal = buildCabinetDocument(applyHardwareProfile(base, 'generic_side_mount_12_7_450'));

    const woodLeft = wood.parts.find(part => part.id === 'drawer:1:box:left');
    const metalLeft = metal.parts.find(part => part.id === 'drawer:1:box:left');

    expect(woodLeft?.size.y).toBeGreaterThan(450);
    expect(metalLeft?.size.y).toBe(450);
    expect(metal.hardware.filter(item => item.category === 'drawer_slide')).toHaveLength(6);
    expect(metal.parts.filter(part => part.category === 'hardware')).toHaveLength(6);
    expect(metal.hardware[0].keepout.size.y).toBeGreaterThan(metal.hardware[0].size.y);
    expect(metal.hardware[0].mountingReference.partId).not.toBe('');
  });

  it('uses editable slide clearance after a preset has been applied', () => {
    const base = applyHardwareProfile(
      utilityStarter('utility_3_drawer_base').parameters,
      'generic_side_mount_12_7_450',
    );
    const stock = buildCabinetDocument(base);
    const edited = buildCabinetDocument({
      ...base,
      metalSlideClearancePerSide: 18,
      metalSlideLength: 400,
    });

    const boxWidth = (document: ReturnType<typeof buildCabinetDocument>) => {
      const left = document.parts.find(part => part.id === 'drawer:1:box:left')!;
      const right = document.parts.find(part => part.id === 'drawer:1:box:right')!;
      return right.position.x + right.size.x - left.position.x;
    };

    expect(boxWidth(edited)).toBeLessThan(boxWidth(stock));
    expect(edited.parts.find(part => part.id === 'drawer:1:box:left')?.size.y).toBe(400);
    expect(edited.hardware[0].size.x).toBe(18);
  });

  it('applies encoded slide drilling to cabinet and drawer mounting parts', () => {
    const document = buildCabinetDocument(applyHardwareProfile(
      utilityStarter('utility_3_drawer_base').parameters,
      'generic_side_mount_12_7_450',
    ));

    const leftSide = document.parts.find(part => part.id === 'carcass:left');
    const drawerSide = document.parts.find(part => part.id === 'drawer:1:box:left');

    expect(leftSide?.geometry?.holes?.filter(hole => hole.kind === 'circle').length).toBeGreaterThan(0);
    expect(drawerSide?.renderFeatures?.some(feature => feature.kind === 'drill')).toBe(true);
  });

  it('creates concealed-hinge instances and cup drilling for doors', () => {
    const parameters = applyHardwareProfile(
      utilityStarter('utility_door_base').parameters,
      'generic_euro_35_110_overlay',
    );
    const document = buildCabinetDocument(parameters);
    const hinges = document.hardware.filter(item => item.category === 'hinge');

    expect(hinges).toHaveLength(4);
    expect(hinges.every(item => item.definitionId === 'generic_euro_35_110_overlay')).toBe(true);
    expect(document.parts.find(part => part.id === 'door:1')?.renderFeatures?.some(feature => feature.kind === 'drill')).toBe(true);
    expect(document.parts.find(part => part.id === 'carcass:left')?.geometry?.holes?.length).toBeGreaterThan(0);
  });

  it('groups purchased hardware separately from fabricated-panel BOM rows', () => {
    const document = buildCabinetDocument(applyHardwareProfile(
      utilityStarter('utility_3_drawer_base').parameters,
      'generic_side_mount_12_7_450',
    ));
    const rows = buildPurchasedHardwareBom(document.hardware);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      definitionId: 'generic_side_mount_12_7_450',
      manufacturer: 'Generic',
      quantity: 6,
    });
  });

  it('reports depth and hinge-cup compatibility errors', () => {
    const slideIssues = hardwareCompatibility(sanitizeParameters({
      ...utilityStarter('utility_3_drawer_base').parameters,
      drawerMount: 'metal_slides',
      metalSlideLength: 600,
      metalSlideFrontSetback: 20,
      depth: 500,
    }));
    expect(slideIssues.some(issue => issue.level === 'error' && /usable cabinet depth/i.test(issue.message))).toBe(true);

    const hingeIssues = hardwareCompatibility(sanitizeParameters({
      ...utilityStarter('utility_door_base').parameters,
      hingeStyle: 'euro_35mm',
      hingeCupDepth: 18,
      doorThickness: 18,
    }));
    expect(hingeIssues.some(issue => issue.level === 'error' && /break through/i.test(issue.message))).toBe(true);
  });

  it('imports web hardware settings and recognizes matching catalog profiles', () => {
    const parsed = parseDocumentWithReport(JSON.stringify({
      version: 2,
      engineFamily: 'modular_organization',
      family: 1,
      values: {
        design_name: 'Hardware import',
        cabinet_width: 760,
        cabinet_height: 900,
        cabinet_depth: 610,
        cabinet_contents: 'combo',
        drawer_count: 2,
        door_count: 2,
        drawer_mount: 'metal_slides',
        metal_slide_clearance_per_side: 12.7,
        metal_slide_length: 450,
        metal_slide_front_setback: 3,
        metal_slide_envelope_height: 45,
        include_metal_slide_holes: true,
        hardware_drilling_mode: 'recommended',
        metal_slide_cabinet_holes_x: [37, 133, 229, 325],
        metal_slide_drawer_holes_x: [37, 133, 229, 325],
        metal_slide_cabinet_hole_diameter: 5,
        metal_slide_drawer_hole_diameter: 5,
        metal_slide_cabinet_hole_z_from_drawer_bottom: 22.5,
        metal_slide_drawer_hole_z_from_drawer_bottom: 22.5,
        hinge_style: 'euro_35mm',
        front_mount_style: 'overlay',
        hinge_cup_diameter: 35,
        hinge_cup_depth: 12,
        hinge_cup_center_from_door_edge: 22.5,
        hinge_door_fixing_enabled: true,
        hinge_door_fixing_hole_diameter: 3,
        hinge_door_fixing_hole_spacing: 45,
        hinge_plate_holes_enabled: true,
        hinge_plate_hole_diameter: 5,
        hinge_plate_center_from_front: 37,
        hinge_plate_hole_spacing: 32,
      },
    }));

    expect(parsed.document.parameters.drawerMount).toBe('metal_slides');
    expect(parsed.document.parameters.drawerSlideId).toBe('generic_side_mount_12_7_450');
    expect(parsed.document.parameters.hingeId).toBe('generic_euro_35_110_overlay');
    expect(parsed.report.warnings.join(' ')).not.toMatch(/deferred to v0\.5/i);
  });
});
