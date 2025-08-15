import type { SiteConfig, SettingsCache, PerformanceMetrics } from './types';

interface AdvancedFrameAnalysis {
    frameTime: number;
    jankFrames: number;
    smoothFrames: number;
    averageFrameTime: number;
    p95FrameTime: number;
    powerConsumption: number;
    memoryUsage: number;
    renderCalls: number;
}

class AdvancedFPSLimiter {
    private originalRAF: (callback: FrameRequestCallback) => number;
    private originalRAF2: typeof requestIdleCallback;
    private lastFrameTime: number = -Infinity;
    private isIframe: boolean;
    private config: SiteConfig = { enabled: false, value: 60, adaptive: true, priority: 'balanced' };
    private settingsCache: SettingsCache = {};
    private frameInterval: number = 1000 / 60;
    
    // Enhanced frame analysis
    private frameDurations: number[] = [];
    private frameTimestamps: number[] = [];
    private durationSum: number = 0;
    private readonly maxSamples: number = 240; // 4 seconds at 60fps
    private readonly heavyAvgThreshold: number = 8;
    private isPageFlagged: boolean = false;
    
    // Performance monitoring
    private performanceObserver?: PerformanceObserver;
    private renderMetrics: AdvancedFrameAnalysis = {
        frameTime: 16.67,
        jankFrames: 0,
        smoothFrames: 0,
        averageFrameTime: 16.67,
        p95FrameTime: 16.67,
        powerConsumption: 0,
        memoryUsage: 0,
        renderCalls: 0
    };
    
    // Adaptive features
    private adaptiveMode: boolean = false;
    private batteryOptimization: boolean = false;
    private thermalThrottling: boolean = false;
    private networkAwareness: boolean = false;
    private gameMode: boolean = false;
    
    // Smart scheduling
    private visibilityObserver?: IntersectionObserver;
    private mutationObserver?: MutationObserver;
    
    // AI-powered optimization
    private framePredictor: FramePredictor;
    private adaptiveScheduler: AdaptiveScheduler;
    private powerManager: PowerManager;

    constructor() {
        this.originalRAF = window.requestAnimationFrame;
        this.originalRAF2 = window.requestIdleCallback;
        this.isIframe = window.self !== window.top;
        
        this.framePredictor = new FramePredictor();
        this.adaptiveScheduler = new AdaptiveScheduler();
        this.powerManager = new PowerManager();
        
        this.init();
    }

    private async init(): Promise<void> {
        this.settingsCache = await chrome.storage.local.get(null);
        const host = window.location.hostname || 'global';
        const config = this.getConfigForUrl(host, true, false);
        
        this.setupPerformanceMonitoring();
        this.setupSmartObservers();
        this.setupGameDetection();
        
        this.update(config);
        this.listenForMessages();
        
        // Start performance reporting
        this.startPerformanceReporting();
    }
    
