# Run Orbi

## Download and set up once

1. Open **https://github.com/elielalaw1/orbi**.
2. Click **Code → Download ZIP**, then unzip it. The extracted **orbi-main** folder is the project folder.
3. Install **Node.js 22.12 or newer** from https://nodejs.org if it is not installed.
4. Open **Terminal**. Type `cd ` (with a space), drag the **orbi-main** folder into Terminal, then press **Return**.
5. Run these commands, one at a time:

```sh
npm ci
npm run build
npm run preview -- --port 4173 --strictPort
```

## Open Orbi

1. Keep Terminal open and open **http://localhost:4173/** in Chrome.
2. Click **Enable sound** in the small toolbar.
3. Click **Start camera** and allow access.

Left/right pointing is inverted for the dome setup. Toggle **Invert pointing left / right** beneath the camera if the direction is wrong.

To project: click **Launch dome output**, move that window to the projector display, then press **F**.

To stop: press **Control + C** in Terminal.
