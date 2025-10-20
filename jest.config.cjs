module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['jest-canvas-mock'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ]
};
