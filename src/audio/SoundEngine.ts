import type { Emotion, Settings } from "../app/types";
export class SoundEngine {
  private context: AudioContext | null = null;
  async unlock() {
    this.context ??= new AudioContext();
    await this.context.resume();
  }
  play(kind: Emotion | "move", s: Settings) {
    if (!s.audio || !this.context || this.context.state !== "running") return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain(),
      pan = c.createStereoPanner();
    const notes = {
      neutral: 220,
      happy: 440,
      sad: 310,
      angry: 85,
      surprised: 620,
      playful: 520,
      move: 330,
    };
    o.type = kind === "angry" ? "triangle" : "sine";
    o.frequency.setValueAtTime(notes[kind], c.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      notes[kind] * (kind === "sad" ? 0.55 : 1.3),
      c.currentTime + 0.25,
    );
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(s.volume * 0.22, c.currentTime + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.38);
    o.connect(g).connect(pan).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.4);
  }
}
