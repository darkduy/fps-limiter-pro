import type { 
  SettingsCache, 
  SiteConfig, 
  Profile, 
  PerformanceMetrics, 
  TabAnalytics,
  AIRecommendation,
  GameDetectionResult,
  FpsPreset
} from './types';

// Constants
const ALARM_NAME = 'tabSuspenderAlarm';
const PERFORMANCE_ALARM = 'performanceMonitorAlarm';
const AI_ANALYSIS_ALARM = 'aiAnalysisAlarm';

// Enhanced State Management
let settingsCache: SettingsCache = {};
let activeProfile: Profile | null = null;
let tabLastActivated: { [tabId: number]: number } = {};
let performanceMetrics: { [tabId: number]: PerformanceMetrics } = {};
let tabAnalytics: { [tabId: number]: TabAnalytics } = {};
let aiRecommendations: AIRecommendation[] = [];
let currentPresetIndex = 0;

// Default FPS Presets
const DEFAULT_PRESETS: FpsPreset[] = [
  { id: 'eco', name: 'Eco Mode', fps: 30, icon: '🌱', description: 'Battery saving mode' },
  { id: 'balanced', name: 'Balanced', fps: 60, icon: '⚖️', description: 'Perfect balance' },
  { id: 'performance', name: 'Performance', fps: 120, icon: '⚡', description: 'High performance' },
  { id: 'gaming', name: 'Gaming', fps: 144, icon: '🎮', description: 'Gaming optimized' },
  { id: 'ultra', name: 'Ultra', fps: 240, icon: '🚀', description: 'Maximum performance' }
];

// Enhanced Settings Loader
export async function loadAndCacheSettings(): Promise<void> {
    const data = await chrome.storage.local.get(null);
    settingsCache = {
        globalDisabled: data.globalDisabled ?? false,
        autoModeMasterEnable: data.autoModeMasterEnable ?? true,
        applyInFrames: data.applyInFrames ?? false,
        heavyHosts: data.heavyHosts || [],
        profiles: data.profiles || [],
        activeProfileId: data.activeProfileId || null,
        suspenderEnable: data.suspenderEnable ?? false,
        suspenderTimeout: data.suspenderTimeout ?? 30,
        suspenderWhitelist: data.suspenderWhitelist || [],
        
        // New v2.0 features
        adaptiveMode: data.adaptiveMode ?? true,
        aiOptimization: data.aiOptimization ?? true,
        performanceMonitoring: data.performanceMonitoring ?? true,
        smartScheduling: data.smartScheduling ?? true,
        batteryOptimization: data.batteryOptimization ?? true,
        gamingMode: data.gamingMode ?? false,
        developerMode: data.developerMode ?? false,
        analyticsEnabled: data.analyticsEnabled ?? true,
        
        maxCpuUsage: data.maxCpuUsage ?? 80,
        thermalProtection: data.thermalProtection ?? true,
        networkAwareness: data.networkAwareness ?? true,
        presets: data.presets || DEFAULT_PRESETS,
        hotkeys: data.hotkeys || {},
        notifications: data.notifications || {
            enabled: true,
            performanceAlerts: true,
            batteryWarnings: true,
            thermalAlerts: true,
            gameDetection: true
        }
    };
    
    const { profiles = [], activeProfileId = null } = settingsCache;
    if (activeProfileId) {
        activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || null;
    } else {
        activeProfile = profiles[0] || null;
    }
}

