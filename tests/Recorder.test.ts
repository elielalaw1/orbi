import { afterEach, expect, it, vi } from "vitest";
import { Recorder } from "../src/recording/Recorder";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it("manual performance recording keeps audio and runs until explicitly stopped", () => {
  vi.useFakeTimers();
  vi.stubGlobal("window", globalThis);
  const video = { stop: vi.fn() }, audio = { stop: vi.fn() };
  const tracks = [video];
  const stream = { addTrack: vi.fn(track => tracks.push(track)), getTracks: () => tracks };
  const captureStream = vi.fn(() => stream);
  let instance: FakeRecorder;
  class FakeRecorder {
    static isTypeSupported() { return true; }
    state = "inactive";
    onstop?: () => void;
    ondataavailable?: (event: {data: Blob}) => void;
    constructor(public stream: unknown, public options: unknown) { instance = this; }
    start() { this.state = "recording"; }
    stop() { this.state = "inactive"; this.onstop?.(); }
  }
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  const click = vi.fn();
  vi.stubGlobal("document", { createElement: () => ({ click }) });
  const recorder = new Recorder(), dispatch = vi.fn(), end = vi.fn();
  recorder.start({captureStream} as unknown as HTMLCanvasElement, dispatch, end,
    {audioTracks: [audio as unknown as MediaStreamTrack], scripted: false});
  expect(captureStream).toHaveBeenCalledWith(30);
  expect(stream.addTrack).toHaveBeenCalledWith(audio);
  expect(instance!.options).toMatchObject({audioBitsPerSecond: 256000});
  vi.advanceTimersByTime(120000);
  expect(recorder.active).toBe(true);
  expect(dispatch).not.toHaveBeenCalled();
  recorder.stop();
  expect(video.stop).toHaveBeenCalledOnce();
  expect(audio.stop).toHaveBeenCalledOnce();
  expect(click).toHaveBeenCalledOnce();
  expect(end).toHaveBeenCalledOnce();
  expect(recorder.active).toBe(false);
});
