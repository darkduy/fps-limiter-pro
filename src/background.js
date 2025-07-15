class FPSLimiter {
    constructor(initialConfig) {
      this.originalRAF = window.requestAnimationFrame;
      this.lastFrameTime = -Infinity;
      this.isIframe = window.self !== window.top;

      this.update(initialConfig);
      this.listenForMessages();
    }

    update(newConfig) {
        this.config = newConfig;
        this.frameInterval = 1000 / (this.config.value > 0 ? this.config.value : 60);
        this.install();
    }
    
    install() {
      if (this.config.enabled) {
        const boundThrottledRAF = this.throttledRAF.bind(this);
        boundThrottledRAF.toString = () => this.originalRAF.toString();
        window.requestAnimationFrame = boundThrottledRAF;
      } else {
        this.uninstall();
      }
    }

    uninstall() {
      window.requestAnimationFrame = this.originalRAF;
    }

    throttledRAF(callback) {
      const currentTime = performance.now();
      const elapsed = currentTime - this.lastFrameTime;
      const delay = this.frameInterval - elapsed;

      const execute = () => {
          try {
              callback(performance.now());
          } catch (e) {
              console.error("FPS Limiter Error:", e);
          }
      };

      if (delay <= 0) {
        this.lastFrameTime = currentTime;
        execute();
      } else {
        setTimeout(execute, delay);
      }
    }

    listenForMessages() {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'UPDATE_CONFIG') {
          this.update(message.config);
        }
      });
    }
}

let settingsCache = {};

async function loadAndCacheSettings() {
  const data = await chrome.storage.local.get(null);
  settingsCache = {
    globalDisabled: data.globalDisabled ?? false,
    applyInFrames: data.applyInFrames ?? false,
    globalConfig: data.global ?? { enabled: true, value: 60 },
    siteConfigs: data,
  };
}

function getConfigForUrl(url) {
  try {
    const host = new URL(url).hostname;
    return settingsCache.siteConfigs[host] ?? settingsCache.globalConfig;
  } catch (e) {
    return settingsCache.globalConfig;
  }
}

async function manageScriptingForTab(tabId, url) {
    if (!url || !url.startsWith('http')) return;

    if (settingsCache.globalDisabled) {
        const injected = await chrome.scripting.getRegisteredContentScripts({ ids: [`fps-limiter-${tabId}`] });
        if (injected.length > 0) {
            await chrome.scripting.unregisterContentScripts({ ids: [`fps-limiter-${tabId}`] });
        }
        return;
    }

    const config = getConfigForUrl(url);

    chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: settingsCache.applyInFrames },
        func: (cfg) => {
            // Class FPSLimiter được định nghĩa tại đây khi tiêm vào
            // Class definition is inlined here for injection
            class FPSLimiter {
                constructor(initialConfig) { this.originalRAF = window.requestAnimationFrame; this.lastFrameTime = -Infinity; this.isIframe = window.self !== window.top; this.update(initialConfig); this.listenForMessages(); }
                update(newConfig) { this.config = newConfig; this.frameInterval = 1000 / (this.config.value > 0 ? this.config.value : 60); this.install(); }
                install() { if (this.config.enabled) { const boundThrottledRAF = this.throttledRAF.bind(this); boundThrottledRAF.toString = () => this.originalRAF.toString(); window.requestAnimationFrame = boundThrottledRAF; } else { this.uninstall(); } }
                uninstall() { window.requestAnimationFrame = this.originalRAF; }
                throttledRAF(callback) { const currentTime = performance.now(); const elapsed = currentTime - this.lastFrameTime; const delay = this.frameInterval - elapsed; const execute = () => { try { callback(performance.now()); } catch (e) { console.error("FPS Limiter Error:", e); } }; if (delay <= 0) { this.lastFrameTime = currentTime; execute(); } else { setTimeout(execute, delay); } }
                listenForMessages() { chrome.runtime.onMessage.addListener((message) => { if (message.type === 'UPDATE_CONFIG') { this.update(message.config); } }); }
            }
            if (!window.myFpsLimiter) { window.myFpsLimiter = new FPSLimiter(cfg); } else { window.myFpsLimiter.update(cfg); }
        },
        args: [config],
        world: 'MAIN',
    }).catch(err => {});
}

chrome.runtime.onStartup.addListener(loadAndCacheSettings);
chrome.runtime.onInstalled.addListener(loadAndCacheSettings);

chrome.storage.onChanged.addListener(async () => {
    await loadAndCacheSettings();
    const tabs = await chrome.tabs.query({ status: 'complete' });
    for (const tab of tabs) {
        if (tab.id && tab.url && tab.url.startsWith('http')) {
            const newConfig = getConfigForUrl(tab.url);
            chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_CONFIG', config: newConfig }).catch(() => {});
        }
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
        manageScriptingForTab(tab.id, tab.url);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        manageScriptingForTab(tabId, tab.url);
    }
});
