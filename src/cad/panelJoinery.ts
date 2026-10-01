import type { CadPart, CadRenderFeature, FamilyRecipeValues, JoineryStyle, Vec3 } from './types';
import { tabSpans, valueNumber } from './joineryPolicy';

type Axis = keyof Vec3;
const axes: Axis[] = ['x', 'y', 'z'];
const end = (p: CadPart, a: Axis) => p.position[a] + p.size[a];
const normal = (p: CadPart): Axis => axes.reduce((a, b) => p.size[a] <= p.size[b] ? a : b);
type Joint = { receiver: CadPart; member: CadPart; axis: Axis; spanAxis: Axis; thicknessAxis: Axis;
  sign: -1 | 1; face: number; start: number; stop: number; depth: number; bands: { start: number; end: number }[] };

/** Resolve real panel contacts once, then apply both halves from the same joint.
 * All calculations use original assembly coordinates; cuts are converted to the
 * final expanded blank coordinates only after every joint has been resolved.
 */
export function joinPanels(parts: CadPart[], style: JoineryStyle, depth: number | ((receiver: CadPart) => number), clearance: number,
  values: FamilyRecipeValues = {}, allow: (receiver: CadPart, member: CadPart) => boolean = () => true) {
  if (style === 'butt') return;
  const originals = new Map(parts.map(p => [p.id, { ...p, position: { ...p.position }, size: { ...p.size } }]));
  const cuts = new Map<string, CadRenderFeature[]>();
  const joints: Joint[] = [];
  const cut = (p: CadPart, f: CadRenderFeature) => cuts.set(p.id, [...(cuts.get(p.id) ?? []), f]);
  for (const receiver of parts) for (const member of parts) {
    if (receiver === member || !allow(receiver, member)) continue;
    const r = originals.get(receiver.id)!, m = originals.get(member.id)!;
    const axis = normal(r), thicknessAxis = normal(m);
    if (axis === thicknessAxis || m.geometry) continue;
    const spanAxis = axes.find(a => a !== axis && a !== thicknessAxis)!;
    const start = Math.max(r.position[spanAxis], m.position[spanAxis]);
    const stop = Math.min(end(r, spanAxis), end(m, spanAxis));
    if (stop - start < 1 || Math.min(end(r, thicknessAxis), end(m, thicknessAxis)) -
      Math.max(r.position[thicknessAxis], m.position[thicknessAxis]) < .1) continue;
    // Fixed shelves formerly had a 2 mm assembly gap on each end. Adjustable
    // shelves are excluded by the caller and retain that removal clearance.
    const tolerance = member.category === 'shelf' ? 2.01 : .01;
    let sign: -1 | 1, face: number;
    if (Math.abs(m.position[axis] - end(r, axis)) <= tolerance) { sign = -1; face = end(r, axis); }
    else if (Math.abs(end(m, axis) - r.position[axis]) <= tolerance) { sign = 1; face = r.position[axis]; }
    else continue;
    const location = member.id === 'carcass:bottom' ? 'bottom' : member.id.startsWith('carcass:top') ? 'top'
      : member.category === 'shelf' ? 'shelf' : member.category === 'divider' ? 'separator' : 'default';
    const bands = style === 'tab_slot' ? tabSpans(stop - start, values, location).map(s => ({ start: s.start + start, end: s.end + start }))
      : [{ start, end: stop }];
    joints.push({ receiver, member, axis, thicknessAxis, spanAxis, sign, face, start, stop,
      depth: style === 'tab_slot' ? r.size[axis] : Math.min(Math.max(.1, typeof depth === 'number' ? depth : depth(receiver)), Math.max(.1, r.size[axis] - .5)), bands });
  }

  for (const j of joints) {
    const { receiver, member, axis, spanAxis, thicknessAxis, face, sign } = j;
    const r = originals.get(receiver.id)!, m = originals.get(member.id)!;
    if (style === 'screw') {
      const span = j.stop - j.start;
      const margin = Math.min(valueNumber(values, 'butt_registration_edge_margin', 35), Math.max(6, span * .25));
      const count = Math.max(1, Math.round(span / Math.max(1, valueNumber(values, 'butt_registration_target_spacing', 180))));
      const diameter = Math.max(.1, valueNumber(values, 'butt_registration_hole_diameter', 4));
      for (let i = 0; i < count; i++) {
        const pos = { ...r.position }, size = { x: diameter, y: diameter, z: diameter };
        pos[spanAxis] = j.start + margin + (span - 2 * margin) * (i + .5) / count - diameter / 2;
        pos[thicknessAxis] = m.position[thicknessAxis] + m.size[thicknessAxis] / 2 - diameter / 2;
        size[axis] = r.size[axis];
        cut(receiver, { kind: 'drill', axis, sourcePartId: member.id, position: pos, size });
      }
      continue;
    }
    const far = face + sign * j.depth;
    const low = Math.min(member.position[axis], far), high = Math.max(end(member, axis), far);
    member.position[axis] = low; member.size[axis] = high - low;
    for (const band of j.bands) {
      const pos = { ...m.position }, size = { ...m.size };
      pos[axis] = Math.min(face, far); size[axis] = j.depth;
      pos[spanAxis] = band.start - clearance / 2; size[spanAxis] = band.end - band.start + clearance;
      pos[thicknessAxis] -= clearance / 2; size[thicknessAxis] += clearance;
      cut(receiver, { kind: style === 'dado' ? 'dado' : 'slot', axis, sourcePartId: member.id, position: pos, size,
        ...(style === 'tab_slot' ? { semanticRole: 'tab-slot-receiver' as const, clearance } : {}) });
      if (style === 'tab_slot') addRelief(receiver, pos, size, axis, values, cut);
    }
    member.metadata = { ...member.metadata, matingJoinery: style, tabSlotMatingTabs: style === 'tab_slot' };
  }
  // Carve the expanded edge back everywhere except its mating bands. A member
  // can meet multiple receivers (e.g. both top stretchers); combine their bands.
  const groups = new Map<string, Joint[]>();
  for (const j of joints.filter(() => style !== 'screw')) {
    const key = `${j.member.id}/${j.axis}/${j.sign}`;
    groups.set(key, [...(groups.get(key) ?? []), j]);
  }
  for (const group of groups.values()) {
    const j = group[0], m = originals.get(j.member.id)!, member = j.member;
    const bands = group.flatMap(g => g.bands).sort((a, b) => a.start - b.start);
    let cursor = member.position[j.spanAxis];
    const gap = (start: number, stop: number) => {
      if (stop - start < 1e-6) return;
      const pos = { ...member.position }, size = { ...member.size };
      pos[j.spanAxis] = start; size[j.spanAxis] = stop - start;
      if (j.sign < 0) size[j.axis] = m.position[j.axis] - member.position[j.axis];
      else { pos[j.axis] = end(m, j.axis); size[j.axis] = end(member, j.axis) - end(m, j.axis); }
      cut(member, { kind: 'slot', axis: j.thicknessAxis, sourcePartId: j.receiver.id, position: pos, size,
        ...(style === 'tab_slot' ? { semanticRole: 'tab-outline' as const } : {}) });
    };
    for (const b of bands) { gap(cursor, b.start); cursor = Math.max(cursor, b.end); }
    gap(cursor, end(member, j.spanAxis));
  }
  for (const p of parts) {
    const old = originals.get(p.id)!;
    p.renderFeatures = [
      ...(p.renderFeatures ?? []).map(f => ({ ...f, position: Object.fromEntries(axes.map(a => [a, f.position[a] + old.position[a] - p.position[a]])) as Vec3 })),
      ...(cuts.get(p.id) ?? []).map(f => ({ ...f, position: Object.fromEntries(axes.map(a => [a, f.position[a] - p.position[a]])) as Vec3 })),
    ];
  }
}

