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

export type AppInfo = {
  name: string;
  version: string;
  platform: string;
  electron?: string;
  chromium?: string;
  isPackaged: boolean;
};

export type RecentProject = {
  path: string;
  name: string;
  updatedAt: number;
};

export type CloseDecision = 'save' | 'discard' | 'cancel';
export type CloseResolution = 'approve' | 'cancel';

export type CabinetDesktopApi = {
  platform: string;
  getAppInfo(): Promise<AppInfo>;
  confirmClose(options: { documentName: string }): Promise<CloseDecision>;
  resolveClose(resolution: CloseResolution): Promise<boolean>;
  onCloseRequested(callback: () => void): void;
  offCloseRequested(): void;
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
  saveText(options: {
    content: string;
    suggestedName: string;
    kind: 'csv' | 'html' | 'dxf' | 'svg' | 'json';
  }): Promise<DesktopSaveResult>;
  saveBinary(options: {
    bytes: ArrayBuffer;
    suggestedName: string;
    kind: 'zip';
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
