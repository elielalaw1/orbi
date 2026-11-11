# Wisdome operator runbook

## Start in under two minutes

1. Connect power and HDMI. Extend desktop (do not mirror), set the projector display to **3840 × 2160**, and check that an adapter has not dropped it to 1080p.
2. In the project directory run `npm run dev`. Open localhost:5173 in Chrome/Edge on the laptop.
3. Launch dome output. Move that new window to the HDMI display, then press **F there**. The canvas backing store is 2160²; at 3840 × 2160 it sits at x=840, y=0 with pure black sides. At another viewport size it is proportionally fitted, so verify display and browser scaling. Browser chrome disappears only in fullscreen.
4. Return to studio on the laptop. Trigger moods 1–6 and arrow movements. Check orientation and guides with the technicians. Disable guides before the performance.
5. Start the built-in camera, grant permission, verify gestures. If it fails, use buttons/keyboard. Tune dome intensity. Audio is off by default.

No cursor, webcam, text or control UI is drawn in output. F is the only output shortcut, preventing accidental local state changes. The operator keeps control of calibration guides. A standalone output without a studio starts a neutral idle face.

## OBS alternative

Open square output, capture that window, and crop browser chrome if necessary. OBS Base and Output: 3840 × 2160, 30 FPS. Set the square source size 2160 × 2160 and position 840,0; keep the rest black. Use Fullscreen Projector on the HDMI monitor. Capture only the square canvas area, not the studio page. OBS may add a frame or two of latency.

## Official simulator

Open https://dcuartielles.github.io/wisdome-360/tools/dome-simulator.html separately. Click **Share a screen, window or tab…** and choose the **square output**, then approve in the browser/OS picker. Set 160°, tilt 26°, front bottom. Use a centered 100% crop of a square source; adjust crop for window chrome. Confirm no mirroring. This supplies the actual fisheye image, not a perspective preview. Alternatively, use ORBI's PNG download or recorded WebM via Open file.

Inspect Reference, Back row and Back row far left. For a symmetric right-side seat, use Custom with Left/right +2.6 m, Height +1.0 m and Front/back +2.4 m. Look at the sweet spot. Test expressions and left/right/up/down, check brows/mouth remain visible, and compare cross-reflection on/off at several brightness settings. Simulator seat locations and cross-reflection are approximate. Validate actual sightlines and brightness from the real seats.

`node scripts/check-simulator.mjs` runs an optional network-dependent inspection, saves actual dome-master PNGs and simulator screenshots, and exercises the simulator's share handler with a controlled canvas-stream fixture replacing the OS picker. This is separate from normal offline tests and does not establish physical screen-sharing compatibility.

## Audio and fallback

ORBI supplies optional browser stereo sound only. Select the HDMI sound device in the OS if using the venue's stereo fallback. Dante 5.1 requires a separately configured sender or interface and 6-channel material; this application does not implement that route.

Bring the converted MP4 fallback and this runbook. For video-file delivery, official separate audio order is L,R,C,LFE,Ls,Rs, mono WAV per channel, 48 kHz/16-bit; stereo uses L,R only. Align frame-one audio sync tone with the conversion script's frame-one white circular flash. Verify final files in the simulator and with technicians.

Before the show, disable notifications, screen savers, sleep and automatic updates on the installation laptop. Test the same adapters, cables and laptop in the dry run. Check audio/video latency and sustained production frame rate.

## Recovery

- Camera permission denied: enable site permission and Start camera again; manual control continues.
- Model unavailable: verify `public/models/gesture_recognizer.task` and `public/wasm/`; `npm run assets` refreshes them with internet access.
- Camera unplugged: reconnect, restart camera, recalibrate center if needed.
- Output out of sync: keep one studio open; reload output. Both must use the same exact origin, including host and port (`localhost` and `127.0.0.1` differ).
- Low FPS: lower studio resolution and inference rate; use square output plus OBS scaling if the 2160² shader is too heavy. Recording can duplicate frames, so conversion to 30 FPS does not prove 30 FPS capture.
- WebGL context lost: reload output and check graphics acceleration. If it persists, play the fallback recording.
