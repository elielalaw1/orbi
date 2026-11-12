# ORBI — runbook

ORBI is a live dome character controlled by hand gestures. The camera and gesture guide stay on the laptop; a separate window sends the clean image to the dome.

## Prepare once, before the presentation

Project: https://github.com/elielalaw1/orbi

Use the current prepared copy on the presentation laptop. To set up a downloaded copy: install Node.js 22.12+, open Terminal in the extracted project folder, then run:

```sh
npm ci
npm run build
```

## Start

1. Connect HDMI. Use an extended display at **3840 × 2160**.
2. Double-click **Start Orbi.command** in the prepared project folder, or run:

   ```sh
   npm run preview -- --port 4173 --strictPort
   ```

3. Keep Terminal open. Open **http://localhost:4173/** in Chrome.
4. Click **Enable sound**, then **Start camera** and allow camera access.
5. Click **Launch dome output**. Move that window to the projector display and press **F**. The centered 2160 × 2160 picture has black sidebars.
6. Check brightness and left/right direction. Use **Invert pointing left / right** beneath the camera if needed. If calibration guides are visible, press **G** in the laptop window to hide them.

## Perform

The emoji guide beneath the camera shows every scene. Hold a pose for about half a second; lower your hands before repeating. One fist returns home and cancels a scene. Scenes can also be clicked in the guide.

Keyboard backup: **1–6** expressions · **arrow keys** movement · **Space** home/cancel · **R** reset · **C** camera · **V** camera guide · **F** fullscreen. Use character shortcuts in the laptop window; the projector window uses **F** only.



To stop the server, press **Control + C** in Terminal.
