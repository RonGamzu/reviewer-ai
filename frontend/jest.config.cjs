/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__tests__/__mocks__/styleMock.cjs',
    '\\.(jpg|jpeg|png|gif|webp)$': '<rootDir>/src/__tests__/__mocks__/fileMock.cjs',
    '\\.svg$': '<rootDir>/src/__tests__/__mocks__/fileMock.cjs',
    // Redirect api/client globally to avoid import.meta.env (Vite-only)
    '^.+/api/client\\.js$': '<rootDir>/src/__tests__/__mocks__/apiClientMock.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupTests.js'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.[jt]s?(x)'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
};