// AI-Powered Game Detection
export function detectGame(url: string, title: string, metadata: any = {}): GameDetectionResult {
    const gameIndicators = {
        domains: ['steam', 'itch.io', 'miniclip', 'kongregate', 'armor games', 'newgrounds'],
        keywords: ['game', 'play', 'player', 'level', 'score', 'fps', 'rpg', 'mmorpg', 'battle'],
        technologies: ['webgl', 'canvas', 'unity', 'unreal'],
        patterns: [/game/i, /play/i, /\.io$/]
    };
    
    let confidence = 0;
    let gameType: GameDetectionResult['gameType'] = 'unknown';
    let features: string[] = [];
    
    try {
        const host = new URL(url).hostname.toLowerCase();
        const titleLower = title.toLowerCase();
        
        // Domain analysis
        if (gameIndicators.domains.some(domain => host.includes(domain))) {
            confidence += 0.4;
            features.push('gaming_domain');
        }
        
        // Title analysis
        const keywordMatches = gameIndicators.keywords.filter(keyword => 
            titleLower.includes(keyword) || host.includes(keyword)
        );
        confidence += keywordMatches.length * 0.1;
        features.push(...keywordMatches.map(k => `keyword_${k}`));
        
        // Pattern matching
        if (gameIndicators.patterns.some(pattern => pattern.test(url) || pattern.test(title))) {
            confidence += 0.2;
            features.push('pattern_match');
        }
        
        // Game type detection
        if (titleLower.includes('fps') || titleLower.includes('shooter')) gameType = 'fps';
        else if (titleLower.includes('moba') || titleLower.includes('dota') || titleLower.includes('lol')) gameType = 'moba';
        else if (titleLower.includes('strategy') || titleLower.includes('rts')) gameType = 'strategy';
        else if (confidence < 0.3) gameType = 'casual';
        
        // Recommended FPS based on game type
        const recommendedFps = {
            'fps': 144,
            'moba': 120,
            'strategy': 60,
            'casual': 60,
            'unknown': 60
        }[gameType];
        
        return {
            isGame: confidence > 0.3,
            confidence: Math.min(confidence, 1),
            gameType,
            recommendedFps,
            features
        };
    } catch (e) {
        return {
            isGame: false,
            confidence: 0,
            gameType: 'unknown',
            recommendedFps: 60,
            features: []
        };
    }
}

// Enhanced Config Calculation with AI
export function getConfigForUrl(
    url: string, 
    tabIsActive: boolean, 
    tabIsAudible: boolean, 
    profile: Profile | null, 
    sCache: SettingsCache,
    performanceData?: PerformanceMetrics,
    tabMeta?: any
): SiteConfig {
    const fallbackConfig: SiteConfig = { enabled: true, value: 60, adaptive: true, priority: 'balanced' };
    if (sCache.globalDisabled || !profile) return { ...fallbackConfig, enabled: !sCache.globalDisabled };
    
    const profileSettings = profile.settings;
    let baseConfig = profileSettings.globalConfig || fallbackConfig;
    
    try {
        const host = new URL(url).hostname;
        
        // Gaming mode detection
        if (sCache.gamingMode || sCache.adaptiveMode) {
            const gameResult = detectGame(url, tabMeta?.title || '', tabMeta);
            if (gameResult.isGame && gameResult.confidence > 0.7) {
                baseConfig = { ...baseConfig, value: gameResult.recommendedFps, priority: 'performance' };
            }
        }
        
        // Auto mode processing
        if (sCache.autoModeMasterEnable) {
            // Background audio tab optimization
            if (!tabIsActive && tabIsAudible) {
                return { enabled: true, value: 5, priority: 'battery' };
            }
            
            // Domain-specific configuration
            const autoConfig = (profileSettings.autoModeConfigs ?? []).find(c => {
                if (host.includes(c.domain)) {
                    // Check conditions if exist
                    if (c.conditions) {
                        if (c.conditions.batteryLevel && performanceData?.batteryLevel && 
                            performanceData.batteryLevel < c.conditions.batteryLevel) {
                            return false;
                        }
                        if (c.conditions.cpuUsage && performanceData?.cpuUsage && 
                            performanceData.cpuUsage > c.conditions.cpuUsage) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            });
            
            if (autoConfig) {
                baseConfig = { enabled: true, value: autoConfig.fps, priority: 'balanced' };
            }
        }
        
        // Adaptive optimizations
        if (sCache.adaptiveMode && performanceData) {
            // Battery optimization
            if (sCache.batteryOptimization && performanceData.batteryLevel < 20) {
                baseConfig.value = Math.min(baseConfig.value, 30);
                baseConfig.priority = 'battery';
            }
            
            // CPU throttling
            if (performanceData.cpuUsage > (sCache.maxCpuUsage || 80)) {
                baseConfig.value = Math.max(30, baseConfig.value * 0.7);
                baseConfig.priority = 'battery';
            }
            
            // Thermal protection
            if (sCache.thermalProtection && performanceData.thermalState !== 'normal') {
                const thermalMultiplier = {
                    'fair': 0.8,
                    'serious': 0.6,
                    'critical': 0.4
                }[performanceData.thermalState] || 1;
                baseConfig.value = Math.max(15, baseConfig.value * thermalMultiplier);
            }
        }
        
        return baseConfig;
    } catch (e) {
        return baseConfig;
    }
}

// Performance Monitoring
async function collectPerformanceMetrics(tabId: number): Promise<void> {
    try {
        const [cpuInfo, memoryInfo] = await Promise.all([
            chrome.system?.cpu?.getInfo(),
            chrome.system?.memory?.getInfo()
        ].map(p => p?.catch(() => null)));
        
        // Estimate battery (not directly available in extensions)
        const batteryLevel = 100; // Placeholder - would need different approach
        
        const metrics: PerformanceMetrics = {
            frameTime: 16.67, // Will be updated by content script
            cpuUsage: cpuInfo?.processors?.[0]?.usage?.total || 0,
            memoryUsage: memoryInfo ? (memoryInfo.availableCapacity / memoryInfo.capacity) * 100 : 0,
            batteryLevel,
            thermalState: 'normal',
            networkType: 'unknown'
        };
        
        performanceMetrics[tabId] = metrics;
        
        // Update tab config with new performance data
        const tab = await chrome.tabs.get(tabId);
        if (tab) {
            await updateTabConfig(tab, metrics);
        }
    } catch (e) {
        console.warn('Performance monitoring error:', e);
    }
}

// AI Recommendations Engine
function generateAIRecommendations(): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    
    // Analyze tab analytics for patterns
    const analytics = Object.values(tabAnalytics);
    if (analytics.length > 0) {
        const avgPowerConsumption = analytics.reduce((sum, tab) => sum + tab.powerConsumption, 0) / analytics.length;
        
        if (avgPowerConsumption > 50) {
            recommendations.push({
                type: 'setting',
                title: 'High Power Consumption Detected',
                description: 'Consider enabling battery optimization mode',
                value: { batteryOptimization: true },
                confidence: 0.8,
                reason: 'Multiple tabs showing high power usage'
            });
        }
        
        // Detect unused tabs
        const inactiveTabs = analytics.filter(tab => 
            Date.now() - tab.lastActive > 30 * 60 * 1000 && tab.sessionDuration > 10 * 60 * 1000
        );
        
        if (inactiveTabs.length > 3) {
            recommendations.push({
                type: 'setting',
                title: 'Many Inactive Tabs',
                description: 'Enable tab suspension to save memory',
                value: { suspenderEnable: true, suspenderTimeout: 15 },
                confidence: 0.9,
                reason: `${inactiveTabs.length} tabs inactive for over 30 minutes`
            });
        }
    }
    
    return recommendations;
}

// Enhanced Tab Update
async function updateTabConfig(tab: chrome.tabs.Tab, performanceData?: PerformanceMetrics): Promise<void> {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith('http')) return;
    
    const config = getConfigForUrl(
        tab.url, 
        tab.active, 
        tab.audible ?? false, 
        activeProfile, 
        settingsCache,
        performanceData,
        { title: tab.title }
    );
    
    chrome.tabs.sendMessage(tab.id, { 
        type: 'UPDATE_CONFIG', 
        config,
        performanceData,
        adaptiveMode: settingsCache.adaptiveMode
    }).catch(() => {});
}

