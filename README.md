# ORBI — The Living Wisdome

Interactive WebGL fulldome character with MediaPipe hand tracking.

## Run

Node.js 20.19+ or 22.12+ required. Run `npm ci`, then `npm run dev`, and open the printed localhost URL in Chrome.

## Hand gestures

Start the camera. The emoji guide below your camera shows every scene. Hold a scene pose for about half a second; lower your hands before repeating it.

| Hands | Scene |
|---|---|
| 👍👍 Two thumbs up | Boxing match |
| ✊✊ Two fists | Zero gravity |
| 🫶 Heart with both hands | Flirt |
| ✌️✌️ Two peace signs | Run |
| 🖐️✊ One palm and one fist | Orbi Hears an Echo |
| 🤟🤟 Thumb, index and little finger out on both hands | Two Orbis, One Rose |
| 👎👎 Two thumbs down | The Great Escape |
| 🖕 One middle finger | Angry fire |
| 🖐️🖐️ Two open palms | The Death of Orbi; release and repeat to stop |

Left/right pointing is inverted by default for the camera-facing-sweetspot setup. Use **Invert pointing left / right** beneath the camera to switch back; this does not flip the camera image or vertical navigation. Verify against audience left/right in the dome.

One fist returns home and cancels a scene. Point left/right/down to move; both index fingers up move overhead; one peace sign moves back. Single-hand expressions: thumbs up happy, thumbs down sad, open palm surprised, 🤟 playful, middle finger angry. Scene buttons remain available.

**C** camera · **V** camera/gesture guide · **F** fullscreen.

Orbi opens directly in performance view. The small toolbar contains camera, sound, fullscreen, projector output, recording and brightness. Scene names beneath the camera can also be clicked.

Camera input only; no microphone or speech recognition. Sound effects and stereo recording remain available.

Run `npm test` and `npm run build` for checks. GPL-3.0-or-later; see LICENSE and THIRD_PARTY.md.

## Friday submission workflow

See [RUN.md](RUN.md) for startup, [runbook.md](runbook.md) for venue operation, and the [official hand-in checklist](https://dcuartielles.github.io/wisdome-360/course/hand-in/) for submission requirements. The browser recording is source material; do not upload the WebM as the required fallback.

1. Select **Record performance** in the toolbar. This records the square master at2048² with browser stereo sound, without guides. Perform the actual show, then stop. Keep the operator tab active.
2. With Python3 and FFmpeg installed, convert the downloaded recording (replace the example number/team with the actual assigned values):

   ```sh
   bash scripts/convert-fallback.sh /path/to/orbi-fallback.webm /path/to/B03_teamname_ORBI/fallback/B03_teamname_ORBI_2048x2048_30fps.mp4
   ```

   The converter writes a72Mbit/s H.264 MP4 and matching mono48kHz/16-bit WAVs into `audio/`. It prepends a one-frame circular white flash and1kHz tone. It refuses captures below2048² or without stereo audio, and refuses overwriting exports. A constant30fps export does not establish that every captured frame is unique.
3. Copy `runbook.md` into that submission folder; replace pending details and fallback paths with the real names. Include the completed presentation for the final upload. Preserve credits and source/license notices if distributing source.
4. Run `python3 scripts/check-delivery.py /path/to/B03_teamname_ORBI`. Watch the entire resulting MP4 in the official simulator and listen to its final WAVs in sync. The checker cannot prove160° source geometry, performance quality or venue readiness.
5. If the MP4 exceeds500MB, create the reduced upload version using the command on the official hand-in page. Bring the full master on the laptop. ZIP the correctly named folder, with the presentation included for the final upload. A pair follows the supplied Canvas instruction: both upload the same ZIP.

A final submission cannot be named correctly until the actual running-order number and team name are known. The supplied short test recording is not a completed performance fallback.
