import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["verification/openclaw.e2e.test.ts"],
    testTimeout: 300_000,
    hookTimeout: 300_000,
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
