import type { SettingsCache, SiteConfig } from './types';

let settingsCache: SettingsCache = {};

async function loadAndCacheSettings(): Promise<void> {
    const data = await chrome.storage.local.get(null);
    settingsCache = {
        globalDisabled: data.globalDisabled ?? false,
        autoModeMasterEnable: data.autoModeMasterEnable ?? true,
        applyInFrames: data.applyInFrames ?? false,
        globalConfig: data.global ?? { enabled: true, value: 60 },
        siteConfigs: data,
        autoModeConfigs: data.autoModeConfigs || [],
        heavyHosts: data.heavyHosts || [],
    };
}

function getConfigForUrl(url: string, tabIsActive: boolean, tabIsAudible: boolean): SiteConfig {
    if (!settingsCache.globalConfig) return { enabled: false, value: 60 };
    try {
        const host = new URL(url).hostname;
        if (settingsCache.autoModeMasterEnable) {
            if (!tabIsActive && tabIsAudible) return { enabled: true, value: 5 };
            const autoConfig = (settingsCache.autoModeConfigs ?? []).find(c => host.includes(c.domain));
            if (autoConfig) return { enabled: true, value: autoConfig.fps };
        }
        const siteConfig = settingsCache.siteConfigs[host];
        if (siteConfig) return siteConfig;
        return settingsCache.globalConfig;
    } catch (e) {
        return settingsCache.globalConfig;
    }
}

async function updateTab(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith('http')) return;
    const config = getConfigForUrl(tab.url, tab.active, tab.audible ?? false);
    chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_CONFIG', config }).catch(() => {});
}

chrome.storage.onChanged.addListener(async (changes) => {
    await loadAndCacheSettings();
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
        await updateTab(tab);
    }
    if (changes.heavyHosts && tabs.length > 0) {
        for (const tab of tabs) {
            try {
                if(!tab.url || !tab.id) continue;
                const host = new URL(tab.url).hostname;
                if ((settingsCache.heavyHosts ?? []).includes(host)) {
                    chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
                    chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#e74c3c' });
                } else {
                    chrome.action.setBadgeText({ tabId: tab.id, text: '' });
                }
            } catch (e) {}
        }
    }
});

chrome.runtime.onMessage.addListener(async (message: any, sender: chrome.runtime.MessageSender) => {
    if (message.type === 'PAGE_IS_HEAVY' && sender.tab?.url) {
        try {
            const host = new URL(sender.tab.url).hostname;
            const { heavyHosts = [] } = await chrome.storage.local.get('heavyHosts');
            if (!heavyHosts.includes(host)) {
                heavyHosts.push(host);
                await chrome.storage.local.set({ heavyHosts });
            }
        } catch (e) {}
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.TabActiveInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        updateTab(tab);
    } catch (e) {}
});

chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (changeInfo.audible !== undefined) {
        updateTab(tab);
    }
});

chrome.runtime.onStartup.addListener(loadAndCacheSettings);
chrome.runtime.onInstalled.addListener(loadAndCacheSettings);