// Enhanced Badge Update
function updateTabBadge(tab: chrome.tabs.Tab): void {
    if (!tab.id || !tab.url) return;
    
    try {
        const host = new URL(tab.url).hostname;
        const isHeavy = (settingsCache.heavyHosts ?? []).includes(host);
        const analytics = tabAnalytics[tab.id];
        
        let text = '';
        let color = '#4285f4';
        
        if (isHeavy) {
            text = '!';
            color = '#ea4335';
        } else if (settingsCache.gamingMode && analytics?.averageFps > 100) {
            text = '🎮';
            color = '#34a853';
        } else if (settingsCache.batteryOptimization && performanceMetrics[tab.id]?.batteryLevel < 20) {
            text = '🔋';
            color = '#fbbc04';
        }
        
        chrome.action.setBadgeText({ tabId: tab.id, text });
        chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color });
    } catch (e) {}
}

// Keyboard Shortcuts Handler
chrome.commands.onCommand.addListener(async (command) => {
    switch (command) {
        case 'toggle_fps_limiter':
            const newState = !settingsCache.globalDisabled;
            await chrome.storage.local.set({ globalDisabled: newState });
            
            // Show notification
            if (settingsCache.notifications?.enabled) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'FPS Limiter Pro',
                    message: `FPS Limiter ${newState ? 'Disabled' : 'Enabled'}`
                });
            }
            break;
            
        case 'cycle_fps_preset':
            const presets = settingsCache.presets || DEFAULT_PRESETS;
            currentPresetIndex = (currentPresetIndex + 1) % presets.length;
            const preset = presets[currentPresetIndex];
            
            // Apply preset to current profile
            if (activeProfile) {
                activeProfile.settings.globalConfig.value = preset.fps;
                await chrome.storage.local.set({ 
                    profiles: settingsCache.profiles?.map(p => 
                        p.id === activeProfile?.id ? activeProfile : p
                    )
                });
            }
            
            // Show notification
            if (settingsCache.notifications?.enabled) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'FPS Preset Changed',
                    message: `${preset.icon} ${preset.name} - ${preset.fps} FPS`
                });
            }
            break;
    }
});

