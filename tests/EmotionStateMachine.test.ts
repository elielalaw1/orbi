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
  expect(m.sample(9000, defaults).color[1]).toBeLessThan(presets.neutral.color[1]);
  m.sample(11600, defaults).color.forEach((v, i) =>
    expect(v).toBeCloseTo(presets.neutral.color[i]),
  );
  const n = new EmotionStateMachine();
  n.restore(m.snapshot());
  expect(n.sample(9000, defaults)).toEqual(m.sample(9000, defaults));
});


it("lets the flames end before the red dome cools to yellow", async () => {
 const { FaceAnimator } = await import("../src/character/FaceAnimator");
 const face = new FaceAnimator();
 face.emotion.trigger("angry", 0, defaults);
 expect(face.sample(1000, defaults).fire).toBeGreaterThan(.9);
 const red = face.sample(3000, defaults);
 expect(red.fire).toBe(0);
 expect(red.expression.color[1]).toBeLessThan(.2);
 face.sample(4500, defaults);
 const cooling = face.sample(6500, defaults);
 expect(cooling.fire).toBe(0);
 expect(cooling.expression.color[1]).toBeGreaterThan(.2);
 expect(cooling.expression.color[1]).toBeLessThan(.8);
 expect(face.sample(9200, defaults).expression.color[1]).toBeCloseTo(.8);
});
