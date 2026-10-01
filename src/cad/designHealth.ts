import { stockThickness } from './cabinetModel';
import { hardwareCompatibility } from './hardware';
import { hardwareDefinition } from './hardwareCatalog';
import { sectionLayoutErrors } from './sections';
import { drawerScrewPlacement } from './drawerJoinery';
import type { CabinetDocument, CadPart, HardwareInstance } from './types';
import { buildFeatureGraph } from './kernel/featureGraph';
import type { CadFeature, KernelDiagnostic, KernelStatus } from './kernel/types';

export type DesignHealthSeverity = 'error' | 'warning' | 'info';
export type DesignHealthCategory =
  | 'geometry'
  | 'compatibility'
  | 'coverage'
  | 'system'
  | 'manufacturing';

export type DesignHealthCheck = {
  id: string;
  severity: DesignHealthSeverity;
  category: DesignHealthCategory;
  title: string;
  message: string;
  suggestion?: string;
  partIds?: string[];
  featureIds?: string[];
};

export type DesignHealthCoverage = {
  id: string;
  label: string;
  status: 'checked' | 'partial' | 'not-applicable';
  detail: string;
};

export type DesignHealthReport = {
  status: 'pass' | 'warning' | 'error';
  readiness: 'ready' | 'review' | 'blocked';
  checks: DesignHealthCheck[];
  errors: DesignHealthCheck[];
  warnings: DesignHealthCheck[];
  coverage: DesignHealthCoverage[];
  summary: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
    checkedCategories: number;
  };
};

export type DesignHealthOptions = {
  kernelDiagnostics?: KernelDiagnostic[];
  kernelStatus?: KernelStatus;
};

const machiningKinds = new Set<CadFeature['kind']>(['dado', 'rabbet', 'groove', 'pocket']);
const axes = ['x', 'y', 'z'] as const;

export function analyzeDesignHealth(
  document: CabinetDocument,
  options: DesignHealthOptions = {},
): DesignHealthReport {
  const checks: DesignHealthCheck[] = [];
  const coverage: DesignHealthCoverage[] = [];
  const p = document.parameters;
  const carcassThickness = stockThickness(p.carcassStock, p.materialThickness);
  const graph = buildFeatureGraph(document);

  checkSystemContract(document, graph.partFeatures, checks);
  coverage.push({
    id: 'system-contract',
    label: 'Document/system interfaces',
    status: 'checked',
    detail: 'Stable part IDs, finite fabricated bodies, feature IDs, and hardware mounting references checked.',
  });

  checkJoineryMaterial(p.joineryStyle, p.dadoDepth, carcassThickness, checks);
  checkDrawerConstruction(document, checks);
  checkSectionConstraints(document, carcassThickness, checks);
  coverage.push({
    id: 'geometry-constraints',
    label: 'Geometry and section constraints',
    status: 'checked',
    detail: 'Material/joinery residual stock and bounded section feasibility checked from cabinet parameters.',
  });

  const compatibility = hardwareCompatibility(p);
  for (const [index, issue] of compatibility.entries()) {
    checks.push({
      id: `hardware-compat-${index + 1}`,
      severity: issue.level,
      category: 'compatibility',
      title: hardwareIssueTitle(issue.message),
      message: issue.message,
      suggestion: hardwareIssueSuggestion(issue.message),
    });
  }
  checkHardwareDefinitions(document, checks);
  coverage.push({
    id: 'hardware-compatibility',
    label: 'Hardware compatibility',
    status: document.hardware.length ? 'checked' : 'not-applicable',
    detail: document.hardware.length
      ? 'Selected profiles, required clearances, verification support, and mounting references checked.'
      : 'No purchased slide/hinge instances are active in this design.',
  });

  checkShelfHardwareCollisions(document, checks);
  coverage.push({
    id: 'keepout-collisions',
    label: 'Shelf / hardware keepouts',
    status: document.hardware.length && document.parts.some(part => part.category === 'shelf')
      ? 'checked'
      : 'not-applicable',
    detail: 'Semantic shelf bodies are tested against purchased-hardware keepout envelopes.',
  });

  checkEdgeDistances(document, graph.partFeatures, checks);
  checkMachiningOverlap(document, graph.partFeatures, checks);
  coverage.push({
    id: 'machining-intent',
    label: 'Manufacturing feature intent',
    status: 'checked',
    detail: 'Registered drilling edge distance and overlapping subtractive feature envelopes checked.',
  });

  const diagnostics = options.kernelDiagnostics ?? [];
  for (const diagnostic of diagnostics) {
    checks.push({
      id: `kernel-${diagnostic.code}-${diagnostic.partId ?? 'document'}-${diagnostic.featureId ?? 'feature'}`,
      severity: diagnostic.severity,
      category: 'manufacturing',
      title: 'Exact CAD diagnostic',
      message: diagnostic.message,
      partIds: diagnostic.partId ? [diagnostic.partId] : undefined,
      featureIds: diagnostic.featureId ? [diagnostic.featureId] : undefined,
      suggestion: diagnostic.severity === 'error'
        ? 'Resolve this exact-kernel error before manufacturing output.'
        : undefined,
    });
  }

  const kernelStatus = options.kernelStatus ?? 'idle';
  coverage.push({
    id: 'exact-kernel',
    label: 'Exact B-Rep rebuild',
    status: kernelStatus === 'ready' ? 'checked' : kernelStatus === 'error' ? 'partial' : 'partial',
    detail: kernelStatus === 'ready'
      ? 'Current semantic document has a matching exact OpenCascade rebuild.'
      : kernelStatus === 'error'
        ? 'Exact rebuild reported diagnostics; analytical geometry remains available as fallback.'
        : 'Exact rebuild is not currently confirmed ready; semantic checks still run independently.',
  });

  if (!checks.some(check => check.category === 'manufacturing' && check.severity !== 'info')) {
    checks.push({
      id: 'manufacturing-readiness-summary',
      severity: 'info',
      category: 'manufacturing',
      title: 'Manufacturing readiness',
      message: 'No blocking semantic manufacturing issue was found in the checked scope.',
    });
  }

  const errors = checks.filter(check => check.severity === 'error');
  const warnings = checks.filter(check => check.severity === 'warning');
  const infoCount = checks.filter(check => check.severity === 'info').length;
  const status: DesignHealthReport['status'] = errors.length
    ? 'error'
    : warnings.length
      ? 'warning'
      : 'pass';
  const readiness: DesignHealthReport['readiness'] = errors.length
    ? 'blocked'
    : warnings.length || coverage.some(item => item.status === 'partial')
      ? 'review'
      : 'ready';

  return {
    status,
    readiness,
    checks,
    errors,
    warnings,
    coverage,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount,
      checkedCategories: new Set(checks.map(check => check.category)).size,
    },
  };
}

