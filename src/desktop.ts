export type DesktopFileResult = {
  path: string;
  name: string;
  content: string;
};

export type DesktopSaveResult = {
  canceled: boolean;
  path?: string;
  name?: string;
};

export type RecoveryResult = {
  content: string;
  updatedAt: number;
} | null;

export type RecentProject = {
  path: string;
  name: string;
  updatedAt: number;
};

export type CabinetDesktopApi = {
  platform: string;
  openDocument(): Promise<DesktopFileResult | null>;
  openRecent(path: string): Promise<DesktopFileResult | null>;
  saveDocument(options: {
    content: string;
    path?: string | null;
    suggestedName: string;
    saveAs?: boolean;
  }): Promise<DesktopSaveResult>;
  saveStep(options: {
    bytes: ArrayBuffer;
    suggestedName: string;
  }): Promise<DesktopSaveResult>;
  listRecent(): Promise<RecentProject[]>;
  readRecovery(): Promise<RecoveryResult>;
  writeRecovery(content: string): Promise<void>;
  clearRecovery(): Promise<void>;
};

declare global {
  interface Window {
    cabinetDesktop?: CabinetDesktopApi;
  }
}

export function desktopApi() {
  return window.cabinetDesktop;
}
