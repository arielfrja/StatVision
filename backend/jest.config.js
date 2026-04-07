module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Map uuid to the CommonJS entry point
    '^uuid$': 'uuid',
  },
  transformIgnorePatterns: [
    // This allows uuid (an ESM-only package) to be transformed by ts-jest
    "node_modules/(?!(uuid)/)"
  ],
};
