import type { Action, Routine } from "../app/types";

export interface SceneGesture {
  id: Routine | "angry" | "flood";
  label: string;
  emoji: string;
  instruction: string;
  action: Action;
  /** Order-independent MediaPipe categories; omit for custom landmark gestures. */
  modelGestures?: readonly [string, string];
}

// Shared by recognition, the animation index and the camera guide.
export const sceneGestures: readonly SceneGesture[] = [
  { id: "boxing", label: "Boxing match", emoji: "👍👍", instruction: "Two thumbs up", action: { type: "routine", value: "boxing" }, modelGestures: ["Thumb_Up", "Thumb_Up"] },
  { id: "gravity", label: "Zero gravity", emoji: "✊✊", instruction: "Two closed fists", action: { type: "routine", value: "gravity" }, modelGestures: ["Closed_Fist", "Closed_Fist"] },
  { id: "flirt", label: "Flirt", emoji: "🫶", instruction: "Make a heart with both hands", action: { type: "routine", value: "flirt" } },
  { id: "lap", label: "Run", emoji: "✌️✌️", instruction: "Two peace signs", action: { type: "routine", value: "lap" }, modelGestures: ["Victory", "Victory"] },
  { id: "echo", label: "Orbi Hears an Echo", emoji: "🖐️✊", instruction: "One open palm + one closed fist", action: { type: "routine", value: "echo" }, modelGestures: ["Open_Palm", "Closed_Fist"] },
  { id: "rose", label: "Two Orbis, One Rose", emoji: "🤟🤟", instruction: "Both hands: thumb, index and little finger out", action: { type: "routine", value: "rose" }, modelGestures: ["ILoveYou", "ILoveYou"] },
  { id: "escape", label: "The Great Escape", emoji: "👎👎", instruction: "Two thumbs down", action: { type: "routine", value: "escape" }, modelGestures: ["Thumb_Down", "Thumb_Down"] },
  { id: "angry", label: "Angry fire", emoji: "🖕", instruction: "Raise one middle finger", action: { type: "emotion", value: "angry" } },
  { id: "flood", label: "The Death of Orbi", emoji: "🖐️🖐️", instruction: "Two open palms · repeat to stop", action: { type: "flood" }, modelGestures: ["Open_Palm", "Open_Palm"] },
];
