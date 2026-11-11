import { it, expect } from "vitest";
import { EmotionStateMachine } from "../src/character/EmotionStateMachine";
import { defaults } from "../src/app/types";
import { presets } from "../src/character/EmotionPresets";
it("morphs continuously and does not restart held emotions", () => {
  const m = new EmotionStateMachine();
  m.trigger("happy", 1000, defaults);
  expect(m.sample(1000, defaults).smile).toBe(presets.neutral.smile);
  const mid = m.sample(1200, defaults);
  expect(mid.smile).toBeGreaterThan(presets.neutral.smile);
  expect(mid.smile).toBeLessThan(1);
  expect(m.trigger("happy", 1200, defaults)).toBe(false);
  expect(m.sample(1500, defaults).smile).toBe(1);
  m.trigger("sad", 1500, defaults);
  expect(m.sample(1500, defaults).smile).toBe(1);
  expect(m.sample(3000, defaults).smile).toBeCloseTo(presets.sad.smile);
  m.sample(3000, defaults).color.forEach((v, i) =>
    expect(v).toBeCloseTo(presets.sad.color[i]),
  );
});
it("returns smoothly to idle and can serialize for output", () => {
  const m = new EmotionStateMachine();
  m.trigger("angry", 0, defaults);
  m.tick(7000, defaults);
  expect(m.emotion).toBe("neutral");
  m.sample(7000, defaults).color.forEach((v, i) =>
    expect(v).toBeCloseTo(presets.angry.color[i]),
  );
  m.sample(9000, defaults).color.forEach((v, i) =>
    expect(v).toBeCloseTo(presets.neutral.color[i]),
  );
  const n = new EmotionStateMachine();
  n.restore(m.snapshot());
  expect(n.sample(9000, defaults)).toEqual(m.sample(9000, defaults));
});
