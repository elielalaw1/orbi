import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
  ],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  studio = await context.newPage();
await studio.goto("http://localhost:5173");
await studio.locator("#dome").waitFor();
await mkdir("docs/simulator", { recursive: true });
async function capture(name, delay = 1700) {
  await studio.waitForTimeout(delay);
  const data = await studio
    .locator("#dome")
    .evaluate((c) => c.toDataURL().split(",")[1]);
  const path = `docs/simulator/${name}-master.png`;
  await writeFile(path, Buffer.from(data, "base64"));
  return path;
}
const neutral = await capture("neutral");
await studio.screenshot({ path: "docs/studio-desktop.png", fullPage: true });
const sim = await context.newPage();
await sim.goto(
  "https://dcuartielles.github.io/wisdome-360/tools/dome-simulator.html",
);
await sim.locator("#pick").setInputFiles(neutral);
await sim.locator("#view").selectOption("dome");
await sim.locator("#guide").uncheck();
await sim.locator("#venue").uncheck();
await sim.locator("#frontMark").uncheck();
await sim.locator("#look").click();
for (const seat of ["ref", "back", "side", "right"]) {
  if (seat === "right") {
    await sim.locator("#seat").selectOption("custom");
    for (const [id, value] of [
      ["ex", "2.6"],
      ["ey", "1"],
      ["ez", "2.4"],
    ])
      await sim.locator("#" + id).evaluate((el, v) => {
        el.value = v;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
  } else await sim.locator("#seat").selectOption(seat);
  await sim.waitForTimeout(700);
  await sim.screenshot({ path: `docs/simulator/neutral-${seat}.png` });
}
await sim.locator("#haze").check();
await sim.screenshot({ path: "docs/simulator/cross-reflection.png" });
await sim.locator("#haze").uncheck();
await studio.locator('[data-emotion="angry"]').click();
const angry = await capture("angry");
await sim.locator("#pick").setInputFiles(angry);
await sim.locator("#seat").selectOption("ref");
await sim.waitForTimeout(700);
await sim.screenshot({ path: "docs/simulator/angry-ref.png" });
// Inspect directional holds and several intensities with cross-reflection.
await studio.locator('[data-emotion="neutral"]').click();
for (const direction of ["left", "right", "up", "down"]) {
  await studio.locator('[data-dir="' + direction + '"]').click();
  const file = await capture(direction, 1000);
  await sim.locator("#pick").setInputFiles(file);
  await sim.waitForTimeout(300);
  await sim.screenshot({ path: `docs/simulator/direction-${direction}.png` });
}
await studio.locator("#center").click();
for (const value of ["0.4", "0.68", "0.85"]) {
  await studio.locator('[data-setting="brightness"]').evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  const file = await capture("brightness-" + value);
  await sim.locator("#pick").setInputFiles(file);
  await sim.locator("#haze").check();
  await sim.waitForTimeout(300);
  await sim.screenshot({ path: `docs/simulator/brightness-${value}.png` });
}

// Exercise the official screen-sharing handler using a canvas stream of a rendered ORBI frame.
// Browser/OS source-picker approval is intentionally replaced; the simulator's own share handler runs.
const share = await context.newPage();
// Feed an actual rendered master into a controlled screen-capture fixture.
await share.addInitScript(
  ({ png }) => {
    navigator.mediaDevices.getDisplayMedia = async () => {
      const image = new Image();
      image.src = png;
      await image.decode();
      const c = document.createElement("canvas");
      c.width = image.width;
      c.height = image.height;
      const g = c.getContext("2d");
      g.drawImage(image, 0, 0);
      setInterval(() => g.drawImage(image, 0, 0), 33);
      return c.captureStream(30);
    };
  },
  {
    png:
      "data:image/png;base64," +
      (await studio
        .locator("#dome")
        .evaluate((c) => c.toDataURL().split(",")[1])),
  },
);
await share.goto(
  "https://dcuartielles.github.io/wisdome-360/tools/dome-simulator.html",
);
await share.locator("#share").click();
await share.waitForTimeout(1000);
await share.screenshot({ path: "docs/simulator/share-workflow.png" });
console.log("Simulator HUD:", await share.locator("#hud").textContent());
await browser.close();
