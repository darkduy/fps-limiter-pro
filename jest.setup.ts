global.chrome = {
  alarms: { create: jest.fn(), onAlarm: { addListener: jest.fn() }},
  runtime: { onInstalled: { addListener: jest.fn() }, onStartup: { addListener: jest.fn() }, onMessage: { addListener: jest.fn() }},
  storage: {
    local: { get: jest.fn().mockResolvedValue({}), set: jest.fn(), clear: jest.fn(), remove: jest.fn(), getBytesInUse: jest.fn() },
    onChanged: { addListener: jest.fn() }
  },
  tabs: { query: jest.fn(), get: jest.fn(), onActivated: { addListener: jest.fn() }, onUpdated: { addListener: jest.fn() }, onRemoved: { addListener: jest.fn() }, discard: jest.fn() },
  action: { setBadgeText: jest.fn(), setBadgeBackgroundColor: jest.fn() },
} as any;
