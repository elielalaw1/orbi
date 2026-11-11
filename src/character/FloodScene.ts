import type { Frame } from "./FaceAnimator";
import { blend, presets, type Expression } from "./EmotionPresets";
import { roomToMaster } from "../dome/ProjectionMath";

export const FLOOD_DURATION = 90;
const AUTHORED_DURATION = 120;

// The route, expressions and shader share the original choreography clock.
export function floodCueTime(elapsed: number): number {
  return elapsed < 0 ? -1 : (elapsed / FLOOD_DURATION) * AUTHORED_DURATION;
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

const acceptance: Expression = {
  ...presets.sad,
  eye: 0.46,
  smile: -0.14,
  open: 0,
  brow: -0.15,
};

const route = [
  [0, 0, 20], [21, 0, 20], [30, -66, 30], [39, 67, 35],
  [48, -54, 49], [58, 72, 56], [69, -44, 66], [79, 24, 76],
  [86, 45, 54], [95, 0, 20], [120, 0, 20],
];

export function floodFrame(frame: Frame, seconds: number): Frame {
  const next = route.findIndex(([time]) => time > seconds);
  const end = next < 0 ? route.length - 1 : next;
  const [startTime, startAz, startEl] = route[Math.max(0, end - 1)];
  const [endTime, endAz, endEl] = route[end];
  const move = ease((seconds - startTime) / (endTime - startTime));
  const panic = ease((seconds - 19) / 14) * (1 - ease((seconds - 77) / 18));
  const az = startAz + (endAz - startAz) * move + Math.sin(seconds * 2.1) * panic * 1.4;
  const el = startEl + (endEl - startEl) * move + Math.sin(seconds * 3.2) * panic * 1.1;
  const [masterX, masterY] = roomToMaster(az, el);
  const alert = blend(presets.neutral, presets.surprised, ease((seconds - 11) / 15));
  const strain = blend(alert, presets.angry, panic * (0.26 + 0.24 * Math.sin(seconds * 0.76)));
  const expression = {
    ...blend(strain, acceptance, ease((seconds - 83) / 17)),
    color: presets.neutral.color,
  };
  return {
    ...frame,
    position: { ...frame.position, az, el, masterX, masterY, roll: 0, lean: panic * 0.08 * Math.sin(seconds * 1.8) },
    expression,
    hearts: 0,
    kiss: 0,
    gazeX: seconds < 21 ? Math.sin(seconds * 0.4) * 0.65 : Math.sign(endAz - startAz) * panic * 0.75,
    gazeY: -0.7 * ease((seconds - 8) / 10) * (1 - ease((seconds - 94) / 8)),
    blink: frame.blink * (1 - ease((seconds - 102) / 6)),
    breath: 1 + 0.025 * panic * Math.sin(seconds * 6),
    shake: 0,
  };
}
