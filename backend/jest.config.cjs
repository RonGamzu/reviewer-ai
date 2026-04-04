/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  moduleNameMapper: {
    // Prevent actual SQLite file creation during tests
    '^sqlite3$': '<rootDir>/src/__tests__/__mocks__/sqlite3Mock.cjs',
    // Prevent node-fetch ESM-only issues (v3 has no CJS build)
    '^node-fetch$': '<rootDir>/src/__tests__/__mocks__/fetchMock.cjs',
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
};
