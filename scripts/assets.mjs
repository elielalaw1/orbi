import { mkdir, copyFile, writeFile } from "node:fs/promises";
await mkdir("public/wasm", { recursive: true });
for (const name of [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
])
  await copyFile(
    `node_modules/@mediapipe/tasks-vision/wasm/${name}`,
    `public/wasm/${name}`,
  );
const response = await fetch(
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
);
if (!response.ok) throw Error(`Model download: ${response.status}`);
await mkdir("public/models", { recursive: true });
await writeFile(
  "public/models/gesture_recognizer.task",
  Buffer.from(await response.arrayBuffer()),
);
console.log("MediaPipe runtime and model saved locally.");
