import { defaults, type Action, type Settings } from "./types";
import { FaceAnimator } from "../character/FaceAnimator";
export class StateStore {
  settings: Settings = { ...defaults };
  animator = new FaceAnimator();
  time = 0;
  dispatch(action: Action) {
    const s = this.settings;
    if(action.type==='routine'){this.animator.startRoutine(action.value,this.time);return;}
    if(action.type==='reset'||action.type==='center')this.animator.cancelRoutine();
    if(this.animator.routineActive(this.time)&&['target','hand-lost','emotion','direction'].includes(action.type))return;
    if (action.type === "settings") Object.assign(s, action.value);
    if (action.type === "emotion")
      this.animator.emotion.trigger(action.value, this.time, s);
    if (action.type === "direction") {
      this.animator.spatial.trigger(action.value, this.time, s);
      this.animator.emotion.lastInteraction = this.time;
    }
    if (action.type === "target") {
      this.animator.spatial.moveTo(
        action.value.x,
        action.value.y,
        this.time,
        s,
      );
      this.animator.emotion.lastInteraction = this.time;
    }
    if (action.type === "hand-lost")
      this.animator.spatial.center(this.time, s, [0, 20]);
    if (action.type === "center") this.animator.spatial.center(this.time, s);
    if (action.type === "reset") {
      this.animator.emotion.trigger("neutral", this.time, s);
      this.animator.spatial.center(this.time, s);
    }
  }
}