function addRelief(receiver: CadPart, pos: Vec3, size: Vec3, axis: Axis, values: FamilyRecipeValues,
  cut: (p: CadPart, f: CadRenderFeature) => unknown) {
  const material = receiver.category === 'drawer' ? 'drawer' : receiver.category === 'divider' ? 'divider' : 'carcass';
  const mode = values[material + '_slot_corner_relief'];
  const relief = !mode || mode === 'inherit' ? values.slot_corner_relief : mode;
  if (relief !== 'dogbone' && !['t_bone', 'tbone', 't-bone'].includes(String(relief))) return;
  const configured = valueNumber(values, material + '_cnc_tool_diameter', 0);
  const diameter = configured > 0 ? configured : valueNumber(values, 'cnc_tool_diameter', 0);
  if (diameter <= 0) return;
  const [u, v] = axes.filter(a => a !== axis), radius = diameter / 2;
  for (const i of [0, 1]) for (const k of [0, 1]) {
    const cu = pos[u] + i * size[u], cv = pos[v] + k * size[v];
    if (cu <= receiver.position[u] || cu >= end(receiver, u) || cv <= receiver.position[v] || cv >= end(receiver, v)) continue;
    const du = relief === 'dogbone' ? radius / Math.sqrt(2) : size[u] >= size[v] ? radius : 0;
    const dv = relief === 'dogbone' ? radius / Math.sqrt(2) : size[v] > size[u] ? radius : 0;
    const p = { ...pos }, s = { ...size };
    p[u] = cu + (i ? -du : du) - radius; p[v] = cv + (k ? -dv : dv) - radius;
    s[u] = diameter; s[v] = diameter;
    cut(receiver, { kind: 'drill', axis, position: p, size: s });
  }
}
