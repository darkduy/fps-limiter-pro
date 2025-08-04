module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Thêm mục 'transform' để đảm bảo ts-jest được sử dụng
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
