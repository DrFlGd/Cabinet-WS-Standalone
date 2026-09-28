import type { CadPart, HardwareInstance } from './types';

export type BomRow = {
  material: string;
  size: { x: number; y: number; z: number };
  quantity: number;
  partIds: string[];
  names: string[];
};

const rounded = (value: number) => Math.round(value * 1000) / 1000;

export function buildBom(parts: CadPart[]): BomRow[] {
  const rows = new Map<string, BomRow>();

  for (const part of parts.filter(part => part.category !== 'hardware')) {
    const size = {
      x: rounded(part.size.x),
      y: rounded(part.size.y),
      z: rounded(part.size.z),
    };
    const key = [part.material, size.x, size.y, size.z].join('|');
    const existing = rows.get(key);
    if (existing) {
      existing.quantity += 1;
      existing.partIds.push(part.id);
      existing.names.push(part.name);
    } else {
      rows.set(key, {
        material: part.material,
        size,
        quantity: 1,
        partIds: [part.id],
        names: [part.name],
      });
    }
  }

  return [...rows.values()];
}


export type PurchasedHardwareBomRow = {
  definitionId: string;
  label: string;
  manufacturer: string;
  model: string;
  quantity: number;
  instanceIds: string[];
  verificationStatus: string;
};

export function buildPurchasedHardwareBom(hardware: HardwareInstance[]): PurchasedHardwareBomRow[] {
  const rows = new Map<string, PurchasedHardwareBomRow>();

  for (const instance of hardware) {
    const key = [
      instance.definitionId,
      instance.manufacturer,
      instance.model,
      instance.label,
      instance.verificationStatus,
    ].join('|');
    const existing = rows.get(key);
    if (existing) {
      existing.quantity += 1;
      existing.instanceIds.push(instance.id);
    } else {
      rows.set(key, {
        definitionId: instance.definitionId,
        label: instance.label,
        manufacturer: instance.manufacturer,
        model: instance.model,
        quantity: 1,
        instanceIds: [instance.id],
        verificationStatus: instance.verificationStatus,
      });
    }
  }

  return [...rows.values()];
}
