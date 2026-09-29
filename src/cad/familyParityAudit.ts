import rawMatrix from './data/familyCapabilityMatrix.json';
import type { CabinetFamily } from './types';

export type FamilyCapabilityStatus =
  | 'geometry-driving'
  | 'manufacturing-driving'
  | 'compatibility-only'
  | 'unsupported';

export type FamilyParityState = 'unverified' | 'known-gap';

export type FamilyCapabilityRow = {
  family: CabinetFamily;
  key: string;
  section: string;
  status: FamilyCapabilityStatus;
  owner: string;
  parity: FamilyParityState;
  note: string | null;
};

type RawCapabilityMatrix = {
  schemaVersion: number;
  standaloneBaseCommit: string;
  referenceCommit: string;
  methodology: {
    summary: string;
    caveats: string[];
  };
  counts: Record<CabinetFamily, Record<string, number>>;
  rows: FamilyCapabilityRow[];
};

const matrix = rawMatrix as RawCapabilityMatrix;

export const FAMILY_CAPABILITY_MATRIX_VERSION = matrix.schemaVersion;
export const FAMILY_CAPABILITY_STANDALONE_BASE = matrix.standaloneBaseCommit;
export const FAMILY_CAPABILITY_REFERENCE_COMMIT = matrix.referenceCommit;

export function familyCapabilityRows(family?: CabinetFamily): FamilyCapabilityRow[] {
  return family
    ? matrix.rows.filter(row => row.family === family)
    : [...matrix.rows];
}

export function familyCapabilityFor(family: CabinetFamily, key: string): FamilyCapabilityRow | null {
  return matrix.rows.find(row => row.family === family && row.key === key) ?? null;
}

export function familyCapabilitySummary(family: CabinetFamily) {
  const rows = familyCapabilityRows(family);
  return {
    total: rows.length,
    geometryDriving: rows.filter(row => row.status === 'geometry-driving').length,
    manufacturingDriving: rows.filter(row => row.status === 'manufacturing-driving').length,
    compatibilityOnly: rows.filter(row => row.status === 'compatibility-only').length,
    unsupported: rows.filter(row => row.status === 'unsupported').length,
    knownGaps: rows.filter(row => row.parity === 'known-gap').length,
  };
}
