import { test, expect, type Page } from "@playwright/test";

const pixel = (page: Page, x: number, y: number) => page.locator("#dome").evaluate(
  (canvas, point) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2")!;
    const value = new Uint8Array(4);
    gl.readPixels(point.x, point.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, value);
    return [...value];
  }, { x, y },
);

async function syntheticCamera(page: Page) {
  await page.addInitScript(() => {
    (window as any).__cameraRequests = [];
    (window as any).SpeechRecognition = class {
      constructor() { throw new Error("Speech recognition must not be used"); }
    };
    (window as any).webkitSpeechRecognition = (window as any).SpeechRecognition;
    const source = document.createElement("canvas");
    source.width = 640;
    source.height = 480;
    const context = source.getContext("2d")!;
    context.fillStyle = "#28382d";
    const paint = () => {
      context.fillRect(0, 0, source.width, source.height);
      requestAnimationFrame(paint);
    };
    requestAnimationFrame(paint);
    navigator.mediaDevices.getUserMedia = async constraints => {
      (window as any).__cameraRequests.push(constraints);
      if (constraints?.audio) throw new Error("Microphone must not be requested");
      return source.captureStream(20);
    };
  });
}

async function startCamera(page: Page) {
  await page.locator("#projection-camera").click();
  await expect(page.locator("#model")).toHaveText("Ready · local", { timeout: 30000 });
  await expect(page.locator("#hand-preview")).toBeVisible();
}

test("opens directly into Orbi with no studio or simulator page", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  // The former simulator link must not resurrect the removed interface.
  await page.goto("/?simulator");
  await expect(page.locator("#dome")).toBeVisible();
  await expect(page.locator("iframe, .sidebar, #studio, #projection-dashboard")).toHaveCount(0);
  await expect(page.getByText("ORBI · controls", { exact: true })).toHaveCount(0);
  await page.keyboard.press("d");
  await expect(page.locator("iframe, .sidebar, #studio")).toHaveCount(0);
  await expect.poll(() => pixel(page, 0, 0)).toEqual([0, 0, 0, 255]);
  const neutral = await pixel(page, 384, 384);
  expect(neutral[0]).toBeGreaterThan(neutral[2] * 3);
  await page.keyboard.press("3");
  await expect.poll(async () => (await pixel(page, 384, 384))[2]).toBeGreaterThan(neutral[2] + 15);
  await page.keyboard.press("r");
  await expect.poll(async () => (await pixel(page, 384, 384))[0]).toBeGreaterThan(100);
  await page.screenshot({ path: testInfo.outputPath("performance-desktop.png") });
  expect(errors).toEqual([]);
});

test("synchronizes a clean centered HDMI output independently of operator UI", async ({ page }, testInfo) => {
  await page.goto("/");
  const popup = page.waitForEvent("popup");
  await page.locator("#open-output").click();
  const output = await popup;
  await output.setViewportSize({ width: 3840, height: 2160 });
  await expect(output.locator("#dome")).toHaveAttribute("width", "2160");
  await expect(output.locator("button, video, aside, iframe")).toHaveCount(0);
  expect(await output.locator("#dome").boundingBox()).toMatchObject({ x: 840, y: 0, width: 2160, height: 2160 });
  expect(await pixel(output, 0, 0)).toEqual([0, 0, 0, 255]);
  const neutral = await pixel(output, 1080, 1080);
  await page.bringToFront();
  await page.keyboard.press("3");
  await expect.poll(async () => (await pixel(output, 1080, 1080))[2]).toBeGreaterThan(neutral[2] + 15);
  await page.keyboard.press("2");
  await page.waitForTimeout(100);
  await page.close();
  await expect.poll(async () => {
    const color = await pixel(output, 1080, 1080);
    return color[0] > color[2] * 3;
  }).toBe(true);
  await output.screenshot({ path: testInfo.outputPath("hdmi-output.png") });
});

test("camera denial leaves keyboard control working and mobile page contained", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    };
  });
  await page.goto("/");
  await page.locator("#projection-camera").click();
  await expect(page.locator("#toast")).toContainText(/manual controls/i);
  await expect(page.locator("#projection-camera")).toBeEnabled();
  await expect(page.locator("#hand-preview")).toBeHidden();
  await page.keyboard.press("3");
  await expect.poll(async () => (await pixel(page, 384, 384))[2]).toBeGreaterThan(30);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: testInfo.outputPath("performance-mobile.png") });
});

test("camera guide covers all scenes, keeps inversion separate and requests no microphone", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1920, height: 1200 });
  await syntheticCamera(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /voice|microphone/i })).toHaveCount(0);
  await startCamera(page);
  await expect(page.locator(".pip-scenes li")).toHaveCount(9);
  await expect(page.locator('[data-gesture-scene="lap"]')).toContainText("✌️✌️");
  await expect(page.locator('[data-gesture-scene="flood"]')).toContainText("repeat to stop");
  const invert = page.locator("#invert-horizontal");
  await expect(invert).toBeChecked();
  const originalTransform = await page.locator("#pip-video").evaluate(video => getComputedStyle(video).transform);
  await invert.uncheck();
  expect(await page.locator("#pip-video").evaluate(video => getComputedStyle(video).transform)).toBe(originalTransform);
  await invert.check();
  expect(await page.evaluate(() => (window as any).__cameraRequests)).toEqual([
    { video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
  ]);
  await page.locator('[data-scene="lap"]').click();
  await expect(page.locator('[data-gesture-scene="lap"]')).toHaveClass(/active/);
  await page.keyboard.press("Space");
  await expect(page.locator(".pip-scenes li.active")).toHaveCount(0);
  await page.locator('[data-scene="flood"]').click();
  await expect(page.locator('[data-gesture-scene="flood"]')).toHaveClass(/active/);
  await page.keyboard.press("Space");
  await expect(page.locator(".pip-scenes li.active")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("gesture-guide.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  const guide = await page.locator("#hand-preview").boundingBox();
  expect(guide!.x).toBeGreaterThanOrEqual(0);
  expect(guide!.x + guide!.width).toBeLessThanOrEqual(390);
  expect(guide!.y + guide!.height).toBeLessThanOrEqual(844);
});

test("records a 2048 square performance and restores preview resolution", async ({ page }, testInfo) => {
  await syntheticCamera(page);
  await page.goto("/");
  await startCamera(page);
  await page.locator("#projection-camera").click();
  await page.locator("#record-performance").click();
  await expect(page.locator("#dome")).toHaveAttribute("width", "2048");
  await page.waitForTimeout(1000);
  const pending = page.waitForEvent("download");
  await page.locator("#record-performance").click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("orbi-fallback.webm");
  await download.saveAs(testInfo.outputPath("test-recording.webm"));
  await expect(page.locator("#dome")).toHaveAttribute("width", "768");
  await expect(page.locator("#record-performance")).toContainText(/record/i);
});

test("unsupported graphics shows a useful error without uncaught exceptions", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind: any, ...args: any[]): any {
      if (kind === "webgl2") return null;
      return original.apply(this, [kind, ...args] as any);
    };
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Projection unavailable" })).toBeVisible();
  await expect(page.locator(".fatal p")).toContainText("WebGL2 is unavailable");
  expect(errors).toEqual([]);
});
