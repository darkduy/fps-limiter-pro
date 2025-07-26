import type { SiteConfig, SettingsCache } from './types';

class FPSLimiter {
    private originalRAF: (callback: FrameRequestCallback) => number;
    private lastFrameTime: number = -Infinity;
    private isIframe: boolean;
    private config: SiteConfig = { enabled: false, value: 60 };
    private settingsCache: SettingsCache = {};
    private frameInterval: number = 1000 / 60;
    
    private frameDurations: number[] = [];
    private durationSum: number = 0;
    private readonly maxSamples: number = 120;
    private readonly heavyAvgThreshold: number = 8;
    private isPageFlagged: boolean = false;

    constructor() {
        this.originalRAF = window.requestAnimationFrame;
        this.isIframe = window.self !== window.top;
        this.init();
    }

    private async init(): Promise<void> {
        const host = window.location.hostname || 'global';
        this.settingsCache = await chrome.storage.local.get(null);
        const config = this.getConfigForUrl(host, true, false);
        this.update(config);
        this.listenForMessages();
    }
    
    private getConfigForUrl(host: string, tabIsActive: boolean, tabIsAudible: boolean): SiteConfig {
        if (this.settingsCache.autoModeMasterEnable) {
            if (!tabIsActive && tabIsAudible) return { enabled: true, value: 5 };
            const autoConfig = (this.settingsCache.autoModeConfigs || []).find(c => host.includes(c.domain));
            if (autoConfig) return { enabled: true, value: autoConfig.fps };
        }
        const siteConfig = this.settingsCache[host];
        if (siteConfig) return siteConfig;
        return this.settingsCache.globalConfig ?? { enabled: true, value: 60 };
    }

    public update(newConfig: SiteConfig): void {
        this.config = newConfig;
        if (this.isIframe && !(this.settingsCache.applyInFrames ?? false)) { this.uninstall(); return; }
        if (this.settingsCache.globalDisabled) { this.uninstall(); return; }
        this.frameInterval = 1000 / (this.config.value > 0 ? this.config.value : 60);
        this.install();
    }

    private install(): void {
      if (this.config.enabled) {
        const r = this.throttledRAF.bind(this);
        r.toString = () => this.originalRAF.toString();
        window.requestAnimationFrame = r;
      } else {
        this.uninstall();
      }
    }

    private uninstall(): void { window.requestAnimationFrame = this.originalRAF; }

    private throttledRAF(cb: FrameRequestCallback): void {
        const t = performance.now(), e = t - this.lastFrameTime, d = this.frameInterval - e;
        const exec = (): void => {
            const startTime = performance.now();
            try { cb(startTime); } catch (err) {}
            const endTime = performance.now();
            this.analyzeFrame(endTime - startTime);
        };
        if (d <= 0) { this.lastFrameTime = t; exec(); } else { setTimeout(exec, d); }
    }

    private analyzeFrame(duration: number): void {
        if (this.isPageFlagged || this.isIframe) return;
        this.frameDurations.push(duration);
        this.durationSum += duration;
        if (this.frameDurations.length > this.maxSamples) {
            this.durationSum -= this.frameDurations.shift()!;
        }
        if (this.frameDurations.length < this.maxSamples) return;
        const avg = this.durationSum / this.frameDurations.length;
        if (avg > this.heavyAvgThreshold) {
            this.isPageFlagged = true;
            chrome.runtime.sendMessage({ type: 'PAGE_IS_HEAVY' });
        }
    }
    
    private listenForMessages(): void {
      chrome.runtime.onMessage.addListener((message: any) => {
        if (message.type === 'UPDATE_CONFIG') {
          this.update(message.config);
        }
      });
    }
}

new FPSLimiter();
