import type { Emotion } from "../app/types";
export interface Expression {
  color: [number, number, number];
  eye: number;
  smile: number;
  open: number;
  brow: number;
  tilt: number;
  wink: number;
}
export const presets: Record<Emotion, Expression> = {
  neutral: {
    color: [1, 0.8, 0.035],
    eye: 1,
    smile: 0.55,
    open: 0.025,
    brow: 0,
    tilt: 0,
    wink: 0,
  },
  happy: {
    color: [1, 0.87, 0.035],
    eye: 0.74,
    smile: 1,
    open: 0.68,
    brow: 1,
    tilt: 0,
    wink: 0,
  },
  sad: {
    color: [0.10, 0.56, 1],
    eye: 0.75,
    smile: -0.8,
    open: 0.05,
    brow: -0.4,
    tilt: -1,
    wink: 0,
  },
  angry: {
    color: [1, 0.105, 0.075],
    eye: 0.52,
    smile: -0.45,
    open: 0.18,
    brow: -0.5,
    tilt: 1.2,
    wink: 0,
  },
  surprised: {
    color: [1, 0.49, 0.025],
    eye: 1.25,
    smile: 0,
    open: 1,
    brow: 1.7,
    tilt: 0,
    wink: 0,
  },
  playful: {
    color: [1, 0.25, 0.47],
    eye: 0.9,
    smile: 0.75,
    open: 0.3,
    brow: 0.7,
    tilt: -0.35,
    wink: 0.75,
  },
};
export function blend(
  a: Expression,
  b: Expression,
  t: number,
  colorT = t,
): Expression {
  const lerp = (x: number, y: number, q = t) => x + (y - x) * q;
  return {
    color: a.color.map((v, i) => lerp(v, b.color[i], colorT)) as [
      number,
      number,
      number,
    ],
    eye: lerp(a.eye, b.eye),
    smile: lerp(a.smile, b.smile),
    open: lerp(a.open, b.open),
    brow: lerp(a.brow, b.brow),
    tilt: lerp(a.tilt, b.tilt),
    wink: lerp(a.wink, b.wink),
  };
}
