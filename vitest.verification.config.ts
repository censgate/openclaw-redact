import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["verification/**/*.test.ts"],
    exclude: ["verification/openclaw.e2e.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    globalSetup: "./verification/globalSetup.ts",
    reporters: ["default", "./verification/verificationReporter.ts"],
    pool: "threads",
    maxConcurrency: 1,
    fileParallelism: false,
    poolOptions: {
      threads: {
        isolate: false,
        singleThread: true,
      },
    },
  },
});
