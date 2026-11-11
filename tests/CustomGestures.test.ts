import { it, expect } from "vitest";
import { middleFinger, isolatedIndex } from "../src/gesture/CustomGestures";
import { hand, rotatedHand } from "./fixtures";
it("detects a clear middle finger at arbitrary image rotations and sizes", () => {
  for (const angle of [0, 0.6, 1.5, 3.1])
    for (const size of [0.5, 1, 1.4])
      expect(middleFinger(rotatedHand(hand([9]), angle, size))).toBe(true);
});
it("rejects open palms, fists, victory, index and ambiguous fingers", () => {
  for (const extended of [[5, 9, 13, 17], [], [5, 9], [5], [9, 13]])
    expect(middleFinger(hand(extended))).toBe(false);
  expect(middleFinger([])).toBe(false);
  expect(middleFinger(hand([9]), "Victory", 0.96)).toBe(false);
  expect(isolatedIndex(hand([5]))).toBe(true);
});
