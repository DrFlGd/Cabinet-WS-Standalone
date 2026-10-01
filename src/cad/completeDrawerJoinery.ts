import type { CabinetParameters, CadPart, FamilyRecipeValues } from './types';
import { joinPanels } from './panelJoinery';
import { valueNumber } from './joineryPolicy';

/** Shared completion pass for dedicated drawers and every cabinet drawer box. */
export function completeDrawerJoinery(parts: CadPart[], p: CabinetParameters, values: FamilyRecipeValues) {
  for (const left of parts.filter(part => /:box:left$/.test(part.id))) {
    const prefix = left.id.slice(0, -':box:left'.length);
    const right = parts.find(part => part.id === prefix + ':box:right')!;
    const front = parts.find(part => part.id === prefix + ':box:front')!;
    const back = parts.find(part => part.id === prefix + ':box:back')!;
    const bottom = parts.find(part => part.id === prefix + ':box:bottom' || part.id === prefix + ':bottom')!;
    if (!right || !front || !back || !bottom) continue;
    const walls = [left, right, front, back];
    // A captured bottom must physically enter all four grooves. Previously the
    // dedicated drawer left it flush with the inside faces and mirrored neither
    // the left groove nor the front groove.
    if (p.drawerBottomStyle === 'captured' || values.drawer_bottom_joinery === 'dado') {
      const depth = Math.min(left.size.x - .5, Math.max(.1, valueNumber(values, 'drawer_bottom_dado_depth', p.drawerBottomGrooveDepth)));
      const clearance = p.drawerDadoFitClearance;
      const lowX = left.position.x + left.size.x - depth, highX = right.position.x + depth;
      const lowY = front.position.y + front.size.y - depth, highY = back.position.y + depth;
      bottom.position.x = lowX; bottom.size.x = highX - lowX;
      bottom.position.y = lowY; bottom.size.y = highY - lowY;
      // Retain the existing shared-cabinet inset unless the recipe supplies it.
      const oldInset = bottom.position.z - left.position.z;
      bottom.position.z = left.position.z + valueNumber(values, 'drawer_bottom_inset', oldInset);
      for (const wall of walls) {
        wall.renderFeatures = (wall.renderFeatures ?? []).filter(f => f.sourcePartId !== bottom.id &&
          f.sourcePartId !== prefix + ':bottom' && f.sourcePartId !== prefix + ':box:bottom');
        const axis = wall === left || wall === right ? 'x' : 'y';
        const pos = { ...bottom.position }, size = { ...bottom.size };
        if (wall === left) { pos.x = lowX; size.x = depth; }
        if (wall === right) { pos.x = right.position.x; size.x = depth; }
        if (wall === front) { pos.y = lowY; size.y = depth; }
        if (wall === back) { pos.y = back.position.y; size.y = depth; }
        const span = axis === 'x' ? 'y' : 'x';
        pos[span] -= clearance / 2; size[span] += clearance;
        pos.z -= clearance / 2; size.z += clearance;
        wall.renderFeatures.push({ kind: 'slot', axis, sourcePartId: bottom.id,
          position: { x: pos.x - wall.position.x, y: pos.y - wall.position.y, z: pos.z - wall.position.z }, size });
      }
    }
    completeDividers(parts, prefix, walls, bottom, values);
    if (p.drawerJoineryStyle === 'tab_slot') {
      joinPanels(walls, 'tab_slot', 0, p.drawerJointFitClearance, values,
        (receiver, member) => (receiver === left || receiver === right) && (member === front || member === back));
    }
  }
}


