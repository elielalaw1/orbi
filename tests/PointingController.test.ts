import { it, expect } from "vitest";
import { PointingController } from "../src/gesture/PointingController";
import { defaults as siteDefaults } from "../src/app/types";
import { hand } from "./fixtures";
const originalDefaults={...siteDefaults,invertHorizontal:false};
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

it("inverts only horizontal position and orientation for the dome setup", () => {
  for (const mirrored of [false, true]) {
    const landmarks=hand([5]);
    landmarks[8]={x:.8,y:landmarks[5].y,z:0};
    landmarks[9]={x:.7,y:.4,z:0};
    for (const pointingMethod of ["orientation", "position"] as const) {
      const settings={...originalDefaults,mirrored,pointingMethod};
      const normal=new PointingController().classify(landmarks,settings);
      const flipped=new PointingController().classify(landmarks,{...settings,invertHorizontal:true});
      expect(flipped).toBe(normal === "left" ? "right" : normal === "right" ? "left" : normal);
    }
    const p=new PointingController();
    const normal=p.target(landmarks,{...originalDefaults,mirrored})!;
    const flipped=p.target(landmarks,{...originalDefaults,mirrored,invertHorizontal:true})!;
    expect(flipped.x).toBeCloseTo(-normal.x);
    expect(flipped.y).toBeCloseTo(normal.y);
  }
});