    private setupPerformanceMonitoring(): void {
        if (!this.settingsCache.performanceMonitoring) return;
        
        // Performance Observer for detailed metrics
        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                for (const entry of entries) {
                    if (entry.entryType === 'measure') {
                        this.analyzePerformanceEntry(entry);
                    }
                }
            });
            this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
        } catch (e) {
            console.warn('Performance Observer not supported');
        }
    }
    
    private setupSmartObservers(): void {
        // Visibility observer for adaptive rendering
        if ('IntersectionObserver' in window) {
            this.visibilityObserver = new IntersectionObserver((entries) => {
                const isVisible = entries.some(entry => entry.isIntersecting);
                this.adaptiveScheduler.setVisibility(isVisible);
            });
            
            // Observe important elements
            document.addEventListener('DOMContentLoaded', () => {
                const importantElements = document.querySelectorAll('canvas, video, iframe, [data-fps-critical]');
                importantElements.forEach(el => this.visibilityObserver?.observe(el));
            });
        }
        
        // Mutation observer for dynamic content
        if ('MutationObserver' in window) {
            this.mutationObserver = new MutationObserver((mutations) => {
                const hasImportantChanges = mutations.some(mutation => 
                    mutation.type === 'childList' && 
                    (mutation.addedNodes.length > 5 || this.containsMediaElements(mutation.addedNodes))
                );
                
                if (hasImportantChanges) {
                    this.adaptiveScheduler.notifyContentChange();
                }
            });
            
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false
            });
        }
    }
    
    private setupGameDetection(): void {
        // Detect WebGL/Canvas usage for game optimization
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (gl) {
                this.gameMode = true;
                this.adaptiveScheduler.enableGameMode();
            }
        }
        
        // Detect Unity/Unreal games
        const unityCheck = () => {
            if (window.unityInstance || document.querySelector('#unity-container') || 
                document.querySelector('[data-unity]') || /unity/i.test(document.title)) {
                this.gameMode = true;
                this.adaptiveScheduler.enableGameMode();
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', unityCheck);
        } else {
            unityCheck();
        }
    }
    
    private containsMediaElements(nodes: NodeList): boolean {
        return Array.from(nodes).some(node => 
            node.nodeType === Node.ELEMENT_NODE &&
            ['CANVAS', 'VIDEO', 'IFRAME', 'EMBED', 'OBJECT'].includes((node as Element).tagName)
        );
    }
    
    private getConfigForUrl(host: string, tabIsActive: boolean, tabIsAudible: boolean): SiteConfig {
        // Enhanced config logic with adaptive features
        if (this.settingsCache.autoModeMasterEnable) {
            if (!tabIsActive && tabIsAudible) {
                return { enabled: true, value: 5, priority: 'battery', adaptive: true };
            }
            
            const autoConfig = (this.settingsCache.autoModeConfigs || []).find((c: any) => host.includes(c.domain));
            if (autoConfig) {
                return { 
                    enabled: true, 
                    value: autoConfig.fps,
                    priority: this.gameMode ? 'performance' : 'balanced',
                    adaptive: this.settingsCache.adaptiveMode ?? true
                };
            }
        }
        
        const siteConfig = this.settingsCache[host];
        if (siteConfig) return { ...siteConfig, adaptive: this.settingsCache.adaptiveMode ?? true };
        
        const globalConfig = this.settingsCache.globalConfig || { enabled: true, value: 60 };
        return { 
            ...globalConfig, 
            priority: this.gameMode ? 'performance' : 'balanced',
            adaptive: this.settingsCache.adaptiveMode ?? true
        };
    }

    public update(newConfig: SiteConfig, performanceData?: PerformanceMetrics): void {
        this.config = newConfig;
        this.adaptiveMode = newConfig.adaptive ?? false;
        
        if (this.isIframe && !(this.settingsCache.applyInFrames ?? false)) { 
            this.uninstall(); 
            return; 
        }
        
        if (this.settingsCache.globalDisabled) { 
            this.uninstall(); 
            return; 
        }
        
        // Adaptive FPS calculation
        let targetFps = this.config.value;
        
        if (this.adaptiveMode && performanceData) {
            targetFps = this.calculateAdaptiveFPS(targetFps, performanceData);
        }
        
        // Apply AI recommendations
        if (this.settingsCache.aiOptimization) {
            targetFps = this.framePredictor.predictOptimalFPS(targetFps, this.renderMetrics);
        }
        
        this.frameInterval = 1000 / Math.max(1, targetFps);
        this.install();
        
        // Update power management
        this.powerManager.updateConfig(this.config, performanceData);
    }
    
    private calculateAdaptiveFPS(baseFps: number, performanceData: PerformanceMetrics): number {
        let adaptedFps = baseFps;
        
        // Battery optimization
        if (this.settingsCache.batteryOptimization && performanceData.batteryLevel < 20) {
            adaptedFps = Math.min(adaptedFps, 30);
        } else if (performanceData.batteryLevel < 50) {
            adaptedFps = Math.min(adaptedFps, baseFps * 0.8);
        }
        
        // CPU throttling
        if (performanceData.cpuUsage > 80) {
            adaptedFps = Math.max(15, adaptedFps * 0.6);
        } else if (performanceData.cpuUsage > 60) {
            adaptedFps = adaptedFps * 0.8;
        }
        
        // Thermal protection
        const thermalMultipliers = {
            'normal': 1.0,
            'fair': 0.9,
            'serious': 0.7,
            'critical': 0.5
        };
        adaptedFps *= thermalMultipliers[performanceData.thermalState] || 1.0;
        
        // Network-aware optimization
        if (this.settingsCache.networkAwareness) {
            if (performanceData.networkType === 'slow-2g' || performanceData.networkType === '2g') {
                adaptedFps = Math.min(adaptedFps, 30);
            }
        }
        
        return Math.max(5, Math.round(adaptedFps));
    }
    
    private install(): void {
        if (this.config.enabled) {
            // Enhanced RAF with smart scheduling
            const smartRAF = this.createSmartRAF();
            // @ts-ignore
            smartRAF.toString = () => this.originalRAF.toString();
            window.requestAnimationFrame = smartRAF as any;
            
            // Hook into requestIdleCallback for additional optimization
            if (this.originalRAF2) {
                window.requestIdleCallback = this.createSmartIdleCallback();
            }
        } else {
            this.uninstall();
        }
    }

    private uninstall(): void { 
        window.requestAnimationFrame = this.originalRAF;
        if (this.originalRAF2) {
            window.requestIdleCallback = this.originalRAF2;
        }
    }

    private createSmartRAF(): (callback: FrameRequestCallback) => number {
        return (cb: FrameRequestCallback): number => {
            const now = performance.now();
            const elapsed = now - this.lastFrameTime;
            const shouldSchedule = this.adaptiveScheduler.shouldScheduleFrame(elapsed, this.frameInterval);
            
            if (!shouldSchedule) {
                // Skip this frame
                return this.originalRAF.call(window, () => {});
            }
            
            const targetDelay = this.frameInterval - elapsed;
            
            const executeCallback = (timestamp: number): void => {
                const executionStart = performance.now();
                this.lastFrameTime = timestamp;
                
                try {
                    cb(timestamp);
                } catch (err) {
                    console.error('RAF callback error:', err);
                }
                
                const executionTime = performance.now() - executionStart;
                this.analyzeFrame(executionTime, timestamp);
                
                // Update frame predictor
                this.framePredictor.recordFrame(executionTime, timestamp);
            };
            
            if (targetDelay <= 0) {
                return this.originalRAF.call(window, executeCallback);
            } else {
                // Use intelligent scheduling
                return this.adaptiveScheduler.scheduleFrame(executeCallback, targetDelay);
            }
        };
    }
    
    private createSmartIdleCallback(): typeof requestIdleCallback {
        return (callback: IdleRequestCallback, options?: IdleRequestOptions): number => {
            // Enhance idle callback with FPS awareness
            const enhancedCallback = (deadline: IdleDeadline): void => {
                // Only execute if we have spare time after frame rendering
                if (deadline.timeRemaining() > this.frameInterval * 0.3) {
                    callback(deadline);
                } else {
                    // Reschedule for next idle period
                    this.originalRAF2(callback, options);
                }
            };
            
            return this.originalRAF2(enhancedCallback, options);
        };
    }

    private analyzeFrame(duration: number, timestamp: number): void {
        if (this.isIframe && !this.gameMode) return;
        
        // Enhanced frame analysis
        this.frameDurations.push(duration);
        this.frameTimestamps.push(timestamp);
        this.durationSum += duration;
        
        if (this.frameDurations.length > this.maxSamples) {
            this.durationSum -= this.frameDurations.shift()!;
            this.frameTimestamps.shift();
        }
        
        if (this.frameDurations.length < 10) return; // Need minimum samples
        
        // Calculate advanced metrics
        this.updateRenderMetrics();
        
        // Check for performance issues
        this.detectPerformanceIssues();
        
        // Adaptive optimization
        if (this.adaptiveMode) {
            this.adaptiveScheduler.analyzePerformance(this.renderMetrics);
        }
    }
    
    private updateRenderMetrics(): void {
        const durations = this.frameDurations;
        const timestamps = this.frameTimestamps;
        
        // Basic statistics
        this.renderMetrics.averageFrameTime = this.durationSum / durations.length;
        
        // Calculate P95 frame time
        const sortedDurations = [...durations].sort((a, b) => a - b);
        const p95Index = Math.floor(sortedDurations.length * 0.95);
        this.renderMetrics.p95FrameTime = sortedDurations[p95Index];
        
        // Count jank frames (>16.67ms for 60fps)
        const targetFrameTime = this.frameInterval;
        this.renderMetrics.jankFrames = durations.filter(d => d > targetFrameTime * 1.5).length;
        this.renderMetrics.smoothFrames = durations.length - this.renderMetrics.jankFrames;
        
        // Estimate power consumption (heuristic)
        this.renderMetrics.powerConsumption = this.estimatePowerConsumption();
        
        // Memory usage (approximate)
        if ((performance as any).memory) {
            this.renderMetrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }
        
        // Render calls counter
        this.renderMetrics.renderCalls++;
    }
    
    private estimatePowerConsumption(): number {
        // Heuristic power consumption based on frame complexity and frequency
        const avgFrameTime = this.renderMetrics.averageFrameTime;
        const fps = 1000 / this.frameInterval;
        const complexity = avgFrameTime / 16.67; // Normalized to 60fps baseline
        
        // Base power consumption (arbitrary units)
        let power = fps * complexity * 0.1;
        
        // Adjust for jank frames (they consume more power)
        const jankRatio = this.renderMetrics.jankFrames / this.frameDurations.length;
        power *= (1 + jankRatio * 2);
        
        // Game mode typically consumes more power
        if (this.gameMode) {
            power *= 1.5;
        }
        
        return Math.min(100, power); // Cap at 100 units
    }
    
    private detectPerformanceIssues(): void {
        const metrics = this.renderMetrics;
        
        // Heavy page detection
        if (!this.isPageFlagged && metrics.averageFrameTime > this.heavyAvgThreshold) {
            this.isPageFlagged = true;
            chrome.runtime.sendMessage({ type: 'PAGE_IS_HEAVY' });
        }
        
        // Memory leak detection
        if (metrics.memoryUsage > 0) {
            const memoryGrowthRate = this.calculateMemoryGrowthRate();
            if (memoryGrowthRate > 1000000) { // 1MB per second
                chrome.runtime.sendMessage({ 
                    type: 'MEMORY_LEAK_DETECTED',
                    growth: memoryGrowthRate 
                });
            }
        }
        
        // Performance degradation detection
        if (metrics.jankFrames / this.frameDurations.length > 0.3) {
            chrome.runtime.sendMessage({ 
                type: 'PERFORMANCE_DEGRADATION',
                jankRatio: metrics.jankFrames / this.frameDurations.length
            });
        }
    }
    
    private calculateMemoryGrowthRate(): number {
        // Simple heuristic for memory growth rate
        const memorySnapshots = this.getMemorySnapshots();
        if (memorySnapshots.length < 2) return 0;
        
        const recent = memorySnapshots[memorySnapshots.length - 1];
        const older = memorySnapshots[0];
        const timeDiff = recent.timestamp - older.timestamp;
        const memoryDiff = recent.memory - older.memory;
        
        return timeDiff > 0 ? memoryDiff / (timeDiff / 1000) : 0; // bytes per second
    }
    
    private getMemorySnapshots(): Array<{timestamp: number, memory: number}> {
        // Placeholder - would maintain a rolling window of memory measurements
        return [];
    }
    
    private analyzePerformanceEntry(entry: PerformanceEntry): void {
        // Analyze performance timeline entries for optimization insights
        if (entry.name.includes('paint') || entry.name.includes('render')) {
            const duration = entry.duration || 0;
            if (duration > 16.67) {
                // Long paint/render detected
                this.adaptiveScheduler.notifyLongTask(duration);
            }
        }
    }
    
    private startPerformanceReporting(): void {
        // Report performance data to background script
        setInterval(() => {
            if (this.settingsCache.analyticsEnabled) {
                const fps = this.calculateCurrentFPS();
                chrome.runtime.sendMessage({
                    type: 'PERFORMANCE_DATA',
                    data: {
                        fps,
                        frameDrops: this.renderMetrics.jankFrames,
                        powerConsumption: this.renderMetrics.powerConsumption,
                        memoryUsage: this.renderMetrics.memoryUsage,
                        averageFrameTime: this.renderMetrics.averageFrameTime
                    }
                });
            }
        }, 5000); // Every 5 seconds
    }
    
    private calculateCurrentFPS(): number {
        if (this.frameTimestamps.length < 2) return 0;
        
        const recentTimestamps = this.frameTimestamps.slice(-60); // Last 60 frames
        if (recentTimestamps.length < 2) return 0;
        
        const timeSpan = recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0];
        const frameCount = recentTimestamps.length - 1;
        
        return frameCount > 0 ? (frameCount * 1000) / timeSpan : 0;
    }
    
    private listenForMessages(): void {
        chrome.runtime.onMessage.addListener((message: any) => {
            switch (message.type) {
                case 'UPDATE_CONFIG':
                    this.update(message.config, message.performanceData);
                    this.adaptiveMode = message.adaptiveMode ?? false;
                    break;
                    
                case 'GET_PERFORMANCE_METRICS':
                    return Promise.resolve(this.renderMetrics);
                    
                case 'ADAPTIVE_OPTIMIZE':
                    if (this.adaptiveMode) {
                        this.adaptiveScheduler.optimize(message.parameters);
                    }
                    break;
            }
        });
    }
}

