// src/types.ts - Enhanced type definitions for FPS Limiter Pro Max

/**
 * Core site configuration interface
 */
export interface SiteConfig {
  enabled: boolean;
  value: number;
  adaptive?: boolean;
  priority?: 'performance' | 'battery' | 'balanced';
  customSettings?: {
    enableInFrames?: boolean;
    thermalThrottling?: boolean;
    batteryOptimization?: boolean;
  };
}

/**
 * Auto-mode configuration with advanced conditions
 */
export interface AutoModeConfig {
  domain: string;
  fps: number;
  conditions?: {
    batteryLevel?: number;
    cpuUsage?: number;
    timeRange?: { start: string; end: string };
    networkType?: string[];
    gameMode?: boolean;
  };
  metadata?: {
    detectedType?: 'game' | 'video' | 'social' | 'productivity';
    confidence?: number;
    lastUpdated?: number;
  };
}

/**
 * Profile settings structure
 */
export interface ProfileSettings {
  globalConfig: SiteConfig;
  autoModeConfigs: AutoModeConfig[];
  adaptiveSettings?: AdaptiveSettings;
  powerSettings?: PowerSettings;
}

/**
 * User profile with metadata
 */
export interface Profile {
  id: string;
  name: string;
  settings: ProfileSettings;
  icon?: string;
  hotkey?: string;
  conditions?: ProfileCondition[];
  metadata?: {
    createdAt: number;
    updatedAt: number;
    usage: {
      activations: number;
      totalTime: number;
      averageFps: number;
    };
  };
}

/**
 * Adaptive performance settings
 */
export interface AdaptiveSettings {
  enabled: boolean;
  batteryOptimization: boolean;
  cpuThrottling: boolean;
  networkOptimization: boolean;
  thermalThrottling: boolean;
  gameMode: boolean;
  aiOptimization: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

/**
 * Power management settings
 */
export interface PowerSettings {
  enabled: boolean;
  lowBatteryThreshold: number;
  batteryModeFps: number;
  thermalProtection: boolean;
  cpuThreshold: number;
  networkAwareness: boolean;
}

/**
 * Profile activation conditions
 */
export interface ProfileCondition {
  type: 'time' | 'battery' | 'cpu' | 'network' | 'domain' | 'gameMode';
  value: any;
  operator: 'eq' | 'gt' | 'lt' | 'contains' | 'in' | 'between';
  enabled: boolean;
}

/**
 * Real-time performance metrics
 */
export interface PerformanceMetrics {
  frameTime: number;
  averageFps: number;
  jankFrames: number;
  cpuUsage: number;
  memoryUsage: number;
  batteryLevel: number;
  thermalState: 'normal' | 'fair' | 'serious' | 'critical';
  networkType: string;
  powerConsumption: number;
  timestamp: number;
}

/**
 * Tab analytics and tracking
 */
export interface TabAnalytics {
  tabId: number;
  domain: string;
  url: string;
  title: string;
  performance: {
    averageFps: number;
    peakFps: number;
    minFps: number;
    frameDrops: number;
    jankPercentage: number;
    memoryLeaks: number;
    powerConsumption: number;
  };
  usage: {
    sessionStart: number;
    sessionDuration: number;
    lastActive: number;
    activations: number;
    totalTime: number;
  };
  classification: {
    type: 'game' | 'video' | 'social' | 'productivity' | 'unknown';
    confidence: number;
    features: string[];
  };
}

/**
 * AI recommendation structure
 */
export interface AIRecommendation {
  id: string;
  type: 'fps' | 'profile' | 'setting' | 'optimization';
  category: 'performance' | 'battery' | 'gaming' | 'general';
  title: string;
  description: string;
  reasoning: string;
  value: any;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  estimatedImprovement?: {
    performance: number;
    battery: number;
    smoothness: number;
  };
  metadata: {
    createdAt: number;
    source: 'usage_pattern' | 'performance_analysis' | 'user_behavior' | 'system_state';
    basedOn: string[];
  };
}

/**
 * FPS presets with metadata
 */
export interface FpsPreset {
  id: string;
  name: string;
  fps: number;
  icon: string;
  description: string;
  category: 'eco' | 'balanced' | 'performance' | 'gaming' | 'ultra' | 'custom';
  conditions?: ProfileCondition[];
  metadata?: {
    usage: number;
    performance: number;
    battery: number;
  };
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  enabled: boolean;
  types: {
    performanceAlerts: boolean;
    batteryWarnings: boolean;
    thermalAlerts: boolean;
    gameDetection: boolean;
    aiRecommendations: boolean;
    profileSwitching: boolean;
  };
  frequency: 'immediate' | 'batched' | 'daily';
  quiet: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

/**
 * Game detection result
 */
export interface GameDetectionResult {
  isGame: boolean;
  confidence: number;
  gameType: 'fps' | 'moba' | 'strategy' | 'casual' | 'simulation' | 'unknown';
  recommendedFps: number;
  features: string[];
  metadata: {
    detectionMethod: string[];
    analysisTime: number;
    frameAnalysis?: {
      complexity: number;
      renderCalls: number;
      shaderUsage: number;
    };
  };
}

/**
 * System information
 */
export interface SystemInfo {
  hardware: {
    cpu: {
      cores: number;
      usage: number;
      temperature?: number;
    };
    memory: {
      total: number;
      available: number;
      usage: number;
    };
    gpu?: {
      name: string;
      memory: number;
      usage: number;
      temperature?: number;
    };
  };
  battery?: {
    level: number;
    charging: boolean;
    chargingTime?: number;
    dischargingTime?: number;
  };
  network: {
    type: string;
    speed: number;
    latency?: number;
  };
  thermal: {
    state: 'normal' | 'fair' | 'serious' | 'critical';
    cpuTemp?: number;
    gpuTemp?: number;
  };
}

/**
 * Main settings cache interface
 */
export interface SettingsCache {
  // Core settings
  globalDisabled?: boolean;
  autoModeMasterEnable?: boolean;
  applyInFrames?: boolean;
  globalConfig?: SiteConfig;
  autoModeConfigs?: AutoModeConfig[];
  heavyHosts?: string[];
  