function checkSystemContract(
  document: CabinetDocument,
  partFeatures: Record<string, CadFeature[]>,
  checks: DesignHealthCheck[],
) {
  const ids = new Set<string>();
  for (const part of document.parts) {
    if (ids.has(part.id)) {
      checks.push({
        id: `duplicate-part-${part.id}`,
        severity: 'error',
        category: 'system',
        title: 'Duplicate semantic part ID',
        message: `Part ID ${part.id} appears more than once.`,
        partIds: [part.id],
        suggestion: 'Every generated cabinet part must have one stable semantic ID.',
      });
    }
    ids.add(part.id);

    if (
      !Number.isFinite(part.size.x) ||
      !Number.isFinite(part.size.y) ||
      !Number.isFinite(part.size.z) ||
      part.size.x <= 0 ||
      part.size.y <= 0 ||
      part.size.z <= 0
    ) {
      checks.push({
        id: `invalid-part-size-${part.id}`,
        severity: 'error',
        category: 'system',
        title: 'Invalid fabricated body size',
        message: `${part.name} has a non-finite or non-positive body dimension.`,
        partIds: [part.id],
      });
    }

    const featureIds = new Set<string>();
    for (const feature of partFeatures[part.id] ?? []) {
      if (featureIds.has(feature.id)) {
        checks.push({
          id: `duplicate-feature-${feature.id}`,
          severity: 'error',
          category: 'system',
          title: 'Duplicate feature ID',
          message: `Feature identity ${feature.id} is not unique within ${part.id}.`,
          partIds: [part.id],
          featureIds: [feature.id],
        });
      }
      featureIds.add(feature.id);
    }
  }

  for (const hardware of document.hardware) {
    if (
      hardware.mountingReference.partId !== 'cabinet' &&
      !document.parts.some(part => part.id === hardware.mountingReference.partId)
    ) {
      checks.push({
        id: `missing-hardware-mount-${hardware.id}`,
        severity: 'error',
        category: 'system',
        title: 'Missing hardware mounting reference',
        message: `${hardware.label} references missing part ${hardware.mountingReference.partId}.`,
        partIds: [hardware.mountingReference.partId],
        suggestion: 'Regenerate or reassign the hardware mounting member.',
      });
    }
  }
}

