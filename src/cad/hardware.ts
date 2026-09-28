import { hardwareDefinition } from './hardwareCatalog';
import type {
  CabinetParameters,
  CadPart,
  HardwareDefinition,
  HardwareInstance,
  Vec3,
} from './types';

const hardwareColor = '#46545a';

export function hasDrawerContent(parameters: CabinetParameters) {
  if (parameters.layoutMode === 'sections') {
    return parameters.sectionNodes.some(node => node[2] === 'leaf' && node[5] === 'drawers' && node[6] > 0);
  }
  return parameters.cabinetContents !== 'doors' && parameters.drawerCount > 0;
}

export function hasDoorContent(parameters: CabinetParameters) {
  if (parameters.layoutMode === 'sections') {
    return parameters.sectionNodes.some(node => node[2] === 'leaf' && node[5] === 'doors' && node[6] > 0);
  }
  return parameters.cabinetContents !== 'drawers' && parameters.doorCount > 0;
}

export function buildHardwareInstances(parts: CadPart[], parameters: CabinetParameters): HardwareInstance[] {
  const hardware: HardwareInstance[] = [];

  if (parameters.drawerMount === 'metal_slides' && hasDrawerContent(parameters)) {
    const definition = hardwareDefinition(parameters.drawerSlideId);
    const drawerSides = parts.filter(part => part.category === 'drawer' && /:box:(left|right)$/.test(part.id));

    for (const drawerSide of drawerSides) {
      const side = drawerSide.id.endsWith(':left') ? 'left' : 'right';
      const clearance = Math.max(3, parameters.metalSlideClearancePerSide);
      const length = Math.min(
        parameters.metalSlideLength,
        Math.max(60, drawerSide.size.y - parameters.metalSlideFrontSetback),
      );
      const height = Math.min(parameters.metalSlideEnvelopeHeight, Math.max(12, drawerSide.size.z - 4));
      const x = side === 'left'
        ? drawerSide.position.x - clearance
        : drawerSide.position.x + drawerSide.size.x;
      const z = drawerSide.position.z + Math.max(2, (drawerSide.size.z - height) / 2);
      const position = {
        x,
        y: drawerSide.position.y + parameters.metalSlideFrontSetback,
        z,
      };
      const size = { x: clearance, y: length, z: height };
      const mountingPart = nearestCabinetMount(parts, drawerSide, side);

      hardware.push(makeInstance({
        id: `hardware:slide:${drawerSide.id}`,
        definition,
        fallbackDefinitionId: parameters.drawerSlideId || 'custom-metal-slide',
        category: 'drawer_slide',
        fallbackLabel: 'Custom metal drawer slide',
        fallbackManufacturer: 'Custom',
        fallbackModel: `${parameters.metalSlideLength} mm`,
        position,
        size,
        mountingPartId: mountingPart?.id ?? 'cabinet',
        mountingFace: side === 'left' ? 'right' : 'left',
        parameters,
      }));
    }
  }

  if (parameters.hingeStyle === 'euro_35mm' && hasDoorContent(parameters)) {
    const definition = hardwareDefinition(parameters.hingeId);
    const doors = parts.filter(part => part.category === 'front' && /door:\d+$/.test(part.id));

    for (const door of doors) {
      const hingeCount = door.size.z > 1500 ? 4 : door.size.z > 900 ? 3 : 2;
      const hingeOnLeft = door.position.x + door.size.x / 2 <= parameters.width / 2;
      const edgeX = hingeOnLeft
        ? door.position.x + Math.min(parameters.hingeCupCenterFromDoorEdge, door.size.x / 3)
        : door.position.x + door.size.x - Math.min(parameters.hingeCupCenterFromDoorEdge, door.size.x / 3);
      const topMargin = Math.min(110, Math.max(70, door.size.z * 0.14));
      const usable = Math.max(0, door.size.z - 2 * topMargin);

      for (let index = 0; index < hingeCount; index += 1) {
        const zCenter = door.position.z + topMargin + (hingeCount === 1 ? usable / 2 : usable * index / (hingeCount - 1));
        const size = {
          x: Math.max(40, parameters.hingeCupDiameter + 10),
          y: Math.max(12, parameters.hingeCupDepth + 4),
          z: 24,
        };
        const position = {
          x: edgeX - size.x / 2,
          y: door.position.y + Math.max(0, door.size.y - size.y),
          z: zCenter - size.z / 2,
        };
        const mountingPart = nearestCabinetMount(parts, door, hingeOnLeft ? 'left' : 'right');

        hardware.push(makeInstance({
          id: `hardware:hinge:${door.id}:${index + 1}`,
          definition,
          fallbackDefinitionId: parameters.hingeId || 'custom-euro-35mm',
          category: 'hinge',
          fallbackLabel: 'Custom 35 mm concealed hinge',
          fallbackManufacturer: 'Custom',
          fallbackModel: `${parameters.hingeCupDiameter} mm cup`,
          position,
          size,
          mountingPartId: mountingPart?.id ?? 'cabinet',
          mountingFace: hingeOnLeft ? 'right' : 'left',
          parameters,
        }));
      }
    }
  }

  return hardware;
}

