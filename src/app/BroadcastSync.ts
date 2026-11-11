import type { FaceAnimator, Frame } from "../character/FaceAnimator";
import type { Settings } from "./types";
export interface Snapshot {
  frame: Frame;
  floodStartedAt?: number | null;
  settings: Settings;
  emotion: string;
  sent: number;
  time: number;
  animation: ReturnType<FaceAnimator["snapshot"]>;
}
export class BroadcastSync {
  private channel: BroadcastChannel;
  private timer?: number;
  latest: Snapshot | null = null;
  onFrame?: (data: Snapshot) => void;
  onRequest?: () => void;
  constructor(private output: boolean) {
    this.channel = new BroadcastChannel("orbi-wisdome-v1");
    this.channel.onmessage = (e) => {
      if (e.data?.type === "frame" && this.output) {
        this.latest = e.data.value;
        this.onFrame?.(e.data.value);
      }
      if (e.data?.type === "hello" && !this.output) {
        if (this.onRequest) this.onRequest();
        else if (this.latest) this.send(this.latest);
      }
    };
    if (output) {
      this.channel.postMessage({ type: "hello" });
      this.timer = window.setInterval(
        () => this.channel.postMessage({ type: "hello" }),
        2000,
      );
    }
  }
  send(value: Snapshot) {
    this.latest = value;
    this.channel.postMessage({ type: "frame", value });
  }
  close() {
    clearInterval(this.timer);
    this.channel.close();
  }
}
