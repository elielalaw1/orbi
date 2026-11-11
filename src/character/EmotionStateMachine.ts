import type { Emotion, Settings } from "../app/types";
import { presets, blend, type Expression } from "./EmotionPresets";
export const ease = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
export class EmotionStateMachine {
  emotion: Emotion = "neutral";
  private from: Expression = structuredClone(presets.neutral);
  private changed = 0;
  lastInteraction = 0;
  trigger(emotion: Emotion, now: number, settings: Settings) {
    this.lastInteraction = now;
    if (emotion === this.emotion) return false;
    this.from = this.sample(now, settings);
    this.emotion = emotion;
    this.changed = now;
    return true;
  }
  sample(now: number, s: Settings): Expression {
    const dur = this.emotion === "neutral" ? s.returnMs : s.expressionMs;
    return blend(
      this.from,
      presets[this.emotion],
      ease((now - this.changed) / dur),
      ease(
        (now - this.changed) /
          (this.emotion === "neutral" ? s.returnMs : s.colorMs),
      ),
    );
  }
  snapshot() {
    return {
      emotion: this.emotion,
      from: this.from,
      changed: this.changed,
      lastInteraction: this.lastInteraction,
    };
  }
  restore(state: ReturnType<EmotionStateMachine["snapshot"]>) {
    Object.assign(this, state);
  }
  tick(now: number, s: Settings) {
    if (this.emotion !== "neutral" && now - this.lastInteraction > s.idleMs)
      this.trigger("neutral", now, s);
  }
}
