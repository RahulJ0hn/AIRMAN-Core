/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/tests/**"],
  coverageDirectory: "coverage",
  setupFiles: ["<rootDir>/src/tests/setup.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        // Disable type-checking in tests — mocks cause spurious TS errors.
        // Type safety is enforced by the main `tsc` build step.
        diagnostics: false,
      },
    ],
  },
};
