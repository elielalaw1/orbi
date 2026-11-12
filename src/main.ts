import "./style.css";
import { floodCueTime, floodFrame } from "./character/FloodScene";
import { normalizeDegrees } from "./dome/FaceGeometry";
import { StateStore } from "./app/StateStore";
import { BroadcastSync } from "./app/BroadcastSync";
import { emotions, type Action, type Direction } from "./app/types";
import { DomeRenderer } from "./dome/DomeRenderer";
import { CameraManager } from "./gesture/CameraManager";
import { MediaPipeRecognizer } from "./gesture/MediaPipeRecognizer";
import { HandInputController } from "./gesture/HandInputController";
import { sceneGestures } from "./gesture/GestureBindings";
import { SoundEngine } from "./audio/SoundEngine";
import { Recorder } from "./recording/Recorder";

function boot() {
  const params = new URLSearchParams(location.search);
  const output = params.has("output");
  const square = params.get("output") === "square";
  const store = new StateStore();
  const sync = new BroadcastSync(output);
  const sound = new SoundEngine();
  const recorder = new Recorder();
  const camera = new CameraManager();
  const recognizer = new MediaPipeRecognizer();
  const gestures = new HandInputController();
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  document.body.className = output ? "output-view" : "performance-view";
  $("app").innerHTML = `<main id="projection-stage" aria-label="Orbi dome projection"><canvas id="dome" aria-label="Live fisheye dome master"></canvas></main>`;
  if (!output) {
    $("app").insertAdjacentHTML("beforeend", `
      <nav class="projection-toolbar" aria-label="Performance controls">
        <button id="projection-camera">Start camera · C</button>
        <button id="sound-toggle">Enable sound</button>
        <button id="projection-fullscreen">Fullscreen · F</button>
        <button id="open-output">Launch dome output ↗</button>
        <button id="preview-toggle">Camera & gestures · V</button>
        <button id="record-performance">● Record performance</button>
        <label class="brightness-control">☀ <span class="sr-only">Brightness</span><input id="brightness" aria-label="Brightness" type="range" min="0.15" max="1" step="0.01" value="${store.settings.brightness}"></label>
      </nav>
      <aside id="hand-preview" hidden aria-label="Camera and hand gestures">
        <div class="pip-header"><strong>Your camera</strong><button id="pip-hide" aria-label="Hide camera preview">×</button></div>
        <div class="pip-view"><video id="pip-video" playsinline muted></video><canvas id="pip-landmarks" width="640" height="480"></canvas></div>
        <div class="pip-status" id="pip-status" role="status">Start the camera to use gestures</div><span id="model" hidden>Not loaded</span>
        <section class="pip-guide" aria-label="Hand gesture instructions">
          <h3>Choose a scene</h3><p class="pip-hint">Hold for ½ second. Lower your hands before repeating.<br>Or click a scene below.</p>
          <ul class="pip-scenes">${sceneGestures.map(binding => `<li data-gesture-scene="${binding.id}"><button data-scene="${binding.id}"><span class="gesture-emoji" aria-hidden="true">${binding.emoji}</span><span><strong>${binding.label}</strong><small>${binding.instruction}</small></span></button></li>`).join("")}</ul>
          <h3>Move Orbi</h3><label class="pip-invert"><input id="invert-horizontal" type="checkbox" ${store.settings.invertHorizontal ? "checked" : ""}> ↔️ Invert pointing left / right</label>
          <ul class="pip-movement"><li>👈 👉 Point left / right</li><li>☝️ ☝️ Both index fingers up → overhead</li><li>👇 Point down → front · ✌️ One peace sign → back</li><li>✊ One fist → home / cancel scene</li></ul>
          <h3>Expressions · one hand</h3><p class="pip-expressions">👍 Happy · 👎 Sad · 🖐️ Surprised<br>🤟 Playful · 🖕 Angry</p>
        </section>
      </aside><div id="toast" role="status" aria-live="polite"></div>`);
  }
  const canvas = $<HTMLCanvasElement>("dome");
  let renderer: DomeRenderer;
  try { renderer = new DomeRenderer(canvas); }
  catch (error) {
    $("app").innerHTML = '<div class="fatal"><h1>Projection unavailable</h1><p></p></div>';
    document.querySelector(".fatal p")!.textContent = String(error);
    sync.close();
    return;
  }
  let toastTimer = 0;
  function toast(message: string) {
    if (output) return;
    $("toast").textContent = message;
    $("toast").classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => $("toast").classList.remove("visible"), 6500);
  }
  document.addEventListener("orbi-error", event => toast((event as CustomEvent).detail));
  let previous = performance.now();
  let floodStartedAt: number | null = null;
  function advance(now: number) { store.time += (now - previous) * store.settings.speed; previous = now; }
  function floodTime() { return floodStartedAt === null ? -1 : Math.max(0, (Date.now() - floodStartedAt) / 1000); }
  function publish() {
    sync.send({floodStartedAt, frame: store.animator.sample(store.time, store.settings), settings: store.settings,
      emotion: store.animator.emotion.emotion, sent: Date.now(), time: store.time, animation: store.animator.snapshot()});
  }
  function highlightScene(id: string | null) {
    document.querySelectorAll<HTMLElement>("[data-gesture-scene]").forEach(row => row.classList.toggle("active", row.dataset.gestureScene === id));
  }
  function dispatch(action: Action) {
    if (output) return;
    advance(performance.now());
    if (action.type === "flood") {
      store.dispatch({type: "reset"});
      floodStartedAt = floodStartedAt === null ? Date.now() : null;
      highlightScene(floodStartedAt === null ? null : "flood");
      publish();
      return;
    }
    if (["routine", "center", "reset", "emotion"].includes(action.type)) floodStartedAt = null;
    if (action.type === "emotion" && action.value === "angry" && store.animator.routineActive(store.time)) store.dispatch({type: "reset"});
    if (action.type === "routine") highlightScene(action.value);
    if (action.type === "emotion") highlightScene(action.value === "angry" ? "angry" : null);
    if (action.type === "center" || action.type === "reset") highlightScene(null);
    store.dispatch(action);
    publish();
  }
  function render() {
    const elapsed = floodTime();
    const cue = floodCueTime(elapsed);
    const normal = store.animator.sample(store.time, store.settings);
    const frame = cue < 0 ? normal : floodFrame(normal, cue);
    renderer.render(frame, store.settings, output ? (square ? 2048 : 2160) : store.settings.resolution, cue);
    if (!output) sound.update(frame, elapsed, store.settings);
  }
  function launchOutput() {
    const popup = window.open(`${import.meta.env.BASE_URL}?output=hdmi`, "orbi-hdmi", "popup,width=1280,height=720");
    toast(popup ? "Move the output window to the projector, then press F there." : "Allow popups for localhost, then launch the output again.");
  }
  function fullscreen() { void document.documentElement.requestFullscreen().catch(() => toast("Fullscreen unavailable. Use your browser's fullscreen command.")); }
  let cameraRunning = false, cameraBusy = false, modelLoaded = false, previewWanted = true;
  let lastVideoTime = -1, lastInference = 0, lastFrameAt = 0, inferenceCost = 0, staleReturned = false;
  function updatePreview() { if (!output) $("hand-preview").hidden = !cameraRunning || !previewWanted; }
  function stopCamera() {
    cameraRunning = false;
    camera.stop($<HTMLVideoElement>("pip-video"));
    gestures.clear();
    dispatch({type: "hand-lost"});
    $("projection-camera").textContent = "Start camera · C";
    updatePreview();
  }
  async function toggleCamera() {
    if (cameraBusy) return;
    if (cameraRunning) { stopCamera(); return; }
    cameraBusy = true;
    const button = $<HTMLButtonElement>("projection-camera");
    button.disabled = true;
    button.textContent = "Starting camera…";
    try {
      $("model").textContent = modelLoaded ? "Ready · local" : "Loading…";
      await camera.start($("pip-video"));
      if (!modelLoaded) { await recognizer.load(); modelLoaded = true; }
      $("model").textContent = "Ready · local";
      cameraRunning = true;
      previewWanted = true;
      lastVideoTime = -1;
      lastFrameAt = performance.now();
      staleReturned = false;
      gestures.clear();
      $("projection-camera").textContent = "Stop camera · C";
      updatePreview();
    } catch (error) {
      stopCamera();
      $("model").textContent = "Unavailable";
      toast(`Camera or model unavailable: ${error instanceof Error ? error.message : String(error)}. Manual controls remain available: 1–6, arrows, Space and R.`);
    } finally { cameraBusy = false; button.disabled = false; }
  }
  const connections = [[0,1,2,3,4], [0,5,6,7,8], [5,9,10,11,12], [9,13,14,15,16], [13,17,18,19,20], [0,17]];
  function infer(now: number) {
    if (!cameraRunning) return;
    const video = $<HTMLVideoElement>("pip-video");
    if (video.readyState < 2 || video.currentTime === lastVideoTime) {
      if (now - lastFrameAt > 750 && !staleReturned) {
        gestures.clear(); dispatch({type: "hand-lost"}); staleReturned = true;
        $("pip-status").textContent = "No camera signal · returning home";
      }
      return;
    }
    if (now - lastInference < Math.max(1000 / store.settings.inferenceFps, inferenceCost * 1.8)) return;
    lastInference = now; lastFrameAt = now; lastVideoTime = video.currentTime; staleReturned = false;
    try {
      const started = performance.now();
      const result = recognizer.recognize(video, now);
      const cost = performance.now() - started;
      inferenceCost = inferenceCost ? inferenceCost * .8 + cost * .2 : cost;
      const hands = result.landmarks.map((landmarks, index) => ({landmarks,
        gesture: result.gestures[index]?.[0]?.categoryName ?? null,
        score: result.gestures[index]?.[0]?.score ?? 0,
        handedness: result.handedness[index]?.[0]?.categoryName ?? "",
        handednessScore: result.handedness[index]?.[0]?.score ?? 0}));
      const routed = gestures.update(hands, now, store.settings);
      for (const action of routed.actions) dispatch(action);
      $("pip-status").textContent = routed.positionLabel.replaceAll("_", " ");
      const overlay = $<HTMLCanvasElement>("pip-landmarks");
      const context = overlay.getContext("2d")!;
      context.clearRect(0, 0, 640, 480);
      if (!$("hand-preview").hidden) hands.forEach((hand, index) => {
        context.strokeStyle = context.fillStyle = index === routed.controlIndex ? "#b5ff60" : "#70cdff";
        context.lineWidth = 2;
        for (const chain of connections) {
          context.beginPath();
          chain.forEach((joint, i) => { const p = hand.landmarks[joint]; i ? context.lineTo(p.x*640,p.y*480) : context.moveTo(p.x*640,p.y*480); });
          context.stroke();
        }
        for (const p of hand.landmarks) { context.beginPath(); context.arc(p.x*640,p.y*480,3,0,Math.PI*2); context.fill(); }
      });
    } catch (error) { stopCamera(); toast(`Tracking stopped: ${String(error)}. Use manual controls or restart the camera.`); }
  }
  let recordingBusy = false, soundUnlocked = false;
  async function toggleRecording() {
    if (recordingBusy) return;
    if (recorder.active) { recorder.stop(); return; }
    recordingBusy = true;
    const before = {resolution: store.settings.resolution, guides: store.settings.guides, audio: store.settings.audio};
    const restore = () => {
      dispatch({type: "settings", value: before});
      $("record-performance").textContent = "● Record performance";
      $("sound-toggle").textContent = before.audio && soundUnlocked ? "Mute sound" : "Enable sound";
    };
    try {
      await sound.unlock();
      soundUnlocked = true;
      dispatch({type: "settings", value: {resolution: 2048, guides: false, audio: true}});
      $("sound-toggle").textContent = "Mute sound";
      render();
      recorder.start(canvas, dispatch, () => {restore(); toast("Recording downloaded. Convert it with scripts/convert-fallback.sh.");},
        {audioTracks: sound.recordingTracks(), scripted: false});
      $("record-performance").textContent = "■ Stop recording";
      toast("Recording your performance at 2048² with sound. Keep this tab active; click Stop recording when finished.");
    } catch (error) { restore(); toast(String(error)); }
    finally { recordingBusy = false; }
  }
  if (!output) {
    $("projection-camera").onclick = () => void toggleCamera();
    $("projection-fullscreen").onclick = fullscreen;
    $("open-output").onclick = launchOutput;
    $("record-performance").onclick = () => void toggleRecording();
    $("preview-toggle").onclick = () => { previewWanted = !previewWanted; updatePreview(); };
    $("pip-hide").onclick = () => { previewWanted = false; updatePreview(); };
    $("brightness").oninput = event => dispatch({type: "settings", value: {brightness: Number((event.target as HTMLInputElement).value)}});
    $("invert-horizontal").onchange = event => { gestures.clear(); dispatch({type: "settings", value: {invertHorizontal: (event.target as HTMLInputElement).checked}}); };
    $("sound-toggle").onclick = async () => {
      try {
        await sound.unlock();
        const enabled = !soundUnlocked || !store.settings.audio;
        soundUnlocked = true;
        dispatch({type: "settings", value: {audio: enabled}});
        $("sound-toggle").textContent = enabled ? "Mute sound" : "Enable sound";
      } catch { toast("Sound unavailable. Check your browser and selected audio output."); }
    };
    document.querySelectorAll<HTMLButtonElement>("[data-scene]").forEach(button => {
      button.onclick = () => {
        const binding = sceneGestures.find(scene => scene.id === button.dataset.scene);
        if (binding) dispatch(binding.action);
      };
    });
    camera.onDisconnect = () => { stopCamera(); toast("Camera disconnected. Reconnect and start again, or use manual controls."); };
  }
  window.addEventListener("keydown", event => {
    if ((event.target as HTMLElement).matches("input,select,textarea")) return;
    const key = event.key.toLowerCase();
    if (key === "f") { event.preventDefault(); if (!event.repeat) fullscreen(); return; }
    if (output) return;
    if (key === "c") { event.preventDefault(); if (!event.repeat) void toggleCamera(); }
    if (key === "v") { previewWanted = !previewWanted; updatePreview(); }
    if (key === "r") dispatch({type: "reset"});
    if (key === "w" && !event.repeat) dispatch({type: "flood"});
    if (key === "g") dispatch({type: "settings", value: {guides: !store.settings.guides}});
    if (key === "q" || key === "e") dispatch({type: "settings", value: {rotation: normalizeDegrees(store.settings.rotation + (key === "q" ? -1 : 1) * (event.shiftKey ? 15 : 5))}});
    if (key === "0") dispatch({type: "settings", value: {rotation: 0}});
    const number = Number(key);
    if (number >= 1 && number <= 6) dispatch({type: "emotion", value: emotions[number - 1]});
    const direction: Record<string, Direction> = {ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down"};
    if (direction[event.key]) { event.preventDefault(); if (!event.repeat) dispatch({type: "direction", value: direction[event.key]}); }
    if (event.code === "Space") { event.preventDefault(); dispatch({type: "center"}); }
  });
  sync.onRequest = () => { advance(performance.now()); publish(); };
  sync.onFrame = snapshot => {
    floodStartedAt = snapshot.floodStartedAt ?? null;
    previous = performance.now();
    store.animator.restore(snapshot.animation);
    store.settings = {...snapshot.settings};
    store.time = snapshot.time + Math.max(0, Math.min(500, Date.now() - snapshot.sent)) * store.settings.speed;
  };
  let lastSync = 0;
  function animate(now: number) {
    advance(now);
    if (!output) infer(now);
    render();
    if (!output && now - lastSync >= 33) { publish(); lastSync = now; }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener("pagehide", () => { sync.close(); recognizer.close(); camera.stream?.getTracks().forEach(track => track.stop()); });
}
boot();
