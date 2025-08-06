// jest.config.js
module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // THÊM MỤC NÀY ĐỂ SỬA LỖI:
  // Đảm bảo ts-jest xử lý tất cả các tệp .ts/.tsx mà nó gặp phải
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
