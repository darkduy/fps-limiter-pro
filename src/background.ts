// src/background.ts - Enhanced Background Script with AI and Modern Features
import type {
  SettingsCache,
  SiteConfig,
  Profile,
  PerformanceMetrics,
  TabAnalytics,
  AIRecommendation,
  GameDetectionResult,
  FpsPreset,
  SystemInfo,
  InternalMessage,
  EventType,
} from './types';
import { AIEngine } from './services/aiEngine';
import { PerformanceMonitor } from './services/performanceMonitor';
import { ProfileManager } from './services/profileManager';
import { GameDetector } from './services/gameDetector';
import { PowerManager } from './services/powerManager';
import { NotificationManager } from './services/notificationManager';

// Constants
const ALARM_NAMES = {
  TAB_SUSPENDER: 'tabSuspenderAlarm',
  PERFORMANCE_MONITOR: 'performanceMonitorAlarm',
  AI_ANALYSIS: 'aiAnalysisAlarm',
  CLEANUP: 'cleanupAlarm',
  STATISTICS: 'statisticsAlarm',
} as const;

const DEFAULT_PRESETS: FpsPreset[] = [
  {
    id: 'eco',
    name: 'Eco Mode',
    fps: 30,
    icon: '🌱',
    description: 'Maximum battery savings',
    category: 'eco',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    fps: 60,
    icon: '⚖️',
    description: 'Perfect balance of performance and efficiency',
    category: 'balanced',
  },
  {
    id: 'performance',
    name: 'Performance',
    fps: 120,
    icon: '⚡',
    description: 'High performance for demanding tasks',
    category: 'performance',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    fps: 144,
    icon: '🎮',
    description: 'Optimized for gaming experience',
    category: 'gaming',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    fps: 240,
    icon: '🚀',
    description: 'Maximum performance for high-end displays',
    category: 'ultra',
  },
];

/**
 * Main Background Service Worker Class
 */
class BackgroundService {
  // Core services
  private aiEngine: AIEngine;
  private performanceMonitor: PerformanceMonitor;
  private profileManager: ProfileManager;
  private gameDetector: GameDetector;
  private powerManager: PowerManager;
  private notificationManager: NotificationManager;

  // State management
  private settingsCache: SettingsCache = {};
  private activeProfile: Profile | null = null;
  private tabAnalytics: Map<number, TabAnalytics> = new Map();
  private tabLastActivated: Map<number, number> = new Map();
  private systemInfo: SystemInfo | null = null;
  private currentPresetIndex = 0;

  constructor() {
    // Initialize services
    this.aiEngine = new AIEngine();
    this.performanceMonitor = new PerformanceMonitor();
    this.profileManager = new ProfileManager();
    this.gameDetector = new GameDetector();
    this.powerManager = new PowerManager();
    this.notificationManager = new NotificationManager();

    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('🚀 FPS Limiter Pro Max v2.0 - Initializing Background Service');

    try {
      // Load settings and initialize services
      await this.loadAndCacheSettings();
      await this.initializeServices();
      await this.setupEventListeners();
      await this.createAlarms();
      await this.migrateDataIfNeeded();

      console.log('✅ Background Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Background Service:', error);
    }
  }

