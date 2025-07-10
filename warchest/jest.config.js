module.exports = {
  testEnvironment: 'node',
  // Disable cache to avoid permission issues writing to tmp
  cache: false,
  moduleNameMapper: {
    '^chalk$': '<rootDir>/tests/__mocks__/chalk.js',
    '^ora$': '<rootDir>/tests/__mocks__/ora.js'
  },
  cacheDirectory: '<rootDir>/tmp/jest_cache',
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};