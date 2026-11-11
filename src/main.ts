import { floodCueTime, floodFrame, FLOOD_DURATION } from "./character/FloodScene";
import "./style.css";
import { installVoice } from "./gesture/VoiceInput";
import { palmCenter } from "./gesture/GestureNavigator";
import { normalizeDegrees } from "./dome/FaceGeometry";
import { StateStore } from "./app/StateStore";
import { BroadcastSync } from "./app/BroadcastSync";
import {
  emotions,
  type Action,
  type Emotion,
  type Settings,
  type Direction,
} from "./app/types";
import { DomeRenderer } from "./dome/DomeRenderer";
import { CameraManager } from "./gesture/CameraManager";
import { MediaPipeRecognizer } from "./gesture/MediaPipeRecognizer";
import {
  HandInputController,
  type HandDetection,
} from "./gesture/HandInputController";
import type { Landmark } from "./gesture/CustomGestures";
import { SoundEngine } from "./audio/SoundEngine";
import { Recorder } from "./recording/Recorder";
function boot() {
  const app = document.querySelector<HTMLDivElement>("#app")!,
    params = new URLSearchParams(location.search),
    output = params.has("output"),
    square = params.get("output") === "square";
  const store = new StateStore(),
    sync = new BroadcastSync(output),
    sound = new SoundEngine(),
    recorder = new Recorder();
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const icons: Record<Emotion, string> = {
    neutral: "◡",
    happy: "⌣",
    sad: "⌢",
    angry: "≋",
    surprised: "○",
    playful: "⌁",
  };
  const animations = [
    ["Pinball", "Hold two thumbs up", "pinball"],
    ["Zero gravity", "Hold up two closed fists", "gravity"],
    ["Rain", "Show two open palms", "rain"],
    ["Ghost chase", "Make two peace signs", "ghost"],
    ["Flirt", "Make a heart with both hands", "flirt"],
    ["Run", "Start voice and say “run”", "lap"],
    ["Angry fire", "Raise one middle finger", "angry"],
    ["The Death of Orbi", "Press W to start or stop the flood", "flood"],
  ] as const;
  const range = (
    label: string,
    key: keyof Settings,
    min: number,
    max: number,
    step: number,
    unit = "",
  ) =>
    `<label class="range-label"><span>${label}<output id="v-${key}">${store.settings[key]}${unit}</output></span><input aria-label="${label}" data-setting="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${store.settings[key]}"></label>`;
  if (output) {
    document.body.className = "output";
    app.innerHTML =
      '<canvas id="dome" aria-label="ORBI dome projection"></canvas>';
    if (square) document.body.classList.add("square");
  } else
    app.innerHTML = `
<aside class="sidebar"><a class="brand" href="${import.meta.env.BASE_URL}" aria-label="ORBI home"><span class="brand-mark">o<span>••</span></span>ORBI<span class="brand-dot">®</span></a><div class="edition">THE LIVING WISDOME</div><nav><a class="nav-item active" href="#studio"><span>◉</span> Live studio <b>01</b></a><a class="nav-item" href="#calibration"><span>⌖</span> Calibration <b>02</b></a><a class="nav-item" href="#delivery"><span>↗</span> Output & delivery <b>03</b></a></nav><div class="side-bottom"><div class="mini-orbi">••<span>◡</span></div><p>A little gesture.<br>A whole world of feeling.</p><div class="venue">MALMÖ, SWEDEN<br><strong>Wisdome · 11.6 m · 26° tilt</strong></div><span class="version">ORBI STUDIO / V1.0</span></div></aside>
<main id="studio"><header><div class="breadcrumb">WORKSPACE <span>/</span> LIVE STUDIO</div><div class="session"><i></i> LOCAL SESSION <span id="clock">00:00</span></div></header>
<section class="title-row"><div><div class="eyebrow">AN INTERACTIVE DOME EXPERIENCE</div><h1>Bring the room to life<span>.</span></h1><p>Your gestures. Their feelings. One very big personality.</p></div><button class="primary" id="open-output">Launch dome output <span>↗</span></button></section>
<div class="studio-grid"><section class="preview-panel panel"><div class="panel-head"><h2><i class="live-dot"></i> <span id="view-title">In the dome</span> <span class="tag">LIVE SIMULATOR</span></h2><button class="text-button" id="toggle-simulator">View dome master</button><button class="text-button" id="guides">⌖ <span>Show guides</span> <kbd>G</kbd></button></div><div class="preview-stage simulator-view"><iframe id="simulator" src="${import.meta.env.BASE_URL}simulator/index.html?embedded" title="Live Wisdome simulator" allow="fullscreen" loading="eager"></iframe><div class="orbital-ring"></div><canvas id="dome" aria-label="Live fisheye dome-master preview"></canvas><div class="stage-label">160° EQUIDISTANT FISHEYE</div><div class="stage-north">BACK / ZENITH <span>↑</span></div><div class="stage-front">↓ <span>FRONT OF VENUE</span></div></div><div class="preview-footer"><div><i class="live-dot"></i><span id="emotion-label">Neutral</span><span class="muted" id="activity">Feeling at home</span></div><div><span id="fps">— FPS</span><span class="divider">/</span><span id="resolution-label">1024 × 1024</span><button id="snapshot" class="text-button" aria-label="Save dome image">↓ PNG</button></div></div></section>
<aside class="sim-side panel" aria-label="Simulator controls"><div class="sim-switch"><button id="index-tab" aria-pressed="true">Animations</button><button id="input-tab" aria-pressed="false">Camera input</button></div>
<section id="animation-index"><h2>Animation index</h2><p>Select a scene to play it. With the camera on, hold a two-hand gesture briefly.</p>
${animations.map(([name, cue], i) => `<button class="scene-entry" data-preview="${i}"><span><strong>${name}</strong><small>${cue}</small></span><span aria-hidden="true">▶</span></button>`).join("")}</section>
<section id="camera-input" class="camera-panel" hidden><div class="panel-head"><h2>Gesture input</h2><span class="tiny-status" id="input-mode">MANUAL</span></div><div class="camera-view"><video id="camera" playsinline muted></video><canvas id="landmarks"></canvas><div id="camera-empty"><div class="camera-icon">⌁</div><h3>A wave is all it takes.</h3><p>Connect your camera to give<br>ORBI something to react to.</p></div><span class="camera-badge" id="camera-badge">CAMERA OFF</span></div><button id="camera-toggle" class="camera-start">◉ &nbsp; Start camera <span>↗</span></button><div class="telemetry"><div><span>Detected gesture</span><strong id="gesture">No gesture</strong></div><div><span>Confidence</span><strong id="confidence">—</strong></div><div><span>Direction</span><strong id="direction">Centered</strong></div><div><span>Model</span><strong id="model">Not loaded</strong></div><div><span>Inference time</span><strong id="inference-cost">—</strong></div></div><div class="hint"><span>✦</span><p>Point to move directly. Hold other gestures briefly to change emotion.</p></div></section></aside>
<section class="emotion-panel panel"><div class="panel-head"><h2>Set the mood <span class="muted normal">A feeling fills the whole dome.</span></h2><span class="tiny-status">KEYS 1–6</span></div><div class="emotion-buttons">${emotions.map((e, i) => `<button class="emotion-button ${e === "neutral" ? "selected" : ""}" data-emotion="${e}" aria-pressed="${e === "neutral"}"><span class="emotion-face ${e}">${icons[e]}</span><strong>${e[0].toUpperCase() + e.slice(1)}</strong><span class="gesture-name">${["No gesture", "Thumbs up", "Thumbs down", "Middle finger", "Open palm", "Peace sign"][i]}</span><kbd>${i + 1}</kbd></button>`).join("")}</div></section>
<section class="direction-panel panel"><div class="panel-head"><h2>Follow your lead</h2><span class="tiny-status">ARROW KEYS</span></div><div class="direction-content"><div class="dpad"><button data-dir="up" aria-label="Look up">↑</button><button data-dir="left" aria-label="Look left">←</button><button id="center" aria-label="Return to center">⊙</button><button data-dir="right" aria-label="Look right">→</button><button data-dir="down" aria-label="Look down">↓</button></div><p>Eyes first.<br>Curiosity follows.<small>Space to return home</small></p></div></section></div>
<section class="lower-grid" id="calibration"><div class="panel controls"><div class="panel-head"><h2>Fine-tune the feeling</h2><button id="reset" class="text-button">↺ Reset character <kbd>R</kbd></button></div><div class="control-grid">${range("Dome brightness", "brightness", 0.15, 1, 0.01)}${range("Animation speed", "speed", 0.5, 1.5, 0.05)}<label class="select-label">Render resolution<select id="resolution"><option value="768">768 × 768 · preview</option><option value="1024" selected>1024 × 1024 · development</option><option value="2048">2048 × 2048 · production</option><option value="2160">2160 × 2160 · HDMI</option></select></label><label class="toggle-label"><span>Procedural sound<small>Optional stereo reactions</small></span><input id="audio" type="checkbox" role="switch"></label></div><details><summary>Face & animation calibration <span>＋</span></summary><div class="control-grid">${range("Home azimuth", "homeAz", -10, 10, 1, "°")}${range("Home elevation", "homeEl", 15, 25, 1, "°")}${range("Eye spacing", "eyeSpacing", 8, 18, 0.5, "°")}${range("Face scale", "faceScale", 0.6, 1.8, 0.02)}${range("Mouth scale", "mouthScale", 0.6, 1.3, 0.05)}${range("Eyebrow offset", "browOffset", -2, 2, 0.25, "°")}${range("Expression transition", "expressionMs", 250, 600, 10, " ms")}${range("Color transition", "colorMs", 600, 1200, 20, " ms")}${range("Return transition", "returnMs", 1000, 1800, 50, " ms")}${range("Directional hold", "holdMs", 500, 3000, 100, " ms")}${range("Anticipation", "anticipationMs", 100, 400, 10, " ms")}${range("Idle timeout", "idleMs", 3000, 15000, 500, " ms")}${range("Master volume", "volume", 0, 0.5, 0.01)}</div></details><details><summary>Gesture & pointing calibration <span>＋</span></summary><p class="calibration-note">Directional control is relative to the camera, not precise 3D pointing. Use a single index finger. In position mode, center your hand and press Calibrate center, then move outside the dead zone.</p><div class="control-grid"><label class="select-label">Pointing method<select id="pointing-method"><option value="orientation">Finger orientation</option><option value="position">Hand position</option></select></label><label class="toggle-label"><span>Mirror camera & directions</span><input id="mirror" type="checkbox" checked></label>${range("Confidence threshold", "confidence", 0.5, 0.95, 0.01)}${range("Stable gesture duration", "stableMs", 300, 500, 10, " ms")}${range("Reaction cooldown", "cooldownMs", 500, 2000, 100, " ms")}${range("Inference rate", "inferenceFps", 10, 30, 1, " FPS")}${range("Position dead zone", "deadZone", 0.08, 0.35, 0.01)}${range("Orientation threshold", "directionThreshold", 0.5, 0.9, 0.05)}<button class="secondary" id="calibrate">Calibrate hand center</button></div></details></div>
<div class="panel delivery" id="delivery"><div class="panel-head"><h2>Ready for the big room?</h2><span>↗</span></div><p>A clean output. A world of expression.<br>Keep your controls right here.</p><div class="output-spec"><strong>3840 × 2160</strong><span>HDMI FRAME · CENTERED 2160² MASTER</span></div><div class="delivery-actions"><button class="secondary" id="flood">Start The Death of Orbi <kbd>W</kbd></button><button class="secondary" id="square-output">Open square master ↗</button><button class="secondary" id="record">● Record demo</button></div><span class="delivery-note">Output window: press F for fullscreen.<br>Recording follows a 33-second scripted sequence.</span></div></section><footer><span><b class="footer-logo">ORBI</b> THE DOME IS THE CHARACTER.</span><span>BUILT FOR WISDOME MALMÖ <span class="footer-star">✳</span></span></footer></main><div id="toast" role="status" aria-live="polite"></div>`;
  const canvas = $<HTMLCanvasElement>("dome");
  let dashboardOpen = false;
  let sweepTimers: number[] = [];
  const previewDock = canvas.parentElement!;
  if (!output) {
    const stage = document.createElement("section");
    stage.id = "projection-stage";
    stage.setAttribute("aria-label", "Clean dome projection");
    app.prepend(stage);
    const toolbar = document.createElement("div");
    toolbar.className = "projection-toolbar";
    toolbar.innerHTML =
      '<button id="projection-camera">Start camera · C</button><button id="projection-fullscreen">Fullscreen · F</button><button id="projection-dashboard" aria-expanded="false">Controls · D</button><button id="projection-preview">Camera preview · V</button><span>Point ← →: sides · both index fingers ↑: up · point ↓: front · peace: back · fist: home. Q/E rotates the face. 0 resets rotation. D opens controls.</span>';
    document.body.append(toolbar);
    const pip = document.createElement("aside");
    pip.id = "hand-preview";
    pip.hidden = true;
    pip.innerHTML =
      '<div class="pip-header"><strong>Your camera</strong><button id="pip-hide" aria-label="Hide camera preview">×</button></div><div class="pip-view"><video id="pip-video" playsinline muted></video><canvas id="pip-landmarks"></canvas></div><div class="pip-status" id="pip-status">Point to choose a destination</div><div class="pip-legend">Point ← →: sides · both index fingers ↑: up<br>Point ↓: front · Peace: back · Fist: home<br>Touch index tips and thumb tips to form a heart: flirt<br>Hold matching hands: thumbs up = pinball · fists = zero gravity · palms = rain · peace signs = ghost</div>';
    document.body.append(pip);
    $("pip-hide").onclick = () => {
      previewWanted = false;
      updatePreviewVisibility();
    };
    $("projection-preview").onclick = () => {
      previewWanted = !previewWanted;
      updatePreviewVisibility();
    };
    document.querySelector("h1")!.textContent = "ORBI · controls";
    document.querySelector(".title-row p")!.textContent =
      "Pointing gestures choose a destination. Other gestures change emotion.";
    const orientation = document.createElement("div");
    orientation.className = "orientation-controls";
    orientation.innerHTML =
      "<h3>Face orientation</h3>" +
      range("Face rotation · Q/E", "rotation", -180, 180, 1, "°") +
      '<div class="orientation-presets"><button type="button" data-roll="-90">−90°</button><button type="button" data-roll="0">0°</button><button type="button" data-roll="90">+90°</button><button type="button" data-roll="180">180°</button></div><label class="toggle-label"><span>Keep face upright<small>Keeps the face upright, including behind the audience</small></span><input id="auto-upright" type="checkbox" checked></label>' +
      range("Upright adjustment speed", "orientationSpeed", 90, 720, 30, "°/s");
    document.querySelector(".control-grid")!.prepend(orientation);
    orientation
      .querySelectorAll<HTMLButtonElement>("[data-roll]")
      .forEach(
        (button) =>
          (button.onclick = () =>
            rotateFace(Number(button.dataset.roll) - store.settings.rotation)),
      );
    $("auto-upright").onchange = () =>
      dispatch({
        type: "settings",
        value: { autoUpright: ($("auto-upright") as HTMLInputElement).checked },
      });
    const handCalibration = document.createElement("button");
    handCalibration.id = "calibrate-left-hand";
    handCalibration.className = "secondary";
    handCalibration.textContent = "Calibrate: this is my left hand";
    document.querySelector(".control-grid")!.append(handCalibration);
    handCalibration.onclick = () => {
      if (
        lastDetections.length !== 1 ||
        lastDetections[0].handednessScore < 0.7
      ) {
        toast("Show only your left hand clearly and try again.");
        return;
      }
      const label = lastDetections[0].handedness;
      if (label !== "Left" && label !== "Right") return;
      dispatch({ type: "settings", value: { leftHandLabel: label } });
      gestures.clear();
      toast("Left hand calibrated. It should now be highlighted in green.");
    };
    const scope = document.createElement("label");
    scope.className = "toggle-label full-dome-setting";
    scope.innerHTML =
      "<span>Full dome enabled<small>Point sideways with either hand. Both index fingers up: overhead. Point down: front. Peace: back. Fist: home.</small></span>";
    document.querySelector(".control-grid")!.prepend(scope);
    const speed = document.createElement("div");
    speed.innerHTML = range(
      "Movement (degrees/second)",
      "angularSpeed",
      20,
      240,
      5,
    );
    document.querySelector(".control-grid")!.append(speed.firstElementChild!);
    const navigationMode = document.createElement("label");
    navigationMode.className = "select-label";
    navigationMode.innerHTML =
      'Position control<select id="navigation-mode"><option value="gestures">Pointing gestures · fixed destinations</option><option value="position">Drag using hand position</option></select>';
    document.querySelector(".control-grid")!.append(navigationMode);
    $("navigation-mode").onchange = () => {
      gestures.clear();
      dispatch({
        type: "settings",
        value: {
          navigationMode: ($("navigation-mode") as HTMLSelectElement)
            .value as Settings["navigationMode"],
        },
      });
      dispatch({ type: "hand-lost" });
    };
    const reach = document.createElement("div");
    reach.innerHTML = range("Hand reach", "handReach", 1, 5, 0.1);
    document.querySelector(".control-grid")!.append(reach.firstElementChild!);
    const sweep = document.createElement("button");
    sweep.className = "secondary";
    sweep.textContent = "Test the full dome (pauses camera)";
    document.querySelector(".control-grid")!.append(sweep);
    sweep.onclick = () => {
      sweepTimers.forEach(clearTimeout);
      if (cameraRunning) stopCamera();
      const targets = [
        { x: -0.88, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0.88 },
        { x: 0.88, y: 0 },
        { x: 0, y: -0.88 },
      ];
      sweepTimers = targets.map((value, i) =>
        window.setTimeout(() => dispatch({ type: "target", value }), i * 1800),
      );
      sweepTimers.push(
        window.setTimeout(() => dispatch({ type: "hand-lost" }), 10000),
      );
    };
    const response = document.createElement("div");
    response.innerHTML = range(
      "Pointing response (ms)",
      "pointResponseMs",
      16,
      200,
      2,
    );
    document
      .querySelector(".control-grid")!
      .append(response.firstElementChild!);
    ($("pointing-method") as HTMLSelectElement).value = "position";
    document.querySelector(".calibration-note")!.textContent =
      "Point left or right to choose a side, raise both index fingers to go overhead, or point down to go to the front. Peace selects the back; a fist returns home. Hold the direction briefly. Either hand can control Orbi. When no hands are visible, Orbi returns home. In hand-position mode, the camera centre maps to the zenith, the bottom to the front and the top to the back. This is camera control, not precise physical 3D pointing. The face becomes smaller near the projection edge.";
    ($("resolution") as HTMLSelectElement).value = String(
      store.settings.resolution,
    );
    let hideTimer: number;
    const reveal = () => {
      toolbar.classList.remove("idle");
      clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (
          !dashboardOpen &&
          !document.getElementById("camera-toggle")?.hasAttribute("disabled")
        )
          toolbar.classList.add("idle");
      }, 4500);
    };
    window.addEventListener("pointermove", reveal);
    window.addEventListener("pointerdown", reveal);
    setTimeout(reveal, 0);
    $("projection-dashboard").onclick = () => setDashboard(!dashboardOpen);
    $("projection-camera").onclick = () => void toggleCamera();
    $("projection-fullscreen").onclick = () => void fullscreenProjection();
    setDashboard(params.has("simulator"));
  }
  function pauseSimulator(paused: boolean) {
    const frame = $<HTMLIFrameElement>("simulator");
    frame?.contentWindow?.postMessage(
      { type: "orbi-visibility", visible: !paused },
      location.origin,
    );
  }
  function setDashboard(show: boolean) {
    dashboardOpen = show;
    document.body.classList.toggle("projection-view", !show);
    document.body.classList.toggle("dashboard-open", show);
    (show ? previewDock : $("projection-stage")).append(canvas);
    document.querySelector(".projection-toolbar")?.classList.remove("idle");
    if (!show)
      setTimeout(() => {
        if (!dashboardOpen)
          document.querySelector(".projection-toolbar")?.classList.add("idle");
      }, 4500);
    $("projection-dashboard").textContent = show
      ? "Hide controls · D"
      : "Controls · D";
    $("projection-dashboard").setAttribute("aria-expanded", String(show));
    pauseSimulator(!show || !previewDock.classList.contains("simulator-view"));
  }
  async function fullscreenProjection() {
    setDashboard(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast("Open this page in Chrome or Safari and choose fullscreen.");
    }
  }

  let renderer: DomeRenderer;
  try {
    renderer = new DomeRenderer(canvas);
  } catch (e) {
    document.querySelector(".projection-toolbar")?.remove();
    document.body.classList.remove("projection-view", "dashboard-open");
    app.innerHTML = `<div class="fatal"><h1>Projection unavailable</h1><p></p></div>`;
    app.querySelector("p")!.textContent = String(e);
    sync.close();
    return;
  }
  function toast(message: string) {
    if (output) {
      console.warn(message);
      return;
    }
    $("toast").textContent = message;
    $("toast").classList.add("visible");
    setTimeout(() => $("toast").classList.remove("visible"), 6000);
  }
  document.addEventListener("orbi-error", (e) =>
    toast((e as CustomEvent).detail),
  );
  let previous = performance.now();
  function advance(now: number) {
    store.time += (now - previous) * store.settings.speed;
    previous = now;
  }
  const rehearsalTime = Number(params.get("floodAt"));
  let floodStartedAt: number | null =
    !output && params.has("floodAt") && Number.isFinite(rehearsalTime)
      ? Date.now() - Math.max(0, Math.min(FLOOD_DURATION, rehearsalTime)) * 1000
      : null;
  function floodTime() {
    return floodStartedAt === null ? -1 : Math.max(0, (Date.now() - floodStartedAt) / 1000);
  }
  function toggleFlood() {
    floodStartedAt = floodStartedAt === null ? Date.now() : null;
    $("flood").textContent = floodStartedAt === null ? "Start The Death of Orbi (W)" : "End flood scene (W)";
    publish();
  }
  function publish() {
    const frame = store.animator.sample(store.time, store.settings);
    sync.send({
      floodStartedAt,
      frame,
      settings: store.settings,
      emotion: store.animator.emotion.emotion,
      sent: Date.now(),
      time: store.time,
      animation: store.animator.snapshot(),
    });
  }
  function dispatch(a: Action) {
    if (output) return;
    advance(performance.now());
    store.dispatch(a);
    publish();
    if (a.type === "emotion") sound.play(a.value, store.settings);
    if (a.type === "target") {
      $("direction").textContent = "Full dome";
      $("activity").textContent = "Following hand";
    }
    if (a.type === "direction") {
      sound.play("move", store.settings);
      $("direction").textContent = a.value;
      $("activity").textContent = `Curious about ${a.value}`;
    }
    if (a.type === "center" || a.type === "reset" || a.type === "hand-lost") {
      $("direction").textContent = "Centered";
      $("activity").textContent = "Feeling at home";
    }
  }
  function rotateFace(delta: number) {
    const rotation = normalizeDegrees(store.settings.rotation + delta);
    dispatch({ type: "settings", value: { rotation } });
    const input = document.querySelector<HTMLInputElement>(
      '[data-setting="rotation"]',
    );
    if (input) input.value = String(rotation);
    $("v-rotation").textContent = `${rotation}°`;
  }
  const launch = (mode: string) => {
    const w = window.open(
      `${import.meta.env.BASE_URL}?output=${mode}`,
      "orbi-" + mode,
      "popup,width=1280,height=720",
    );
    if (!w) toast("Allow popups for localhost, then launch the output again.");
    else toast("Move the output to the extended display, then press F there.");
  };
  const camera = new CameraManager(),
    recognizer = new MediaPipeRecognizer(),
    gestures = new HandInputController();
  let cameraRunning = false,
    cameraBusy = false,
    modelLoaded = false,
    lastInference = 0,
    lastVideoTime = -1,
    lastLandmarks: Landmark[] = [],
    lastDetections: HandDetection[] = [];
  let previewWanted = true,
    lastFrameAt = 0,
    staleReturned = false,
    inferenceCostMs = 0;
  function updatePreviewVisibility() {
    const pip = $("hand-preview");
    if (pip) pip.hidden = !cameraRunning || !previewWanted;
  }
  function stopCamera() {
    cameraRunning = false;
    camera.stop($<HTMLVideoElement>("camera"));
    gestures.clear();
    lastLandmarks = [];
    lastDetections = [];
    dispatch({ type: "hand-lost" });
    const pipVideo = $<HTMLVideoElement>("pip-video");
    if (pipVideo) pipVideo.srcObject = null;
    updatePreviewVisibility();
    $("camera-empty").style.display = "";
    $("camera-toggle").textContent = "◉ Start camera";
    $("camera-badge").textContent = "CAMERA OFF";
    $("input-mode").textContent = "MANUAL";
    $("projection-camera").textContent = "Start camera · C";
    $("gesture").textContent = "No gesture";
    $("confidence").textContent = "—";
    const overlay = $<HTMLCanvasElement>("landmarks");
    overlay.getContext("2d")!.clearRect(0, 0, overlay.width, overlay.height);
  }
  const voice = !output ? installVoice($("projection-camera"), dispatch) : null;
  window.addEventListener("pagehide", () => voice?.stop());
  async function toggleCamera() {
    if (cameraBusy) return;
    sweepTimers.forEach(clearTimeout);
    sweepTimers = [];
    if (cameraRunning) {
      stopCamera();
      return;
    }
    cameraBusy = true;
    const button = $<HTMLButtonElement>("camera-toggle");
    button.disabled = true;
    try {
      $("model").textContent = modelLoaded ? "Ready" : "Loading…";
      await camera.start($("camera"));
      if (!modelLoaded) {
        await recognizer.load();
        modelLoaded = true;
      }
      $("model").textContent = "Ready · local";
      cameraRunning = true;
      lastFrameAt = performance.now();
      staleReturned = false;
      gestures.clear();
      const pipVideo = $<HTMLVideoElement>("pip-video");
      pipVideo.srcObject = camera.stream;
      updatePreviewVisibility();
      await pipVideo
        .play()
        .catch(() =>
          toast(
            "Camera preview could not play. Gesture control continues.",
          ),
        );
      updatePreviewVisibility();
      dispatch({ type: "hand-lost" });
      lastVideoTime = -1;
      $("camera-empty").style.display = "none";
      button.textContent = "■ Stop camera";
      $("camera-badge").textContent = "CAMERA LIVE";
      $("input-mode").textContent = "CAMERA";
    } catch (e) {
      stopCamera();
      $("model").textContent = modelLoaded ? "Ready" : "Unavailable";
      toast(
        `Camera or model unavailable: ${e instanceof Error ? e.message : String(e)}. Manual controls remain available.`,
      );
    } finally {
      cameraBusy = false;
      button.disabled = false;
      $("projection-camera").textContent = cameraRunning
        ? "Stop camera · C"
        : "Start camera · C";
    }
  }
  const connections = [
    [0, 1, 2, 3, 4],
    [0, 5, 6, 7, 8],
    [5, 9, 10, 11, 12],
    [9, 13, 14, 15, 16],
    [13, 17, 18, 19, 20],
    [0, 17],
  ];
  function infer(now: number) {
    if (!cameraRunning) return;
    const video = $<HTMLVideoElement>("camera"),
      s = store.settings;
    if (video.readyState < 2 || video.currentTime === lastVideoTime) {
      if (now - lastFrameAt > 750 && !staleReturned) {
        dispatch({ type: "hand-lost" });
        gestures.clear();
        staleReturned = true;
        lastDetections = [];
        $("pip-status").textContent = "No camera signal · home";
      }
      return;
    }
    if (
      now - lastInference <
      Math.max(1000 / s.inferenceFps, inferenceCostMs * 1.8)
    )
      return;
    lastFrameAt = now;
    staleReturned = false;
    lastInference = now;
    lastVideoTime = video.currentTime;
    try {
      const inferenceStarted = performance.now();
      const result = recognizer.recognize(video, now);
      const elapsed = performance.now() - inferenceStarted;
      inferenceCostMs = inferenceCostMs
        ? inferenceCostMs * 0.8 + elapsed * 0.2
        : elapsed;
      lastDetections = result.landmarks.map((landmarks, index) => ({
        landmarks,
        gesture: result.gestures[index]?.[0]?.categoryName || null,
        score: result.gestures[index]?.[0]?.score || 0,
        handedness: result.handedness[index]?.[0]?.categoryName || "",
        handednessScore: result.handedness[index]?.[0]?.score || 0,
      }));
      const routed = gestures.update(lastDetections, now, s);
      lastLandmarks =
        routed.controlIndex >= 0
          ? lastDetections[routed.controlIndex].landmarks
          : [];
      for (const action of routed.actions) dispatch(action);
      $("gesture").textContent = routed.label
        .replaceAll("_", " ")
        .replace("point:", "Pointing ");
      $("confidence").textContent = lastDetections.length
        ? `${Math.round(routed.score * 100)}%`
        : "—";
      $("pip-status").textContent =
        routed.controlIndex >= 0
          ? routed.positionLabel
          : "No left hand · returning home";
      if (!dashboardOpen && $("hand-preview").hidden) return;
      const overlay = $<HTMLCanvasElement>("landmarks");
      if (overlay.width !== 640 || overlay.height !== 480) {
        overlay.width = 640;
        overlay.height = 480;
      }
      const ctx = overlay.getContext("2d")!;
      ctx.clearRect(0, 0, 640, 480);
      if (s.navigationMode === "position") {
        const halfX =
            (Math.max(0.2, s.centerX, 1 - s.centerX) * 0.9) / s.handReach,
          halfY = (Math.max(0.2, s.centerY, 1 - s.centerY) * 0.9) / s.handReach;
        ctx.strokeStyle = "#ffffffaa";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([7, 5]);
        ctx.strokeRect(
          (s.centerX - halfX) * 640,
          (s.centerY - halfY) * 480,
          halfX * 1280,
          halfY * 960,
        );
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 2;
      lastDetections.forEach((hand, index) => {
        const l = hand.landmarks;
        ctx.strokeStyle = ctx.fillStyle =
          index === routed.controlIndex ? "#b5ff60" : "#70cdff";
        for (const chain of connections) {
          ctx.beginPath();
          chain.forEach((j, k) => {
            if (l[j]) {
              const x = l[j].x * 640,
                y = l[j].y * 480;
              k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
          });
          ctx.stroke();
        }
        if (index === routed.controlIndex && l[9]) {
          const p = palmCenter(l);
          ctx.beginPath();
          ctx.arc(p.x * 640, p.y * 480, 7, 0, Math.PI * 2);
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();
        }
        for (const pt of l) {
          ctx.beginPath();
          ctx.arc(pt.x * 640, pt.y * 480, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      if ($("hand-preview").hidden) return;
      const pipOverlay = $<HTMLCanvasElement>("pip-landmarks");
      if (pipOverlay.width !== 640) {
        pipOverlay.width = 640;
        pipOverlay.height = 480;
      }
      const pipContext = pipOverlay.getContext("2d")!;
      pipContext.clearRect(0, 0, 640, 480);
      pipContext.drawImage(overlay, 0, 0);
    } catch (e) {
      stopCamera();
      toast(`Recognition stopped: ${String(e)}. Use manual controls.`);
    }
  }
  if (!output) {
    $("simulator").addEventListener("load", () =>
      pauseSimulator(
        !dashboardOpen || !previewDock.classList.contains("simulator-view"),
      ),
    );
    $("toggle-simulator").onclick = () => {
      const stage = document.querySelector(".preview-stage")!;
      const inSimulator = stage.classList.toggle("simulator-view");
      $("view-title").textContent = inSimulator ? "In the dome" : "Dome master";
      $("toggle-simulator").textContent = inSimulator
        ? "View dome master"
        : "View in simulator";
      pauseSimulator(!inSimulator);
    };
    window.addEventListener("message", (event) => {
      if (
        event.origin !== location.origin ||
        event.source !== $<HTMLIFrameElement>("simulator").contentWindow ||
        event.data?.type !== "orbi-key"
      )
        return;
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: event.data.key,
          code: event.data.code,
          repeat: event.data.repeat,
          shiftKey: event.data.shiftKey,
          bubbles: true,
        }),
      );
    });
    function showIndex(show: boolean) {
      $("animation-index").hidden = !show;
      $("camera-input").hidden = show;
      $("index-tab").setAttribute("aria-pressed", String(show));
      $("input-tab").setAttribute("aria-pressed", String(!show));
    }
    $("index-tab").onclick = () => showIndex(true);
    $("input-tab").onclick = () => showIndex(false);
    for (const button of document.querySelectorAll<HTMLButtonElement>(".scene-entry")) {
      const [, , scene] = animations[Number(button.dataset.preview)];
      button.onclick = () => {
        if (scene === "flood") return toggleFlood();
        if (floodStartedAt !== null) toggleFlood();
        if (scene === "angry") {
          dispatch({type: "reset"});
          dispatch({type: "emotion", value: "angry"});
        } else {
          dispatch({type: "routine", value: scene});
        }
      };
    }
    $("flood").onclick = toggleFlood;
    $("open-output").onclick = () => launch("hdmi");
    $("square-output").onclick = () => launch("square");
    $("camera-toggle").onclick = toggleCamera;
    camera.onDisconnect = () => {
      stopCamera();
      toast(
        "Camera disconnected. Reconnect and start again, or use manual controls.",
      );
    };
    document
      .querySelectorAll<HTMLButtonElement>("[data-emotion]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            dispatch({ type: "emotion", value: b.dataset.emotion as Emotion })),
      );
    document
      .querySelectorAll<HTMLButtonElement>("[data-dir]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            dispatch({ type: "direction", value: b.dataset.dir as Direction })),
      );
    $("center").onclick = () => dispatch({ type: "center" });
    $("reset").onclick = () => dispatch({ type: "reset" });
    $("guides").onclick = () =>
      dispatch({ type: "settings", value: { guides: !store.settings.guides } });
    document.querySelectorAll<HTMLInputElement>("[data-setting]").forEach(
      (input) =>
        (input.oninput = () => {
          const key = input.dataset.setting as keyof Settings;
          dispatch({ type: "settings", value: { [key]: Number(input.value) } });
          $(`v-${key}`).textContent = input.value;
        }),
    );
    $("resolution").onchange = (e) => {
      if (recorder.active) {
        ($("resolution") as HTMLSelectElement).value = String(
          store.settings.resolution,
        );
        toast("Stop recording before changing canvas resolution.");
        return;
      }
      dispatch({
        type: "settings",
        value: { resolution: Number((e.target as HTMLSelectElement).value) },
      });
    };
    $("pointing-method").onchange = (e) => {
      gestures.clear();
      dispatch({
        type: "settings",
        value: {
          pointingMethod: (e.target as HTMLSelectElement)
            .value as Settings["pointingMethod"],
        },
      });
    };
    $("mirror").onchange = (e) => {
      const mirrored = (e.target as HTMLInputElement).checked;
      dispatch({ type: "settings", value: { mirrored } });
      document
        .querySelector(".camera-view")!
        .classList.toggle("unmirrored", !mirrored);
      $("hand-preview").classList.toggle("unmirrored", !mirrored);
      gestures.clear();
    };
    $("calibrate").onclick = () => {
      if (!lastLandmarks.length) {
        toast(
          "Start the camera and hold one hand at your desired center first.",
        );
        return;
      }
      dispatch({
        type: "settings",
        value: { centerX: lastLandmarks[9].x, centerY: lastLandmarks[9].y },
      });
      toast("Hand center calibrated for position control.");
    };
    $("audio").onchange = async (e) => {
      try {
        await sound.unlock();
        dispatch({
          type: "settings",
          value: { audio: (e.target as HTMLInputElement).checked },
        });
      } catch {
        toast("Audio unavailable; visuals remain active.");
      }
    };
    $("snapshot").onclick = () => {
      const a = document.createElement("a");
      a.download = "orbi-dome-master.png";
      a.href = canvas.toDataURL();
      a.click();
    };
    $("record").onclick = () => {
      if (recorder.active) {
        recorder.stop();
        return;
      }
      try {
        if (cameraRunning) stopCamera();
        if (store.settings.guides)
          dispatch({ type: "settings", value: { guides: false } });
        recorder.start(canvas, dispatch, () => {
          $("record").textContent = "● Record demo";
          toast(
            "Recording downloaded. Convert it using the README delivery command.",
          );
        });
        $("record").textContent = "■ Stop recording";
        toast(
          "Recording the square master. Keep this tab active for 33 seconds.",
        );
      } catch (e) {
        toast(String(e));
      }
    };
  }
  window.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).matches("input,select,textarea") && !output)
      return;
    if (output) {
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.documentElement.requestFullscreen().catch(() => {});
      }
      return;
    }
    if (e.key.toLowerCase() === "w") {
      e.preventDefault();
      if (!e.repeat) toggleFlood();
      return;
    }
    if (e.key.toLowerCase() === "d") {
      e.preventDefault();
      setDashboard(!dashboardOpen);
      return;
    }
    if (e.key.toLowerCase() === "v") {
      e.preventDefault();
      previewWanted = !previewWanted;
      updatePreviewVisibility();
      return;
    }
    if (e.key.toLowerCase() === "c") {
      e.preventDefault();
      if (!e.repeat) void toggleCamera();
      return;
    }
    if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      if (!e.repeat) void fullscreenProjection();
      return;
    }
    if (e.key === "Escape" && dashboardOpen) {
      setDashboard(false);
      return;
    }
    if (e.key.toLowerCase() === "q" || e.key.toLowerCase() === "e") {
      e.preventDefault();
      rotateFace(
        (e.key.toLowerCase() === "q" ? -1 : 1) * (e.shiftKey ? 15 : 5),
      );
      return;
    }
    if (e.key === "0") {
      e.preventDefault();
      rotateFace(-store.settings.rotation);
      return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= 6) dispatch({ type: "emotion", value: emotions[n - 1] });
    const dir: Record<string, Direction> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    if (dir[e.key]) {
      e.preventDefault();
      if (!e.repeat) dispatch({ type: "direction", value: dir[e.key] });
    }
    if (e.code === "Space") {
      e.preventDefault();
      dispatch({ type: "center" });
    }
    if (e.key.toLowerCase() === "g")
      dispatch({ type: "settings", value: { guides: !store.settings.guides } });
    if (e.key.toLowerCase() === "r") dispatch({ type: "reset" });
  });
  sync.onRequest = () => {
    advance(performance.now());
    publish();
  };
  sync.onFrame = (snapshot) => {
    floodStartedAt = snapshot.floodStartedAt ?? null;
    previous = performance.now();
    store.animator.restore(snapshot.animation);
    store.settings = { ...snapshot.settings };
    store.time =
      snapshot.time +
      Math.min(500, Date.now() - snapshot.sent) * snapshot.settings.speed;
  };
  let lastSync = 0,
    uiUpdate = 0,
    frames = 0,
    frameStart = previous;
  function animate(now: number) {
    advance(now);
    frames++;
    if (!output) infer(now);
    const elapsed = floodTime();
    const normalFrame = store.animator.sample(store.time, store.settings);
    const cueTime = floodCueTime(elapsed);
    const frame = cueTime < 0 ? normalFrame : floodFrame(normalFrame, cueTime);
    const resolution = output
      ? (square ? (sync.latest ? store.settings.resolution : 1024) : 2160)
      : store.settings.resolution;
    renderer.render(frame, store.settings, resolution, cueTime);
    if (!output) {
      if (now - lastSync > 33) {
        sync.send({
          floodStartedAt,
          frame,
          settings: store.settings,
          emotion: store.animator.emotion.emotion,
          sent: Date.now(),
          time: store.time,
          animation: store.animator.snapshot(),
        });
        lastSync = now;
      }
      if (now - uiUpdate > 250) {
        $("inference-cost").textContent = cameraRunning
          ? `${Math.round(inferenceCostMs)} ms`
          : "—";
        if (elapsed >= 0) {
          const seconds = Math.floor(Math.min(elapsed, FLOOD_DURATION));
          $("flood").textContent = `End flood scene · ${seconds}s (W)`;
        }
        const emotion = store.animator.emotion.emotion;
        $("emotion-label").textContent =
          emotion[0].toUpperCase() + emotion.slice(1);
        document
          .querySelectorAll<HTMLButtonElement>("[data-emotion]")
          .forEach((b) => {
            const selected = b.dataset.emotion === emotion;
            b.classList.toggle("selected", selected);
            b.setAttribute("aria-pressed", String(selected));
          });
        $("resolution-label").textContent =
          `${store.settings.resolution} × ${store.settings.resolution}`;
        $("guides").querySelector("span")!.textContent = store.settings.guides
          ? "Hide guides"
          : "Show guides";
        $("guides").classList.toggle("enabled", store.settings.guides);
        const sec = Math.floor(store.time / 1000);
        $("clock").textContent =
          `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
        uiUpdate = now;
      }
      if (now - frameStart >= 1000) {
        $("fps").textContent =
          `${Math.round((frames * 1000) / (now - frameStart))} FPS`;
        frames = 0;
        frameStart = now;
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener("pagehide", () => {
    sync.close();
    recognizer.close();
    camera.stream?.getTracks().forEach((t) => t.stop());
  });
}
boot();