function makeInstance(args: {
  id: string;
  definition: HardwareDefinition | null;
  fallbackDefinitionId: string;
  category: HardwareInstance['category'];
  fallbackLabel: string;
  fallbackManufacturer: string;
  fallbackModel: string;
  position: Vec3;
  size: Vec3;
  mountingPartId: string;
  mountingFace: string;
  parameters: CabinetParameters;
}): HardwareInstance {
  const definition = args.definition;
  // Hardware presets are one-time patches. After application, the editable cabinet
  // parameters remain authoritative so users can tune a verified/reference preset.
  const drilling = args.category === 'drawer_slide'
    ? {
        enabled: args.parameters.includeMetalSlideHoles && args.parameters.hardwareDrillingMode !== 'off',
        cabinetHolesX: [...args.parameters.metalSlideCabinetHolesX],
        drawerHolesX: [...args.parameters.metalSlideDrawerHolesX],
        cabinetHoleDiameter: args.parameters.metalSlideCabinetHoleDiameter,
        drawerHoleDiameter: args.parameters.metalSlideDrawerHoleDiameter,
        cabinetHoleZFromDrawerBottom: args.parameters.metalSlideCabinetHoleZFromDrawerBottom,
        drawerHoleZFromDrawerBottom: args.parameters.metalSlideDrawerHoleZFromDrawerBottom,
      }
    : {
        enabled: true,
        doorFixingEnabled: args.parameters.hingeDoorFixingEnabled,
        doorFixingHoleDiameter: args.parameters.hingeDoorFixingHoleDiameter,
        doorFixingHoleSpacing: args.parameters.hingeDoorFixingHoleSpacing,
        plateHolesEnabled: args.parameters.hingePlateHolesEnabled,
        plateHoleDiameter: args.parameters.hingePlateHoleDiameter,
        plateCenterFromFront: args.parameters.hingePlateCenterFromFront,
        plateHoleSpacing: args.parameters.hingePlateHoleSpacing,
      };

  return {
    id: args.id,
    definitionId: definition?.id ?? args.fallbackDefinitionId,
    category: args.category,
    manufacturer: definition?.manufacturer ?? args.fallbackManufacturer,
    model: definition?.model ?? args.fallbackModel,
    label: definition?.label ?? args.fallbackLabel,
    position: args.position,
    size: args.size,
    mountingReference: {
      partId: args.mountingPartId,
      face: args.mountingFace,
    },
    keepout: {
      position: {
        x: args.position.x - 2,
        y: args.position.y - 2,
        z: args.position.z - 2,
      },
      size: {
        x: args.size.x + 4,
        y: args.size.y + 4,
        z: args.size.z + 4,
      },
    },
    drilling,
    verificationStatus: definition?.verification.status ?? 'custom',
  };
}

function nearestCabinetMount(parts: CadPart[], target: CadPart, side: 'left' | 'right') {
  const targetX = side === 'left' ? target.position.x : target.position.x + target.size.x;
  const candidates = parts.filter(part =>
    (part.category === 'carcass' || part.category === 'divider') &&
    part.size.z > target.size.z * 0.45 &&
    rangesOverlap(part.position.z, part.position.z + part.size.z, target.position.z, target.position.z + target.size.z)
  );

  return candidates
    .map(part => {
      const faceX = side === 'left' ? part.position.x + part.size.x : part.position.x;
      const directionValid = side === 'left' ? faceX <= targetX + 4 : faceX >= targetX - 4;
      return { part, distance: directionValid ? Math.abs(faceX - targetX) : Number.POSITIVE_INFINITY };
    })
    .sort((a, b) => a.distance - b.distance)[0]?.part ?? null;
}

