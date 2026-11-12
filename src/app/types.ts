export const emotions = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "surprised",
  "playful",
] as const;
export type Emotion = (typeof emotions)[number];
export type Direction = "left" | "right" | "up" | "down";
export interface Settings {
  leftHandLabel: "Left" | "Right";
  fullDome: boolean;
  angularSpeed: number;
  pointResponseMs: number;
  handReach: number;
  navigationMode: "gestures" | "position";
  brightness: number;
  speed: number;
  resolution: number;
  guides: boolean;
  audio: boolean;
  volume: number;
  homeAz: number;
  homeEl: number;
  eyeSpacing: number;
  faceScale: number;
  mouthScale: number;
  rotation: number;
  autoUpright: boolean;
  orientationSpeed: number;
  browOffset: number;
  expressionMs: number;
  colorMs: number;
  returnMs: number;
  idleMs: number;
  holdMs: number;
  anticipationMs: number;
  confidence: number;
  stableMs: number;
  cooldownMs: number;
  inferenceFps: number;
  pointingMethod: "orientation" | "position";
  mirrored: boolean;
  invertHorizontal: boolean;
  centerX: number;
  centerY: number;
  deadZone: number;
  directionThreshold: number;
}
export const defaults: Settings = {
  // Current Tasks handedness refers to the subject. CSS mirroring does not alter input.
  leftHandLabel: "Left",
  fullDome: true,
  angularSpeed: 240,
  pointResponseMs: 30,
  handReach: 2.8,
  navigationMode: "gestures",
  brightness: 0.84,
  speed: 1,
  resolution: 768,
  guides: false,
  audio: true,
  volume: 0.18,
  homeAz: 0,
  homeEl: 20,
  eyeSpacing: 14,
  faceScale: 1.4,
  mouthScale: 1,
  rotation: 0,
  autoUpright: true,
  orientationSpeed: 360,
  browOffset: 0,
  expressionMs: 450,
  colorMs: 950,
  returnMs: 1400,
  idleMs: 6500,
  holdMs: 1500,
  anticipationMs: 180,
  confidence: 0.7,
  stableMs: 380,
  cooldownMs: 900,
  inferenceFps: 20,
  pointingMethod: "position",
  mirrored: true,
  invertHorizontal: true,
  centerX: 0.5,
  centerY: 0.5,
  deadZone: 0.15,
  directionThreshold: 0.55,
};
export type GestureScene = 'gravity' | 'boxing';
export type Routine = "lap" | "flirt" | "escape" | "rose" | "echo" | GestureScene;
export type Action =
  | { type: "flood" }
  | { type: "routine"; value: Routine }
  | { type: "emotion"; value: Emotion }
  | { type: "direction"; value: Direction }
  | { type: "target"; value: { x: number; y: number } }
  | { type: "hand-lost" }
  | { type: "center" }
  | { type: "reset" }
  | { type: "settings"; value: Partial<Settings> };
