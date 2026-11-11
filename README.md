# ORBI — The Living Wisdome

Interactive WebGL fulldome character with MediaPipe hand tracking.

## Run

Node.js 20.19+ or 22.12+ required. Run `npm ci`, then `npm run dev`, and open the printed localhost URL in Chrome.

## Voice and hand routines

Click **Start voice** and allow microphone access. Camera and voice can run together.

- **“Run”**: animated lap around the dome.
- **Two-hand heart** (touch index fingertips above touching thumbs and hold briefly): move to the side, heart eyes, kiss mouth and wink.

In either navigation mode, hold two thumbs up for pinball, two fists for zero gravity, two open palms for rain, or two peace signs for the ghost chase.

Routines temporarily take control from gestures for eight seconds, then return control. Space/center or reset cancels a routine. Silent pauses keep listening; network and permission errors show a recovery message. Chrome speech recognition may require internet. Real microphone recognition remains dependent on the browser, permissions and speech service.

**C** camera · **D** controls · **V** camera preview · **F** fullscreen.

Run `npm test` and `npm run build` for checks. GPL-3.0-or-later; see LICENSE and THIRD_PARTY.md.


## Microphone troubleshooting

Use **Test microphone** to check the input level. Stop the test before starting voice. A successful microphone test with failed recognition points to Chrome’s speech service rather than the animation commands. Select the built-in input in Chrome’s microphone settings; macOS must also allow Google Chrome microphone access. After switching from a disconnected input, fully quit and reopen Chrome if capture still fails. **Try run** and **Try flirt** let you verify animations independently.

Voice accepts “run” and “flirt,” close variants such as “running,” “ron,” “flert,” and “flirting,” and optional “Orbi” or “please” prefixes. Commands must match a supported phrase. Reported confidence below 50% is rejected. Hand scenes need about a half-second hold and tolerate brief tracking dropouts.
