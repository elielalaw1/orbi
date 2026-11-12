# Performance-only application — 12 November 2026

The studio/dashboard and embedded simulator have been removed from source, styles and shipped assets. The main page is now Orbi with a small performance toolbar and camera/gesture guide. D and the old simulator query cannot reopen a studio. The separate projector window stays UI-free; full-performance stereo recording remains available.

Current validation:60 unit tests in14files,6 rewritten browser tests and production build pass. Browser tests verify no studio/sidebar/iframe, all scene controls and home reset, camera-only permissions and inversion, clean2160² HDMI output at x840,y0, mobile layout, camera denial, graphics failure, and2048² recording with stereo sound. The actual recorded fixture probes as VP9 2048² plus Opus48kHz stereo. Physical venue checks remain necessary.

# Hand gesture update — 12 November 2026

All nine animation-index scenes now have hand gestures from the shared GestureBindings list. Two-hand scene poses require450ms and180ms release/dropout tolerance. One fist cancels a scene in default gesture navigation. The camera guide includes scene emoji, movement and single-hand expressions. Floating guide is hidden in the dashboard to avoid blocking its camera controls.

Microphone capture and speech-recognition implementation/UI were removed. Camera requests explicitly use audio:false. Generated sound effects and stereo recording remain intact.

Verification:58 unit tests across14 files pass; all6 browser tests pass; production build passes under Node22. Browser checks cover guide rendering, absence of voice/mic controls, camera-only capture constraints, clean HDMI output and actual stereo recording. Synthetic hand fixtures test routing, hold/release, scene switching and confidence rejection; real-hand camera recognition still depends on pose and lighting.

# Current submission checks — 12 November 2026

The historical report below describes 10 November and is not proof that final submission files exist.

- Current unit tests: **60 passing tests across15 files**; production TypeScript/Vite build passes.
- A real Chrome manual performance capture was checked with ffprobe: **2048×2048 VP9, stereo Opus48kHz**. Recording restores the previous preview resolution afterward.
- The new delivery converter was exercised on a synthetic stereo fixture and an actual short Orbi browser recording. Both exported H.264 High2048², constant30fps, measured72Mbit/s, 8-bit Rec.709, without muxed audio; matching mono48kHz/16-bit PCM WAVs have exactly1600 samples per video frame.
- Decoded first-frame black corners/white center and first-frame1kHz tone in both channels pass `scripts/check-delivery.py`. The synthetic fixture has31 frames including the sync marker. Fixtures are temporary checks, not the full performance fallback.
- Current browser suite: **5 tests passed in 14.3 seconds** on 12 November 2026 using installed Google Chrome and Node 22. Updated checks cover current controls, black corners and emotional tint, clean 2160² output positioning and synchronization after the operator closes, camera denial/manual recovery, local MediaPipe startup, 2048² performance recording/download/settings restoration, mobile width, and unsupported graphics. Browser discovery is portable; screenshots and downloads stay in test-results rather than overwriting reference documentation. This is browser validation, not a venue performance benchmark.
- Final performance capture/order, final identity/names, full simulator watch-through, real camera accuracy, actual HDMI/Dante routing, venue brightness and sustained frame rate remain unverified.
- `public/audio/boxing.mp3` has no documented source/credit yet; obtain provenance before distribution.

# Validation report — 10 November 2026

## Automated results

- `npm install`: succeeded in the managed Linux workspace; package-lock.json is included.
- `npm run dev`: Vite serves the application at localhost:5173.
- `npm run build`: TypeScript checks and Vite production bundle succeeded.
- `npm test`: **14 passing tests in 7 files**.
- `npm run test:e2e`: **5 browser tests**, Chromium with software WebGL rendering. Covered actual shader pixels, manual emotion/direction keys, guide toggle/reset, no normal-operation page exceptions, denied camera permission/manual fallback, local MediaPipe WASM/model startup with a synthetic camera, no-hand inference, recording/download, mobile overflow, unsupported WebGL fallback, and two-window output synchronization.

The output test checks the actual canvas backing resolution is 2160², its bounding rectangle at 3840 × 2160 is x=840,y=0,width=2160,height=2160, and output contains neither buttons nor video. Pixel tests confirm black corners and golden/red/blue emotion backgrounds. It also closes the operator immediately after an emotion command and verifies the output finishes animating independently.

