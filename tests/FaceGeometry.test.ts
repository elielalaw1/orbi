import { it, expect } from "vitest";
import {
  angularFootprint,
  fitFaceScale,
  uprightRoll,
  settleRoll,
  normalizeDegrees,
} from "../src/dome/FaceGeometry";
import { presets } from "../src/character/EmotionPresets";
import { defaults } from "../src/app/types";
import {
  masterToRoom,
  roomToMaster,
  roomDirection,
} from "../src/dome/ProjectionMath";
it("fits all expression footprints into the physical 80-degree cap, including extreme proportions", () => {
  for (const expression of Object.values(presets))
    for (const eyeSpacing of [8, 14])
      for (const browOffset of [-2, 2])
        for (const mouthScale of [0.6, 1.3])
          for (const radius of [0, 0.5, 0.8, 0.9]) {
            const s = { ...defaults, eyeSpacing, browOffset, mouthScale };
            const footprint = angularFootprint(
                s,
                { ...expression, brow: expression.brow + 0.15 },
                1.017,
                0.035,
              ),
              scale = fitFaceScale(radius, s.faceScale, footprint);
            expect(radius * 80 + footprint * scale).toBeLessThanOrEqual(
              79.650001,
            );
          }
});
it("preserves full fisheye directions over a polar grid, including back and zenith", () => {
  for (let r = 0; r <= 0.9; r += 0.1)
    for (let a = 0; a < 360; a += 15) {
      const p: [number, number] = [
        r * Math.cos((a * Math.PI) / 180),
        r * Math.sin((a * Math.PI) / 180),
      ];
      const v = masterToRoom(...p)!;
      const az = (Math.atan2(v[0], v[1]) * 180) / Math.PI,
        el = (Math.asin(v[2]) * 180) / Math.PI,
        q = roomToMaster(az, el);
      expect(q[0]).toBeCloseTo(p[0], 7);
      expect(q[1]).toBeCloseTo(p[1], 7);
    }
});
it("settles upright behind the audience without a sudden roll at the zenith", () => {
  expect(uprightRoll(roomDirection(0, 90))).toBeNull();
  expect(Math.abs(uprightRoll(roomDirection(180, 45))!)).toBeCloseTo(180);
  let roll = 0;
  for (let i = 0; i < 180; i++) {
    const next = settleRoll(roll, 180, 1 / 60);
    expect(Math.abs(next - roll)).toBeLessThanOrEqual(1.500001);
    roll = next;
  }
  expect(Math.abs(roll)).toBeCloseTo(180);
});

it('supports full-turn calibration and takes the shortest path after repeated rotations',()=>{
 expect(normalizeDegrees(1085)).toBe(5);expect(normalizeDegrees(-1085)).toBe(-5);
 expect(settleRoll(1080,10,1/60,360)).toBeCloseTo(1086);
 expect(settleRoll(-1080,-10,1/60,360)).toBeCloseTo(-1086);
});
it('upright correction catches up to the back-facing orientation faster than the old limiter',()=>{
 let roll=0;for(let i=0;i<30;i++)roll=settleRoll(roll,180,1/60,defaults.orientationSpeed);
 expect(Math.abs(roll)).toBeCloseTo(180);
});
