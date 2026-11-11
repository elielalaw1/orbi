import { it, expect } from "vitest";
import { PointingController } from "../src/gesture/PointingController";
import { defaults as originalDefaults } from "../src/app/types";
import { hand } from "./fixtures";
const defaults={...originalDefaults,pointingMethod:"orientation" as const};
it("handles orientation, mirroring, dead zone and calibrated position", () => {
  const p = new PointingController(),
    l = hand([5]);
  expect(p.classify(l, defaults)).toBe("up");
  l[8] = { x: 0.8, y: l[5].y, z: 0 };
  expect(p.classify(l, { ...defaults, mirrored: true })).toBe("left");
  p.clear();
  expect(p.classify(l, { ...defaults, mirrored: false })).toBe("right");
  const s = { ...defaults, pointingMethod: "position" as const };
  l[9] = { x: 0.5, y: 0.5, z: 0 };
  expect(p.classify(l, s)).toBeNull();
  l[9].x = 0.8;
  expect(p.classify(l, s)).toBe("left");
  expect(p.classify(l, { ...s, centerX: 0.8 })).toBeNull();
});

it('reaches the left, right, front and back rim without moving the hand out of view',()=>{
 const p=new PointingController(),l=hand([5]);
 for(const [x,y,axis,sign] of [[.33,.5,'x',1],[.67,.5,'x',-1],[.5,.33,'y',1],[.5,.67,'y',-1]] as const){l[9]={x,y,z:0};const t=p.target(l,originalDefaults)!;expect(t[axis]*sign).toBeCloseTo(.9,6);expect(Math.hypot(t.x,t.y)).toBeLessThanOrEqual(.900001);}
});
it('keeps the calibrated center at zero while adjusting hand reach',()=>{
 const p=new PointingController(),l=hand([5]);l[9]={x:.6,y:.55,z:0};expect(p.target(l,{...originalDefaults,centerX:.6,centerY:.55})).toEqual({x:-0,y:0});
 l[9].x=.7;const low=p.target(l,{...originalDefaults,handReach:1})!,high=p.target(l,{...originalDefaults,handReach:4})!;expect(Math.abs(high.x)).toBeGreaterThan(Math.abs(low.x));
});
