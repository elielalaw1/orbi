import type { Direction, Settings } from "../app/types";
import { uprightRoll, settleRoll } from "../dome/FaceGeometry";
import { ease } from "./EmotionStateMachine";
import { roomToMaster, masterToRoom, angles } from "../dome/ProjectionMath";
export function clampMaster(x: number, y: number): [number, number] {
  const r = Math.hypot(x, y),
    k = r > 0.9 ? 0.9 / r : 1;
  return [x * k, y * k];
}
export class SpatialAnimator {
  direction: Direction | null = null;
  private started = -1e9;
  private start = [0, 0];
  private returning = false;
  private returnHome: [number, number] | null = null;
  private roll = 0;
  private point: [number, number] = roomToMaster(0, 20);
  private target: [number, number] = roomToMaster(0, 20);
  private updated = 0;
  private returnAt = -1e9;
  private tracking = false;
  trigger(d: Direction, now: number, s: Settings) {
    if (s.fullDome) {
      const targets: Record<Direction, [number, number]> = {
        left: [-0.85, -0.12],
        right: [0.85, -0.12],
        up: [0, 0.85],
        down: [0, -0.88],
      };
      this.moveTo(...targets[d], now, s);
      this.direction = d;
      return;
    }
    const p = this.sample(now, s);
    this.start = [p.az - s.homeAz, p.el - s.homeEl];
    this.direction = d;
    this.started = now;
    this.returning = false;
    this.returnHome = null;
  }
  moveTo(x: number, y: number, now: number, s: Settings) {
    this.fullSample(now, s);
    const next = clampMaster(x, y);
    if (!this.tracking || this.returning) this.started = now;
    this.tracking = true;
    this.returning = false;
    this.target = next;
    this.returnAt =
      now +
      ((Math.hypot(next[0] - this.point[0], next[1] - this.point[1]) * 80) /
        s.angularSpeed) *
        1000 +
      s.holdMs;
  }
  center(
    now: number,
    s: Settings,
    home: [number, number] = [s.homeAz, s.homeEl],
  ) {
    if (s.fullDome) {
      this.fullSample(now, s);
      this.target = roomToMaster(...home);
      this.started = now - s.anticipationMs;
      this.returnAt = Infinity;
      this.tracking = false;
      this.returning = true;
      this.direction = null;
      return;
    }
    const p = this.sample(now, s);
    this.start = [p.az - home[0], p.el - home[1]];
    this.returnHome = home;
    this.started = now;
    this.direction = null;
    this.returning = true;
  }
  snapshot() {
    return {
      direction: this.direction,
      started: this.started,
      start: this.start,
      returning: this.returning,
      point: this.point,
      target: this.target,
      updated: this.updated,
      returnAt: Number.isFinite(this.returnAt) ? this.returnAt : 1e15,
      tracking: this.tracking,
      returnHome: this.returnHome,
      roll: this.roll,
    };
  }
  restore(state: ReturnType<SpatialAnimator["snapshot"]>) {
    Object.assign(this, state);
  }
  private fullSample(now: number, s: Settings) {
    const dt = Math.max(0, now - this.updated) / 1000;
    this.updated = now;
    if (now > this.returnAt && !this.returning) {
      this.target = roomToMaster(s.homeAz, s.homeEl);
      this.returning = true;
      this.tracking = false;
      this.started = now - s.anticipationMs;
    }
    const dx = this.target[0] - this.point[0],
      dy = this.target[1] - this.point[1],
      distance = Math.hypot(dx, dy);
    if (
      (this.tracking || now - this.started >= s.anticipationMs) &&
      distance > 1e-8
    ) {
      const response = this.tracking ? s.pointResponseMs / 1000 : 0.2;
      const step = Math.min(
        distance,
        (s.angularSpeed / 80) * dt,
        distance * (1 - Math.exp(-dt / Math.max(0.016, response))),
      );
      this.point = clampMaster(
        this.point[0] + (dx / distance) * step,
        this.point[1] + (dy / distance) * step,
      );
    }
    const direction = masterToRoom(...this.point)!,
      room = angles(direction);
    this.roll = s.autoUpright?settleRoll(this.roll,uprightRoll(direction),dt,s.orientationSpeed):0;
    return {
      ...room,
      roll: this.roll,
      gazeX: Math.max(-1, Math.min(1, dx * 5)),
      gazeY: Math.max(-1, Math.min(1, dy * 5)),
      lean: Math.min(0.035, distance * 0.03),
      masterX: this.point[0],
      masterY: this.point[1],
    };
  }
  sample(now: number, s: Settings) {
    if (s.fullDome) return this.fullSample(now, s);
    const t = now - this.started,
      targets = { left: [-25, 0], right: [25, 0], up: [0, 12], down: [0, -12] },
      target = this.direction ? targets[this.direction] : [0, 0];
    let az = 0,
      el = 0,
      gazeX = 0,
      gazeY = 0,
      lean = 0;
    if (this.returning) {
      const f = 1 - ease(t / s.returnMs);
      az = this.start[0] * f;
      el = this.start[1] * f;
    } else if (this.direction) {
      const move = ease((t - s.anticipationMs) / 650),
        back = 1 - ease((t - s.anticipationMs - 650 - s.holdMs) / s.returnMs);
      az = (this.start[0] + (target[0] - this.start[0]) * move) * back;
      el = (this.start[1] + (target[1] - this.start[1]) * move) * back;
      gazeX = (target[0] / 25) * ease(t / 110) * back;
      gazeY = (target[1] / 12) * ease(t / 110) * back;
      lean = Math.sin(move * Math.PI) * 0.04 * back;
    }
    const home =
      this.returning && this.returnHome
        ? this.returnHome
        : [s.homeAz, s.homeEl];
    az = Math.max(-25, Math.min(25, home[0] + az));
    el = Math.max(8, Math.min(32, home[1] + el));
    const p = roomToMaster(az, el);
    return {
      az,
      el,
      gazeX,
      gazeY,
      lean,
      roll: s.autoUpright?(uprightRoll(masterToRoom(...p)!) || 0):0,
      masterX: p[0],
      masterY: p[1],
    };
  }
}