// AI-Powered Frame Predictor
class FramePredictor {
    private frameHistory: Array<{time: number, duration: number, timestamp: number}> = [];
    private readonly maxHistory = 1000;
    
    recordFrame(duration: number, timestamp: number): void {
        this.frameHistory.push({ time: performance.now(), duration, timestamp });
        if (this.frameHistory.length > this.maxHistory) {
            this.frameHistory.shift();
        }
    }
    
    predictOptimalFPS(baseFps: number, metrics: AdvancedFrameAnalysis): number {
        if (this.frameHistory.length < 60) return baseFps; // Need enough data
        
        // Analyze frame patterns
        const recentFrames = this.frameHistory.slice(-60);
        const avgDuration = recentFrames.reduce((sum, frame) => sum + frame.duration, 0) / recentFrames.length;
        
        // If frames are consistently fast, we might be able to increase FPS
        if (avgDuration < 8 && metrics.jankFrames < 3) {
            return Math.min(baseFps * 1.2, 240);
        }
        
        // If frames are struggling, reduce FPS
        if (avgDuration > 20 || metrics.jankFrames > 10) {
            return Math.max(baseFps * 0.8, 15);
        }
        
        return baseFps;
    }
}

// Adaptive Scheduling System
class AdaptiveScheduler {
    private isVisible = true;
    private gameMode = false;
    private contentChanged = false;
    private longTaskDetected = false;
    
