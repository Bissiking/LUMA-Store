import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  webServer: {
    command: "npx tsx scripts/e2e-server.ts",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
