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
  private nextStep = 0;

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
    const angry = frame.expression.color[1] < .3 && floodSeconds < 0;
    if (this.context?.state === "running") {
      const now = this.context.currentTime;
      this.master!.gain.setTargetAtTime(settings.audio ? settings.volume : 0, now, .025);
      if (settings.audio) {
        if (blinking && !this.lastBlink && floodSeconds < FLOOD_DURATION * .85) {
          // A short descending pixel chirp on the lid closure.
          this.tone(1250, 520, .065, .09, "square");
        }
        if (kissing && !this.lastKiss && floodSeconds < 0) {
          this.hiss(1500, .13, .28);
          this.tone(680, 180, .16, .55);
        }
        if (angry && !this.lastAngry) {
          this.tone(125, 48, .65, .45, "sawtooth");
          this.tone(92, 38, .8, .22, "triangle");
        }
        if (frame.run > .25 && floodSeconds < 0 && now >= this.nextStep) {
          this.tone(125, 40, .08, .32);
          this.hiss(2400, .08, .08);
          this.nextStep = now + .11;
        }
        if (now >= this.nextTexture) {
          if (floodSeconds >= 0 && floodSeconds < FLOOD_DURATION) {
            this.hiss(450 + 200*Math.sin(floodSeconds*.8), .55, .55, "lowpass");
            this.tone(180 + Math.random()*180, 65, .23, .12);
          } else if (angry) {
            this.hiss(1200, .38, .22);
            this.hiss(3000, .055, .35);
          } else if (frame.run > .25) {
            this.hiss(950, .28, .14);
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
