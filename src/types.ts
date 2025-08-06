// src/types.ts
export interface SiteConfig {
  enabled: boolean;
  value: number;
}

export interface AutoModeConfig {
  domain: string;
  fps: number;
}

export interface ProfileSettings {
  globalConfig: SiteConfig;
  autoModeConfigs: AutoModeConfig[];
}

export interface Profile {
  id: string;
  name: string;
  settings: ProfileSettings;
}

export interface SettingsCache {
  [key: string]: any;
  globalDisabled?: boolean;
  autoModeMasterEnable?: boolean;
  applyInFrames?: boolean;
  heavyHosts?: string[];
  profiles?: Profile[];
  activeProfileId?: string | null;
  suspenderEnable?: boolean;
  suspenderTimeout?: number;
  suspenderWhitelist?: string[];
}
