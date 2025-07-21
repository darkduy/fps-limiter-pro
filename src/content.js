class FPSLimiter {
    constructor() {
      this.originalRAF = window.requestAnimationFrame;
      this.lastFrameTime = -Infinity;
      this.isIframe = window.self !== window.top;
      this.config = { enabled: false, value: 60 };
      this.init();
    }

    async init() {
        const host = window.location.hostname || 'global';
        const data = await chrome.storage.local.get(null);
        this.settingsCache = data;
        const config = this.getConfigForUrl(host, true, false); // Giả định tab active khi mới tải
        this.update(config);
        this.listenForMessages();
    }
    
    getConfigForUrl(host, tabIsActive, tabIsAudible) {
        if (this.settingsCache.autoModeMasterEnable) {
            if (!tabIsActive && tabIsAudible) return { enabled: true, value: 5 };
            const autoConfig = (this.settingsCache.autoModeConfigs || []).find(c => host.includes(c.domain));
            if (autoConfig) return { enabled: true, value: autoConfig.fps };
        }
        const siteConfig = this.settingsCache[host];
        if (siteConfig) return siteConfig;
        return this.settingsCache.globalConfig ?? { enabled: true, value: 60 };
    }

    update(newConfig) {
        this.config = newConfig;
        if (this.isIframe && !(this.settingsCache.applyInFrames ?? false)) { this.uninstall(); return; }
        if (this.settingsCache.globalDisabled) { this.uninstall(); return; }

        this.frameInterval = 1000 / (this.config.value > 0 ? this.config.value : 60);
        this.install();
    }

    install() {
      if (this.config.enabled) {
        const r = this.throttledRAF.bind(this);
        r.toString = () => this.originalRAF.toString();
        window.requestAnimationFrame = r;
      } else {
        this.uninstall();
      }
    }
    uninstall() { window.requestAnimationFrame = this.originalRAF; }
    throttledRAF(cb) { const t = performance.now(), e = t - this.lastFrameTime, d = this.frameInterval - e; const exec = () => { try { cb(performance.now()); } catch (err) {} }; if (d <= 0) { this.lastFrameTime = t; exec(); } else { setTimeout(exec, d); } }
    
    listenForMessages() {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'UPDATE_CONFIG') {
          this.update(message.config);
        }
      });
    }
}

new FPSLimiter();
