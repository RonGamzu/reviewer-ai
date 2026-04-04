/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  moduleNameMapper: {
    // Mock Gemini SDK to avoid real API calls and ESM-related issues
    '^@google/generative-ai$': '<rootDir>/src/__tests__/__mocks__/generativeAiMock.cjs',
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
};
