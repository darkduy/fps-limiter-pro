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
            if (!tabIsActive && tabIsAudible) return { enabled: true, value: 5 };
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
    const config = getConfigForUrl(tab.url, tab.active, tab.audible);
    chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_CONFIG', config }).catch(() => {});
}

chrome.storage.onChanged.addListener(async () => {
    await loadAndCacheSettings();
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
        await updateTab(tab);
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        updateTab(tab);
    } catch (e) {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.audible !== undefined) {
        updateTab(tab);
    }
});

chrome.runtime.onStartup.addListener(loadAndCacheSettings);
chrome.runtime.onInstalled.addListener(loadAndCacheSettings);
