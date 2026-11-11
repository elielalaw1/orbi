import { test, expect } from "@playwright/test";
const pixel = async (
  page: import("@playwright/test").Page,
  x: number,
  y: number,
) =>
  page.locator("#dome").evaluate(
    (canvas, pt) => {
      const gl = (canvas as HTMLCanvasElement).getContext("webgl2")!,
        p = new Uint8Array(4);
      gl.readPixels(pt.x, pt.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
      return [...p];
    },
    { x, y },
  );
test("renders actual shader, controls emotions and keeps black corners", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Bring the room to life." }),
  ).toBeVisible();
  await page.waitForTimeout(500);
  expect(await pixel(page, 0, 0)).toEqual([0, 0, 0, 255]);
  const center = await pixel(page, 512, 512);
  expect(center[0]).toBeGreaterThan(100);
  expect(center[0]).toBeGreaterThan(center[2] * 3);
  await page.keyboard.press("4");
  await expect(page.locator("#emotion-label")).toHaveText("Angry");
  await page.waitForTimeout(1100);
  const red = await pixel(page, 512, 512);
  expect(red[0]).toBeGreaterThan(red[1] * 3);
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#direction")).toHaveText("left");
  await page.keyboard.press("Space");
  await expect(page.locator("#direction")).toHaveText("Centered");
  await page.keyboard.press("g");
  await expect(page.locator("#guides")).toContainText("Hide guides");
  await page.keyboard.press("r");
  await expect(page.locator("#emotion-label")).toHaveText("Neutral");
  await page.keyboard.press("g");
  await page.waitForTimeout(1700);
  await page.screenshot({ path: "docs/studio-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("synchronizes a clean 2160 master in an HDMI output window", async ({
  page,
}) => {
  await page.goto("/");
  const popupPromise = page.waitForEvent("popup");
  await page.locator("#open-output").click();
  const out = await popupPromise;
  await out.waitForSelector("canvas");
  await expect(out.locator("button")).toHaveCount(0);
  await expect(out.locator("video")).toHaveCount(0);
  await out.setViewportSize({ width: 3840, height: 2160 });
  await page.locator('[data-emotion="sad"]').click();
  await page.waitForTimeout(1800);
  await expect(out.locator("canvas")).toHaveAttribute("width", "2160");
  const blue = await pixel(out, 1080, 1080);
  expect(blue[2]).toBeGreaterThan(blue[0] * 1.5);
  const box = await out.locator("canvas").boundingBox();
  expect(box).toMatchObject({ x: 840, y: 0, width: 2160, height: 2160 });
  await page.locator('[data-emotion="happy"]').click();
  await page.close();
  await out.waitForTimeout(1400);
  const yellow = await pixel(out, 1080, 1080);
  expect(yellow[0]).toBeGreaterThan(yellow[2] * 3);
  await out.screenshot({ path: "docs/hdmi-output.png" });
  await out.close();
});
test("camera denial preserves manual control and mobile layout fits", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    };
  });
  await page.goto("/");
  await page.locator("#camera-toggle").click();
  await expect(page.locator("#toast")).toContainText(
    "Manual controls remain available",
  );
  await page.locator('[data-emotion="happy"]').click();
  await expect(page.locator("#emotion-label")).toHaveText("Happy");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: "docs/studio-mobile.png", fullPage: true });
});
test("local MediaPipe model loads with a synthetic camera and recorder downloads", async ({
  browser,
}) => {
  const context = await browser.newContext({
    permissions: ["camera"],
    viewport: { width: 1280, height: 1000 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#999";
    ctx.fillRect(0, 0, 640, 480);
    setInterval(() => {
      ctx.fillRect(0, 0, 640, 480);
    }, 50);
    navigator.mediaDevices.getUserMedia = async () => canvas.captureStream(20);
  });
  await page.goto("/");
  await page.locator("#camera-toggle").click();
  await expect(page.locator("#model")).toHaveText("Ready · local", {
    timeout: 30000,
  });
  await expect(page.locator("#gesture")).toHaveText("No hand visible", {
    timeout: 10000,
  });
  await page.locator("#camera-toggle").click();
  await page.locator("#record").click();
  await expect(page.locator("#record")).toHaveText("■ Stop recording");
  await page.waitForTimeout(1000);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#record").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("orbi-fallback.webm");
  await download.saveAs("docs/test-recording.webm");
  await context.close();
});

test("unsupported graphics shows a useful message without uncaught errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      kind: any,
      ...args: any[]
    ): any {
      if (kind === "webgl2") return null;
      return original.apply(this, [kind, ...args] as any);
    };
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Projection unavailable" }),
  ).toBeVisible();
  await expect(page.locator(".fatal p")).toContainText("WebGL2 is unavailable");
  expect(errors).toEqual([]);
});
