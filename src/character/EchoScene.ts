import { ease } from "./EmotionStateMachine";

export const ECHO_DURATION_MS = 28000;
export const ECHO_INPUT_MS = 8500;

export interface EchoCue {
  seconds: number;
  look?: number;
  smile?: number;
}

export interface EchoFace {
  azimuth: number;
  elevation: number;
  size: number;
  opacity: number;
  look: number;
  smile: number;
  tilt: number;
  blink: number;
}

const placements = [
  [0, 20], [78, 27], [-76, 31], [118, 54],
  [-128, 55], [43, 70], [-38, 66], [180, 57],
];

function opening(seconds: number, cues: readonly EchoCue[]) {
  let look = -ease((seconds - .55) / .48) + 1.85 * ease((seconds - 3) / .65)
    - 1.45 * ease((seconds - 5.6) / .62) + .6 * ease((seconds - 8) / .65);
  let smile = .55 - .95 * ease((seconds - 2.5) / .5) + 1.3 * ease((seconds - 6.6) / .7);
  for (const cue of cues) {
    if (cue.seconds > seconds) break;
    const amount = ease((seconds - cue.seconds) / .22);
    if (cue.look !== undefined) look += (cue.look - look) * amount;
    if (cue.smile !== undefined) smile += (cue.smile - smile) * amount;
  }
  return { look, smile };
}

export function echoFaces(seconds: number, cues: readonly EchoCue[] = []): EchoFace[] {
  return placements.map(([azimuth, elevation], index) => {
    const main = index === 0;
    const last = index === placements.length - 1;
    const delay = main ? 0 : 1.1 + (index - 1) * .46;
    const visibleAt = main ? 0 : index === 1 ? 1.7 : 6 + index * .8;
    const replay = opening(Math.min(seconds - delay, 14 - delay), cues);
    const hush = ease((seconds - 14) / .65);
    // On each side of the room, look along the shorter arc toward the rear.
    const towardRear = azimuth < 0 ? -1 : 1;
    const reply = ease((seconds - (last ? 21 : 22.25)) / .55);
    const turn = ease((seconds - 16) / .8) * (1 - ease((seconds - 24.2) / 1.35));
    const opacity = (main ? 1 : ease((seconds - visibleAt) / .7))
      * (last || main ? 1 : 1 - ease((seconds - 17.2) / 1.15));
    const stopMoving = 1 - ease((seconds - 13.8) / .75);
    const nodTime = seconds - (last ? 21 : 22.25);
    const nod = Math.sin(Math.PI * Math.max(0, Math.min(1, nodTime / .85)));
    return {
      azimuth: azimuth + (main ? 5 : 3) * replay.look * stopMoving,
      elevation: elevation + (last || main ? nod * -4 : 0),
      size: main ? 1.28 : last ? 1.03 : .49 + index * .025,
      opacity,
      look: replay.look * (1 - hush) + towardRear * turn * (last ? 0 : 1 - reply),
      smile: replay.smile * (1 - hush) + .12 * hush + (last || main ? .82 * reply : 0),
      tilt: (last || main ? -9 * nod : 0),
      blink: last || main ? nod * .66 : 0,
    };
  });
}
