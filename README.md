# ORBI — The Living Wisdome

Interactive WebGL fulldome character with MediaPipe hand tracking.

## Run

Node.js 20.19+ or 22.12+ required. Run `npm ci`, then `npm run dev`, and open the printed localhost URL in Chrome.

## English voice routines

Click **Start voice** and allow microphone access. Camera and voice can run together.

- **“Take a lap”**: animated lap around the dome.
- **“Flirt”**: move to the side, heart eyes, kiss mouth and wink.

Voice routines temporarily take control from gestures for eight seconds, then return control. Space/center or reset cancels a routine. Silent pauses keep listening; network and permission errors show a recovery message. Chrome speech recognition may require internet. Real microphone recognition remains dependent on the browser, permissions and speech service.

**C** camera · **D** controls · **V** camera preview · **F** fullscreen.

Run `npm test` and `npm run build` for checks. GPL-3.0-or-later; see LICENSE and THIRD_PARTY.md.


## Microphone troubleshooting

Use **Test microphone** to check the input level. Stop the test before starting voice. A successful microphone test with failed recognition points to Chrome’s speech service rather than the animation commands. Select the built-in input in Chrome’s microphone settings; macOS must also allow Google Chrome microphone access. After switching from a disconnected input, fully quit and reopen Chrome if capture still fails. **Try lap** and **Try flirt** let you verify animations independently.
