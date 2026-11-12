import type { Direction, Settings } from "../app/types";
import type { Landmark } from "./CustomGestures";
export class PointingController {
  private previous: Direction | null = null;
  classify(l: Landmark[], s: Settings): Direction | null {
    if (l.length !== 21) return null;
    let x: number, y: number;
    if (s.pointingMethod === "position") {
      x = l[9].x - s.centerX;
      y = s.centerY - l[9].y;
    } else {
      x = l[8].x - l[5].x;
      y = l[5].y - l[8].y;
      const n = Math.hypot(x, y);
      if (n < 0.04) return null;
      x /= n;
      y /= n;
    }
    if (s.mirrored) x = -x;
    if (s.invertHorizontal) x = -x;
    const threshold =
      s.pointingMethod === "position" ? s.deadZone : s.directionThreshold;
    if (Math.max(Math.abs(x), Math.abs(y)) < threshold) {
      this.previous = null;
      return null;
    }
    const d: Direction =
      Math.abs(x) > Math.abs(y)
        ? x > 0
          ? "right"
          : "left"
        : y > 0
          ? "up"
          : "down";
    if (
      this.previous &&
      this.previous !== d &&
      Math.abs(Math.abs(x) - Math.abs(y)) < threshold * 0.25
    )
      return this.previous;
    this.previous = d;
    return d;
  }
  target(l:Landmark[],s:Settings):{x:number;y:number}|null{
    if(l.length!==21)return null;
    let x=(l[9].x-s.centerX)/Math.max(.2,s.centerX,1-s.centerX);
    const y=(s.centerY-l[9].y)/Math.max(.2,s.centerY,1-s.centerY);
    x*=s.handReach;const targetY=y*s.handReach;
    if(s.mirrored)x=-x;if(s.invertHorizontal)x=-x;const r=Math.hypot(x,targetY),k=r>.9?.9/r:1;
    return {x:x*k,y:targetY*k};
  }
  clear() {
    this.previous = null;
  }
}
