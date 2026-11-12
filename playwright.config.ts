import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const chromiumPath = process.env.CHROMIUM_PATH ?? [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].find(path => existsSync(path));
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1440, height: 1100 },
    launchOptions: {
      executablePath: chromiumPath,
      args: [
        "--no-sandbox",
        "--enable-unsafe-swiftshader",
        "--autoplay-policy=no-user-gesture-required",
        ...(process.env.ORBI_SOFTWARE_WEBGL ? ["--use-angle=swiftshader"] : []),
      ],
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
