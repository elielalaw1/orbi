import { it, expect } from "vitest";
import { GestureStabilizer } from "../src/gesture/GestureStabilizer";
it("requires stable history, latches held gestures, releases and retriggers", () => {
  const g = new GestureStabilizer(350, 500, 0.7);
  const fired = [];
  for (let t = 0; t < 1300; t += 50) {
    const value = g.update("Thumb_Up", 0.95, t);
    if (value) fired.push(t);
  }
  expect(fired).toEqual([350]);
  g.update(null, 0, 1300);
  g.update(null, 0, 1500);
  let commit: string | null = null;
  for (let t = 1550; t <= 1950; t += 50)
    commit = g.update("Thumb_Up", 0.95, t) || commit;
  expect(commit).toBe("Thumb_Up");
});
it("rejects low confidence, contradictory and stale input", () => {
  const g = new GestureStabilizer();
  for (let t = 0; t < 1000; t += 50) {
    expect(g.update(t % 100 ? "A" : "B", 0.95, t)).toBeNull();
  }
  g.clear();
  expect(g.update("A", 0.99, 0)).toBeNull();
  expect(g.update("A", 0.99, 1000)).toBeNull();
  for (let t = 1100; t < 1800; t += 50)
    expect(g.update("A", 0.2, t)).toBeNull();
});
