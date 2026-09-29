import { describe, expect, it } from 'vitest';
import { allFamilyStarters, familyStarter, parametersFromFamilyValues } from './familyCatalog';
import { completeFamilyValues, editFamilySetting, syncFamilyValuesFromParameters } from './familySettings';
import { buildFamilyCabinetDocument } from './familyModel';
import { parseDocument, serializeDocument } from './documentIO';
import { createHistoryState, historyReducer, type EditorDocument } from '../editor/history';
import type { CabinetFamily, FamilyRecipeValues } from './types';

function documentFor(family: CabinetFamily, values: FamilyRecipeValues): EditorDocument {
  return { family, starterId: null, familyValues: values, parameters: parametersFromFamilyValues(family, values), name: 'Regression', displayUnits: 'in' };
}
function familyEdit(doc: EditorDocument, key: string, value: string | number) {
  return { ...doc, ...editFamilySetting(doc.family, doc.familyValues, doc.parameters, key, value) };
}
function reopen(doc: EditorDocument): EditorDocument {
  return parseDocument(serializeDocument(buildFamilyCabinetDocument(doc.parameters, doc.name, doc.displayUnits, doc)));
}

describe('edit/save reliability', () => {
  it('preserves every starter recipe and native geometry across repeated save/reopen', () => {
    for (const starter of allFamilyStarters()) {
      const before = documentFor(starter.family, completeFamilyValues(starter.family, starter.values));
      const loaded = reopen(reopen(before));
      expect(loaded.parameters, starter.id).toEqual(before.parameters);
      expect(loaded.familyValues, starter.id).toEqual(before.familyValues);
      const original = buildFamilyCabinetDocument(before.parameters, before.name, before.displayUnits, before);
      const restored = buildFamilyCabinetDocument(loaded.parameters, loaded.name, loaded.displayUnits, loaded);
      expect(restored.parts, starter.id).toEqual(original.parts);
      expect(restored.hardware, starter.id).toEqual(original.hardware);
    }
  });

  it.each(['shop_cart', 'utility', 'benchtop', 'stackable', 'kitchen', 'drawer', 'equipment_stand'] as const)(
    'preserves native edits, units, save/reopen and undo/redo through family edits: %s', family => {
      const starter = familyStarter(family);
      let doc = documentFor(family, completeFamilyValues(family, starter.values));
      const field = family === 'equipment_stand' ? 'tray_thickness' : 'drawer_gap';
      const originalValue = Number(doc.familyValues[field] ?? 3);
      doc = familyEdit(doc, field, originalValue + 1);
      const parameters = { ...doc.parameters, width: doc.parameters.width + 27.5, shelfPositions: [0.23, 0.67] };
      doc = { ...doc, parameters, familyValues: syncFamilyValuesFromParameters(family, doc.familyValues, parameters) };
      const loaded = reopen(doc);
      expect(loaded.parameters).toEqual(doc.parameters);
      expect(loaded.displayUnits).toBe('in');
      let history = createHistoryState(loaded);
      history = historyReducer(history, { type: 'edit', now: 1000, apply: current => familyEdit(current, field, originalValue + 2) });
      expect(history.present.parameters.width).toBe(parameters.width);
      expect(history.present.parameters.shelfPositions).toEqual(parameters.shelfPositions);
      const edited = history.present;
      history = historyReducer(history, { type: 'undo' });
      expect(history.present).toEqual(createHistoryState(loaded).present);
      history = historyReducer(history, { type: 'redo' });
      expect(history.present).toEqual(edited);
      expect(reopen(history.present).parameters).toEqual(history.present.parameters);
    },
  );

  it('keeps Simple layout after switching from sections and editing a family field', () => {
    const starter = familyStarter('kitchen', 'photo_section_cabinet');
    let doc = documentFor('kitchen', starter.values);
    const parameters = { ...doc.parameters, layoutMode: 'legacy' as const };
    doc = { ...doc, parameters, familyValues: syncFamilyValuesFromParameters(doc.family, doc.familyValues, parameters) };
    expect(doc.familyValues.cabinet_layout_mode).toBe('legacy');
    expect(familyEdit(reopen(doc), 'drawer_gap', 4).parameters.layoutMode).toBe('legacy');
  });

  it.each(['inside_clear', 'modular_grid', 'outside_box', 'enclosure'])(
    'round-trips native drawer resize from %s sizing', basis => {
      const values = { ...familyStarter('drawer').values, drawer_design_basis: basis, drawer_face_style: 'inset_flush', drawer_back_clearance: 8 };
      const doc = documentFor('drawer', values);
      const parameters = { ...doc.parameters, width: doc.parameters.width + 20, depth: doc.parameters.depth + 13, height: doc.parameters.height + 7 };
      const synced = syncFamilyValuesFromParameters('drawer', values, parameters);
      const rebuilt = parametersFromFamilyValues('drawer', synced);
      for (const key of ['width', 'height', 'depth'] as const) expect(rebuilt[key]).toBeCloseTo(parameters[key]);
      expect(synced.drawer_design_basis).toBe(basis === 'modular_grid' ? 'outside_box' : basis);
    },
  );

  it('preserves segmented frame depth on repeated sync and unrelated edits', () => {
    const values = { ...familyStarter('kitchen').values, front_facing_style: 'face_frame', face_frame_construction: 'segmented_back_dado', face_frame_back_dado_depth: 6 };
    const doc = documentFor('kitchen', values);
    const parameters = { ...doc.parameters, depth: doc.parameters.depth + 35 };
    const familyValues = syncFamilyValuesFromParameters('kitchen', values, parameters);
    const loaded = reopen({ ...doc, familyValues, parameters });
    expect(parametersFromFamilyValues('kitchen', loaded.familyValues).depth).toBeCloseTo(parameters.depth);
    expect(familyEdit(loaded, 'drawer_gap', 4).parameters.depth).toBeCloseTo(parameters.depth);
  });

  it('switches equipment sizing to manual on native envelope edits', () => {
    const values = { ...familyStarter('equipment_stand').values, sizing_mode: 'equipment' };
    const doc = documentFor('equipment_stand', values);
    const parameters = { ...doc.parameters, width: doc.parameters.width + 20 };
    const synced = syncFamilyValuesFromParameters('equipment_stand', values, parameters);
    expect(synced.sizing_mode).toBe('manual');
    const rebuilt = parametersFromFamilyValues('equipment_stand', synced);
    for (const key of ['width', 'height', 'depth'] as const) expect(rebuilt[key]).toBe(parameters[key]);
  });

  it('retains measured drawer and face-frame thickness after native edits', () => {
    const values = completeFamilyValues('kitchen', familyStarter('kitchen').values);
    const doc = documentFor('kitchen', values);
    const parameters = { ...doc.parameters, drawerMaterialThickness: 14.25, faceFrameThickness: 20.5 };
    const familyValues = syncFamilyValuesFromParameters('kitchen', values, parameters);
    const adapted = parametersFromFamilyValues('kitchen', familyValues);
    expect(adapted.drawerMaterialThickness).toBe(14.25);
    expect(adapted.faceFrameThickness).toBe(20.5);
  });

  it.each(['fill_opening', 'inside_clear', 'target_box'])(
    'inverts enclosure height mode %s with wood runners', mode => {
      const values = { ...familyStarter('drawer').values, drawer_design_basis: 'enclosure', enclosure_height_mode: mode, drawer_mount: 'wood_rails', wood_rail_thickness: 12, wood_rail_side_clearance: 1.5 };
      const doc = documentFor('drawer', values);
      const parameters = { ...doc.parameters, width: doc.parameters.width + 11, height: doc.parameters.height + 9 };
      const rebuilt = parametersFromFamilyValues('drawer', syncFamilyValuesFromParameters('drawer', values, parameters));
      expect(rebuilt.width).toBe(parameters.width);
      expect(rebuilt.height).toBe(parameters.height);
    },
  );

  it('does not share mutable section/array state with history snapshots', () => {
    const starter = familyStarter('kitchen', 'photo_section_cabinet');
    const doc = documentFor('kitchen', starter.values);
    const state = createHistoryState(doc);
    const edited = historyReducer(state, { type: 'edit', now: 1, apply: current => {
      current.parameters.sectionNodes[0][4] = 123;
      current.parameters.shelfPositions.push(0.5);
      return current;
    } });
    expect(state.present.parameters).toEqual(doc.parameters);
    expect(historyReducer(edited, { type: 'undo' }).present.parameters).toEqual(doc.parameters);
  });
});
