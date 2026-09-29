import { describe, expect, it } from 'vitest';
import { analyzeDesignHealth } from './designHealth';
import {
  allFamilyStarters,
  familyStarter,
  familyStarters,
  FAMILY_DEFINITIONS,
} from './familyCatalog';
import { buildFamilyCabinetDocument } from './familyModel';
import { buildFeatureGraph } from './kernel/featureGraph';
import { buildManufacturingModel } from './manufacturing';
import { buildShopDocumentation } from './shopDocs';

describe('v0.13 seven-family parity catalog', () => {
  it('ports all seven original families and all 110 shipped starter recipes', () => {
    expect(FAMILY_DEFINITIONS.map(family => family.id)).toEqual([
      'shop_cart',
      'utility',
      'benchtop',
      'stackable',
      'kitchen',
      'drawer',
      'equipment_stand',
    ]);
    expect(familyStarters('shop_cart')).toHaveLength(6);
    expect(familyStarters('utility')).toHaveLength(11);
    expect(familyStarters('benchtop')).toHaveLength(8);
    expect(familyStarters('stackable')).toHaveLength(6);
    expect(familyStarters('kitchen')).toHaveLength(57);
    expect(familyStarters('drawer')).toHaveLength(7);
    expect(familyStarters('equipment_stand')).toHaveLength(15);
    expect(allFamilyStarters()).toHaveLength(110);
  });

  it('builds every starter as a native semantic document with stable unique part IDs', () => {
    for (const starter of allFamilyStarters()) {
      const document = buildFamilyCabinetDocument(
        starter.parameters,
        starter.name,
        'mm',
        { family: starter.family, starterId: starter.id, familyValues: starter.values },
      );

      expect(document.version, starter.id).toBe(3);
      expect(document.family, starter.id).toBe(starter.family);
      expect(document.starterId, starter.id).toBe(starter.id);
      expect(document.parts.length, starter.id).toBeGreaterThan(0);
      expect(new Set(document.parts.map(part => part.id)).size, starter.id).toBe(document.parts.length);
      expect(document.parts.every(part =>
        Number.isFinite(part.size.x)
        && Number.isFinite(part.size.y)
        && Number.isFinite(part.size.z)
        && part.size.x > 0
        && part.size.y > 0
        && part.size.z > 0
      ), starter.id).toBe(true);

      const graph = buildFeatureGraph(document);
      expect(Object.keys(graph.partFeatures), starter.id).toHaveLength(document.parts.length);
      for (const part of document.parts) {
        expect(graph.partFeatures[part.id]?.some(feature => feature.kind === 'assembly-transform'), starter.id + ':' + part.id).toBe(true);
      }
    }
  });

  it('ports representative Shop Cart workbench and caster construction', () => {
    const starter = familyStarter('shop_cart', 'shop_cart_4_section_drawer_workbench');
    const document = buildFamilyCabinetDocument(starter.parameters, starter.name, 'mm', {
      family: starter.family,
      starterId: starter.id,
      familyValues: starter.values,
    });

    expect(document.parameters.width).toBe(1800);
    expect(document.parameters.layoutMode).toBe('sections');
    expect(document.parts.some(part => part.id === 'worktop')).toBe(true);
    expect(document.parts.filter(part => part.metadata?.baseStyle === 'casters')).toHaveLength(4);
    expect(document.parts.filter(part => part.category === 'divider').length).toBeGreaterThanOrEqual(3);
  });

  it('ports all Benchtop drawer-count examples through the native drawer construction', () => {
    const starter = familyStarter('benchtop', 'benchtop_wide_8_drawer');
    const document = buildFamilyCabinetDocument(starter.parameters, starter.name, 'mm', {
      family: starter.family,
      starterId: starter.id,
      familyValues: starter.values,
    });

    expect(document.parameters.width).toBe(800);
    expect(document.parts.filter(part => /^drawer:\d+:front$/.test(part.id))).toHaveLength(8);
    expect(document.parts.filter(part => /:box:left$/.test(part.id))).toHaveLength(8);
  });

  it('ports Stackable drawer, open, and door module semantics with stack interfaces', () => {
    for (const id of ['stackable_2_drawer', 'stackable_open_module', 'stackable_door_module']) {
      const starter = familyStarter('stackable', id);
      const document = buildFamilyCabinetDocument(starter.parameters, starter.name, 'mm', {
        family: starter.family,
        starterId: starter.id,
        familyValues: starter.values,
      });

      expect(document.parts.some(part => part.id === 'stack:interface:front'), id).toBe(true);
      expect(document.parts.some(part => part.id === 'stack:interface:rear'), id).toBe(true);
      expect(document.parts.some(part => part.id === 'stack:base'), id).toBe(true);
    }

    const open = familyStarter('stackable', 'stackable_open_module');
    const openDocument = buildFamilyCabinetDocument(open.parameters, open.name, 'mm', {
      family: open.family,
      starterId: open.id,
      familyValues: open.values,
    });
    expect(openDocument.parts.filter(part => part.category === 'front')).toHaveLength(0);
    expect(openDocument.parts.some(part => part.category === 'shelf')).toBe(true);
  });

  it('ports Kitchen standard sizes, face frames, and the section-layout photo example', () => {
    const b30 = familyStarter('kitchen', 'kitchen_standard_B30');
    const b30Document = buildFamilyCabinetDocument(b30.parameters, b30.name, 'in', {
      family: b30.family,
      starterId: b30.id,
      familyValues: b30.values,
    });
    expect(b30Document.parameters.width).toBeCloseTo(762);
    expect(b30Document.parts.some(part => part.category === 'frame')).toBe(true);
    expect(b30Document.parts.some(part => part.metadata?.kitchenModel === 'B30')).toBe(true);

    const photo = familyStarter('kitchen', 'photo_section_cabinet');
    const photoDocument = buildFamilyCabinetDocument(photo.parameters, photo.name, 'mm', {
      family: photo.family,
      starterId: photo.id,
      familyValues: photo.values,
    });
    expect(photoDocument.parameters.layoutMode).toBe('sections');
    expect(photoDocument.parameters.sectionNodes).toHaveLength(8);
    expect(photoDocument.parts.filter(part => part.category === 'front').length).toBeGreaterThanOrEqual(8);
  });

  it('ports Standalone Drawer sizing bases and divider-grid construction', () => {
    const grid = familyStarter('drawer', 'drawer_450_mm_opening_4x3_divider_grid');
    const document = buildFamilyCabinetDocument(grid.parameters, grid.name, 'mm', {
      family: grid.family,
      starterId: grid.id,
      familyValues: grid.values,
    });
    expect(document.parts.some(part => part.id === 'drawer:1:box:left')).toBe(true);
    expect(document.parts.some(part => part.id === 'drawer:1:bottom')).toBe(true);
    expect(document.parts.filter(part => part.category === 'divider')).toHaveLength(5);

    const inside = familyStarter('drawer', 'drawer_420_x_336_x_85_inside_clear');
    expect(inside.parameters.width).toBeGreaterThan(420);
    expect(inside.parameters.depth).toBeGreaterThan(336);
    expect(inside.parameters.height).toBeGreaterThan(85);
  });

  it('ports Equipment Stand tray, skeletonized-side, upper-bay, and French-cleat examples', () => {
    const tower = familyStarter('equipment_stand', 'equipment_stand_stacked_dual_bay_printer_tower');
    const towerDocument = buildFamilyCabinetDocument(tower.parameters, tower.name, 'mm', {
      family: tower.family,
      starterId: tower.id,
      familyValues: tower.values,
    });
    expect(towerDocument.parts.filter(part => /^tray:\d+:bottom$/.test(part.id))).toHaveLength(2);
    expect(towerDocument.parts.some(part => part.id === 'shelf:upper-bay')).toBe(true);

    const wall = familyStarter('equipment_stand', 'equipment_stand_skeletonized_wall_stand');
    const wallDocument = buildFamilyCabinetDocument(wall.parameters, wall.name, 'mm', {
      family: wall.family,
      starterId: wall.id,
      familyValues: wall.values,
    });
    expect(wallDocument.parts.find(part => part.id === 'carcass:left')?.geometry?.holes?.length).toBeGreaterThan(0);
    expect(wallDocument.parts.some(part => part.id.startsWith('mount:cleat:'))).toBe(true);
  });

  it('feeds every family through Design Health, shop docs, and manufacturing without renderer-derived identity', () => {
    for (const family of FAMILY_DEFINITIONS) {
      const starter = familyStarter(family.id);
      const document = buildFamilyCabinetDocument(starter.parameters, starter.name, 'mm', {
        family: starter.family,
        starterId: starter.id,
        familyValues: starter.values,
      });
      const health = analyzeDesignHealth(document, { kernelStatus: 'ready' });
      const docs = buildShopDocumentation(document, health);
      const manufacturing = buildManufacturingModel(document, docs, health);

      expect(docs.bom.length, family.id).toBeGreaterThan(0);
      expect(new Set(docs.bom.map(row => row.partNumber)).size, family.id).toBe(docs.bom.length);
      expect(manufacturing.parts.length, family.id).toBe(docs.bom.length);
      expect(manufacturing.parts.every(part => part.metadata.coordinateSystem === 'part-local'), family.id).toBe(true);
    }
  });
});
