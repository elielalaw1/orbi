import type { Action } from "../app/types";
export const demo: { at: number; action: Action }[] = [
  { at: 0, action: { type: "reset" } },
  { at: 2000, action: { type: "emotion", value: "happy" } },
  { at: 6000, action: { type: "emotion", value: "neutral" } },
  { at: 8500, action: { type: "direction", value: "left" } },
  { at: 12500, action: { type: "direction", value: "right" } },
  { at: 16500, action: { type: "direction", value: "up" } },
  { at: 20500, action: { type: "emotion", value: "sad" } },
  { at: 24500, action: { type: "emotion", value: "angry" } },
  { at: 28500, action: { type: "reset" } },
];
export class Recorder {
  active = false;
  private recorder: MediaRecorder | null = null;
  private timers: number[] = [];
  start(
    canvas: HTMLCanvasElement,
    dispatch: (a: Action) => void,
    onEnd: () => void,
    options: { audioTracks?: MediaStreamTrack[]; scripted?: boolean } = {},
  ) {
    if (!canvas.captureStream || !window.MediaRecorder)
      throw Error("Canvas recording is unavailable in this browser. Use OBS.");
    const mime = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ].find((m) => MediaRecorder.isTypeSupported(m));
    if (!mime)
      throw Error("This browser cannot record WebM. Use Chrome or OBS.");
    const stream = canvas.captureStream(30);
    for (const track of options.audioTracks ?? []) stream.addTrack(track);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 60000000,
        audioBitsPerSecond: 256000,
      });
    } catch (error) {
      stream.getTracks().forEach(track => track.stop());
      throw error;
    }
    const chunks: Blob[] = [];
    this.recorder = recorder;
    this.active = true;
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const url = URL.createObjectURL(new Blob(chunks, { type: mime })),
        a = document.createElement("a");
      a.href = url;
      a.download = "orbi-fallback.webm";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      this.active = false;
      onEnd();
    };
    recorder.start(1000);
    if (options.scripted === false) return;
    this.timers = demo.map((step) =>
      window.setTimeout(() => dispatch(step.action), step.at),
    );
    this.timers.push(window.setTimeout(() => this.stop(), 33000));
  }
  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.recorder?.state === "recording") this.recorder.stop();
  }
}
