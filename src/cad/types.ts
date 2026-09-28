export type PartCategory = 'carcass' | 'back' | 'shelf' | 'front' | 'drawer' | 'hardware';

export type Vec3 = { x: number; y: number; z: number };

export type CadPart = {
  id: string;
  name: string;
  category: PartCategory;
  material: string;
  position: Vec3;
  size: Vec3;
  color: string;
  visible: boolean;
  metadata?: Record<string, string | number | boolean>;
};

export type CabinetParameters = {
  width: number;
  height: number;
  depth: number;
  materialThickness: number;
  backThickness: number;
  shelfCount: number;
  doorCount: number;
  drawerCount: number;
  toeKickHeight: number;
  toeKickDepth: number;
  faceGap: number;
};

export type CabinetDocument = {
  version: 1;
  id: string;
  name: string;
  units: 'mm';
  parameters: CabinetParameters;
  parts: CadPart[];
};

export type ViewPreset = 'iso' | 'front' | 'right' | 'top';
