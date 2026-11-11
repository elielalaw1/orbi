import type { Settings } from "../app/types";
import type { Expression } from "../character/EmotionPresets";
import type { Vec3 } from "./ProjectionMath";
const dot = (a: Vec3, b: Vec3) => a.reduce((sum, n, i) => sum + n * b[i], 0);
const norm = (v: Vec3): Vec3 => {
  const n = Math.hypot(...v);
  return v.map((x) => x / n) as Vec3;
};
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function uprightRoll(direction: Vec3): number | null {
  const [x, y] = direction,
    h = Math.hypot(x, y);
  if (h < 0.12) return null;
  const baseRight = norm([1 - x * x, -x * direction[1], -x * direction[2]]),
    baseUp = cross(baseRight, direction);
  const desired: Vec3 = [y / h, -x / h, 0];
  return (
    (Math.atan2(dot(desired, baseUp), dot(desired, baseRight)) * 180) / Math.PI
  );
}
export function normalizeDegrees(value:number):number{return ((value+180)%360+360)%360-180;}
export function settleRoll(
  current: number,
  desired: number | null,
  dt: number,
  degreesPerSecond=90,
): number {
  if (desired === null) return current;
  const delta = normalizeDegrees(desired-current),
    maxStep = degreesPerSecond * Math.max(0, dt);
  return current + Math.max(-maxStep, Math.min(maxStep, delta));
}
// Conservative spherical cap containing eyes, brows, mouth and visible soft shadows.
export function angularFootprint(
  s: Settings,
  e: Expression,
  breath: number,
  lean: number,
): number {
  const eyeRadius = Math.max(8.9, 10.4 * e.eye * 1.025 + 0.3) + 2.5;
  const eyes = Math.hypot(s.eyeSpacing + 0.25, 4.4) + eyeRadius;
  const browY =
    16.6 +
    Math.abs(e.brow) * 1.35 +
    Math.abs(s.browOffset) +
    0.85 +
    Math.abs(e.tilt) * 2.24;
  const brows = Math.hypot(s.eyeSpacing + 7.8, browY) + 2;
  const mouth =
    Math.hypot(
      11.6 * s.mouthScale + 2,
      8.5 + Math.abs(e.smile) * 2.6 + 0.62 + e.open * 5.2,
    ) + 2;
  return (
    Math.max(eyes, brows, mouth) * Math.max(0.5, breath) * (1 + Math.abs(lean))
  );
}
export function fitFaceScale(
  radius: number,
  requested: number,
  footprint: number,
): number {
  const remaining = Math.max(0.01, 80 * (1 - Math.min(1, radius)) - 0.35);
  return Math.min(requested, remaining / Math.max(1, footprint));
}
