import type { FamilyRecipeValues } from './types';

export const valueNumber = (v: FamilyRecipeValues, key: string, fallback: number) =>
  typeof v[key] === 'number' && Number.isFinite(v[key]) ? v[key] as number : fallback;

/** OpenSCAD joinery.scad + core/resolve.scad tab spacing, in panel-local mm. */
export function tabSpans(span: number, v: FamilyRecipeValues = {}, location = 'default') {
  const margin = Math.min(valueNumber(v, 'joint_tab_edge_margin', 15), Math.max(2, span * .15));
  const requested = Math.max(.1, valueNumber(v, 'joint_tab_width', 35));
  const web = Math.max(0, valueNumber(v, 'minimum_joint_web', 30));
  const maxByWeb = Math.max(1, Math.floor((span - 2 * margin + web) / Math.max(.1, requested + web)));
  const count = Math.min(100, v.tab_count_mode === 'fixed'
    ? Math.max(1, Math.round(valueNumber(v, 'joint_tab_count', 3)))
    : Math.min(Math.max(1, valueNumber(v, 'max_auto_tab_count', 6)), maxByWeb,
      Math.max(1, Math.round(span / Math.max(1, valueNumber(v, 'target_tab_spacing', 180))))));
  const width = Math.min(requested, Math.max(6, (span - 2 * margin - (count - 1) * web) / count));
  const placement = v.edge_joinery_policy === 'legacy' && !(location === 'bottom' && v.stackable_mode)
    ? 'automatic' : v[location + '_tab_placement'];
  const custom = v[location + '_tab_custom_centers'];
  let centers = Array.from({ length: count }, (_, i) => margin + (span - 2 * margin) * (i + .5) / count);
  if (placement === 'edge_biased') {
    const a = margin + width / 2, b = span - margin - width / 2;
    centers = centers.map((_, i) => count <= 1 || b <= a ? span / 2 : a + (b - a) * i / (count - 1));
  }
  if (placement === 'custom' && Array.isArray(custom)) {
    const valid = custom.filter((x): x is number => typeof x === 'number' && x >= width / 2 && x <= span - width / 2);
    if (valid.length) centers = valid;
  }
  if (location === 'bottom' && v.stackable_mode && placement === 'stack_safe') {
    const t = valueNumber(v, 'material_thickness', 19.05);
    const frontRequested = valueNumber(v, 'stack_interface_front_margin', 60);
    const rearRequested = valueNumber(v, 'stack_interface_back_margin', 60);
    const front = Math.min(Math.max(t, frontRequested), Math.max(t, span - t - rearRequested - 20));
    const rear = Math.min(Math.max(t, rearRequested), Math.max(t, span - t - front - 20));
    const mode = v.carcass_slot_corner_relief === 'inherit' || !v.carcass_slot_corner_relief
      ? v.slot_corner_relief : v.carcass_slot_corner_relief;
    const tool = valueNumber(v, 'carcass_cnc_tool_diameter', 0) || valueNumber(v, 'cnc_tool_diameter', 0);
    const web = Math.max(1, valueNumber(v, 'joint_fit_clearance', .2) / 2 +
      (['dogbone', 't_bone', 'tbone', 't-bone'].includes(String(mode)) ? tool / 2 : 0));
    if (front >= width + 2 * web && rear >= width + 2 * web) {
      const edge = (pad: number) => Math.min(Math.max(pad / 2, width / 2 + web), Math.max(width / 2 + web, pad - width / 2 - web));
      centers = centers.map((_, i) => count <= 1 ? span / 2 : edge(front) + (span - edge(rear) - edge(front)) * i / (count - 1));
    }
  }
  // Union overlapping requested tabs; never emit self-intersecting cut profiles.
  const result: { start: number; end: number }[] = [];
  for (const c of centers.sort((a, b) => a - b)) {
    const start = Math.max(0, c - width / 2), end = Math.min(span, c + width / 2);
    const last = result.at(-1);
    if (last && start <= last.end) last.end = Math.max(last.end, end);
    else if (end > start) result.push({ start, end });
  }
  return result;
}