function completeDividers(parts: CadPart[], prefix: string, walls: CadPart[], bottom: CadPart, values: FamilyRecipeValues) {
  const [left, right, front, back] = walls;
  const existing = parts.filter(part => part.id.startsWith(prefix + ':organizer:') || part.id.startsWith(prefix + ':divider:'));
  if (!existing.length && !values.include_drawer_divider_grid) return;
  const floor = bottom.position.z + bottom.size.z;
  const nominal: Record<string, number> = { '1/8_nominal': 3.175, '1/4_nominal': 6.35, '3/8_nominal': 9.525, '1/2_nominal': 12.7, '5/8_nominal': 15.875, '3/4_nominal': 19.05 };
  const thickness = Math.max(.5, nominal[String(values.drawer_divider_stock)] ?? valueNumber(values, 'custom_drawer_divider_thickness', existing[0] ? Math.min(existing[0].size.x, existing[0].size.y) : 3));
  const height = Math.min(left.position.z + left.size.z - floor,
    valueNumber(values, 'drawer_divider_height', existing[0]?.size.z ?? 60));
  if (height <= 0) return;
  const inner = { x: right.position.x - left.position.x - left.size.x,
    y: back.position.y - front.position.y - front.size.y };
  const origin = { x: left.position.x + left.size.x, y: front.position.y + front.size.y };
  const dividers: CadPart[] = [];
  for (const axis of ['x', 'y'] as const) {
    const custom = values['drawer_divider_custom_' + axis];
    const countKey = axis === 'x' ? 'drawer_divider_columns' : 'drawer_divider_rows';
    const old = existing.filter(part => (part.metadata?.organizerAxis ?? part.metadata?.gridAxis) === axis);
    const cells = Math.max(1, Math.round(valueNumber(values, countKey, old.length + 1)));
    const clear = (inner[axis] - (cells - 1) * thickness) / cells;
    const centers = values.drawer_divider_layout_mode === 'custom_positions' && Array.isArray(custom)
      ? custom.filter((x): x is number => typeof x === 'number' && x >= thickness / 2 && x <= inner[axis] - thickness / 2)
      : Array.from({ length: Math.max(0, cells - 1) }, (_, i) => (i + 1) * clear + i * thickness + thickness / 2);
    for (const [index, center] of centers.entries()) {
      const position = { ...origin, z: floor }, size = { ...inner, z: height };
      position[axis] += center - thickness / 2; size[axis] = thickness;
      dividers.push({ id: old[index]?.id ?? prefix + ':divider:' + axis + ':' + (index + 1),
        name: axis === 'x' ? 'Drawer Divider Column ' + (index + 1) : 'Drawer Divider Row ' + (index + 1),
        category: 'divider', position, size, color: left.color, material: `Drawer divider stock (${thickness} mm)`,
        visible: true, metadata: { gridAxis: axis, organizer: true } });
    }
  }
  for (const part of existing) parts.splice(parts.indexOf(part), 1);
  parts.push(...dividers);
  const mounting = values.drawer_divider_mounting;
  const clearance = Math.max(0, valueNumber(values, 'drawer_divider_groove_clearance', .2));
  if (mounting === 'bottom_only' || mounting === 'bottom_and_perimeter') {
    joinPanels([bottom, ...walls, ...dividers], 'dado', receiver => receiver === bottom
      ? valueNumber(values, 'drawer_divider_bottom_groove_depth', 2)
      : valueNumber(values, 'drawer_divider_perimeter_groove_depth', 2), clearance, values,
      (r, m) => dividers.includes(m) && (r === bottom || (mounting === 'bottom_and_perimeter' && walls.includes(r))));
  }
  const interlockClearance = Math.max(0, valueNumber(values, 'drawer_divider_interlock_clearance', .2));
  const longitudinalTop = values.drawer_divider_interlock_orientation !== 'transverse_top';
  for (const column of dividers.filter(d => d.metadata?.gridAxis === 'x')) {
    for (const row of dividers.filter(d => d.metadata?.gridAxis === 'y')) {
      for (const [part, other, top] of [[column, row, longitudinalTop], [row, column, !longitudinalTop]] as const) {
        const depth = Math.min(part.size.z, part.size.z / 2 + interlockClearance / 2);
        const axis = part === column ? 'x' : 'y', span = axis === 'x' ? 'y' : 'x';
        const position = { x: 0, y: 0, z: top ? part.size.z - depth : 0 }, size = { ...part.size, z: depth };
        position[span] = other.position[span] - part.position[span] - interlockClearance / 2;
        size[span] = other.size[span] + interlockClearance;
        part.renderFeatures = [...(part.renderFeatures ?? []), { kind: 'slot', axis, semanticRole: 'tab-outline',
          sourcePartId: other.id, position, size }];
      }
    }
  }
}
