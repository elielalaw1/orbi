import type { Landmark } from "../src/gesture/CustomGestures";
// Synthetic articulated hands, palm length .2. Can be rotated/scaled in 3D.
export function hand(extended: number[]) {
  const l: Landmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.8,
    z: 0,
  }));
  l[0] = { x: 0.5, y: 0.8, z: 0 };
  for (let f = 0; f < 4; f++) {
    const b = 5 + f * 4,
      x = 0.38 + f * 0.08;
    l[b] = { x, y: 0.6, z: 0 };
    l[b + 1] = { x, y: 0.48, z: 0 };
    if (extended.includes(b)) {
      l[b + 2] = { x, y: 0.37, z: 0 };
      l[b + 3] = { x, y: 0.26, z: 0 };
    } else {
      l[b + 2] = { x, y: 0.52, z: -0.08 };
      l[b + 3] = { x, y: 0.63, z: -0.07 };
    }
  }
  l[1] = { x: 0.35, y: 0.75, z: 0 };
  l[2] = { x: 0.3, y: 0.68, z: 0 };
  l[3] = { x: 0.28, y: 0.6, z: 0 };
  l[4] = { x: 0.26, y: 0.55, z: 0 };
  return l;
}
export function rotatedHand(l: Landmark[], angle: number, scale = 1) {
  return l.map((p) => ({
    x:
      0.5 +
      scale * ((p.x - 0.5) * Math.cos(angle) - (p.y - 0.5) * Math.sin(angle)),
    y:
      0.5 +
      scale * ((p.x - 0.5) * Math.sin(angle) + (p.y - 0.5) * Math.cos(angle)),
    z: p.z * scale,
  }));
}
