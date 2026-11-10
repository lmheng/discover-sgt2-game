import { randomBytes, scryptSync } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

/** Test-only admin passcode; the hash is generated fresh for each run. */
export const E2E_PASSCODE = "e2e-passcode-only-for-tests";
const salt = randomBytes(16);
const e2eHash = ["scrypt", 16384, 8, 1, salt.toString("base64"), scryptSync(E2E_PASSCODE, salt, 32).toString("base64")].join("$");

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * E2E projects mirror the three supported form factors:
 * - mobile-390: personal phone via QR (touch, small viewport)
 * - laptop-1366: ordinary government laptop
 * - kiosk-1920: booth monitor in kiosk mode
 *
 * The web server runs a production build with test-only admin credentials
 * and an isolated data directory.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 90_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-390",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "laptop-1366",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
    {
      name: "kiosk-1920",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
  ],
  webServer: {
    command: `npx next start -H 127.0.0.1 -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATA_DIR: ".e2e-data",
      ADMIN_PASSCODE_HASH: e2eHash,
      ADMIN_SESSION_SECRET: "e2e-session-secret-not-for-production-use-0123456789",
      RETENTION_DAYS: "90",
    },
  },
});
