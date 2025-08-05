// src/common/settingsManager.ts
import type { SettingsCache } from '../types';

/**
 * Hàm debounce giúp trì hoãn việc thực thi một hàm cho đến khi người dùng ngừng tương tác.
 * Rất hữu ích cho các sự kiện input, slider để tránh gọi API lưu trữ quá nhiều lần.
 */
export function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: number;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export const SettingsManager = {
  // Lấy tất cả cài đặt với giá trị mặc định an toàn
  getAllSettings: async (): Promise<SettingsCache> => {
    const defaults: SettingsCache = {
      globalDisabled: false,
      autoModeMasterEnable: true,
      applyInFrames: false,
      globalConfig: { enabled: true, value: 60 },
      autoModeConfigs: [],
      heavyHosts: [],
      profiles: [],
      activeProfileId: null,
      suspenderEnable: false,
      suspenderTimeout: 30,
      suspenderWhitelist: [],
    };
    const settings = await chrome.storage.local.get(defaults);
    return settings as SettingsCache;
  },

  // Cập nhật một hoặc nhiều cài đặt
  updateSettings: async (settingsToUpdate: Partial<SettingsCache>): Promise<void> => {
    await chrome.storage.local.set(settingsToUpdate);
  },
};