function checkJoineryMaterial(
  joineryStyle: CabinetDocument['parameters']['joineryStyle'],
  dadoDepth: number,
  thickness: number,
  checks: DesignHealthCheck[],
) {
  if (joineryStyle !== 'dado') return;
  const residual = thickness - dadoDepth;
  if (residual <= 0) {
    checks.push({
      id: 'carcass-dado-breakthrough',
      severity: 'error',
      category: 'manufacturing',
      title: 'Dado breaks through carcass stock',
      message: `Dado depth ${dadoDepth.toFixed(2)} mm is not less than carcass thickness ${thickness.toFixed(2)} mm.`,
      suggestion: 'Reduce dado depth or use thicker carcass stock.',
    });
  } else if (residual < Math.max(2.5, thickness * 0.15)) {
    checks.push({
      id: 'carcass-dado-thin-wall',
      severity: 'warning',
      category: 'manufacturing',
      title: 'Thin residual stock behind dado',
      message: `Only ${residual.toFixed(2)} mm of carcass stock remains behind the dado.`,
      suggestion: 'Review cutter depth and material strength before machining.',
    });
  }
}

function checkDrawerConstruction(document: CabinetDocument, checks: DesignHealthCheck[]) {
  const p = document.parameters;

  if (p.drawerJoineryStyle === 'tab_slot') {
    checks.push({
      id: 'drawer-tab-slot-not-modeled',
      severity: 'warning',
      category: 'coverage',
      title: 'Drawer tab/slot corner geometry is not modeled yet',
      message: 'The tab/slot drawer style is preserved from the family recipe, but Standalone does not yet add mating front/back tabs and side slots.',
      suggestion: 'Do not manufacture this drawer corner style from Standalone until tab/slot geometry is implemented and verified.',
    });
  }

  if (p.drawerJoineryStyle === 'screw') {
    const drawerSides = document.parts.filter(part =>
      part.category === 'drawer' && /:box:(left|right)$/.test(part.id),
    );
    const invalidSides = drawerSides.filter(side => {
      const bottomGroove = (side.renderFeatures ?? []).find(feature =>
        feature.kind === 'slot' && feature.sourcePartId.endsWith(':box:bottom'),
      );
      return !drawerScrewPlacement({
        boxHeight: side.size.z,
        edgeMargin: p.drawerScrewEdgeMargin,
        diameter: p.drawerScrewHoleDiameter,
        bottomCaptured: p.drawerBottomStyle === 'captured',
        bottomGrooveZ: bottomGroove?.position.z ?? 0,
        bottomThickness: p.drawerBottomThickness,
      }).valid;
    });

    if (invalidSides.length) {
      checks.push({
        id: 'drawer-screw-margin-invalid',
        severity: 'error',
        category: 'manufacturing',
        title: 'Drawer screw guides do not fit the side panel',
        message: `Screw guide diameter ${p.drawerScrewHoleDiameter.toFixed(2)} mm and edge margin ${p.drawerScrewEdgeMargin.toFixed(2)} mm do not fit ${invalidSides.length} drawer side panel${invalidSides.length === 1 ? '' : 's'} with the current bottom groove.`,
        suggestion: 'Reduce screw diameter/edge margin, increase drawer height, or move the captured-bottom groove.',
        partIds: invalidSides.map(side => side.id),
      });
    }
  }

  if (p.drawerJoineryStyle === 'dado') {
    const residual = p.drawerMaterialThickness - p.drawerDadoDepth;
    if (residual <= 0) {
      checks.push({
        id: 'drawer-corner-dado-breakthrough',
        severity: 'error',
        category: 'manufacturing',
        title: 'Drawer corner dado breaks through side stock',
        message: `Drawer dado depth ${p.drawerDadoDepth.toFixed(2)} mm exceeds the usable ${p.drawerMaterialThickness.toFixed(2)} mm drawer-side stock.`,
        suggestion: 'Reduce drawer dado depth or increase drawer-side stock thickness.',
      });
    } else if (residual < 2) {
      checks.push({
        id: 'drawer-corner-dado-thin-wall',
        severity: 'warning',
        category: 'manufacturing',
        title: 'Thin stock behind drawer corner dado',
        message: `Only ${residual.toFixed(2)} mm remains behind each front/back drawer-side dado.`,
      });
    }
  }

  if (p.drawerBottomStyle === 'captured') {
    const residual = p.drawerMaterialThickness - p.drawerBottomGrooveDepth;
    if (residual <= 0) {
      checks.push({
        id: 'drawer-bottom-groove-breakthrough',
        severity: 'error',
        category: 'manufacturing',
        title: 'Drawer-bottom groove breaks through box stock',
        message: `Bottom groove depth ${p.drawerBottomGrooveDepth.toFixed(2)} mm exceeds the usable ${p.drawerMaterialThickness.toFixed(2)} mm drawer-box stock.`,
        suggestion: 'Reduce groove depth or increase drawer-box stock thickness.',
      });
    } else if (residual < 2) {
      checks.push({
        id: 'drawer-bottom-groove-thin-wall',
        severity: 'warning',
        category: 'manufacturing',
        title: 'Thin stock behind drawer-bottom groove',
        message: `Only ${residual.toFixed(2)} mm remains behind the captured-bottom groove.`,
      });
    }
  }
}

