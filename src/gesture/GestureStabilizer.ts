export class GestureStabilizer {
  private history: { label: string; time: number }[] = [];
  private latched: string | null = null;
  private lastCommit = -1e9;
  private releasedAt: number | null = null;
  constructor(
    public stableMs = 380,
    public cooldownMs = 900,
    public threshold = 0.7,
  ) {}
  update(label: string | null, score: number, now: number): string | null {
    if (!label || score < this.threshold) {
      this.history = [];
      this.releasedAt ??= now;
      if (now - this.releasedAt >= 180) this.latched = null;
      return null;
    }
    this.releasedAt = null;
    this.history.push({ label, time: now });
    this.history = this.history.filter(
      (v) => now - v.time <= this.stableMs + 120,
    );
    const recent = this.history.filter((v) => v.label === label),
      span = recent.length ? now - recent[0].time : 0;
    if (
      span >= this.stableMs &&
      recent.length / this.history.length >= 0.85 &&
      label !== this.latched &&
      now - this.lastCommit >= this.cooldownMs
    ) {
      this.latched = label;
      this.lastCommit = now;
      return label;
    }
    return null;
  }
  clear() {
    this.history = [];
    this.latched = null;
    this.releasedAt = null;
    this.lastCommit = -1e9;
  }
}
