import { familyFieldDefinitions, familyFieldInactiveReason, familyFieldValue } from '../cad/familySettings';
import { isLayoutSetting } from '../cad/cabinetSettings';
import type { CabinetFamily, FamilyRecipeValues, JsonValue } from '../cad/types';
import type { DisplayUnits } from '../cad/units';
import FamilyFieldControl from './FamilyFieldControl';

// The visual editor owns counts and sections. Preserve recipe-specific layout
// inputs here instead of exposing a second arrangement editor in Settings.
export function recipeLayoutFields(family: CabinetFamily) {
  const shared = new Set(['cabinet_layout_mode', 'section_nodes', 'cabinet_contents', 'drawer_count', 'door_count',
    'door_shelf_count', 'drawer_height_mode', 'drawer_height_weights', 'drawer_graduated_step']);
  return familyFieldDefinitions(family).filter(field => isLayoutSetting(field.key) && !shared.has(field.key));
}

export default function FamilyLayoutOptions({ family, values, units, onChange }: {
  family: CabinetFamily; values: FamilyRecipeValues; units: DisplayUnits;
  onChange: (key: string, value: JsonValue) => void;
}) {
  const fields = recipeLayoutFields(family).filter(field => !familyFieldInactiveReason(family, field, values));
  if (!fields.length) return null;
  return <details className="recipe-layout-options">
    <summary>Family layout options</summary>
    <p>Recipe-specific module and bank arrangements. Use the visual editor for individual sections.</p>
    {fields.map(field => <FamilyFieldControl key={field.key} field={field} value={familyFieldValue(values, field)}
      inactiveReason={null} displayUnits={units} onChange={value => onChange(field.key, value)} onOpenManualLayout={() => undefined} />)}
  </details>;
}