function rangesOverlap(a0: number, a1: number, b0: number, b1: number) {
  return Math.max(a0, b0) <= Math.min(a1, b1);
}

export function hardwareParts(instances: HardwareInstance[]): CadPart[] {
  return instances.map(instance => ({
    id: instance.id,
    name: instance.label,
    category: 'hardware',
    material: `Purchased hardware · ${instance.manufacturer}`,
    position: { ...instance.position },
    size: { ...instance.size },
    color: hardwareColor,
    visible: true,
    metadata: {
      definitionId: instance.definitionId,
      manufacturer: instance.manufacturer,
      model: instance.model,
      verification: instance.verificationStatus,
      mountingPart: instance.mountingReference.partId,
      mountingFace: instance.mountingReference.face,
    },
  }));
}

export function applyHardwareDrilling(
  parts: CadPart[],
  instances: HardwareInstance[],
  parameters: CabinetParameters,
) {
  for (const instance of instances) {
    if (instance.category === 'drawer_slide') applySlideDrilling(parts, instance, parameters);
    else applyHingeDrilling(parts, instance, parameters);
  }
}

function applySlideDrilling(parts: CadPart[], instance: HardwareInstance, parameters: CabinetParameters) {
  if (!instance.drilling.enabled || parameters.hardwareDrillingMode === 'off') return;

  const drawerSideId = instance.id.replace('hardware:slide:', '');
  const drawerSide = parts.find(part => part.id === drawerSideId);
  const cabinetMount = parts.find(part => part.id === instance.mountingReference.partId);
  const drawerHoles = instance.drilling.drawerHolesX ?? parameters.metalSlideDrawerHolesX;
  const cabinetHoles = instance.drilling.cabinetHolesX ?? parameters.metalSlideCabinetHolesX;
  const drawerDiameter = instance.drilling.drawerHoleDiameter ?? parameters.metalSlideDrawerHoleDiameter;
  const cabinetDiameter = instance.drilling.cabinetHoleDiameter ?? parameters.metalSlideCabinetHoleDiameter;
  const drawerZ = instance.drilling.drawerHoleZFromDrawerBottom ?? parameters.metalSlideDrawerHoleZFromDrawerBottom;
  const cabinetZ = instance.drilling.cabinetHoleZFromDrawerBottom ?? parameters.metalSlideCabinetHoleZFromDrawerBottom;

  if (drawerSide) {
    drawerSide.renderFeatures = [
      ...(drawerSide.renderFeatures ?? []),
      ...drawerHoles
        .filter(y => y >= 0 && y <= drawerSide.size.y)
        .map(y => ({
          kind: 'drill' as const,
          position: {
            x: drawerSide.id.endsWith(':left') ? -0.6 : Math.max(0, drawerSide.size.x - 0.6),
            y,
            z: Math.min(Math.max(0, drawerZ - drawerDiameter / 2), Math.max(0, drawerSide.size.z - drawerDiameter)),
          },
          size: { x: 1.2, y: drawerDiameter, z: drawerDiameter },
          color: '#26343a',
          opacity: 0.9,
        })),
    ];
  }

  if (cabinetMount) {
    appendMountDrilling(
      cabinetMount,
      cabinetHoles,
      cabinetDiameter,
      instance.position.z - cabinetMount.position.z + cabinetZ,
      instance.position.y - cabinetMount.position.y,
    );
  }
}

