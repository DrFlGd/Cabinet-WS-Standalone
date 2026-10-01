import type {
  ManufacturingGeometry,
  ManufacturingModel,
  ManufacturingOperation,
  ManufacturingOperationKind,
  ManufacturingPart,
  Point2,
} from './manufacturing';
import type { BomRow, ShopDocumentation } from './shopDocs';

export type SheetGrainAxis = 'x' | 'y' | 'none';
export type PartGrainAxis = 'u' | 'v' | 'none';
export type PlacementRotation = 0 | 90;

export type StockRemnant = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
};

export type SheetStockDefinition = {
  id: string;
  material: string;
  thicknessMm: number;
  widthMm: number;
  heightMm: number;
  grainAxis: SheetGrainAxis;
  marginMm: number;
  quantity: number | null;
  remnants: StockRemnant[];
};

export type NestingSettings = {
  partSpacingMm: number;
  kerfMm: number;
  toolDiameterMm: number;
  allowRotation: boolean;
  preferRemnants: boolean;
};

export type ProductionConfiguration = {
  settings: NestingSettings;
  stocks: SheetStockDefinition[];
  toolLibrary: ToolDefinition[];
  machineProfile: MachineProfile;
  postprocessor: PostprocessorContract;
};

export type NestPlacement = {
  id: string;
  sheetId: string;
  stockDefinitionId: string;
  partId: string;
  partNumber: string;
  material: string;
  thicknessMm: number;
  xMm: number;
  yMm: number;
  rotationDeg: PlacementRotation;
  widthMm: number;
  heightMm: number;
  sourceWidthMm: number;
  sourceHeightMm: number;
  grainAxis: PartGrainAxis;
  operationIds: string[];
};

export type NestedSheet = {
  id: string;
  label: string;
  stockDefinitionId: string;
  source: 'sheet' | 'remnant';
  sourceId: string;
  material: string;
  thicknessMm: number;
  widthMm: number;
  heightMm: number;
  grainAxis: SheetGrainAxis;
  marginMm: number;
  placements: NestPlacement[];
  usedAreaMm2: number;
  usableAreaMm2: number;
  utilization: number;
  svg: string;
  dxf: string;
  registrationJson: string;
};

export type UnplacedPart = {
  stockDefinitionId: string | null;
  partId: string;
  partNumber: string;
  material: string;
  thicknessMm: number;
  widthMm: number;
  heightMm: number;
  reason: string;
};

export type ProductionPlan = {
  version: 1;
  signature: string;
  manufacturingSignature: string;
  settings: NestingSettings;
  stocks: SheetStockDefinition[];
  sheets: NestedSheet[];
  unplaced: UnplacedPart[];
  placementCount: number;
  sheetCount: number;
  remnantCount: number;
  totalUsedAreaMm2: number;
  totalUsableAreaMm2: number;
  overallUtilization: number;
};

export type ToolKind = 'router' | 'drill' | 'engraver';

export type ToolDefinition = {
  id: string;
  label: string;
  kind: ToolKind;
  diameterMm: number;
  supportedOperations: ManufacturingOperationKind[];
};

export type MachineProfile = {
  id: string;
  label: string;
  units: 'mm';
  origin: 'lower-left';
  workAreaMm: { x: number; y: number; z: number };
  safeZMm: number;
  supportedOperations: ManufacturingOperationKind[];
  postprocessorId: string;
};

export type PostprocessorContract = {
  id: string;
  label: string;
  extension: string;
  emitsMachineMotion: boolean;
  description: string;
};

export type ToolpathCompensation = 'outside' | 'inside' | 'center' | 'none';

export type ToolpathOperationPlan = {
  sheetId: string;
  placementId: string;
  partId: string;
  partNumber: string;
  operationId: string;
  operationKind: ManufacturingOperationKind;
  toolId: string | null;
  compensation: ToolpathCompensation;
  depthMm: number | null;
  through: boolean;
  registeredGeometry: ManufacturingGeometry[];
  note: string;
};

export type ToolpathPlan = {
  version: 1;
  status: 'planning-only' | 'unsupported';
  machineProfile: MachineProfile;
  postprocessor: PostprocessorContract;
  operations: ToolpathOperationPlan[];
  unsupportedOperationIds: string[];
  canPostprocess: false;
  message: string;
};

type FreeRect = { x: number; y: number; width: number; height: number };

