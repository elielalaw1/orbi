import { it, expect } from "vitest";
import { GestureController } from "../src/gesture/GestureController";
import { defaults as siteDefaults } from "../src/app/types";
import { hand } from "./fixtures";
const defaults={...siteDefaults,invertHorizontal:false};
it("routes stabilized mock recognition results through shared actions", () => {
  for (const [gesture, emotion] of [
    ["Thumb_Up", "happy"],
    ["Thumb_Down", "sad"],
    ["Open_Palm", "surprised"],
    ["Victory", "playful"],
    ["ILoveYou", "playful"],
    ["Closed_Fist", "surprised"],
  ]) {
    const c = new GestureController(),
      actions = [];
    for (let now = 0; now < 1500; now += 50) {
      const r = c.process(hand([5, 9, 13, 17]), gesture, 0.98, now, defaults);
      if (r.action) actions.push(r.action);
    }
    expect(actions).toEqual([{ type: "emotion", value: emotion }]);
  }
});
it("routes custom landmarks and directional results, clears missing hands", () => {
  const c = new GestureController();
  let action = null;
  for (let t = 0; t <= 400; t += 50)
    action = c.process(hand([9]), "None", 0.5, t, defaults).action || action;
  expect(action).toEqual({ type: "emotion", value: "angry" });
  c.clear();
  action = null;
  for (let t = 0; t <= 400; t += 50)
    action =
      c.process(hand([5]), "Pointing_Up", 0.98, t, {...defaults,fullDome:false,pointingMethod:"orientation"}).action || action;
  expect(action).toEqual({ type: "direction", value: "up" });
  expect(c.process([], "Thumb_Up", 0.99, 1000, defaults)).toEqual({
    label: null,
    score: 0,
    action: null,
  });
});

it('streams full-dome targets immediately and resumes immediately after reacquiring the hand',()=>{
 const c=new GestureController(),l=hand([5]);let action=null;
 for(let t=0;t<=400;t+=50)action=c.process(l,'Pointing_Up',.98,t,defaults).action||action;
 expect(action?.type).toBe('target');
 l[9].x=.15;l[9].y=.2;const next=c.process(l,'Pointing_Up',.98,450,defaults).action;
 expect(next?.type).toBe('target');if(next?.type==='target'){expect(next.value.x).toBeGreaterThan(0);expect(next.value.y).toBeGreaterThan(0);}
 expect(c.process([],'None',0,500,defaults).action).toBeNull();
 expect(c.process(l,'Pointing_Up',.98,550,defaults).action?.type).toBe('target');
});

it('reacts on the first pointing frame even during an emotion cooldown',()=>{
 const c=new GestureController();const open=hand([5,9,13,17]);
 for(let t=0;t<=400;t+=50)c.process(open,'Thumb_Up',.98,t,defaults);
 const result=c.process(hand([5]),'Pointing_Up',.98,416,defaults);
 expect(result.action?.type).toBe('target');
 expect(c.process(hand([5]),'Pointing_Up',.4,433,defaults).action).toBeNull();
 expect(c.process(hand([5]),'Pointing_Up',.98,450,defaults).action?.type).toBe('target');
});
