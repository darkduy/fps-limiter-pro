// src/background.test.ts
import { getConfigForUrl } from './background';
import type { SettingsCache, Profile, ProfileSettings } from './types';

// Mock (giả lập) các API của Chrome vì chúng không tồn tại trong môi trường test Jest
// @ts-ignore
global.chrome = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
    },
  },
};

describe('getConfigForUrl Logic', () => {
  let settingsCache: SettingsCache;
  let activeProfile: Profile | null;

  // Thiết lập dữ liệu mẫu trước mỗi bài test
  beforeEach(() => {
    const defaultSettings: ProfileSettings = {
      globalConfig: { enabled: true, value: 60 },
      autoModeConfigs: [{ domain: 'game.com', fps: 144 }],
    };
    activeProfile = { id: '1', name: 'Default', settings: defaultSettings };
    settingsCache = { autoModeMasterEnable: true };
  });

  test('Nên trả về 5 FPS cho tab chạy nền đang phát nhạc', () => {
    const url = 'http://googleusercontent.com/youtube.com/5';
    const isActive = false;
    const isAudible = true;
    
    const config = getConfigForUrl(url, isActive, isAudible, activeProfile, settingsCache);
    
    expect(config.value).toBe(5);
  });

  test('Nên trả về 144 FPS cho trang game.com trong danh sách theo dõi của Profile', () => {
    const url = 'https://game.com/play';
    const isActive = true;
    const isAudible = false;

    const config = getConfigForUrl(url, isActive, isAudible, activeProfile, settingsCache);
    
    expect(config.value).toBe(144);
  });

  test('Nên trả về 60 FPS (từ globalConfig của Profile) cho một trang bình thường', () => {
    const url = 'https://normal-website.com';
    const isActive = true;
    const isAudible = false;

    const config = getConfigForUrl(url, isActive, isAudible, activeProfile, settingsCache);
    
    expect(config.value).toBe(60);
  });
});