function checkSectionConstraints(
  document: CabinetDocument,
  thickness: number,
  checks: DesignHealthCheck[],
) {
  if (document.parameters.layoutMode !== 'sections') return;
  for (const [index, message] of sectionLayoutErrors(document.parameters, thickness).entries()) {
    checks.push({
      id: `section-constraint-${index + 1}`,
      severity: 'error',
      category: 'geometry',
      title: 'Impossible section dimensions',
      message,
      suggestion: 'Reduce fixed opening sizes, change them to proportional sizing, or enlarge the cabinet.',
    });
  }
}

function checkHardwareDefinitions(document: CabinetDocument, checks: DesignHealthCheck[]) {
  const seen = new Set<string>();
  for (const hardware of document.hardware) {
    if (seen.has(hardware.definitionId)) continue;
    seen.add(hardware.definitionId);
    const definition = hardwareDefinition(hardware.definitionId);
    if (!definition) {
      checks.push({
        id: `hardware-definition-missing-${hardware.definitionId}`,
        severity: 'warning',
        category: 'compatibility',
        title: 'Uncatalogued hardware configuration',
        message: `${hardware.label} is using editable/custom dimensions without a matching catalog definition.`,
        suggestion: 'Verify the real hardware dimensions and drilling before manufacturing.',
      });
      continue;
    }

    if (!definition.verification.verified) {
      checks.push({
        id: `hardware-reference-${definition.id}`,
        severity: 'warning',
        category: 'compatibility',
        title: 'Reference-only hardware profile',
        message: `${definition.label} is a project-reference profile rather than manufacturer-verified hardware.`,
        suggestion: definition.verification.notes,
      });
    }

    if (definition.geometrySupport?.status === 'partial') {
      checks.push({
        id: `hardware-partial-support-${definition.id}`,
        severity: 'warning',
        category: 'coverage',
        title: 'Partial hardware geometry support',
        message: definition.geometrySupport.notes,
        suggestion: 'Review manufacturer documentation for unsupported mounting choices.',
      });
    }

    if (
      document.parameters.hardwareDrillingMode === 'recommended' &&
      hardware.category === 'drawer_slide' &&
      !definition.drilling.enabled
    ) {
      checks.push({
        id: `hardware-drilling-unavailable-${definition.id}`,
        severity: 'warning',
        category: 'manufacturing',
        title: 'Automatic slide drilling unavailable',
        message: `${definition.label} does not encode one unambiguous supported drilling pattern.`,
        suggestion: 'Keep drilling off and use verified manufacturer hole selection, or select a profile with encoded drilling.',
      });
    }
  }
}

function checkShelfHardwareCollisions(document: CabinetDocument, checks: DesignHealthCheck[]) {
  const shelves = document.parts.filter(part => part.category === 'shelf');
  for (const shelf of shelves) {
    for (const hardware of document.hardware) {
      if (!boxesOverlap(worldBox(shelf), hardware.keepout, 0.5)) continue;
      checks.push({
        id: `shelf-hardware-collision-${shelf.id}-${hardware.id}`,
        severity: 'error',
        category: 'compatibility',
        title: 'Shelf / hardware collision',
        message: `${shelf.name} intersects the keepout envelope for ${hardware.label}.`,
        partIds: [shelf.id, hardware.mountingReference.partId],
        suggestion: 'Move the shelf, change opening layout, or select hardware with a compatible envelope.',
      });
    }
  }
}

