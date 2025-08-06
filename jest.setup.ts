// jest.setup.ts

// File này sẽ chạy trước tất cả các bài test, tạo ra một đối tượng 'chrome' giả lập
// để các tệp như background.ts có thể được import mà không gây lỗi.
global.chrome = {
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
    },
    onStartup: {
      addListener: jest.fn(),
    },
    onMessage: {
      addListener: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      getBytesInUse: jest.fn().mockResolvedValue(0),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    onActivated: {
      addListener: jest.fn(),
    },
    onUpdated: {
      addListener: jest.fn(),
    },
    onRemoved: {
      addListener: jest.fn(),
    },
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
} as any;