// Enhanced Event Listeners
chrome.storage.onChanged.addListener(async () => {
    await loadAndCacheSettings();
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
        await updateTabConfig(tab, performanceMetrics[tab.id!]);
        updateTabBadge(tab);
    }
});

chrome.runtime.onMessage.addListener(async (message: any, sender: chrome.runtime.MessageSender) => {
    const tabId = sender.tab?.id;
    
    switch (message.type) {
        case 'PAGE_IS_HEAVY':
            if (sender.tab?.url) {
                try {
                    const host = new URL(sender.tab.url).hostname;
                    const { heavyHosts = [] } = await chrome.storage.local.get('heavyHosts');
                    if (!heavyHosts.includes(host)) {
                        heavyHosts.push(host);
                        await chrome.storage.local.set({ heavyHosts });
                    }
                } catch (e) {}
            }
            break;
            
        case 'PERFORMANCE_DATA':
            if (tabId && message.data) {
                // Update analytics
                if (!tabAnalytics[tabId]) {
                    tabAnalytics[tabId] = {
                        tabId,
                        domain: sender.tab?.url ? new URL(sender.tab.url).hostname : '',
                        averageFps: message.data.fps,
                        peakFps: message.data.fps,
                        frameDrops: 0,
                        memoryLeaks: 0,
                        powerConsumption: message.data.powerConsumption || 0,
                        lastActive: Date.now(),
                        sessionDuration: 0
                    };
                } else {
                    const analytics = tabAnalytics[tabId];
                    analytics.averageFps = (analytics.averageFps + message.data.fps) / 2;
                    analytics.peakFps = Math.max(analytics.peakFps, message.data.fps);
                    analytics.frameDrops += message.data.frameDrops || 0;
                    analytics.powerConsumption = message.data.powerConsumption || analytics.powerConsumption;
                    analytics.lastActive = Date.now();
                }
            }
            break;
            
        case 'GET_AI_RECOMMENDATIONS':
            return { recommendations: aiRecommendations };
    }
});

chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
    tabLastActivated[activeInfo.tabId] = Date.now();
    if (tabAnalytics[activeInfo.tabId]) {
        tabAnalytics[activeInfo.tabId].lastActive = Date.now();
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.audible !== undefined || changeInfo.title !== undefined) {
        await updateTabConfig(tab, performanceMetrics[tabId]);
        updateTabBadge(tab);
    }
});

chrome.tabs.onRemoved.addListener((tabId: number) => {
    delete tabLastActivated[tabId];
    delete performanceMetrics[tabId];
    delete tabAnalytics[tabId];
});

// Enhanced Alarm Handlers
chrome.alarms.onAlarm.addListener(async (alarm) => {
    switch (alarm.name) {
        case ALARM_NAME:
            await checkAndSuspendTabs();
            break;
            
        case PERFORMANCE_ALARM:
            if (settingsCache.performanceMonitoring) {
                const tabs = await chrome.tabs.query({ active: true });
                for (const tab of tabs) {
                    if (tab.id) await collectPerformanceMetrics(tab.id);
                }
            }
            break;
            
        case AI_ANALYSIS_ALARM:
            if (settingsCache.aiOptimization) {
                aiRecommendations = generateAIRecommendations();
            }
            break;
    }
});

// Enhanced Initialization
chrome.runtime.onInstalled.addListener(async () => {
    await loadAndCacheSettings();
    
    // Create alarms
    chrome.alarms.create(ALARM_NAME, { delayInMinutes: 1, periodInMinutes: 1 });
    chrome.alarms.create(PERFORMANCE_ALARM, { delayInMinutes: 0.5, periodInMinutes: 0.5 });
    chrome.alarms.create(AI_ANALYSIS_ALARM, { delayInMinutes: 5, periodInMinutes: 10 });
    
    // Initialize default presets if not exist
    const { presets } = await chrome.storage.local.get('presets');
    if (!presets) {
        await chrome.storage.local.set({ presets: DEFAULT_PRESETS });
    }
});

chrome.runtime.onStartup.addListener(loadAndCacheSettings);

// Export for testing
export { collectPerformanceMetrics, generateAIRecommendations, updateTabConfig };