Unit tests cover: 160° radial mapping, 26° tilt, center/front/back room elevations, inverse projection roundtrips and side orientation; rolling gesture stability, confidence rejection, release/retrigger and stale samples; expression continuity, interruption, idle return and serialized state; pupils-before-face timing, motion limits, interrupted movement and return; rotation/scale-invariant synthetic middle-finger landmarks, ambiguous poses and conflicting model classifications; mirrored pointing, center dead zone and calibration; routing mock recognition results into shared emotion/direction actions.

## Official simulator inspection

Read the official home, comfortable-zone, live connection, delivery specification, EX-03 description **and actual shader source**, simulator source and problems documentation before implementing projection. References:

- https://dcuartielles.github.io/wisdome-360/
- https://dcuartielles.github.io/wisdome-360/reference/comfortable-zone/
- https://dcuartielles.github.io/wisdome-360/reference/connecting/
- https://dcuartielles.github.io/wisdome-360/reference/delivery-spec/
- https://dcuartielles.github.io/wisdome-360/examples/ex03-pulse/
- https://dcuartielles.github.io/wisdome-360/examples/files/EX-03-webgl-glsl/pulse.html
- https://dcuartielles.github.io/wisdome-360/tools/dome-simulator.html
- https://dcuartielles.github.io/wisdome-360/problems/

`node scripts/check-simulator.mjs` loaded actual ORBI WebGL dome-master PNGs into the hosted official simulator, at 160°, tilt 26°, front bottom. Captures are in `docs/simulator/`:

| Check | Observation |
| --- | --- |
| Reference | Face appears forward, below dome zenith; eyes and mouth form one coherent face. Full dome has the emotional surface color. |
| Back row | Features remain visible and become smaller; mouth is readable. |
| Far left | Perspective foreshortening is visible as expected from an off-center seat; no feature is cut off. |
| Far right | Symmetric custom position (+2.6,+1.0,+2.4 m) captures the other side; features remain visible. |
| Angry | Narrowed eyes, inward sloping brows, tense frown and red field convey anger without emotion labels. |
| Left/right | Actual fisheye snapshots put the facial group on the corresponding side in the simulator. |
| Up/down | Face stays visible above the rim; upper motion scales the group down modestly to keep brows from moving too far overhead. |
| Brightness 0.40 / 0.68 / 0.85 | Compared with simulated cross-reflection. Brighter fields visibly lift dark facial values and reduce contrast. Final brightness needs venue calibration. |

The script also invokes the official simulator's own Share handler with a controlled `getDisplayMedia` replacement: a video stream of a canvas holding an actual rendered ORBI frame. This verifies its accepted square stream format, **not real OS source selection or physical screen sharing**. The screen-sharing source picker and extended-display behavior must be tested on the installation laptop. Simulator source/file loading is genuinely exercised; screenshots are not mockups.

## Recording and conversion

The browser test downloads a short actual canvas WebM (`docs/test-recording.webm`); it is an early-stop smoke-test clip, not the full show fallback. A 10-second repeated recording fixture was converted by `scripts/convert-fallback.sh` and probed:

- H.264 High; 2048 × 2048; YUV420p, 8-bit.
- Constant frame-rate metadata 30/1; 300 frames for the 10-second fixture including sync.
- Rec.709 color-space tag.
- Measured video stream bitrate **72,001,093 bit/s**, above the 60 Mbit/s minimum.
- Decoded sync-frame corner RGB **[0,0,0]**, center approximately **[253,255,255]** (lossy YUV encoding).
- No muxed audio. Separate audio workflow is documented.

The large conversion fixture was kept in temporary storage rather than added to the project archive. The short browser download remains reproducible via E2E tests. The recorder's 33-second scripted sequence is implemented; an actual 30 FPS/full-resolution 33-second capture is still required on the venue laptop. Constant-frame-rate conversion duplicates missing capture frames; it is not a performance validation.

## Physical limits and unverified items

The environment has software graphics, with the studio preview around 6–10 FPS and the simultaneous official simulator/stream capture sometimes around 1 FPS. These results do **not** establish the production target of 30 FPS at 2048²/2160². A GPU laptop benchmark, inference-latency check, actual camera gestures, poor-light behavior, real display capture, HDMI negotiation, full-screen placement and a venue dry run remain required.

No claim is made for physical Wisdome validation or real-world gesture-recognition accuracy. Synthetic hand fixtures cannot represent every hand/camera orientation or occlusion. The simulator's seat geometry and cross-reflection are approximate. Audio is stereo only; there is no implemented Dante 5.1 sender. The optional fetch ball is omitted. Calibration is session-only.