    setVisibility(visible: boolean): void {
        this.isVisible = visible;
    }
    
    enableGameMode(): void {
        this.gameMode = true;
    }
    
    notifyContentChange(): void {
        this.contentChanged = true;
        // Reset flag after some time
        setTimeout(() => { this.contentChanged = false; }, 2000);
    }
    
    notifyLongTask(duration: number): void {
        this.longTaskDetected = true;
        setTimeout(() => { this.longTaskDetected = false; }, 1000);
    }
    
    shouldScheduleFrame(elapsed: number, frameInterval: number): boolean {
        // Always schedule for game mode
        if (this.gameMode) return true;
        
        // Skip frames when not visible (unless audio is playing)
        if (!this.isVisible) return elapsed > frameInterval * 3;
        
        // Schedule more frames during content changes
        if (this.contentChanged) return elapsed > frameInterval * 0.8;
        
        // Reduce scheduling during long tasks
        if (this.longTaskDetected) return elapsed > frameInterval * 1.5;
        
        return true;
    }
    
    scheduleFrame(callback: (timestamp: number) => void, delay: number): number {
        // Intelligent frame scheduling based on current conditions
        if (this.gameMode && delay < 4) {
            // For games, prefer requestAnimationFrame for better timing
            return requestAnimationFrame(callback);
        } else {
            // Use setTimeout for precise timing control
            return window.setTimeout(() => callback(performance.now()), delay);
        }
    }
    