function checkEdgeDistances(
  document: CabinetDocument,
  partFeatures: Record<string, CadFeature[]>,
  checks: DesignHealthCheck[],
) {
  for (const part of document.parts) {
    for (const [index, hole] of (part.geometry?.holes ?? []).entries()) {
      if (hole.kind !== 'circle' || part.geometry?.axis !== 'x') continue;
      const margin = Math.min(
        hole.u - hole.radius,
        part.size.y - hole.u - hole.radius,
        hole.v - hole.radius,
        part.size.z - hole.v - hole.radius,
      );
      addEdgeDistanceCheck(part, `profile-hole-${index + 1}`, margin, checks);
    }

    for (const feature of partFeatures[part.id] ?? []) {
      if (feature.kind !== 'hole' || !feature.position) continue;
      const planeAxes = axes.filter(axis => axis !== feature.axis);
      let margin = Number.POSITIVE_INFINITY;

      const radius = numberParameter(feature.parameters.radius);
      if (radius !== null && !feature.size) {
        for (const axis of planeAxes) {
          const center = feature.position[axis];
          const limit = part.size[axis];
          margin = Math.min(margin, center - radius, limit - center - radius);
        }
      } else if (feature.size) {
        for (const axis of planeAxes) {
          const start = feature.position[axis];
          const end = start + feature.size[axis];
          margin = Math.min(margin, start, part.size[axis] - end);
        }
      }

      if (Number.isFinite(margin)) {
        addEdgeDistanceCheck(part, feature.id, margin, checks, feature.id);
      }
    }
  }
}

function addEdgeDistanceCheck(
  part: CadPart,
  token: string,
  margin: number,
  checks: DesignHealthCheck[],
  featureId?: string,
) {
  if (margin >= 3) return;
  checks.push({
    id: `edge-distance-${part.id}-${token}`,
    severity: margin < 0 ? 'error' : 'warning',
    category: 'manufacturing',
    title: margin < 0 ? 'Machining exceeds part boundary' : 'Low machining edge distance',
    message: margin < 0
      ? `${part.name} contains drilling that extends ${Math.abs(margin).toFixed(2)} mm past a part edge.`
      : `${part.name} has only ${margin.toFixed(2)} mm between drilling and a part edge.`,
    partIds: [part.id],
    featureIds: featureId ? [featureId] : undefined,
    suggestion: 'Review hardware registration, hole diameter, and edge clearance before machining.',
  });
}

function checkMachiningOverlap(
  document: CabinetDocument,
  partFeatures: Record<string, CadFeature[]>,
  checks: DesignHealthCheck[],
) {
  for (const part of document.parts) {
    const features = (partFeatures[part.id] ?? [])
      .filter(feature => machiningKinds.has(feature.kind) && feature.position && feature.size);

    for (let left = 0; left < features.length; left += 1) {
      for (let right = left + 1; right < features.length; right += 1) {
        const a = features[left];
        const b = features[right];
        if (!a.position || !a.size || !b.position || !b.size) continue;
        if (!boxesOverlap({ position: a.position, size: a.size }, { position: b.position, size: b.size }, 0.25)) continue;
        checks.push({
          id: `machining-overlap-${part.id}-${left + 1}-${right + 1}`,
          severity: 'warning',
          category: 'manufacturing',
          title: 'Overlapping machining',
          message: `${a.label} and ${b.label} overlap on ${part.name}.`,
          partIds: [part.id],
          featureIds: [a.id, b.id],
          suggestion: 'Confirm the overlap is intentional and can be produced as one compatible machining setup.',
        });
      }
    }
  }
}

function hardwareIssueTitle(message: string) {
  if (/slide length/i.test(message)) return 'Drawer slide depth conflict';
  if (/cup depth|break through/i.test(message)) return 'Hinge cup breakthrough';
  if (/no drawers|no doors/i.test(message)) return 'Hardware has no target opening';
  if (/not marked compatible/i.test(message)) return 'Unsupported hardware family';
  if (/targets .* fronts/i.test(message)) return 'Hinge/front application mismatch';
  return 'Hardware compatibility';
}

function hardwareIssueSuggestion(message: string) {
  if (/slide length/i.test(message)) return 'Increase cabinet depth or select a shorter slide.';
  if (/cup depth|break through/i.test(message)) return 'Use thicker door stock or reduce/select a shallower hinge cup.';
  if (/no drawers|no doors/i.test(message)) return 'Change the layout or disable the unused hardware.';
  return 'Review the selected hardware profile and cabinet construction.';
}

function numberParameter(value: string | number | boolean | number[] | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function worldBox(part: CadPart) {
  return { position: part.position, size: part.size };
}

function boxesOverlap(
  a: { position: { x: number; y: number; z: number }; size: { x: number; y: number; z: number } },
  b: { position: { x: number; y: number; z: number }; size: { x: number; y: number; z: number } },
  tolerance = 0,
) {
  return axes.every(axis =>
    Math.min(a.position[axis] + a.size[axis], b.position[axis] + b.size[axis])
      - Math.max(a.position[axis], b.position[axis]) > tolerance
  );
}
