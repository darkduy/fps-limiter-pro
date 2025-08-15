// Enhanced types with new features
export interface SiteConfig { 
  enabled: boolean; 
  value: number;
  adaptive?: boolean;
  priority?: 'performance' | 'battery' | 'balanced';
}

export interface AutoModeConfig { 
  domain: string; 
  fps: number;
  conditions?: {
    batteryLevel?: number;
    cpuUsage?: number;
    timeRange?: { start: string; end: string };
  };
}

export interface ProfileSettings { 
  globalConfig: SiteConfig; 
  autoModeConfigs: AutoModeConfig[];
  adaptiveSettings?: AdaptiveSettings;
}

export interface Profile { 
  id: string; 
  name: string; 
  settings: ProfileSettings;
  icon?: string;
  hotkey?: string;
  conditions?: ProfileCondition[];
}

export interface AdaptiveSettings {
  enabled: boolean;
  batteryOptimization: boolean;
  cpuThrottling: boolean;
  networkOptimization: boolean;
  thermalThrottling: boolean;
  gameMode: boolean;
}

export interface ProfileCondition {
  type: 'time' | 'battery' | 'cpu' | 'network' | 'domain';
  value: any;
  operator: 'eq' | 'gt' | 'lt' | 'contains';
}

export interface PerformanceMetrics {
  frameTime: number;
  cpuUsage: number;
  memoryUsage: number;
  batteryLevel: number;
  thermalState: 'normal' | 'fair' | 'serious' | 'critical';
  networkType: string;
}

export interface TabAnalytics {
  tabId: number;
  domain: string;
  averageFps: number;
  peakFps: number;
  frameDrops: number;
  memoryLeaks: number;
  powerConsumption: number;
  lastActive: number;
  sessionDuration: number;
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
  
  // New v2.0 features
  adaptiveMode?: boolean;
  aiOptimization?: boolean;
  performanceMonitoring?: boolean;
  smartScheduling?: boolean;
  batteryOptimization?: boolean;
  gamingMode?: boolean;
  developerMode?: boolean;
  analyticsEnabled?: boolean;
  
  // Advanced settings
  maxCpuUsage?: number;
  thermalProtection?: boolean;
  networkAwareness?: boolean;
  presets?: FpsPreset[];
  hotkeys?: { [key: string]: string };
  notifications?: NotificationSettings;
}

export interface FpsPreset {
  id: string;
  name: string;
  fps: number;
  icon: string;
  description: string;
  conditions?: ProfileCondition[];
}

export interface NotificationSettings {
  enabled: boolean;
  performanceAlerts: boolean;
  batteryWarnings: boolean;
  thermalAlerts: boolean;
  gameDetection: boolean;
}

export interface AIRecommendation {
  type: 'fps' | 'profile' | 'setting';
  title: string;
  description: string;
  value: any;
  confidence: number;
  reason: string;
}

export interface GameDetectionResult {
  isGame: boolean;
  confidence: number;
  gameType: 'fps' | 'moba' | 'strategy' | 'casual' | 'unknown';
  recommendedFps: number;
  features: string[];
}
