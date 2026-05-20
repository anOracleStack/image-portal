import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
export default defineConfig({
  resolve: {
    alias: { "@ip/shared": resolve(__dirname, "packages/shared/src/index.ts") },
  },
  test: { include: ["packages/**/test/**/*.test.ts"] },
});
