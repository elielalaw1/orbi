import type { Emotion, Settings } from "../app/types";
import { FLOOD_DURATION } from "../character/FloodScene";
import type { Frame } from "../character/FaceAnimator";

export class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private lastBlink = false;
  private lastKiss = false;
  private lastAngry = false;
  private nextTexture = 0;
  private clips = new Map<string, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private loops = new Map<string, {source: AudioBufferSourceNode; gain: GainNode}>();

  private async loadClips() {
    await Promise.all(["kiss", "run", "water"].map(async name => {
      if (this.clips.has(name)) return;
      const response = await fetch(`${import.meta.env.BASE_URL}audio/${name}.mp3`);
      if (!response.ok) throw new Error(`Could not load ${name} audio`);
      this.clips.set(name, await this.context!.decodeAudioData(await response.arrayBuffer()));
    }));
  }

  private sample(name: string, loop = false, rate = 1) {
    const buffer = this.clips.get(name);
    if (!buffer) return;
    const source = this.context!.createBufferSource();
    const gain = this.context!.createGain();
    source.buffer = buffer;
    source.loop = loop;
    source.playbackRate.value = rate;
    gain.gain.value = name === "water" ? 1.1 : 1.6;
    source.connect(gain).connect(this.master!);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
    if (loop) this.loops.set(name, {source, gain});
  }

  private loop(name: string, active: boolean, rate = 1) {
    const playing = this.loops.get(name);
    if (active && !playing) this.sample(name, true, rate);
    if (!active && playing) {
      playing.gain.gain.setTargetAtTime(0, this.context!.currentTime, .04);
      playing.source.stop(this.context!.currentTime + .2);
      this.loops.delete(name);
    }
  }

  async unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);
      this.noise = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
      const samples = this.noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    if (this.context.state === "suspended") await this.context.resume();
    this.loading ??= this.loadClips().catch(error => { this.loading = null; throw error; });
    await this.loading;
  }

  private tone(from: number, to: number, duration: number, level: number, type: OscillatorType = "sine") {
    const context = this.context!;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(to, context.currentTime + duration);
    gain.gain.setValueAtTime(level, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(this.master!);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  private hiss(frequency: number, duration: number, level: number, type: BiquadFilterType = "bandpass") {
    const context = this.context!;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = this.noise;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = .7;
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.linearRampToValueAtTime(level, context.currentTime + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
    source.connect(filter).connect(gain).connect(this.master!);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(0, Math.random() * Math.max(0, 1 - duration));
    source.stop(context.currentTime + duration);
  }

  play(kind: Emotion | "move", settings: Settings) {
    if (!settings.audio || this.context?.state !== "running") return;
    this.master!.gain.setTargetAtTime(settings.volume, this.context.currentTime, .02);
    this.tone(kind === "move" ? 330 : 440, 500, .12, .12);
  }

  update(frame: Frame, floodSeconds: number, settings: Settings) {
    const blinking = frame.blink < .6;
    const kissing = frame.kiss > .7;
    const angry = frame.fire > .05 && floodSeconds < 0;
    if (this.context?.state === "running") {
      const now = this.context.currentTime;
      this.master!.gain.setTargetAtTime(settings.audio ? settings.volume : 0, now, .025);
      this.loop("run", settings.audio && frame.run > .25 && floodSeconds < 0, 1.65);
      this.loop("water", settings.audio && floodSeconds >= 0 && floodSeconds < FLOOD_DURATION);
      if (settings.audio) {
        if (blinking && !this.lastBlink && floodSeconds < FLOOD_DURATION * .85) {
          // A short descending pixel chirp on the lid closure.
          this.tone(1250, 520, .065, .09, "square");
        }
        if (kissing && !this.lastKiss && floodSeconds < 0) {
          this.sample("kiss");
        }
        if (angry && !this.lastAngry) {
          this.tone(125, 48, .65, .45, "sawtooth");
          this.tone(92, 38, .8, .22, "triangle");
        }
        if (now >= this.nextTexture) {
          if (angry && floodSeconds < 0) {
            this.hiss(1200, .38, .22);
            this.hiss(3000, .055, .35);

          } else if (frame.scene === 2) {
            this.tone(220 + 50*Math.sin(frame.sceneTime), 330, .4, .07);
          }
          this.nextTexture = now + .22;
        }
      }
    }
    this.lastBlink = blinking;
    this.lastKiss = kissing;
    this.lastAngry = angry;
  }
}
