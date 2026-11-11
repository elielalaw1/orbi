import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
export class MediaPipeRecognizer {
  private recognizer: GestureRecognizer | null = null;
  async load() {
    const files = await FilesetResolver.forVisionTasks(`${import.meta.env.BASE_URL}wasm`);
    const create = (delegate: "GPU" | "CPU") => GestureRecognizer.createFromOptions(files, {
      baseOptions: {
        modelAssetPath: `${import.meta.env.BASE_URL}models/gesture_recognizer.task`,
        delegate,
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.45,
      minTrackingConfidence: 0.45,
    });
    try { this.recognizer = await create("GPU"); }
    catch { this.recognizer = await create("CPU"); }
  }
  recognize(video: HTMLVideoElement, now: number) {
    if (!this.recognizer) throw Error("Gesture model is not loaded");
    return this.recognizer.recognizeForVideo(video, now);
  }
  close() {
    this.recognizer?.close();
    this.recognizer = null;
  }
}
