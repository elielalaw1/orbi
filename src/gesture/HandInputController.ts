import type { Action, Settings } from "../app/types";
import type { Landmark } from "./CustomGestures";
import { GestureNavigator, palmCenter, indexDirection } from "./GestureNavigator";
import { PointingController } from "./PointingController";
import { GestureController } from "./GestureController";
export interface HandDetection {
  landmarks: Landmark[];
  gesture: string | null;
  score: number;
  handedness: string;
  handednessScore: number;
}
export class HandInputController {
  private left = new GestureController();
  private position = new PointingController();
  private other = new GestureController();
  private navigator = new GestureNavigator();
  private lastPalm: { x: number; y: number } | null = null;
  private hadLeft = false;
  private initialized = false;
  update(hands: HandDetection[], now: number, s: Settings) {
    if (s.navigationMode === "gestures") return this.updateCommands(hands, now, s);
    const controlIndex = hands.reduce(
      (best, h, i) =>
        h.landmarks.length === 21 &&
        h.handedness === s.leftHandLabel &&
        (h.handednessScore >= 0.7 ||
          (this.hadLeft &&
            this.lastPalm &&
            h.handednessScore >= 0.55 &&
            Math.hypot(
              palmCenter(h.landmarks).x - this.lastPalm.x,
              palmCenter(h.landmarks).y - this.lastPalm.y,
            ) < 0.15)) &&
        (best < 0 || h.handednessScore > hands[best].handednessScore)
          ? i
          : best,
      -1,
    );
    const otherIndex = hands.findIndex(
      (h, i) => i !== controlIndex && h.landmarks.length === 21,
    );
    const actions: Action[] = [];
    if (controlIndex < 0) {
      if (this.hadLeft || !this.initialized)
        actions.push({ type: "hand-lost" });
      this.left.clear();
      this.navigator.clear();
    }
    let positionLabel = "";
    let label =
        controlIndex >= 0
          ? "Left hand visible"
          : "No left hand · returning home",
      score = 0;
    if (controlIndex >= 0) {
      const h = hands[controlIndex];
      if (s.fullDome && s.pointingMethod === "position") {
        const target = this.position.target(h.landmarks, s);
        if (target) actions.push({ type: "target", value: target });
        label = "Left hand · position control";
        score = h.handednessScore;
      } else {
        const result = this.left.process(
          h.landmarks,
          h.gesture,
          h.score,
          now,
          s,
        );
        if (result.action) actions.push(result.action);
        label = result.label || "Left hand visible";
        score = result.score;
      }
    }
    positionLabel = label;
    if (otherIndex >= 0) {
      const h = hands[otherIndex],
        result = this.other.process(h.landmarks, h.gesture, h.score, now, s);
      if (result.action?.type === "emotion") {
        actions.push(result.action);
        label = result.label || label;
        score = result.score;
      }
    } else this.other.clear();
    this.lastPalm =
      controlIndex >= 0 ? palmCenter(hands[controlIndex].landmarks) : null;
    this.hadLeft = controlIndex >= 0;
    this.initialized = true;
    return { actions, controlIndex, label, score, positionLabel };
  }
  private updateCommands(hands: HandDetection[], now: number, s: Settings) {
    const valid = hands.filter(h => h.landmarks.length === 21 && h.handednessScore >= 0.55);
    const actions: Action[] = [];
    let positionLabel = "No hand · returning home";
    let controlIndex = -1;
    if (!valid.length) {
      if (this.hadLeft || !this.initialized) actions.push({ type: "hand-lost" });
      this.navigator.clear();
      this.other.clear();
    } else {
      const navigation = this.navigator.updateHands(valid, now, s);
      if (navigation.selected === "home") {
        if (!this.hadLeft || navigation.command === "home") actions.push({ type: "hand-lost" });
      } else actions.push({ type: "target", value: navigation.target });
      positionLabel = `${navigation.label} · point to choose a destination`;
      controlIndex = hands.findIndex(h => valid.includes(h) && !!indexDirection(h.landmarks, s.mirrored));
      if (controlIndex < 0) controlIndex = hands.indexOf(valid[0]);
      // Navigation poses take priority over emotions, including the two-hand up command.
      const emotionHand = valid.find(h => !indexDirection(h.landmarks, s.mirrored) &&
        h.gesture !== "Victory" && h.gesture !== "Closed_Fist");
      if (emotionHand) {
        const result = this.other.process(emotionHand.landmarks, emotionHand.gesture, emotionHand.score, now, s);
        if (result.action?.type === "emotion") actions.push(result.action);
      } else this.other.clear();
    }
    this.hadLeft = valid.length > 0;
    this.initialized = true;
    return { actions, controlIndex, label: positionLabel, score: valid[0]?.handednessScore ?? 0, positionLabel };
  }
  clear() {
    this.left.clear();
    this.position.clear();
    this.navigator.clear();
    this.other.clear();
    this.hadLeft = false;
    this.lastPalm = null;
    this.initialized = false;
  }
}
