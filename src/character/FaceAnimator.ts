import { roomToMaster } from "../dome/ProjectionMath";
import type { Settings } from "../app/types";
import { EmotionStateMachine, ease } from "./EmotionStateMachine";
import { SpatialAnimator } from "./SpatialAnimator";
export class FaceAnimator {
  emotion = new EmotionStateMachine();
  spatial = new SpatialAnimator();
  private routine: {kind:'lap'|'flirt';start:number}|null=null;
  startRoutine(kind:'lap'|'flirt',now:number){this.routine={kind,start:now};}
  cancelRoutine(){this.routine=null;}
  routineActive(now:number){return !!this.routine&&now-this.routine.start<8000;}
  private nextBlink = 2600;
  private blinkStart = -1e9;
  private random = 92831;
  private rand() {
    this.random = (1664525 * this.random + 1013904223) >>> 0;
    return this.random / 4294967296;
  }
  snapshot() {
    return {
      routine: this.routine,
      emotion: this.emotion.snapshot(),
      spatial: this.spatial.snapshot(),
      nextBlink: this.nextBlink,
      blinkStart: this.blinkStart,
      random: this.random,
    };
  }
  restore(state: ReturnType<FaceAnimator["snapshot"]>) {
    this.routine=state.routine??null;
    this.emotion.restore(state.emotion);
    this.spatial.restore(state.spatial);
    this.nextBlink = state.nextBlink;
    this.blinkStart = state.blinkStart;
    this.random = state.random;
  }
  sample(now: number, s: Settings) {
    let hearts=0,kiss=0,wink=0,bounce=0;
    if(this.routine){
      const t=now-this.routine.start;
      if(t>=8000){this.routine=null;this.spatial.center(now,s);}
      else if(this.routine.kind==='lap'){
        const phase=Math.min(1,Math.max(0,(t-600)/6500))*Math.PI*2;
        this.spatial.moveTo(Math.sin(phase)*.72,-Math.cos(phase)*.72,now,s);
        bounce=Math.sin(t*.025)*.035;
      }else{
        this.spatial.moveTo(...roomToMaster(65,20),now,s);
        if(t>900){hearts=1;kiss=.7+.3*Math.sin(t*.008);wink=Math.pow(Math.max(0,Math.sin(t*.005)),8);}
      }
    }
    this.emotion.tick(now, s);
    if (now > this.nextBlink) {
      this.blinkStart = now;
      this.nextBlink = now + 2400 + this.rand() * 4300;
    }
    const t = (now - this.blinkStart) / 160,
      blink = t >= 0 && t < 1 ? 1 - Math.sin(t * Math.PI) : 1;
    const expression = this.emotion.sample(now, s),
      position = this.spatial.sample(now, s);
    const glanceIndex=Math.floor(now/2600),glancePhase=ease((now%2600)/180);
    const glance=(index:number,seed:number)=>(Math.sin(index*127.1+seed*311.7)*43758.5453)%1;
    const idleX=(glance(glanceIndex-1,1)*(1-glancePhase)+glance(glanceIndex,1)*glancePhase)*.2;
    const idleY=(glance(glanceIndex-1,2)*(1-glancePhase)+glance(glanceIndex,2)*glancePhase)*.12;
    const calm=1-Math.min(1,Math.max(Math.abs(position.gazeX),Math.abs(position.gazeY)));
    const lookX=position.gazeX*1.1,lookY=position.gazeY*1.1;
    expression.eye*=1+.025*Math.sin(now*.0011);
    expression.brow+=.10*Math.sin(now*.0013)+.05*Math.sin(now*.0021);
    expression.wink*=Math.pow(Math.max(0,Math.sin(now*.0018)),10);
    expression.wink=Math.max(expression.wink,wink);
    return {
      hearts,kiss,
      expression,
      position,
      blink,
      gazeX: lookX + calm*(idleX*1.7+Math.sin(now*.00071)*.12),
      gazeY: lookY + calm*(idleY*1.5+Math.sin(now*.00049)*.07),
      breath: 1 + bounce + 0.017 * Math.sin(now * 0.0016),
      shake:
        this.emotion.emotion === "angry" ? Math.sin(now * 0.022) * 0.12 : 0,
    };
  }
}
export type Frame = ReturnType<FaceAnimator["sample"]>;
