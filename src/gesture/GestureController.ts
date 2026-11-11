import type { Action, Emotion, Settings, Direction } from '../app/types';
import {GestureStabilizer} from './GestureStabilizer';
import {PointingController} from './PointingController';
import {middleFinger,isolatedIndex,type Landmark} from './CustomGestures';
const reactions:Record<string,Emotion>={Thumb_Up:'happy',Thumb_Down:'sad',Open_Palm:'surprised',Victory:'playful',Middle_Finger:'angry',Closed_Fist:'surprised'};
export class GestureController{
 private stabilizer=new GestureStabilizer();private pointer=new PointingController();private tracking=false;private lastDirection:Direction|null=null;
 process(l:Landmark[],known:string|null,confidence:number,now:number,s:Settings):{label:string|null;score:number;action:Action|null}{
  let label=l.length?known:null,score=l.length?confidence:0;
  if(l.length&&middleFinger(l,label||'',score)){label='Middle_Finger';score=.96;}
  const pointing=l.length&&(label==='Pointing_Up'||isolatedIndex(l));
  if(pointing){
   score=known==='Pointing_Up'?confidence:.85;
   if(score>=s.confidence){
    if(!this.tracking)this.stabilizer.clear();this.tracking=true;
    // Spatial input is continuous: no emotion debounce, cooldown or release latch.
    if(s.fullDome&&s.pointingMethod==='position'){
     const target=this.pointer.target(l,s);
     return {label:'point:track',score,action:target?{type:'target',value:target}:null};
    }
    const direction=this.pointer.classify(l,s);
    if(s.fullDome&&direction){
     const targets:Record<Direction,{x:number;y:number}>={left:{x:-.85,y:-.12},right:{x:.85,y:-.12},up:{x:0,y:.85},down:{x:0,y:-.88}};
     return {label:`point:${direction}`,score,action:{type:'target',value:targets[direction]}};
    }
    const changed=direction!==this.lastDirection;this.lastDirection=direction;
    return {label:direction?`point:${direction}`:null,score,action:direction&&changed?{type:'direction',value:direction}:null};
   }
  }
  if(this.tracking){this.tracking=false;this.lastDirection=null;this.pointer.clear();this.stabilizer.clear();}
  if(label==='None'||label==='Pointing_Up')label=null;
  this.stabilizer.stableMs=s.stableMs;this.stabilizer.cooldownMs=s.cooldownMs;this.stabilizer.threshold=s.confidence;
  const commit=this.stabilizer.update(label,score,now);
  return {label,score,action:commit&&reactions[commit]?{type:'emotion',value:reactions[commit]}:null};
 }
 clear(){this.stabilizer.clear();this.pointer.clear();this.tracking=false;this.lastDirection=null;}
}
