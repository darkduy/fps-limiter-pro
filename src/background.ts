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
  ): Promise<void> {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith('http')) return;

    try {
      const tabAnalytics = this.tabAnalytics.get(tab.id);
      const systemInfo = await this.getSystemInfo();
      
      const config = this.getConfigForUrl(
        tab.url,
        tab.active ?? false,
        tab.audible ?? false,
        this.activeProfile,
        this.settingsCache,
        performanceData,
        tabAnalytics,
        systemInfo,
      );

      const message: InternalMessage = {
        type: 'CONFIG_UPDATED',
        data: {
          config,
          performanceData,
          systemInfo,
          adaptiveMode: this.settingsCache.aiOptimization,
          debugMode: this.settingsCache.debugLogging,
        },
        source: 'background',
        timestamp: Date.now(),
        tabId: tab.id,
      };

      await chrome.tabs.sendMessage(tab.id, message);
      
      // Update analytics
      if (tabAnalytics) {
        tabAnalytics.usage.lastActive = Date.now();
        this.tabAnalytics.set(tab.id, tabAnalytics);
      }

      // Update badge
      this.updateTabBadge(tab, config, tabAnalytics);
      
      // Log for debugging
      if (this.settingsCache.debugLogging) {
        console.log(`Updated config for ${tab.url}: ${config.value} FPS`, config);
      }
    } catch (error) {
      if (this.settingsCache.debugLogging) {
        console.warn(`Failed to update tab ${tab.id}:`, error);
      }
    }
  }

  /**
   * Enhanced badge update with visual indicators
   */
  private updateTabBadge(tab: chrome.tabs.Tab, config: SiteConfig, analytics?: TabAnalytics): void {
    if (!tab.id || !tab.url) return;

    try {
      const host = new URL(tab.url).hostname;
      let text = '';
      let color = '#4285f4';

      // Heavy page indicator
      if (this.settingsCache.heavyHosts?.includes(host)) {
        text = '!';
        color = '#ea4335';
      }
      // Gaming mode indicator
      else if (this.settingsCache.gamingMode && analytics?.classification.type === 'game') {
        text = '🎮';
        color = '#34a853';
      }
      // Battery optimization indicator
      else if (this.settingsCache.batteryOptimization && config.priority === 'battery') {
        text = '🔋';
        color = '#fbbc04';
      }
      // AI optimization indicator
      else if (this.settingsCache.aiOptimization && config.adaptive) {
        text = '🧠';
        color = '#9c27b0';
      }
      // Performance indicator
      else if (analytics && analytics.performance.averageFps > 100) {
        text = '⚡';
        color = '#4caf50';
      }

      chrome.action.setBadgeText({ tabId: tab.id, text });
      chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color });
    } catch (error) {
      if (this.settingsCache.debugLogging) {
        console.warn('Badge update error:', error);
      }
    }
  }

  /**
   * Enhanced tab suspension with intelligent criteria
   */
  private async checkAndSuspendTabs(): Promise<void> {
    const { suspenderEnable = false, suspenderTimeout = 30, suspenderWhitelist = [] } = this.settingsCache;
    
    if (!suspenderEnable) return;

    try {
      const timeoutMs = suspenderTimeout * 60 * 1000;
      const now = Date.now();
      const tabs = await chrome.tabs.query({ 
        url: ["http://*/*", "https://*/*"], 
        discarded: false, 
        autoDiscardable: true 
      });

      for (const tab of tabs) {
        if (!tab.id || tab.active || tab.audible || tab.pinned) continue;

        const lastActivated = this.tabLastActivated.get(tab.id) || now;
        const isWhitelisted = tab.url && suspenderWhitelist.some(domain => tab.url!.includes(domain));
        
        if (isWhitelisted) continue;

        // Check if tab has important ongoing activity
        const analytics = this.tabAnalytics.get(tab.id);
        if (analytics && this.isTabImportant(analytics)) continue;

        // Smart suspension based on tab importance and user patterns
        if (now - lastActivated > timeoutMs) {
          const shouldSuspend = await this.shouldSuspendTab(tab, analytics);
          
          if (shouldSuspend && chrome.tabs && chrome.tabs.discard) {
            await chrome.tabs.discard(tab.id);
            this.updateStatistics('tabsSuspended', 1);
            
            if (this.settingsCache.notifications?.types.performanceAlerts) {
              await this.notificationManager.showNotification({
                type: 'info',
                title: 'Tab Suspended',
                message: `Suspended inactive tab to save memory: ${tab.title}`,
                priority: 'low',
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Tab suspension error:', error);
    }
  }

  /**
   * Intelligent tab importance assessment
   */
  private isTabImportant(analytics: TabAnalytics): boolean {
    // Don't suspend tabs with ongoing important activity
    const recentActivity = Date.now() - analytics.usage.lastActive < 5 * 60 * 1000; // 5 minutes
    const hasMediaContent = analytics.classification.type === 'video' || 
                           analytics.classification.features.includes('media');
    const highUsage = analytics.usage.totalTime > 30 * 60 * 1000; // 30 minutes+
    const isGame = analytics.classification.type === 'game';

    return recentActivity || hasMediaContent || highUsage || isGame;
  }

  /**
   * AI-assisted tab suspension decision
   */
  private async shouldSuspendTab(tab: chrome.tabs.Tab, analytics?: TabAnalytics): Promise<boolean> {
    if (!this.settingsCache.aiOptimization || !this.aiEngine.isReady()) {
      return true; // Default suspension
    }

    return await this.aiEngine.shouldSuspendTab(tab, analytics, this.systemInfo);
  }

  /**
   * System information gathering
   */
  private async getSystemInfo(): Promise<SystemInfo | null> {
    try {
      const [cpuInfo, memoryInfo] = await Promise.all([
        chrome.system?.cpu?.getInfo?.() || null,
        chrome.system?.memory?.getInfo?.() || null,
      ]);

      const battery = await this.getBatteryInfo();
      const network = await this.getNetworkInfo();

      this.systemInfo = {
        hardware: {
          cpu: {
            cores: cpuInfo?.numOfProcessors || 4,
            usage: this.calculateCpuUsage(cpuInfo),
            temperature: undefined, // Not available in Chrome extensions
          },
          memory: {
            total: memoryInfo?.capacity || 0,
            available: memoryInfo?.availableCapacity || 0,
            usage: memoryInfo ? ((memoryInfo.capacity - memoryInfo.availableCapacity) / memoryInfo.capacity) * 100 : 0,
          },
        },
        battery,
        network,
        thermal: {
          state: 'normal', // Estimated based on CPU usage
        },
      };

      return this.systemInfo;
    } catch (error) {
      console.warn('Failed to gather system info:', error);
      return null;
    }
  }

  private async getBatteryInfo(): Promise<SystemInfo['battery']> {
    try {
      // @ts-ignore - Battery API might not be available
      const battery = await navigator.getBattery?.();
      return battery ? {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      } : undefined;
    } catch {
      return undefined;
    }
  }

  private async getNetworkInfo(): Promise<SystemInfo['network']> {
    try {
      // @ts-ignore - Network Information API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return connection ? {
        type: connection.effectiveType || 'unknown',
        speed: connection.downlink || 0,
        latency: connection.rtt || 0,
      } : {
        type: 'unknown',
        speed: 0,
        latency: 0,
      };
    } catch {
      return {
        type: 'unknown',
        speed: 0,
        latency: 0,
      };
    }
  }

  private calculateCpuUsage(cpuInfo: any): number {
    if (!cpuInfo || !cpuInfo.processors) return 0;
    
    const totalUsage = cpuInfo.processors.reduce((sum: number, processor: any) => {
      const usage = processor.usage;
      if (!usage) return sum;
      
      const totalTime = usage.user + usage.kernel + usage.idle + usage.total;
      const activeTime = totalTime - usage.idle;
      return sum + (activeTime / totalTime) * 100;
    }, 0);
    
    return totalUsage / cpuInfo.processors.length;
  }

  /**
   * Statistics tracking
   */
  private updateStatistics(metric: keyof NonNullable<SettingsCache['statistics']>, value: number): void {
    if (!this.settingsCache.statistics) {
      this.settingsCache.statistics = {
        totalOptimizations: 0,
        powerSaved: 0,
        performanceGain: 0,
        tabsSuspended: 0,
        gamesDetected: 0,
        lastResetDate: Date.now(),
      };
    }

    this.settingsCache.statistics[metric] += value;
    
    // Persist to storage (debounced)
    this.debouncedSaveStatistics();
  }

  private debouncedSaveStatistics = this.debounce(() => {
    chrome.storage.local.set({ statistics: this.settingsCache.statistics });
  }, 5000);

  /**
   * Utility debounce function
   */
  private debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  /**
   * Event listeners setup
   */
  private async setupEventListeners(): Promise<void> {
    // Storage changes
    chrome.storage.onChanged.addListener(async () => {
      await this.loadAndCacheSettings();
      await this.updateAllTabs();
    });

    // Runtime messages
    chrome.runtime.onMessage.addListener(async (message: InternalMessage, sender, sendResponse) => {
      try {
        await this.handleRuntimeMessage(message, sender);
        sendResponse({ success: true });
      } catch (error) {
        console.error('Runtime message error:', error);
        sendResponse({ success: false, error: error.message });
      }
    });

    // Tab events
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      this.tabLastActivated.set(activeInfo.tabId, Date.now());
      
      // Update analytics
      const analytics = this.tabAnalytics.get(activeInfo.tabId);
      if (analytics) {
        analytics.usage.lastActive = Date.now();
        analytics.usage.activations++;
        this.tabAnalytics.set(activeInfo.tabId, analytics);
      }
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' || changeInfo.audible !== undefined) {
        await this.updateTabConfig(tab);
      }
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.tabLastActivated.delete(tabId);
      this.tabAnalytics.delete(tabId);
    });

    // Keyboard shortcuts
    chrome.commands.onCommand.addListener(async (command) => {
      await this.handleKeyboardShortcut(command);
    });

    // Alarms
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      await this.handleAlarm(alarm);
    });
  }

  /**
   * Handle runtime messages
   */
  private async handleRuntimeMessage(message: InternalMessage, sender: chrome.runtime.MessageSender): Promise<void> {
    const tabId = sender.tab?.id;

    switch (message.type) {
      case 'PERFORMANCE_DATA':
        if (tabId && message.data) {
          await this.handlePerformanceData(tabId, message.data);
        }
        break;

      case 'GAME_DETECTED':
        if (tabId && sender.tab?.url) {
          await this.handleGameDetection(tabId, sender.tab.url, message.data);
        }
        break;

      case 'AI_RECOMMENDATION':
        if (message.data) {
          await this.handleAIRecommendation(message.data);
        }
        break;

      default:
        if (this.settingsCache.debugLogging) {
          console.log('Unhandled message type:', message.type);
        }
    }
  }

  private async handlePerformanceData(tabId: number, data: PerformanceMetrics): Promise<void> {
    // Update or create tab analytics
    let analytics = this.tabAnalytics.get(tabId);
    if (!analytics) {
      const tab = await chrome.tabs.get(tabId);
      analytics = this.createTabAnalytics(tab);
    }

    // Update performance metrics
    analytics.performance.averageFps = (analytics.performance.averageFps + data.averageFps) / 2;
    analytics.performance.peakFps = Math.max(analytics.performance.peakFps, data.averageFps);
    analytics.performance.minFps = Math.min(analytics.performance.minFps || data.averageFps, data.averageFps);
    analytics.performance.frameDrops += data.jankFrames;
    analytics.performance.powerConsumption = data.powerConsumption;
    analytics.usage.lastActive = Date.now();

    this.tabAnalytics.set(tabId, analytics);

    // Feed data to AI engine
    if (this.settingsCache.aiOptimization) {
      await this.aiEngine.processPerformanceData(tabId, data, analytics);
    }

    // Update statistics
    this.updateStatistics('totalOptimizations', 1);
  }

  private async handleGameDetection(tabId: number, url: string, gameData: GameDetectionResult): Promise<void> {
    let analytics = this.tabAnalytics.get(tabId);
    if (!analytics) {
      const tab = await chrome.tabs.get(tabId);
      analytics = this.createTabAnalytics(tab);
    }

    // Update classification
    analytics.classification = {
      type: 'game',
      confidence: gameData.confidence,
      features: gameData.features,
    };

    this.tabAnalytics.set(tabId, analytics);
    this.updateStatistics('gamesDetected', 1);

    // Show notification if enabled
    if (this.settingsCache.notifications?.types.gameDetection) {
      await this.notificationManager.showNotification({
        type: 'info',
        title: 'Game Detected',
        message: `${gameData.gameType.toUpperCase()} game detected - Optimizing for ${gameData.recommendedFps} FPS`,
        priority: 'medium',
      });
    }

    // Auto-apply gaming optimizations
    if (this.settingsCache.gamingMode) {
      const tab = await chrome.tabs.get(tabId);
      await this.updateTabConfig(tab, undefined, true);
    }
  }

  private async handleAIRecommendation(recommendation: AIRecommendation): Promise<void> {
    // Store recommendation
    await this.aiEngine.storeRecommendation(recommendation);

    // Show notification if enabled
    if (this.settingsCache.notifications?.types.aiRecommendations) {
      await this.notificationManager.showNotification({
        type: 'info',
        title: 'AI Recommendation',
        message: recommendation.title,
        priority: recommendation.impact === 'high' ? 'high' : 'medium',
      });
    }
  }

  private createTabAnalytics(tab: chrome.tabs.Tab): TabAnalytics {
    return {
      tabId: tab.id!,
      domain: new URL(tab.url!).hostname,
      url: tab.url!,
      title: tab.title || '',
      performance: {
        averageFps: 60,
        peakFps: 60,
        minFps: 60,
        frameDrops: 0,
        jankPercentage: 0,
        memoryLeaks: 0,
        powerConsumption: 0,
      },
      usage: {
        sessionStart: Date.now(),
        sessionDuration: 0,
        lastActive: Date.now(),
        activations: 1,
        totalTime: 0,
      },
      classification: {
        type: 'unknown',
        confidence: 0,
        features: [],
      },
    };
  }

  /**
   * Handle keyboard shortcuts
   */
  private async handleKeyboardShortcut(command: string): Promise<void> {
    switch (command) {
      case 'toggle_fps_limiter':
        const newState = !this.settingsCache.globalDisabled;
        await chrome.storage.local.set({ globalDisabled: newState });
        
        if (this.settingsCache.notifications?.enabled) {
          await this.notificationManager.showNotification({
            type: 'info',
            title: 'FPS Limiter',
            message: `FPS Limiter ${newState ? 'Disabled' : 'Enabled'}`,
            priority: 'medium',
          });
        }
        break;

      case 'cycle_fps_preset':
        await this.cycleFpsPreset();
        break;

      case 'toggle_gaming_mode':
        const gamingMode = !this.settingsCache.gamingMode;
        await chrome.storage.local.set({ gamingMode });
        
        if (this.settingsCache.notifications?.enabled) {
          await this.notificationManager.showNotification({
            type: 'info',
            title: 'Gaming Mode',
            message: `Gaming Mode ${gamingMode ? 'Enabled' : 'Disabled'}`,
            priority: 'medium',
          });
        }
        break;
    }
  }

  private async cycleFpsPreset(): Promise<void> {
    const presets = this.settingsCache.presets || DEFAULT_PRESETS;
    this.currentPresetIndex = (this.currentPresetIndex + 1) % presets.length;
    const preset = presets[this.currentPresetIndex];

    // Apply preset to active profile
    if (this.activeProfile) {
      this.activeProfile.settings.globalConfig.value = preset.fps;
      await chrome.storage.local.set({
        profiles: this.settingsCache.profiles?.map(p => 
          p.id === this.activeProfile?.id ? this.activeProfile : p
        )
      });
    } else {
      // Apply to global config
      await chrome.storage.local.set({
        globalConfig: { ...this.settingsCache.globalConfig, value: preset.fps }
      });
    }

    if (this.settingsCache.notifications?.enabled) {
      await this.notificationManager.showNotification({
        type: 'success',
        title: 'FPS Preset',
        message: `${preset.icon} ${preset.name} - ${preset.fps} FPS`,
        priority: 'medium',
      });
    }
  }

  /**
   * Handle alarms
   */
  private async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    switch (alarm.name) {
      case ALARM_NAMES.TAB_SUSPENDER:
        await this.checkAndSuspendTabs();
        break;

      case ALARM_NAMES.PERFORMANCE_MONITOR:
        if (this.settingsCache.performanceMonitoring) {
          await this.performanceMonitor.collectMetrics();
        }
        break;

      case ALARM_NAMES.AI_ANALYSIS:
        if (this.settingsCache.aiOptimization) {
          await this.aiEngine.performAnalysis();
        }
        break;

      case ALARM_NAMES.CLEANUP:
        await this.performCleanup();
        break;

      case ALARM_NAMES.STATISTICS:
        await this.updateDailyStatistics();
        break;
    }
  }

  /**
   * Create necessary alarms
   */
  private async createAlarms(): Promise<void> {
    // Tab suspender
    chrome.alarms.create(ALARM_NAMES.TAB_SUSPENDER, {
      delayInMinutes: 1,
      periodInMinutes: 1,
    });

    // Performance monitoring
    chrome.alarms.create(ALARM_NAMES.PERFORMANCE_MONITOR, {
      delayInMinutes: 0.5,
      periodInMinutes: 0.5,
    });

    // AI analysis
    chrome.alarms.create(ALARM_NAMES.AI_ANALYSIS, {
      delayInMinutes: 5,
      periodInMinutes: 10,
    });

    // Cleanup
    chrome.alarms.create(ALARM_NAMES.CLEANUP, {
      delayInMinutes: 60,
      periodInMinutes: 60,
    });

    // Statistics
    chrome.alarms.create(ALARM_NAMES.STATISTICS, {
      delayInMinutes: 1440, // Daily
      periodInMinutes: 1440,
    });
  }

  /**
   * Update all tabs
   */
  private async updateAllTabs(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
      const systemInfo = await this.getSystemInfo();
      
      await Promise.all(tabs.map(async (tab) => {
        try {
          await this.updateTabConfig(tab, undefined, false);
        } catch (error) {
          // Ignore individual tab errors
        }
      }));
    } catch (error) {
      console.error('Failed to update all tabs:', error);
    }
  }

  /**
   * Data migration
   */
  private async migrateDataIfNeeded(): Promise<void> {
    const currentVersion = 2;
    const storedVersion = this.settingsCache.migrationVersion || 1;

    if (storedVersion < currentVersion) {
      console.log(`Migrating data from version ${storedVersion} to ${currentVersion}`);
      
      // Perform migrations
      if (storedVersion < 2) {
        await this.migrateToV2();
      }

      await chrome.storage.local.set({ migrationVersion: currentVersion });
      console.log('Data migration completed');
    }
  }

  private async migrateToV2(): Promise<void> {
    // Migrate old settings format to new structure
    // Add default presets if they don't exist
    if (!this.settingsCache.presets || this.settingsCache.presets.length === 0) {
      await chrome.storage.local.set({ presets: DEFAULT_PRESETS });
    }

    // Initialize new statistics
    if (!this.settingsCache.statistics) {
      await chrome.storage.local.set({
        statistics: {
          totalOptimizations: 0,
          powerSaved: 0,
          performanceGain: 0,
          tabsSuspended: 0,
          gamesDetected: 0,
          lastResetDate: Date.now(),
        }
      });
    }
  }

  /**
   * Cleanup old data
   */
  private async performCleanup(): Promise<void> {
    try {
      // Remove old tab analytics (older than 7 days)
      const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      for (const [tabId, analytics] of this.tabAnalytics.entries()) {
        if (analytics.usage.lastActive < cutoffTime) {
          this.tabAnalytics.delete(tabId);
        }
      }

      // Clean up AI engine data
      if (this.aiEngine.isReady()) {
        await this.aiEngine.cleanup();
      }

      if (this.settingsCache.debugLogging) {
        console.log('Cleanup completed');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Update daily statistics
   */
  private async updateDailyStatistics(): Promise<void> {
    // Reset daily counters or perform daily analysis
    await this.aiEngine.performDailyAnalysis(this.tabAnalytics);
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Handle service worker lifecycle
chrome.runtime.onStartup.addListener(() => {
  backgroundService.loadAndCacheSettings();
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 FPS Limiter Pro Max installed successfully!');
  } else if (details.reason === 'update') {
    console.log(`🔄 FPS Limiter Pro Max updated to version ${chrome.runtime.getManifest().version}`);
  }
});

// Export for testing
export { BackgroundService };
