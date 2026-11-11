import { expect, it } from "vitest";
import { StateStore } from "../src/app/StateStore";
import { FaceAnimator } from "../src/character/FaceAnimator";

it("crosses the rim, swaps sides while invisible, and peeks back in", () => {
  const store = new StateStore();
  store.dispatch({ type: "routine", value: "escape" });

  expect(store.animator.sample(2100, store.settings).run).toBeGreaterThan(0.5);
  const exit = store.animator.sample(3050, store.settings);
  expect(Math.hypot(exit.position.masterX, exit.position.masterY)).toBeGreaterThan(1);
  expect(exit.escape?.visibility).toBe(0);
  const opposite = store.animator.sample(3060, store.settings);
  expect(opposite.position.az).toBeLessThan(0);
  expect(opposite.escape?.visibility).toBe(0);

  const output = new FaceAnimator();
  output.restore(store.animator.snapshot());
  expect(output.sample(4200, store.settings).escape).toEqual({ visibility: 1, peek: 1 });
  expect(output.sample(7300, store.settings).position.az).toBeLessThan(0);
  const finish = output.sample(12500, store.settings);
  expect(finish.position.az).toBe(store.settings.homeAz);
  expect(finish.position.el).toBe(store.settings.homeEl);
  expect(finish.expression.smile).toBeGreaterThan(0.8);
  expect(output.sample(14000, store.settings).escape).toBeUndefined();
});