function applyHingeDrilling(parts: CadPart[], instance: HardwareInstance, parameters: CabinetParameters) {
  const idParts = instance.id.split(':');
  const doorId = idParts.slice(2, -1).join(':');
  const door = parts.find(part => part.id === doorId);
  if (!door) return;

  const cupDiameter = parameters.hingeCupDiameter;
  const cupDepth = Math.min(parameters.hingeCupDepth, Math.max(1, door.size.y - 0.5));
  const localX = instance.position.x + instance.size.x / 2 - door.position.x;
  const localZ = instance.position.z + instance.size.z / 2 - door.position.z;

  door.renderFeatures = [
    ...(door.renderFeatures ?? []),
    {
      kind: 'drill',
      position: {
        x: Math.max(0, localX - cupDiameter / 2),
        y: Math.max(0, door.size.y - cupDepth),
        z: Math.max(0, localZ - cupDiameter / 2),
      },
      size: {
        x: Math.min(cupDiameter, door.size.x),
        y: cupDepth + 0.6,
        z: Math.min(cupDiameter, door.size.z),
      },
      color: '#2e3940',
      opacity: 0.88,
    },
  ];

  const cabinetMount = parts.find(part => part.id === instance.mountingReference.partId);
  if (cabinetMount && parameters.hingePlateHolesEnabled) {
    const centerY = Math.min(cabinetMount.size.y - 5, Math.max(5, parameters.hingePlateCenterFromFront));
    const centerZ = instance.position.z + instance.size.z / 2 - cabinetMount.position.z;
    const halfPitch = parameters.hingePlateHoleSpacing / 2;
    appendMountDrilling(
      cabinetMount,
      [centerY - halfPitch, centerY + halfPitch],
      parameters.hingePlateHoleDiameter,
      centerZ,
      0,
    );
  }
}

function appendMountDrilling(
  part: CadPart,
  offsets: number[],
  diameter: number,
  zCenter: number,
  yBase: number,
) {
  if (part.geometry?.kind === 'extruded-profile' && part.geometry.axis === 'x') {
    const holes = part.geometry.holes ?? (part.geometry.holes = []);
    for (const offset of offsets) {
      const y = yBase + offset;
      if (y < diameter / 2 || y > part.size.y - diameter / 2) continue;
      const z = Math.min(
        part.size.z - diameter / 2,
        Math.max(diameter / 2, zCenter),
      );
      holes.push({ kind: 'circle', u: y, v: z, radius: diameter / 2 });
    }
    return;
  }

  part.renderFeatures = [
    ...(part.renderFeatures ?? []),
    ...offsets.map(offset => ({
      kind: 'drill' as const,
      position: {
        x: -0.6,
        y: Math.max(0, yBase + offset - diameter / 2),
        z: Math.max(0, zCenter - diameter / 2),
      },
      size: { x: 1.2, y: diameter, z: diameter },
      color: '#26343a',
      opacity: 0.9,
    })),
  ];
}

export type HardwareCompatibility = {
  level: 'error' | 'warning';
  message: string;
};

export function hardwareCompatibility(parameters: CabinetParameters): HardwareCompatibility[] {
  const issues: HardwareCompatibility[] = [];
  const slide = hardwareDefinition(parameters.drawerSlideId);
  const hinge = hardwareDefinition(parameters.hingeId);

  if (parameters.drawerMount === 'metal_slides') {
    if (!hasDrawerContent(parameters)) {
      issues.push({ level: 'warning', message: 'Metal drawer slides are selected but this layout has no drawers.' });
    }
    if (parameters.metalSlideLength + parameters.metalSlideFrontSetback > parameters.depth - 12) {
      issues.push({ level: 'error', message: 'Selected slide length exceeds the usable cabinet depth.' });
    }
    if (slide && !slide.targets.includes('utility')) {
      issues.push({ level: 'error', message: 'Selected drawer slide is not marked compatible with Utility cabinets.' });
    }
  }

  if (parameters.hingeStyle !== 'none') {
    if (!hasDoorContent(parameters)) {
      issues.push({ level: 'warning', message: 'A hinge is selected but this layout has no doors.' });
    }
    if (parameters.hingeCupDepth >= parameters.doorThickness) {
      issues.push({ level: 'error', message: 'Hinge cup depth would break through the current door stock.' });
    }
    if (hinge?.frontMountStyle && hinge.frontMountStyle !== parameters.frontMountStyle) {
      issues.push({
        level: 'warning',
        message: `Selected hinge preset targets ${hinge.frontMountStyle.replace('_', ' ')} fronts.`,
      });
    }
  }

  return issues;
}