  /**
   * Load and cache all settings
   */
  public async loadAndCacheSettings(): Promise<void> {
    try {
      const data = await chrome.storage.local.get(null);

      this.settingsCache = {
        // Core settings
        globalDisabled: data.globalDisabled ?? false,
        autoModeMasterEnable: data.autoModeMasterEnable ?? true,
        applyInFrames: data.applyInFrames ?? false,
        globalConfig: data.globalConfig ?? { enabled: true, value: 60 },
        autoModeConfigs: data.autoModeConfigs ?? [],
        heavyHosts: data.heavyHosts ?? [],

        // Profile system
        profiles: data.profiles ?? [],
        activeProfileId: data.activeProfileId ?? null,

        // Tab suspender
        suspenderEnable: data.suspenderEnable ?? false,
        suspenderTimeout: data.suspenderTimeout ?? 30,
        suspenderWhitelist: data.suspenderWhitelist ?? [],

        // AI & Analytics
        aiOptimization: data.aiOptimization ?? true,
        analyticsEnabled: data.analyticsEnabled ?? true,
        performanceMonitoring: data.performanceMonitoring ?? true,
        smartScheduling: data.smartScheduling ?? true,

        // Power management
        batteryOptimization: data.batteryOptimization ?? true,
        thermalProtection: data.thermalProtection ?? true,
        maxCpuUsage: data.maxCpuUsage ?? 80,
        networkAwareness: data.networkAwareness ?? true,

        // Gaming
        gamingMode: data.gamingMode ?? false,
        gameDetection: data.gameDetection ?? true,
        detectionSensitivity: data.detectionSensitivity ?? 'medium',

        // UI & UX
        theme: data.theme ?? 'auto',
        animations: data.animations ?? true,
        notifications: data.notifications ?? {
          enabled: true,
          types: {
            performanceAlerts: true,
            batteryWarnings: true,
            thermalAlerts: true,
            gameDetection: true,
            aiRecommendations: true,
            profileSwitching: true,
          },
          frequency: 'immediate',
          quiet: { enabled: false, startTime: '22:00', endTime: '08:00' },
        },

        // Developer
        developerMode: data.developerMode ?? false,
        debugLogging: data.debugLogging ?? false,
        performanceOverlay: data.performanceOverlay ?? false,
        framePrecision: data.framePrecision ?? 'medium',
        updateFrequency: data.updateFrequency ?? 500,

        // Presets and hotkeys
        presets: data.presets ?? DEFAULT_PRESETS,
        hotkeys: data.hotkeys ?? {},

        // Statistics
        statistics: data.statistics ?? {
          totalOptimizations: 0,
          powerSaved: 0,
          performanceGain: 0,
          tabsSuspended: 0,
          gamesDetected: 0,
          lastResetDate: Date.now(),
        },

        // Version
        version: chrome.runtime.getManifest().version,
        migrationVersion: data.migrationVersion ?? 1,
      };

      // Load active profile
      const { profiles = [], activeProfileId = null } = this.settingsCache;
      if (activeProfileId) {
        this.activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;
      } else {
        this.activeProfile = profiles[0] || null;
      }

      // Update services with new settings
      await this.updateServicesWithSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private async initializeServices(): Promise<void> {
    await Promise.all([
      this.aiEngine.initialize(this.settingsCache),
      this.performanceMonitor.initialize(this.settingsCache),
      this.profileManager.initialize(this.settingsCache),
      this.gameDetector.initialize(this.settingsCache),
      this.powerManager.initialize(this.settingsCache),
      this.notificationManager.initialize(this.settingsCache),
    ]);
  }

  private async updateServicesWithSettings(): Promise<void> {
    await Promise.all([
      this.aiEngine.updateSettings(this.settingsCache),
      this.performanceMonitor.updateSettings(this.settingsCache),
      this.profileManager.updateSettings(this.settingsCache),
      this.gameDetector.updateSettings(this.settingsCache),
      this.powerManager.updateSettings(this.settingsCache),
      this.notificationManager.updateSettings(this.settingsCache),
    ]);
  }

  /**
   * Enhanced FPS configuration calculation with AI assistance
   */
  public getConfigForUrl(
    url: string,
    tabIsActive: boolean,
    tabIsAudible: boolean,
    profile: Profile | null,
    sCache: SettingsCache,
    performanceData?: PerformanceMetrics,
    tabAnalytics?: TabAnalytics,
    systemInfo?: SystemInfo,
  ): SiteConfig {
    const fallbackConfig: SiteConfig = {
      enabled: true,
      value: 60,
      adaptive: true,
      priority: 'balanced',
    };

    if (sCache.globalDisabled || !profile) {
      return { ...fallbackConfig, enabled: !sCache.globalDisabled };
    }

    const profileSettings = profile.settings;
    let baseConfig = profileSettings.globalConfig || fallbackConfig;

    try {
      const host = new URL(url).hostname;

      // AI-powered optimization
      if (sCache.aiOptimization && this.aiEngine.isReady()) {
        const aiSuggestion = this.aiEngine.getOptimalFps(
          url,
          tabAnalytics,
          performanceData,
          systemInfo,
        );
        if (aiSuggestion && aiSuggestion.confidence > 0.7) {
          baseConfig = { ...baseConfig, value: aiSuggestion.fps };
        }
      }

      // Game detection and optimization
      if (sCache.gameDetection || sCache.gamingMode) {
        const gameResult = this.gameDetector.analyzeUrl(url, tabAnalytics);
        if (gameResult.isGame && gameResult.confidence > 0.7) {
          baseConfig = {
            ...baseConfig,
            value: gameResult.recommendedFps,
            priority: 'performance',
            adaptive: true,
          };

          // Update statistics
          this.updateStatistics('gamesDetected', 1);
        }
      }

      // Auto mode processing with enhanced conditions
      if (sCache.autoModeMasterEnable) {
        // Background audio tab optimization
        if (!tabIsActive && tabIsAudible) {
          return {
            enabled: true,
            value: 5,
            priority: 'battery',
            adaptive: false,
          };
        }

        // Domain-specific configuration with conditions
        const autoConfig = (profileSettings.autoModeConfigs ?? []).find((config) => {
          if (!host.includes(config.domain)) return false;

          // Check advanced conditions
          if (config.conditions) {
            if (
              config.conditions.batteryLevel &&
              systemInfo?.battery &&
              systemInfo.battery.level < config.conditions.batteryLevel
            ) {
              return false;
            }

            if (
              config.conditions.cpuUsage &&
              performanceData?.cpuUsage &&
              performanceData.cpuUsage > config.conditions.cpuUsage
            ) {
              return false;
            }

            if (config.conditions.timeRange) {
              const now = new Date();
              const currentTime = now.getHours() * 100 + now.getMinutes();
              const startTime = parseInt(config.conditions.timeRange.start.replace(':', ''));
              const endTime = parseInt(config.conditions.timeRange.end.replace(':', ''));

              if (currentTime < startTime || currentTime > endTime) {
                return false;
              }
            }

            if (
              config.conditions.networkType &&
              systemInfo?.network &&
              !config.conditions.networkType.includes(systemInfo.network.type)
            ) {
              return false;
            }
          }

          return true;
        });

        if (autoConfig) {
          baseConfig = {
            enabled: true,
            value: autoConfig.fps,
            priority: 'balanced',
            adaptive: sCache.aiOptimization ?? true,
          };
        }
      }

      // Power management optimizations
      if (sCache.batteryOptimization || sCache.thermalProtection) {
        baseConfig = this.powerManager.optimizeConfig(
          baseConfig,
          performanceData,
          systemInfo,
          sCache,
        );
      }

      // Performance-based adaptive adjustments
      if (baseConfig.adaptive && performanceData) {
        baseConfig = this.performanceMonitor.adaptConfig(
          baseConfig,
          performanceData,
          tabAnalytics,
        );
      }

      return baseConfig;
    } catch (error) {
      console.error('Error calculating config for URL:', error);
      return baseConfig;
    }
  }

  /**
   * Update tab configuration with enhanced features
   */
  private async updateTabConfig(
    tab: chrome.tabs.Tab,
    performanceData?: PerformanceMetrics,
    force: boolean = false,
  ): Promise