  // Profile system
  profiles?: Profile[];
  activeProfileId?: string | null;
  
  // Tab suspender
  suspenderEnable?: boolean;
  suspenderTimeout?: number;
  suspenderWhitelist?: string[];
  
  // AI & Analytics
  aiOptimization?: boolean;
  analyticsEnabled?: boolean;
  performanceMonitoring?: boolean;
  smartScheduling?: boolean;
  
  // Power management
  batteryOptimization?: boolean;
  thermalProtection?: boolean;
  maxCpuUsage?: number;
  networkAwareness?: boolean;
  
  // Gaming
  gamingMode?: boolean;
  gameDetection?: boolean;
  detectionSensitivity?: 'low' | 'medium' | 'high';
  
  // UI & UX
  theme?: 'auto' | 'light' | 'dark';
  animations?: boolean;
  notifications?: NotificationSettings;
  
  // Developer
  developerMode?: boolean;
  debugLogging?: boolean;
  performanceOverlay?: boolean;
  framePrecision?: 'low' | 'medium' | 'high';
  updateFrequency?: number;
  
  // Presets and hotkeys
  presets?: FpsPreset[];
  hotkeys?: { [key: string]: string };
  
  // Statistics
  statistics?: {
    totalOptimizations: number;
    powerSaved: number;
    performanceGain: number;
    tabsSuspended: number;
    gamesDetected: number;
    lastResetDate: number;
  };
  
  // Version and migration
  version?: string;
  migrationVersion?: number;
  
  // Allow additional properties for extensibility
  [key: string]: any;
}

/**
 * Event types for internal communication
 */
export type EventType = 
  | 'CONFIG_UPDATED'
  | 'PERFORMANCE_DATA'
  | 'AI_RECOMMENDATION'
  | 'GAME_DETECTED'
  | 'BATTERY_WARNING'
  | 'THERMAL_WARNING'
  | 'PROFILE_SWITCHED'
  | 'TAB_SUSPENDED'
  | 'HEAVY_PAGE_DETECTED'
  | 'OPTIMIZATION_APPLIED';

/**
 * Internal message structure
 */
export interface InternalMessage {
  type: EventType;
  data?: any;
  source?: string;
  timestamp?: number;
  tabId?: number;
}

/**
 * Export and import structures
 */
export interface ExportData {
  version: string;
  timestamp: number;
  settings: Partial<SettingsCache>;
  profiles: Profile[];
  analytics?: {
    tabAnalytics: TabAnalytics[];
    statistics: any;
  };
  metadata: {
    exportedBy: string;
    totalSites: number;
    totalProfiles: number;
  };
}

export interface ImportResult {
  success: boolean;
  imported: {
    settings: number;
    profiles: number;
    sites: number;
  };
  skipped: {
    settings: number;
    profiles: number;
    sites: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Frame analysis for advanced performance monitoring
 */
export interface FrameAnalysis {
  timestamp: number;
  duration: number;
  type: 'smooth' | 'jank' | 'dropped';
  complexity: number;
  renderCalls: number;
  gpuTime?: number;
  cpuTime?: number;
}

/**
 * Memory usage tracking
 */
export interface MemoryUsage {
  used: number;
  total: number;
  limit: number;
  breakdown?: {
    javascript: number;
    dom: number;
    css: number;
    images: number;
    other: number;
  };
}

/**
 * Network performance metrics
 */
export interface NetworkMetrics {
  type: string;
  downlink: number;
  rtt: number;
  effectiveType: string;
  saveData: boolean;
}

/**
 * Utility types for type safety
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Validation schemas (for runtime type checking)
 */
export const SiteConfigSchema = {
  enabled: 'boolean',
  value: 'number',
  adaptive: 'boolean?',
  priority: 'string?',
} as const;

export const ProfileSchema = {
  id: 'string',
  name: 'string',
  settings: 'object',
  icon: 'string?',
  hotkey: 'string?',
} as const;
