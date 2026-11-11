# Third-party notices

- **Wisdome 360 / EX-03 Pulse**, David Cuartielles and contributors, https://github.com/dcuartielles/wisdome-360. Projection mapping adapted in `src/dome/ProjectionMath.ts` and `src/dome/shaders/dome.frag.glsl`. Official website marks code GPL-3.0; this derived app is distributed GPL-3.0-or-later. Original code reference: https://dcuartielles.github.io/wisdome-360/examples/files/EX-03-webgl-glsl/pulse.html. Changes: TypeScript inverse transform, procedural angular character, UI, gesture system, animation, synchronization and recording.
- **MediaPipe Tasks Vision**, Google, Apache-2.0, https://github.com/google-ai-edge/mediapipe. Runtime JS and WASM in `public/wasm/` copied from `@mediapipe/tasks-vision` 0.10.32. Gesture recognizer model (float16 version 1), https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task, Google MediaPipe pretrained model, Apache-2.0. See `public/MEDIAPIPE-LICENSE.txt`.
- **DM Sans**, Colophon Foundry and contributors, SIL Open Font License 1.1. **Manrope**, Mikhail Sharanda and contributors, SIL Open Font License 1.1. Fonts downloaded from Google Fonts and self-hosted in `public/fonts/`, with their license files alongside.
- Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT), Playwright (Apache-2.0), Node typings (MIT): package notices remain in installed dependencies. Exact versions are pinned by `package-lock.json`.

Character rendering is procedural. Recorded audio in public/audio is licensed separately from the application code.
- run.mp3 — “Cartoon Running” by Cam, CC BY 3.0, https://soundbible.com/1979-Cartoon-Running.html. Original recording bundled unchanged, played at 1.65× speed in the app.
- water.mp3 — “Bubbling” by Mike Koenig, CC BY 3.0, https://soundbible.com/1148-Bubbling.html. Bundled unchanged and looped during the flood.
- kiss.mp3 — “Cartoon Smooch” by Breviceps, CC0, https://freesound.org/people/Breviceps/sounds/444493/. Freesound MP3 preview bundled unchanged.
CC BY 3.0 license https://creativecommons.org/licenses/by/3.0/
CC0 dedication https://creativecommons.org/publicdomain/zero/1.0/

The official Wisdome Dome Simulator is bundled at `public/simulator/index.html` (GPL-3.0). Adaptations add live same-origin canvas input, compact seat controls, and ORBI keyboard forwarding. Its projection, dome geometry, seat calculations and cross-reflection shader remain the official implementation. The original full source is https://dcuartielles.github.io/wisdome-360/tools/dome-simulator.html.
