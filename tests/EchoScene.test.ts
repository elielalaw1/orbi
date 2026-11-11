import { expect, it } from "vitest";
import { StateStore } from "../src/app/StateStore";
import { FaceAnimator } from "../src/character/FaceAnimator";
import { echoFaces } from "../src/character/EchoScene";

it("replays live cues after a delay on a synced projector", () => {
  const store = new StateStore();
  store.dispatch({ type: "routine", value: "echo" });
  store.time = 2500;
  store.dispatch({ type: "direction", value: "right" });
  store.dispatch({ type: "emotion", value: "sad" });
  const projector = new FaceAnimator();
  projector.restore(store.animator.snapshot());
  const beforeEcho = projector.sample(2800, store.settings).echo!;
  expect(beforeEcho[0].look).toBe(1);
  expect(beforeEcho[1].look).toBeLessThan(0);
  expect(projector.sample(3900, store.settings).echo?.[1].smile).toBeCloseTo(-.85);
});

it("holds the turn to the rear before the rear echo cues Orbi", () => {
  const still = echoFaces(19.5);
  expect(still.filter((face) => face.opacity > 0)).toHaveLength(2);
  const rearNod = echoFaces(21.4);
  expect(rearNod[7].tilt).toBeLessThan(-8);
  expect(Math.abs(rearNod[0].tilt)).toBe(0);
  expect(echoFaces(22.65)[0].tilt).toBeLessThan(-8);
});