    analyzePerformance(metrics: AdvancedFrameAnalysis): void {
        // Adaptive performance analysis
        // This could trigger automatic FPS adjustments
    }
    
    optimize(parameters: any): void {
        // Apply AI-suggested optimizations
        if (parameters.reduceJank) {
            this.longTaskDetected = true;
        }
        
        if (parameters.increasePriority) {
            this.gameMode = true;
        }
    }
}

// Power Management System
class PowerManager {
    private batteryAPI?: any;
    private config: SiteConfig = { enabled: true, value: 60 };
    
    constructor() {
        this.initBatteryAPI();
    }
    
    private async initBatteryAPI(): Promise<void> {
        try {
            // @ts-ignore
            this.batteryAPI = await navigator.getBattery?.();
        } catch (e) {
            // Battery API not supported
        }
    }
    
    updateConfig(config: SiteConfig, performanceData?: PerformanceMetrics): void {
        this.config = config;
        
        if (config.priority === 'battery' && this.batteryAPI) {
            this.optimizeForBattery();
        }
    }
    
    private optimizeForBattery(): void {
        // Additional battery optimizations
        if (this.batteryAPI && !this.batteryAPI.charging && this.batteryAPI.level < 0.2) {
            // Emergency battery mode
            document.querySelectorAll('video, canvas').forEach(element => {
                // Reduce quality/framerate of media elements
                if (element instanceof HTMLVideoElement) {
                    element.playbackRate = 0.8; // Slightly slower playback
                }
            });
        }
    }
}

// Initialize the enhanced FPS Limiter
new AdvancedFPSLimiter();
