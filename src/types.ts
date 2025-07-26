// src/types.ts

export interface SiteConfig {
  enabled: boolean;
  value: number;
}

export interface AutoModeConfig {
  domain: string;
  fps: number;
}

export interface SettingsCache {
  [key: string]: any; // Cho phép các key động cho cài đặt từng trang
  globalDisabled?: boolean;
  autoModeMasterEnable?: boolean;
  applyInFrames?: boolean;
  globalConfig?: SiteConfig;
  autoModeConfigs?: AutoModeConfig[];
  heavyHosts?: string[];
}
