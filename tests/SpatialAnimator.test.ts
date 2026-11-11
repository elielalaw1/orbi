import { it, expect } from "vitest";
import { SpatialAnimator } from "../src/character/SpatialAnimator";
import { defaults as fullDefaults, type Direction } from "../src/app/types";
const defaults={...fullDefaults,fullDome:false};
it("looks first, follows later, returns home, and stays in bounds", () => {
  for (const d of ["left", "right", "up", "down"] as Direction[]) {
    const a = new SpatialAnimator();
    a.trigger(d, 0, defaults);
    const early = a.sample(120, defaults);
    expect(early.az).toBe(0);
    expect(early.el).toBe(20);
    expect(Math.abs(early.gazeX) + Math.abs(early.gazeY)).toBeGreaterThan(0.9);
    for (let t = 0; t < 6000; t += 25) {
      const p = a.sample(t, defaults);
      expect(p.az).toBeGreaterThanOrEqual(-25);
      expect(p.az).toBeLessThanOrEqual(25);
      expect(p.el).toBeGreaterThanOrEqual(8);
      expect(p.el).toBeLessThanOrEqual(32);
    }
    expect(a.sample(6000, defaults)).toMatchObject({ az: 0, el: 20 });
  }
});
it("changes direction without teleporting", () => {
  const a = new SpatialAnimator();
  a.trigger("left", 0, defaults);
  const p = a.sample(700, defaults);
  a.trigger("right", 700, defaults);
  expect(a.sample(700, defaults).az).toBeCloseTo(p.az);
  a.center(900, defaults);
  expect(a.sample(3000, defaults).az).toBe(0);
});

it('full-dome movement reaches behind the audience and remains within the real fisheye',()=>{
 const a=new SpatialAnimator();a.trigger('up',0,fullDefaults);
 const early=a.sample(100,fullDefaults);expect(early.el).toBeGreaterThan(20);expect(early.gazeY).toBeGreaterThan(.9);
 let behind=false,overhead=false;
 for(let t=150;t<=6500;t+=25){const p=a.sample(t,fullDefaults);expect(Math.hypot(p.masterX,p.masterY)).toBeLessThanOrEqual(.900001);if(Math.abs(p.az)>150)behind=true;if(p.el>80)overhead=true;}
 expect(behind).toBe(true);expect(overhead).toBe(true);
});
it('continuous targets cover every part of the dome and serialize without jumps',()=>{
 for(const target of [[-.9,0],[.9,0],[0,.9],[0,-.9],[.8,.8]]){
 const a=new SpatialAnimator();for(let t=0;t<=10000;t+=25){a.moveTo(target[0],target[1],t,fullDefaults);a.sample(t,fullDefaults);}
 const p=a.sample(10000,fullDefaults);expect(Math.hypot(p.masterX,p.masterY)).toBeLessThanOrEqual(.900001);
 if(target[0]===.9)expect(p.az).toBeGreaterThan(60);
 if(target[0]===-.9)expect(p.az).toBeLessThan(-60);
 const b=new SpatialAnimator();b.restore(a.snapshot());expect(b.sample(10000,fullDefaults)).toEqual(p);
 }
});
it('limits angular travel rate and returns home after pointing ends',()=>{
 const a=new SpatialAnimator();a.moveTo(.9,0,0,fullDefaults);let previous=a.sample(0,fullDefaults);
 for(let t=25;t<=7000;t+=25){const p=a.sample(t,fullDefaults);expect(Math.hypot(p.masterX-previous.masterX,p.masterY-previous.masterY)*80).toBeLessThanOrEqual(fullDefaults.angularSpeed*.025+.00001);previous=p;}
 for(let t=7025;t<=22000;t+=25)a.sample(t,fullDefaults);
 expect(a.sample(22000,fullDefaults).el).toBeCloseTo(20,2);
});

it('begins tracking in the next render frame without anticipation delay',()=>{
 const a=new SpatialAnimator();const before=a.sample(1000,fullDefaults);
 a.moveTo(.8,.1,1000,fullDefaults);const next=a.sample(1016,fullDefaults);
 expect(next.masterX).toBeGreaterThan(before.masterX);
 expect(next.masterY).toBeGreaterThan(before.masterY);
 // The speed cap still prevents a teleport across the whole dome.
 expect(Math.hypot(next.masterX-before.masterX,next.masterY-before.masterY)).toBeLessThanOrEqual(fullDefaults.angularSpeed / 80 * .016 + .000001);
});


it('reaches a navigation side promptly and reverses in the next frame',()=>{
 const a=new SpatialAnimator();
 a.moveTo(.8,.1,0,fullDefaults);
 for(let t=16;t<=480;t+=16)a.sample(t,fullDefaults);
 const arrived=a.sample(480,fullDefaults);
 expect(Math.hypot(arrived.masterX-.8,arrived.masterY-.1)).toBeLessThan(.01);
 a.moveTo(-.8,.1,480,fullDefaults);
 expect(a.sample(496,fullDefaults).masterX).toBeLessThan(arrived.masterX);
});
