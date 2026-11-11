import type { Settings } from "../app/types";
import { isolatedIndex, type Landmark } from "./CustomGestures";
import { roomToMaster } from "../dome/ProjectionMath";
export type NavigationCommand =
  "home" | "right" | "left" | "front" | "back" | "up";
// The exact target directions used in the user-approved 24-second navigation film.
export const navigationAngles: Record<NavigationCommand, [number, number]> = {
  home: [0, 20],
  right: [75, 20],
  left: [-75, 20],
  front: [0, 0],
  back: [180, 50],
  up: [0, 90],
};
export const navigationLabels: Record<NavigationCommand, string> = {
  home: "Sweet spot",
  right: "Right",
  left: "Left",
  front: "Front",
  back: "Back",
  up: "Up",
};
export function palmCenter(l: Landmark[]): { x: number; y: number } {
  const ids = [0, 5, 9, 13, 17];
  return {
    x: ids.reduce((n, i) => n + l[i].x, 0) / ids.length,
    y: ids.reduce((n, i) => n + l[i].y, 0) / ids.length,
  };
}
export interface NavigationHand {
  landmarks: Landmark[];
  gesture: string | null;
  score: number;
}
// Direction follows the mirrored camera preview, independent of which hand points.
export function indexDirection(l: Landmark[], mirrored: boolean) {
  if (!isolatedIndex(l)) return null;
  const dx = (l[8].x - l[5].x) * (mirrored ? -1 : 1);
  const dy = l[5].y - l[8].y;
  if (Math.hypot(dx, dy) < 0.035) return null;
  if (Math.abs(dx) > Math.abs(dy) * 1.35) return dx > 0 ? "right" : "left";
  if (Math.abs(dy) > Math.abs(dx) * 1.35) return dy > 0 ? "up" : "front";
  return null;
}
export class GestureNavigator {
  selected: NavigationCommand = "home";
  private pose: NavigationCommand | null = null;
  private poseAt = 0;
  private latched: NavigationCommand | null = null;
  updateHands(hands: NavigationHand[], now: number, s: Settings) {
    const directions = hands.map(h => indexDirection(h.landmarks, s.mirrored));
    let pose: NavigationCommand | null = null;
    if (directions.filter(d => d === "up").length >= 2) pose = "up";
    else {
      const directional = directions.filter(d => d && d !== "up");
      if (directional.length && directional.every(d => d === directional[0]))
        pose = directional[0] as NavigationCommand;
      else if (!directions.some(Boolean)) {
        if (hands.some(h => h.score >= s.confidence && h.gesture === "Closed_Fist")) pose = "home";
        else if (hands.some(h => h.score >= s.confidence && h.gesture === "Victory")) pose = "back";
      }
    }
    let command: NavigationCommand | null = null;
    if (pose !== this.pose) {
      this.pose = pose;
      this.poseAt = now;
      this.latched = null;
    }
    // A brief stable pose rejects isolated bad frames without requiring a swipe.
    if (pose && now - this.poseAt >= 65 && this.latched !== pose) {
      command = pose;
      this.selected = pose;
      this.latched = pose;
    }
    const target = roomToMaster(...navigationAngles[this.selected]);
    return { selected: this.selected, command, target: { x: target[0], y: target[1] },
      ready: true, label: navigationLabels[this.selected] };
  }
  clear() {
    this.selected = "home";
    this.pose = null;
    this.poseAt = 0;
    this.latched = null;
  }
}