type WorkingSheet = {
  id: string;
  label: string;
  stockDefinitionId: string;
  source: 'sheet' | 'remnant';
  sourceId: string;
  material: string;
  thicknessMm: number;
  widthMm: number;
  heightMm: number;
  grainAxis: SheetGrainAxis;
  marginMm: number;
  placements: NestPlacement[];
  freeRects: FreeRect[];
};

type NestPart = {
  part: ManufacturingPart;
  bom: BomRow;
  grainAxis: PartGrainAxis;
  widthMm: number;
  heightMm: number;
};

const OPERATION_KINDS: ManufacturingOperationKind[] = ['CUT', 'POCKET', 'DADO_GROOVE', 'DRILL', 'ENGRAVE', 'EDGE'];

export function createDefaultProductionConfiguration(docs: ShopDocumentation): ProductionConfiguration {
  const stocks: SheetStockDefinition[] = docs.materialGroups.map((group, index) => {
    const rows = docs.bom.filter(row =>
      row.material === group.material
      && Math.abs(row.blank[row.thicknessAxis] - group.thickness) < 0.05
    );
    const hasDirectionalGrain = rows.some(row => row.grainDirection !== 'none');

    return {
      id: 'stock:' + slug(group.material) + ':' + num(group.thickness) + ':' + (index + 1),
      material: group.material,
      thicknessMm: group.thickness,
      widthMm: 2440,
      heightMm: 1220,
      grainAxis: hasDirectionalGrain ? 'x' : 'none',
      marginMm: 12,
      quantity: null,
      remnants: [],
    };
  });

  const tool: ToolDefinition = {
    id: 'tool:router-6mm',
    label: '6 mm router · planning default',
    kind: 'router',
    diameterMm: 6,
    supportedOperations: ['CUT', 'POCKET', 'DADO_GROOVE', 'ENGRAVE'],
  };

  const drill: ToolDefinition = {
    id: 'tool:drill-5mm',
    label: '5 mm drill · planning default',
    kind: 'drill',
    diameterMm: 5,
    supportedOperations: ['DRILL'],
  };

  return {
    settings: {
      partSpacingMm: 6,
      kerfMm: 0,
      toolDiameterMm: tool.diameterMm,
      allowRotation: true,
      preferRemnants: true,
    },
    stocks,
    toolLibrary: [tool, drill],
    machineProfile: {
      id: 'machine:generic-router-mm-planning',
      label: 'Generic metric CNC router · planning only',
      units: 'mm',
      origin: 'lower-left',
      workAreaMm: { x: 2440, y: 1220, z: 100 },
      safeZMm: 15,
      supportedOperations: ['CUT', 'POCKET', 'DADO_GROOVE', 'DRILL', 'ENGRAVE'],
      postprocessorId: 'post:none',
    },
    postprocessor: {
      id: 'post:none',
      label: 'No machine postprocessor configured',
      extension: '',
      emitsMachineMotion: false,
      description: 'Phase 12 production planning preserves toolpath intent but does not emit G-code until a verified machine/postprocessor implementation is selected.',
    },
  };
}

