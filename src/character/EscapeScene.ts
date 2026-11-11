import { roomToMaster } from "../dome/ProjectionMath";
import type { Settings } from "../app/types";
import { ease } from "./EmotionStateMachine";
import { blend, presets } from "./EmotionPresets";
import type { Frame } from "./FaceAnimator";

export const ESCAPE_DURATION_MS = 14000;

type Cue = readonly [
  time: number, azimuth: number, elevation: number, run: number,
  visibility: number, peek: number,
];

// Duplicate the blacked-out endpoints so the side swap happens offscreen.
const cues: readonly Cue[] = [
  [0, 0, 0, 0, 1, 0],
  [1000, 0, 0, 0, 1, 0],
  [2650, 148, -6, 1, 0, 0],
  [3050, 148, -6, 0, 0, 0],
  [3060, -148, -6, 0, 0, 1],
  [3940, -100, 0, 0, 1, 1],
  [4750, -100, 0, 0, 1, 1],
  [5500, -62, 2, .75, 1, 0],
  [6880, 148, -6, 1, 0, 0],
  [7200, 148, -6, 0, 0, 0],
  [7210, -148, -6, 0, 0, 1],
  [7930, -98, 0, 0, 1, 1],
  [8800, -98, 0, 0, 1, 1],
  [10100, -42, 2, .56, 1, 0],
  [11500, 0, 0, 0, 1, 0],
  [14000, 0, 0, 0, 1, 0],
];

export function escapeFrame(frame: Frame, elapsed: number, settings: Settings): Frame {
  const next = cues.findIndex(([time]) => time > elapsed);
  const index = next < 0 ? cues.length - 1 : Math.max(1, next);
  const from = cues[index - 1];
  const to = cues[index];
  const progress = ease((elapsed - from[0]) / (to[0] - from[0]));
  const at = (column: 1 | 2 | 3 | 4 | 5) =>
    from[column] + (to[column] - from[column]) * progress;

  const run = at(3);
  const stride = Math.abs(Math.sin(elapsed * .013));
  const az = settings.homeAz + at(1);
  const el = settings.homeEl + at(2) + stride * run * 1.4;
  const [masterX, masterY] = roomToMaster(az, el);
  const surprise = ease((elapsed - 2900) / 700) * (1 - ease((elapsed - 9100) / 1200));
  const sheepish = ease((elapsed - 10800) / 1000) * (1 - ease((elapsed - 13300) / 700));
  const expression = blend(
    blend(presets.neutral, { ...presets.surprised, color: presets.neutral.color }, surprise),
    { ...presets.neutral, eye: .68, smile: .88, brow: .44, tilt: -.45 },
    sheepish,
  );
  return {
    ...frame,
    escape: { visibility: at(4), peek: at(5) },
    run,
    expression,
    position: { ...frame.position, az, el, masterX, masterY, roll: 0, lean: run * .09 },
    gazeX: at(5) * .88 + (1 - at(5)) * run * .55,
    gazeY: sheepish * -.27,
    breath: 1 + (stride - .45) * run * .085,
    shake: 0,
  };
}
