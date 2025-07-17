// Biến chứa mã nguồn của class FPSLimiter dưới dạng hàm để tiêm vào trang.
const fpsLimiterInjector = (initialConfig) => {
    if (window.myFpsLimiter) {
        window.myFpsLimiter.update(initialConfig);
        return;
    }
    class FPSLimiter {
        constructor(cfg) { this.originalRAF = window.requestAnimationFrame; this.lastFrameTime = -Infinity; this.isIframe = window.self !== window.top; this.update(cfg); this.listenForMessages(); }
        update(cfg) { this.config = cfg; if (this.isIframe && !this.config.applyInFrames) { this.uninstall(); return; } this.frameInterval = 1000 / (this.config.value > 0 ? this.config.value : 60); this.install(); }
        install() { if (this.config.enabled) { const r = this.throttledRAF.bind(this); r.toString = () => this.originalRAF.toString(); window.requestAnimationFrame = r; } else { this.uninstall(); } }
        uninstall() { window.requestAnimationFrame = this.originalRAF; }
        throttledRAF(cb) { const t = performance.now(), e = t - this.lastFrameTime, d = this.frameInterval - e; const exec = () => { try { cb(performance.now()); } catch (err) { console.error("FPS Limiter:", err); } }; if (d <= 0) { this.lastFrameTime = t; exec(); } else { setTimeout(exec, d); } }
        listenForMessages() { chrome.runtime.onMessage.addListener((msg) => { if (msg.type === 'UPDATE_CONFIG') { this.update(msg.config); } }); }
    }
    window.myFpsLimiter = new FPSLimiter(initialConfig);
};

// --- LOGIC CỦA SERVICE WORKER ---

let settingsCache = {};

async function loadAndCacheSettings() {
    const data = await chrome.storage.local.get(null);
    settingsCache = {
        globalDisabled: data.globalDisabled ?? false,
        autoModeMasterEnable: data.autoModeMasterEnable ?? true,
        applyInFrames: data.applyInFrames ?? false,
        globalConfig: data.global ?? { enabled: true, value: 60 },
        siteConfigs: data,
        autoModeConfigs: data.autoModeConfigs || [],
    };
}

function getConfigForUrl(url, tabIsActive, tabIsAudible) {
    if (!settingsCache.globalConfig) return { enabled: false, value: 60 };
    try {
        const host = new URL(url).hostname;
        if (settingsCache.autoModeMasterEnable) {
            if (!tabIsActive && tabIsAudible) return { enabled: true, value: 5 }; // Tối ưu tài nguyên nền
            const autoConfig = settingsCache.autoModeConfigs.find(c => host.includes(c.domain));
            if (autoConfig) return { enabled: true, value: autoConfig.fps };
        }
        const siteConfig = settingsCache.siteConfigs[host];
        if (siteConfig) return siteConfig;
        return settingsCache.globalConfig;
    } catch (e) {
        return settingsCache.globalConfig;
    }
}

async function updateTab(tab) {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith('http')) return;
    if (settingsCache.globalDisabled) return;

    const config = getConfigForUrl(tab.url, tab.active, tab.audible);

    try {
        await chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_CONFIG', config });
    } catch (e) {
        if (e.message.includes('Receiving end does not exist')) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id, allFrames: settingsCache.applyInFrames },
                func: fpsLimiterInjector,
                args: [config],
                world: 'MAIN',
            }).catch(err => {});
        }
    }
}

// --- LISTENERS ĐÃ ĐƯỢC TỐI ƯU ---

chrome.storage.onChanged.addListener(async () => {
    await loadAndCacheSettings();
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
        await updateTab(tab);
    }
});

const tabUpdateHandler = (tabId) => {
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) return;
        updateTab(tab);
    }).catch(()=>{});
};

chrome.tabs.onActivated.addListener(activeInfo => tabUpdateHandler(activeInfo.tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.audible !== undefined) {
        updateTab(tab);
    }
});

chrome.runtime.onStartup.addListener(loadAndCacheSettings);
chrome.runtime.onInstalled.addListener(loadAndCacheSettings);