export function buildProductionPlan(
  manufacturing: ManufacturingModel,
  docs: ShopDocumentation,
  configuration: ProductionConfiguration,
): ProductionPlan {
  const bomById = new Map(docs.bom.map(row => [row.partId, row]));
  const nestParts: NestPart[] = manufacturing.parts
    .flatMap(part => {
      const bom = bomById.get(part.partId);
      if (!bom) return [];
      return [{
        part,
        bom,
        grainAxis: partGrainAxis(part, bom),
        widthMm: part.plane.widthMm,
        heightMm: part.plane.heightMm,
      }];
    })
    .sort((a, b) =>
      (b.widthMm * b.heightMm) - (a.widthMm * a.heightMm)
      || a.part.partNumber.localeCompare(b.part.partNumber, undefined, { numeric: true })
    );

  const workingSheets: WorkingSheet[] = [];
  const stockUseCount = new Map<string, number>();
  const remnantUse = new Set<string>();
  const unplaced: UnplacedPart[] = [];
  const clearance = Math.max(
    0,
    configuration.settings.partSpacingMm,
    configuration.settings.kerfMm,
    configuration.settings.toolDiameterMm,
  );

  const stocks = configuration.stocks.map(stock => sanitizeStock(stock));

  if (configuration.settings.preferRemnants) {
    for (const stock of stocks) {
      for (const remnant of stock.remnants) {
        if (remnant.widthMm <= stock.marginMm * 2 || remnant.heightMm <= stock.marginMm * 2) continue;
        workingSheets.push(createWorkingSheet(stock, 'remnant', remnant.id, remnant.label, remnant.widthMm, remnant.heightMm));
      }
    }
  }

  for (const item of nestParts) {
    const stock = stocks.find(candidate =>
      candidate.material === item.part.material
      && Math.abs(candidate.thicknessMm - item.part.plane.thicknessMm) < 0.05
    );

    if (!stock) {
      unplaced.push(unplacedPart(item, null, 'No compatible sheet stock definition for material/thickness.'));
      continue;
    }

    let placed = placeOnExistingSheet(item, stock, workingSheets, configuration.settings, clearance);

    if (!placed && !configuration.settings.preferRemnants) {
      for (const remnant of stock.remnants) {
        if (remnantUse.has(remnant.id)) continue;
        const candidate = createWorkingSheet(stock, 'remnant', remnant.id, remnant.label, remnant.widthMm, remnant.heightMm);
        if (tryPlace(item, stock, candidate, configuration.settings, clearance)) {
          workingSheets.push(candidate);
          remnantUse.add(remnant.id);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      const used = stockUseCount.get(stock.id) ?? 0;
      const hasCapacity = stock.quantity === null || used < stock.quantity;
      if (hasCapacity) {
        const sheetNumber = used + 1;
        const candidate = createWorkingSheet(
          stock,
          'sheet',
          stock.id + ':sheet:' + sheetNumber,
          stock.material + ' ' + num(stock.thicknessMm) + ' mm · sheet ' + sheetNumber,
          stock.widthMm,
          stock.heightMm,
        );
        if (tryPlace(item, stock, candidate, configuration.settings, clearance)) {
          workingSheets.push(candidate);
          stockUseCount.set(stock.id, sheetNumber);
          placed = true;
        }
      }
    }

    if (!placed) {
      const rotations = allowedRotations(item, stock, configuration.settings.allowRotation);
      const rotationNote = rotations.length
        ? 'No remaining stock piece can fit the part with required margins/spacing.'
        : 'Grain/rotation constraints prevent a valid orientation on this stock.';
      unplaced.push(unplacedPart(item, stock.id, rotationNote));
    }
  }

  const sheets = workingSheets
    .filter(sheet => sheet.placements.length > 0)
    .map(sheet => finalizeSheet(sheet, manufacturing))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  const totalUsedAreaMm2 = sheets.reduce((sum, sheet) => sum + sheet.usedAreaMm2, 0);
  const totalUsableAreaMm2 = sheets.reduce((sum, sheet) => sum + sheet.usableAreaMm2, 0);
  const signature = fnv1a(JSON.stringify({
    manufacturing: manufacturing.signature,
    settings: configuration.settings,
    stocks,
    placements: sheets.flatMap(sheet => sheet.placements.map(placement => ({
      sheetId: sheet.id,
      partId: placement.partId,
      xMm: placement.xMm,
      yMm: placement.yMm,
      rotationDeg: placement.rotationDeg,
    }))),
  }));

  return {
    version: 1,
    signature,
    manufacturingSignature: manufacturing.signature,
    settings: { ...configuration.settings },
    stocks,
    sheets,
    unplaced,
    placementCount: sheets.reduce((sum, sheet) => sum + sheet.placements.length, 0),
    sheetCount: sheets.filter(sheet => sheet.source === 'sheet').length,
    remnantCount: sheets.filter(sheet => sheet.source === 'remnant').length,
    totalUsedAreaMm2,
    totalUsableAreaMm2,
    overallUtilization: totalUsableAreaMm2 > 0 ? totalUsedAreaMm2 / totalUsableAreaMm2 : 0,
  };
}

function placeOnExistingSheet(
  item: NestPart,
  stock: SheetStockDefinition,
  sheets: WorkingSheet[],
  settings: NestingSettings,
  clearance: number,
) {
  const candidates = sheets
    .filter(sheet =>
      sheet.stockDefinitionId === stock.id
      && sheet.material === item.part.material
      && Math.abs(sheet.thicknessMm - item.part.plane.thicknessMm) < 0.05
    )
    .sort((a, b) => {
      if (settings.preferRemnants && a.source !== b.source) return a.source === 'remnant' ? -1 : 1;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

  for (const sheet of candidates) {
    if (tryPlace(item, stock, sheet, settings, clearance)) return true;
  }
  return false;
}

function tryPlace(
  item: NestPart,
  stock: SheetStockDefinition,
  sheet: WorkingSheet,
  settings: NestingSettings,
  clearance: number,
) {
  const rotations = allowedRotations(item, stock, settings.allowRotation);
  let best: {
    rectIndex: number;
    rotation: PlacementRotation;
    partWidth: number;
    partHeight: number;
    footprintWidth: number;
    footprintHeight: number;
    score: [number, number, number];
  } | null = null;

  for (const rotation of rotations) {
    const partWidth = rotation === 0 ? item.widthMm : item.heightMm;
    const partHeight = rotation === 0 ? item.heightMm : item.widthMm;
    const footprintWidth = partWidth + clearance;
    const footprintHeight = partHeight + clearance;

    for (let rectIndex = 0; rectIndex < sheet.freeRects.length; rectIndex += 1) {
      const rect = sheet.freeRects[rectIndex];
      if (footprintWidth > rect.width + 0.001 || footprintHeight > rect.height + 0.001) continue;
      const wastedArea = rect.width * rect.height - footprintWidth * footprintHeight;
      const shortSide = Math.min(rect.width - footprintWidth, rect.height - footprintHeight);
      const score: [number, number, number] = [wastedArea, shortSide, rotation];
      if (!best || compareScore(score, best.score) < 0) {
        best = { rectIndex, rotation, partWidth, partHeight, footprintWidth, footprintHeight, score };
      }
    }
  }

  if (!best) return false;

  const selected = best as NonNullable<typeof best>;
  const rect = sheet.freeRects[selected.rectIndex];
  const placement: NestPlacement = {
    id: 'placement:' + sheet.id + ':' + item.part.partId,
    sheetId: sheet.id,
    stockDefinitionId: stock.id,
    partId: item.part.partId,
    partNumber: item.part.partNumber,
    material: item.part.material,
    thicknessMm: item.part.plane.thicknessMm,
    xMm: rect.x,
    yMm: rect.y,
    rotationDeg: selected.rotation,
    widthMm: selected.partWidth,
    heightMm: selected.partHeight,
    sourceWidthMm: item.widthMm,
    sourceHeightMm: item.heightMm,
    grainAxis: item.grainAxis,
    operationIds: item.part.operations.map(operation => operation.id),
  };
  sheet.placements.push(placement);

  const right: FreeRect = {
    x: rect.x + selected.footprintWidth,
    y: rect.y,
    width: rect.width - selected.footprintWidth,
    height: rect.height,
  };
  const top: FreeRect = {
    x: rect.x,
    y: rect.y + selected.footprintHeight,
    width: selected.footprintWidth,
    height: rect.height - selected.footprintHeight,
  };

  sheet.freeRects.splice(selected.rectIndex, 1, right, top);
  sheet.freeRects = pruneFreeRects(sheet.freeRects.filter(candidate => candidate.width > 0.5 && candidate.height > 0.5));
  return true;
}

function allowedRotations(
  item: NestPart,
  stock: SheetStockDefinition,
  allowRotation: boolean,
): PlacementRotation[] {
  if (stock.grainAxis === 'none' || item.grainAxis === 'none') return allowRotation ? [0, 90] : [0];

  const required = item.grainAxis === 'u'
    ? stock.grainAxis === 'x' ? 0 : 90
    : stock.grainAxis === 'x' ? 90 : 0;

  if (required === 90 && !allowRotation) return [];
  return [required];
}

function partGrainAxis(part: ManufacturingPart, bom: BomRow): PartGrainAxis {
  if (bom.grainDirection === 'none' || bom.grainDirection === part.plane.thicknessAxis) return 'none';
  if (bom.grainDirection === part.plane.uAxis) return 'u';
  if (bom.grainDirection === part.plane.vAxis) return 'v';
  return 'none';
}

function createWorkingSheet(
  stock: SheetStockDefinition,
  source: 'sheet' | 'remnant',
  sourceId: string,
  label: string,
  widthMm: number,
  heightMm: number,
): WorkingSheet {
  const margin = clamp(stock.marginMm, 0, Math.min(widthMm, heightMm) / 3);
  return {
    id: source === 'sheet' ? sourceId : stock.id + ':remnant:' + sourceId,
    label,
    stockDefinitionId: stock.id,
    source,
    sourceId,
    material: stock.material,
    thicknessMm: stock.thicknessMm,
    widthMm,
    heightMm,
    grainAxis: stock.grainAxis,
    marginMm: margin,
    placements: [],
    freeRects: [{
      x: margin,
      y: margin,
      width: Math.max(0, widthMm - margin * 2),
      height: Math.max(0, heightMm - margin * 2),
    }],
  };
}

function finalizeSheet(sheet: WorkingSheet, manufacturing: ManufacturingModel): NestedSheet {
  const usableWidth = Math.max(0, sheet.widthMm - sheet.marginMm * 2);
  const usableHeight = Math.max(0, sheet.heightMm - sheet.marginMm * 2);
  const usedAreaMm2 = sheet.placements.reduce((sum, placement) => sum + placement.widthMm * placement.heightMm, 0);
  const usableAreaMm2 = usableWidth * usableHeight;
  const partial: Omit<NestedSheet, 'svg' | 'dxf' | 'registrationJson'> = {
    id: sheet.id,
    label: sheet.label,
    stockDefinitionId: sheet.stockDefinitionId,
    source: sheet.source,
    sourceId: sheet.sourceId,
    material: sheet.material,
    thicknessMm: sheet.thicknessMm,
    widthMm: sheet.widthMm,
    heightMm: sheet.heightMm,
    grainAxis: sheet.grainAxis,
    marginMm: sheet.marginMm,
    placements: sheet.placements,
    usedAreaMm2,
    usableAreaMm2,
    utilization: usableAreaMm2 > 0 ? usedAreaMm2 / usableAreaMm2 : 0,
  };
  return {
    ...partial,
    svg: sheetSvg(partial as NestedSheet, manufacturing),
    dxf: sheetDxf(partial as NestedSheet, manufacturing),
    registrationJson: sheetRegistrationJson(partial as NestedSheet, manufacturing),
  };
}

export function sheetSvg(sheet: NestedSheet, manufacturing: ManufacturingModel) {
  const width = Math.max(1, sheet.widthMm);
  const height = Math.max(1, sheet.heightMm);
  const partById = new Map(manufacturing.parts.map(part => [part.partId, part]));
  const bodies: string[] = [];

  for (const placement of sheet.placements) {
    const part = partById.get(placement.partId);
    if (!part) continue;
    const geometry = part.operations.flatMap(operation =>
      operation.geometry.map(item => {
        const transformed = transformGeometry(item, placement, part);
        return svgGeometry(transformed, height, operation.kind, operation.id);
      })
    ).join('');
    const label = transformPoint({ x: part.plane.widthMm / 2, y: part.plane.heightMm / 2 }, placement, part);
    bodies.push(
      '<g data-part-id="' + xml(placement.partId) + '" data-part-number="' + xml(placement.partNumber) + '">' +
      geometry +
      '<text class="part-label" x="' + num(label.x) + '" y="' + num(height - label.y) + '" text-anchor="middle">' + xml(placement.partNumber) + '</text>' +
      '</g>'
    );
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + num(width) + 'mm" height="' + num(height) +
    'mm" viewBox="0 0 ' + num(width) + ' ' + num(height) + '" data-units="mm" data-scale="1">' +
    '<style>.stock{fill:#14191c;stroke:#849299;stroke-width:1}.margin{fill:none;stroke:#4d5d64;stroke-dasharray:5 3}.op{fill:none;stroke-width:.6;vector-effect:non-scaling-stroke}.CUT{stroke:#e6edef}.POCKET{stroke:#e5b96a;stroke-dasharray:4 2}.DADO_GROOVE{stroke:#c99ce8}.DRILL{stroke:#69c9e6}.ENGRAVE{stroke:#9ba8ae;fill:#9ba8ae}.EDGE{stroke:#79d8a8;stroke-width:1.1}.part-label{font:10px monospace;fill:#f1d37c;stroke:#14191c;stroke-width:2;paint-order:stroke}</style>' +
    '<rect class="stock" x=".5" y=".5" width="' + num(width - 1) + '" height="' + num(height - 1) + '"/>' +
    '<rect class="margin" x="' + num(sheet.marginMm) + '" y="' + num(sheet.marginMm) + '" width="' +
    num(Math.max(0, width - sheet.marginMm * 2)) + '" height="' + num(Math.max(0, height - sheet.marginMm * 2)) + '"/>' +
    bodies.join('') + '</svg>';
}

export function sheetDxf(sheet: NestedSheet, manufacturing: ManufacturingModel) {
  const partById = new Map(manufacturing.parts.map(part => [part.partId, part]));
  const lines: string[] = [
    '0','SECTION','2','HEADER',
    '9','$ACADVER','1','AC1015',
    '9','$INSUNITS','70','4',
    '0','ENDSEC',
    '0','SECTION','2','ENTITIES',
  ];

  appendDxfGeometry(lines, { type: 'rect', x: 0, y: 0, width: sheet.widthMm, height: sheet.heightMm }, 'STOCK');

  for (const placement of sheet.placements) {
    const part = partById.get(placement.partId);
    if (!part) continue;
    for (const operation of part.operations) {
      for (const geometry of operation.geometry) {
        appendDxfGeometry(lines, transformGeometry(geometry, placement, part), dxfLayer(operation.kind));
      }
    }
    const center = transformPoint({ x: part.plane.widthMm / 2, y: part.plane.heightMm / 2 }, placement, part);
    appendDxfGeometry(lines, {
      type: 'text',
      x: center.x,
      y: center.y,
      height: Math.max(5, Math.min(18, Math.min(placement.widthMm, placement.heightMm) * 0.05)),
      text: placement.partNumber,
    }, 'LABELS');
  }

  lines.push('0','ENDSEC','0','EOF');
  return lines.join('\r\n') + '\r\n';
}

export function sheetRegistrationJson(sheet: NestedSheet, manufacturing: ManufacturingModel) {
  const partById = new Map(manufacturing.parts.map(part => [part.partId, part]));
  return JSON.stringify({
    schema: 'cabinet-ws-sheet-registration-v1',
    units: 'mm',
    scale: 1,
    sheet: {
      id: sheet.id,
      label: sheet.label,
      source: sheet.source,
      sourceId: sheet.sourceId,
      material: sheet.material,
      thicknessMm: sheet.thicknessMm,
      widthMm: sheet.widthMm,
      heightMm: sheet.heightMm,
      grainAxis: sheet.grainAxis,
      marginMm: sheet.marginMm,
    },
    placements: sheet.placements.map(placement => {
      const part = partById.get(placement.partId);
      return {
        placementId: placement.id,
        partId: placement.partId,
        partNumber: placement.partNumber,
        xMm: placement.xMm,
        yMm: placement.yMm,
        rotationDeg: placement.rotationDeg,
        widthMm: placement.widthMm,
        heightMm: placement.heightMm,
        operationIds: placement.operationIds,
        operations: part?.operations.map(operation => ({
          operationId: operation.id,
          featureId: operation.featureId ?? null,
          kind: operation.kind,
          face: operation.face,
          depthMm: operation.depthMm,
          through: operation.through,
        })) ?? [],
      };
    }),
  }, null, 2);
}

export function productionPlanJson(plan: ProductionPlan) {
  return JSON.stringify({
    version: plan.version,
    signature: plan.signature,
    manufacturingSignature: plan.manufacturingSignature,
    settings: plan.settings,
    stocks: plan.stocks,
    summary: {
      placementCount: plan.placementCount,
      sheetCount: plan.sheetCount,
      remnantCount: plan.remnantCount,
      totalUsedAreaMm2: plan.totalUsedAreaMm2,
      totalUsableAreaMm2: plan.totalUsableAreaMm2,
      overallUtilization: plan.overallUtilization,
      unplacedCount: plan.unplaced.length,
    },
    sheets: plan.sheets.map(sheet => ({
      id: sheet.id,
      label: sheet.label,
      stockDefinitionId: sheet.stockDefinitionId,
      source: sheet.source,
      sourceId: sheet.sourceId,
      material: sheet.material,
      thicknessMm: sheet.thicknessMm,
      widthMm: sheet.widthMm,
      heightMm: sheet.heightMm,
      grainAxis: sheet.grainAxis,
      marginMm: sheet.marginMm,
      utilization: sheet.utilization,
      placements: sheet.placements,
    })),
    unplaced: plan.unplaced,
  }, null, 2);
}

export function buildToolpathPlan(
  plan: ProductionPlan,
  manufacturing: ManufacturingModel,
  configuration: ProductionConfiguration,
): ToolpathPlan {
  const partById = new Map(manufacturing.parts.map(part => [part.partId, part]));
  const operations: ToolpathOperationPlan[] = [];
  const unsupportedOperationIds: string[] = [];

  for (const sheet of plan.sheets) {
    for (const placement of sheet.placements) {
      const part = partById.get(placement.partId);
      if (!part) continue;
      for (const operation of part.operations) {
        const tool = selectTool(operation, configuration.toolLibrary);
        const supported = Boolean(tool)
          && configuration.machineProfile.supportedOperations.includes(operation.kind)
          && configuration.postprocessor.emitsMachineMotion;
        if (!supported) unsupportedOperationIds.push(operation.id);

        operations.push({
          sheetId: sheet.id,
          placementId: placement.id,
          partId: part.partId,
          partNumber: part.partNumber,
          operationId: operation.id,
          operationKind: operation.kind,
          toolId: tool?.id ?? null,
          compensation: compensationFor(operation),
          depthMm: operation.depthMm,
          through: operation.through,
          registeredGeometry: operation.geometry.map(geometry => transformGeometry(geometry, placement, part)),
          note: supported
            ? 'Registered for downstream postprocessing.'
            : 'Planning metadata only; no verified machine postprocessor is configured.',
        });
      }
    }
  }

  return {
    version: 1,
    status: unsupportedOperationIds.length ? 'unsupported' : 'planning-only',
    machineProfile: configuration.machineProfile,
    postprocessor: configuration.postprocessor,
    operations,
    unsupportedOperationIds: [...new Set(unsupportedOperationIds)],
    canPostprocess: false,
    message: 'Toolpath registration is available, but Cabinet WS does not emit G-code until a verified machine profile/postprocessor with compensation rules is implemented.',
  };
}

function selectTool(operation: ManufacturingOperation, tools: ToolDefinition[]) {
  if (operation.kind === 'EDGE') return null;
  if (operation.kind === 'DRILL') {
    const diameter = circleDiameter(operation.geometry);
    return tools
      .filter(tool => tool.supportedOperations.includes(operation.kind))
      .sort((a, b) => diameter === null ? a.diameterMm - b.diameterMm : Math.abs(a.diameterMm - diameter) - Math.abs(b.diameterMm - diameter))[0] ?? null;
  }
  return tools.find(tool => tool.supportedOperations.includes(operation.kind)) ?? null;
}

function compensationFor(operation: ManufacturingOperation): ToolpathCompensation {
  if (operation.kind === 'DRILL' || operation.kind === 'ENGRAVE') return 'center';
  if (operation.kind === 'POCKET' || operation.kind === 'DADO_GROOVE') return 'inside';
  if (operation.kind === 'CUT') return operation.sourceKind === 'panel-profile' ? 'outside' : 'inside';
  return 'none';
}

function circleDiameter(geometry: ManufacturingGeometry[]) {
  const circle = geometry.find(item => item.type === 'circle');
  return circle?.type === 'circle' ? circle.radius * 2 : null;
}

function transformGeometry(
  geometry: ManufacturingGeometry,
  placement: NestPlacement,
  part: ManufacturingPart,
): ManufacturingGeometry {
  if (geometry.type === 'circle') {
    const center = transformPoint({ x: geometry.cx, y: geometry.cy }, placement, part);
    return { ...geometry, cx: center.x, cy: center.y };
  }
  if (geometry.type === 'line') {
    const a = transformPoint({ x: geometry.x1, y: geometry.y1 }, placement, part);
    const b = transformPoint({ x: geometry.x2, y: geometry.y2 }, placement, part);
    return { type: 'line', x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }
  if (geometry.type === 'text') {
    const point = transformPoint({ x: geometry.x, y: geometry.y }, placement, part);
    return { ...geometry, x: point.x, y: point.y };
  }
  if (geometry.type === 'rect') {
    const points = [
      { x: geometry.x, y: geometry.y },
      { x: geometry.x + geometry.width, y: geometry.y },
      { x: geometry.x + geometry.width, y: geometry.y + geometry.height },
      { x: geometry.x, y: geometry.y + geometry.height },
    ].map(point => transformPoint(point, placement, part));
    return { type: 'polyline', points, closed: true };
  }
  return {
    ...geometry,
    points: geometry.points.map(point => transformPoint(point, placement, part)),
  };
}

function transformPoint(point: Point2, placement: NestPlacement, part: ManufacturingPart): Point2 {
  if (placement.rotationDeg === 0) return { x: placement.xMm + point.x, y: placement.yMm + point.y };
  return {
    x: placement.xMm + (part.plane.heightMm - point.y),
    y: placement.yMm + point.x,
  };
}

function svgGeometry(geometry: ManufacturingGeometry, sheetHeight: number, kind: ManufacturingOperationKind, operationId: string) {
  const common = ' class="op ' + kind + '" data-operation-id="' + xml(operationId) + '"';
  if (geometry.type === 'circle') {
    return '<circle' + common + ' cx="' + num(geometry.cx) + '" cy="' + num(sheetHeight - geometry.cy) + '" r="' + num(geometry.radius) + '"/>';
  }
  if (geometry.type === 'line') {
    return '<line' + common + ' x1="' + num(geometry.x1) + '" y1="' + num(sheetHeight - geometry.y1) + '" x2="' + num(geometry.x2) + '" y2="' + num(sheetHeight - geometry.y2) + '"/>';
  }
  if (geometry.type === 'text') {
    return '<text' + common + ' x="' + num(geometry.x) + '" y="' + num(sheetHeight - geometry.y) + '" font-size="' + num(geometry.height) + '">' + xml(geometry.text) + '</text>';
  }
  if (geometry.type === 'rect') {
    return '<rect' + common + ' x="' + num(geometry.x) + '" y="' + num(sheetHeight - geometry.y - geometry.height) + '" width="' + num(geometry.width) + '" height="' + num(geometry.height) + '"/>';
  }
  const points = geometry.points.map(point => num(point.x) + ',' + num(sheetHeight - point.y)).join(' ');
  return geometry.closed
    ? '<polygon' + common + ' points="' + points + '" fill="none"/>'
    : '<polyline' + common + ' points="' + points + '" fill="none"/>';
}

function appendDxfGeometry(lines: string[], geometry: ManufacturingGeometry, layer: string) {
  if (geometry.type === 'circle') {
    lines.push('0','CIRCLE','8',layer,'10',num(geometry.cx),'20',num(geometry.cy),'30','0','40',num(geometry.radius));
    return;
  }
  if (geometry.type === 'line') {
    lines.push('0','LINE','8',layer,'10',num(geometry.x1),'20',num(geometry.y1),'30','0','11',num(geometry.x2),'21',num(geometry.y2),'31','0');
    return;
  }
  if (geometry.type === 'text') {
    lines.push('0','TEXT','8',layer,'10',num(geometry.x),'20',num(geometry.y),'30','0','40',num(geometry.height),'1',dxfText(geometry.text));
    return;
  }
  const points = geometry.type === 'rect'
    ? [
        { x: geometry.x, y: geometry.y },
        { x: geometry.x + geometry.width, y: geometry.y },
        { x: geometry.x + geometry.width, y: geometry.y + geometry.height },
        { x: geometry.x, y: geometry.y + geometry.height },
      ]
    : geometry.points;
  lines.push('0','LWPOLYLINE','8',layer,'90',String(points.length),'70',geometry.type === 'rect' || geometry.closed ? '1' : '0');
  for (const point of points) lines.push('10',num(point.x),'20',num(point.y));
}

function dxfLayer(kind: ManufacturingOperationKind) {
  return kind === 'DADO_GROOVE' ? 'DADO-GROOVE' : kind;
}

function dxfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '?').slice(0, 120);
}

function sanitizeStock(stock: SheetStockDefinition): SheetStockDefinition {
  const widthMm = Math.max(50, finite(stock.widthMm, 2440));
  const heightMm = Math.max(50, finite(stock.heightMm, 1220));
  return {
    ...stock,
    thicknessMm: Math.max(0.1, finite(stock.thicknessMm, 18)),
    widthMm,
    heightMm,
    marginMm: clamp(finite(stock.marginMm, 12), 0, Math.min(widthMm, heightMm) / 3),
    quantity: stock.quantity === null ? null : Math.max(0, Math.floor(finite(stock.quantity, 0))),
    remnants: stock.remnants
      .filter(remnant => finite(remnant.widthMm, 0) > 0 && finite(remnant.heightMm, 0) > 0)
      .map(remnant => ({
        ...remnant,
        widthMm: Math.max(10, finite(remnant.widthMm, widthMm / 2)),
        heightMm: Math.max(10, finite(remnant.heightMm, heightMm / 2)),
      })),
  };
}

function unplacedPart(item: NestPart, stockDefinitionId: string | null, reason: string): UnplacedPart {
  return {
    stockDefinitionId,
    partId: item.part.partId,
    partNumber: item.part.partNumber,
    material: item.part.material,
    thicknessMm: item.part.plane.thicknessMm,
    widthMm: item.widthMm,
    heightMm: item.heightMm,
    reason,
  };
}

function pruneFreeRects(rects: FreeRect[]) {
  return rects.filter((candidate, index) =>
    !rects.some((other, otherIndex) =>
      otherIndex !== index
      && candidate.x >= other.x - 0.001
      && candidate.y >= other.y - 0.001
      && candidate.x + candidate.width <= other.x + other.width + 0.001
      && candidate.y + candidate.height <= other.y + other.height + 0.001
    )
  );
}

function compareScore(a: [number, number, number], b: [number, number, number]) {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function finite(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function num(value: number) {
  return Number(value.toFixed(4)).toString();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'material';
}

function xml(value: string) {
  const escapes: Record<string, string> = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  return String(value).replace(/[&<>"']/g, character => escapes[character] ?? character);
}

function fnv1a(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
