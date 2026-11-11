import { it, expect } from "vitest";
import {
  HandInputController,
  type HandDetection,
} from "../src/gesture/HandInputController";
import { defaults as siteDefaults } from "../src/app/types";
import { StateStore } from "../src/app/StateStore";
import { hand } from "./fixtures";
const defaults={...siteDefaults,navigationMode:"position" as const};
const detection = (
  handedness: string,
  gesture = "Pointing_Up",
  handednessScore = 0.98,
): HandDetection => ({
  handedness,
  gesture,
  handednessScore,
  score: 0.98,
  landmarks: hand(gesture === "Pointing_Up" ? [5] : [5, 9, 13, 17]),
});
it("only anatomical Left moves the face, independently of preview mirroring", () => {
  for (const mirrored of [true, false]) {
    const c = new HandInputController(),
      s = { ...defaults, mirrored };
    expect(
      c
        .update([detection("Left")], 0, s)
        .actions.some((a) => a.type === "target"),
    ).toBe(true);
    expect(
      c
        .update([detection("Right")], 16, s)
        .actions.some((a) => a.type === "target" || a.type === "direction"),
    ).toBe(false);
  }
});
it("keeps the same controlling hand when two-hand result order changes", () => {
  const c = new HandInputController(),
    left = detection("Left"),
    right = detection("Right");
  expect(c.update([right, left], 0, defaults).controlIndex).toBe(1);
  expect(c.update([left, right], 16, defaults).controlIndex).toBe(0);
});
it("returns as soon as Left disappears, even when Right remains, and reacquires without delay", () => {
  const c = new HandInputController();
  c.update([detection("Left")], 0, defaults);
  const lost = c.update([detection("Right")], 16, defaults);
  expect(lost.actions).toContainEqual({ type: "hand-lost" });
  expect(c.update([detection("Right")], 32, defaults).actions).toEqual([]);
  expect(
    c
      .update([detection("Left")], 48, defaults)
      .actions.some((a) => a.type === "target"),
  ).toBe(true);
});
it("rejects uncertain handedness and supports explicit left-hand calibration", () => {
  expect(
    new HandInputController().update(
      [detection("Left", "Pointing_Up", 0.55)],
      0,
      defaults,
    ).controlIndex,
  ).toBe(-1);
  expect(
    new HandInputController()
      .update([detection("Right")], 0, { ...defaults, leftHandLabel: "Right" })
      .actions.some((a) => a.type === "target"),
  ).toBe(true);
});
it("Right can still change emotions but never position", () => {
  const c = new HandInputController(),
    actions = [];
  for (let t = 0; t < 1400; t += 50)
    actions.push(
      ...c.update([detection("Right", "Thumb_Up")], t, defaults).actions,
    );
  expect(actions).toContainEqual({ type: "emotion", value: "happy" });
  expect(
    actions.some((a) => a.type === "target" || a.type === "direction"),
  ).toBe(false);
});
it("hand loss bypasses hold and returns to the actual sweet spot in either movement mode", () => {
  for (const fullDome of [true, false]) {
    const store = new StateStore();
    Object.assign(store.settings, {
      fullDome,
      homeAz: 8,
      homeEl: 25,
      holdMs: 3000,
    });
    store.dispatch({ type: "direction", value: "right" });
    for (let t = 0; t <= 1000; t += 25)
      store.animator.sample(t, store.settings);
    store.time = 1000;
    store.dispatch({ type: "hand-lost" });
    for (let t = 1025; t <= 6000; t += 25)
      store.animator.sample(t, store.settings);
    const p = store.animator.sample(6000, store.settings).position;
    expect(p.az).toBeCloseTo(0, 4);
    expect(p.el).toBeCloseTo(20, 4);
  }
});

it('follows a visible left hand continuously without requiring a narrowly classified finger pose',()=>{
 const c=new HandInputController();const h=detection('Left','None');h.landmarks=hand([5,9,13,17]);h.score=.1;h.landmarks[9]={x:.33,y:.5,z:0};
 const result=c.update([h],0,defaults);const action=result.actions.find(a=>a.type==='target');expect(action?.type).toBe('target');if(action?.type==='target')expect(action.value.x).toBeCloseTo(.9);
});

it("requires both fingertip joins and fires once per held heart in either control mode", () => {
  for (const navigationMode of ["gestures","position"] as const) {
    const c=new HandInputController(), s={...defaults,navigationMode};
    const pair=[detection("Right","None"),detection("Left","None")];
    for(const [i,h] of pair.entries()){
      const side=i===0?-1:1;
      for(const [n,x,y] of [[0,.5+side*.20,.70],[9,.5+side*.17,.53],
        [5,.5+side*.13,.5],[6,.5+side*.10,.39],[8,.5+side*.01,.42],[4,.5+side*.01,.59]])
        h.landmarks[n]={x,y,z:0};
    }
    const fire={type:"routine",value:"flirt"};
    expect(c.update(pair,0,s).actions).toEqual([]);
    expect(c.update([...pair].reverse(),660,s).actions).toEqual([fire]);
    expect(c.update(pair,1600,s).actions).toEqual([]);
    pair[0].landmarks[4].x=.26;
    expect(c.update(pair,1800,s).actions).not.toContainEqual(fire);
    expect(c.update(pair,2600,s).actions).not.toContainEqual(fire);
    pair[0].landmarks[4].x=.49;
    expect(c.update(pair,2650,s).actions).toEqual([]);
    expect(c.update(pair,3350,s).actions).toEqual([fire]);
  }
});

it("routes each held pair directly into its animated scene in both modes", () => {
  for (const navigationMode of ["gestures", "position"] as const) {
    for (const [pose, id] of Object.entries({Thumb_Up:1, Closed_Fist:2, Open_Palm:3, Victory:4, Thumb_Down:0})) {
      const controller = new HandInputController();
      const store = new StateStore();
      store.settings.navigationMode = navigationMode;
      const hands = [detection("Left", pose), detection("Right", pose)];
      for (const time of [0, 350, 700, 900]) {
        store.time = time;
        const { actions } = controller.update(hands, time, store.settings);
        if (id && time !== 700) expect(actions).toEqual([]);
        actions.forEach(action => store.dispatch(action));
      }
      const frame = store.animator.sample(1200, store.settings);
      expect(frame.scene).toBe(id);
      if (id) expect(frame.sceneTime).toBe(.5);
    }
  }
});
