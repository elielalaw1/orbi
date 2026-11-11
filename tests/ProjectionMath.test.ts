import { describe, it, expect } from "vitest";
import { masterToRoom, roomToMaster, angles } from "../src/dome/ProjectionMath";
describe("Wisdome 160° room mapping", () => {
  it("places zenith 64° up and front rim 16° below eye level", () => {
    expect(angles(masterToRoom(0, 0)!).el).toBeCloseTo(64);
    expect(angles(masterToRoom(0, -1)!).el).toBeCloseTo(-16);
    expect(angles(masterToRoom(0, -1)!).az).toBeCloseTo(0);
    expect(angles(masterToRoom(0, 1)!).el).toBeCloseTo(36);
  });
  it("uses linear radial angles and rejects corners", () => {
    const a = masterToRoom(0, 0)!,
      b = masterToRoom(0.5, 0)!;
    expect(
      (Math.acos(a.reduce((s, x, i) => s + x * b[i], 0)) * 180) / Math.PI,
    ).toBeCloseTo(40);
    expect(masterToRoom(1, 1)).toBeNull();
  });
  it("roundtrips room directions and preserves left/right", () => {
    for (const az of [-50, -25, 0, 25, 50])
      for (const el of [0, 20, 40]) {
        const p = roomToMaster(az, el),
          v = angles(masterToRoom(...p)!);
        expect(v.az).toBeCloseTo(az, 8);
        expect(v.el).toBeCloseTo(el, 8);
      }
    expect(roomToMaster(25, 20)[0]).toBeGreaterThan(0);
    expect(roomToMaster(0, 20)[1]).toBeLessThan(0);
  });
});
