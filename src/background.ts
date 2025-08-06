import type { SettingsCache, SiteConfig, Profile } from './types';

// --- CONSTANTS ---
const ALARM_NAME = 'tabSuspenderAlarm';

// --- STATE VARIABLES ---
// Các biến này hoạt động như một bộ nhớ đệm (cache) để truy cập nhanh
let settingsCache: SettingsCache = {};
let activeProfile: Profile | null = null;
let tabLastActivated: { [tabId: number]: number } = {};

// --- CORE FUNCTIONS ---

/**
 * Tải tất cả cài đặt từ chrome.storage và cập nhật cache.
 */
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
    };
    
    const { profiles = [], activeProfileId = null } = settingsCache;
    if (activeProfileId) {
        activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || null;
    } else {
        activeProfile = profiles[0] || null;
    }
}

/**
 * Hàm thuần túy để xác định cấu hình FPS cho một URL cụ thể.
 * Dễ dàng cho việc viết unit test.
 */
export function getConfigForUrl(url: string, tabIsActive: boolean, tabIsAudible: boolean, profile: Profile | null, sCache: SettingsCache): SiteConfig {
    const fallbackConfig: SiteConfig = { enabled: true, value: 60 };
    if (sCache.globalDisabled || !profile) return { ...fallbackConfig, enabled: !sCache.globalDisabled };
    
    const profileSettings = profile.settings;

    try {
        const host = new URL(url).hostname;
        if (sCache.autoModeMasterEnable) {
            if (!tabIsActive && tabIsAudible) return { enabled: true, value: 5 };
            const autoConfig = (profileSettings.autoModeConfigs ?? []).find(c => host.includes(c.domain));
            if (autoConfig) return { enabled: true, value: autoConfig.fps };
        }
        return profileSettings.globalConfig;
    } catch (e) {
        return profileSettings.globalConfig ?? fallbackConfig;
    }
}

/**
 * Gửi cấu hình FPS mới nhất đến content script của một tab.
 */
async function updateTabConfig(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith('http')) return;
    const config = getConfigForUrl(tab.url, tab.active, tab.audible ?? false, activeProfile, settingsCache);
    chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_CONFIG', config }).catch(() => {});
}

/**
 * Cập nhật значок cảnh báo (!) cho một tab nếu nó nằm trong danh sách "heavyHosts".
 */
function updateTabBadge(tab: chrome.tabs.Tab): void {
    if (!tab.id || !tab.url) return;
    try {
        const host = new URL(tab.url).hostname;
        const isHeavy = (settingsCache.heavyHosts ?? []).includes(host);
        const text = isHeavy ? '!' : '';
        chrome.action.setBadgeText({ tabId: tab.id, text });
        if (isHeavy) {
            chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#e74c3c' });
        }
    } catch (e) {}
}

/**
 * Kiểm tra và "ngủ đông" các tab không hoạt động.
 */
async function checkAndSuspendTabs(): Promise<void> {
    const { suspenderEnable = false, suspenderTimeout = 30, suspenderWhitelist = [] } = settingsCache;
    if (!suspenderEnable) return;

    const timeoutMs = suspenderTimeout * 60 * 1000;
    const now = Date.now();
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"], discarded: false, autoDiscardable: true });

    for (const tab of tabs) {
        if (!tab.id || tab.active || tab.audible || tab.pinned) continue;
        const lastActivated = tabLastActivated[tab.id] || now;
        const isWhitelisted = tab.url && suspenderWhitelist.some(domain => tab.url!.includes(domain));
        if (isWhitelisted) continue;

        if (now - lastActivated > timeoutMs) {
            if (chrome.tabs && chrome.tabs.discard) {
                chrome.tabs.discard(tab.id).catch(() => {});
            }
        }
    }
}

// --- EVENT LISTENERS ---

// Listener trung tâm: Bất kỳ thay đổi nào trong storage cũng sẽ kích hoạt làm mới toàn bộ
chrome.storage.onChanged.addListener(async () => {
    await loadAndCacheSettings();
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
        await updateTabConfig(tab);
        updateTabBadge(tab);
    }
});

// Lắng nghe tín hiệu từ content script
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

// Cập nhật thời gian active của tab
chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
    tabLastActivated[activeInfo.tabId] = Date.now();
});

// Cập nhật config khi audible thay đổi
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.audible !== undefined) {
        await updateTabConfig(tab);
    }
});

// Dọn dẹp khi tab bị đóng
chrome.tabs.onRemoved.addListener((tabId: number) => {
    delete tabLastActivated[tabId];
});

// Khởi tạo bộ đếm giờ cho Tab Suspender
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === ALARM_NAME) {
        checkAndSuspendTabs();
    }
});

// Khởi tạo khi extension được cài đặt/cập nhật
chrome.runtime.onInstalled.addListener(() => {
    loadAndCacheSettings();
    chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: 1,
        periodInMinutes: 1,
    });
});

// Khởi tạo khi trình duyệt khởi động
chrome.runtime.onStartup.addListener(loadAndCacheSettings);
