import { it, expect } from "vitest";
import { GestureNavigator, indexDirection, navigationAngles } from "../src/gesture/GestureNavigator";
import { HandInputController, type HandDetection } from "../src/gesture/HandInputController";
import { defaults } from "../src/app/types";
import { roomToMaster } from "../src/dome/ProjectionMath";
import { hand, rotatedHand } from "./fixtures";
const pointing = (angle = 0, handedness = "Left"): HandDetection => ({
 landmarks: rotatedHand(hand([5]), angle), gesture: "None", score: 0.1,
 handedness, handednessScore: 0.98,
});
const select = (n: GestureNavigator, hands: HandDetection[], start=0) => {
 n.updateHands(hands,start,defaults);
 return n.updateHands(hands,start+160,defaults);
};
it("reads finger direction from a stationary hand, respecting preview mirroring", () => {
 expect(indexDirection(pointing(-Math.PI/2).landmarks,true)).toBe("right");
 expect(indexDirection(pointing(Math.PI/2).landmarks,true)).toBe("left");
 expect(indexDirection(pointing(-Math.PI/2).landmarks,false)).toBe("left");
 expect(indexDirection(pointing().landmarks,true)).toBe("up");
 expect(indexDirection(pointing(Math.PI).landmarks,true)).toBe("front");
});
it("requires two distinct detected hands pointing up, one finger alone cannot select up", () => {
 const n=new GestureNavigator();
 expect(select(n,[pointing()]).selected).toBe("home");
 expect(select(n,[pointing(),pointing(0,"Right")],200).selected).toBe("up");
});
it("selects exact film targets without moving the palm", () => {
 for(const [angle,target] of [[-Math.PI/2,"right"],[Math.PI/2,"left"],[Math.PI,"front"]] as const){
 const n=new GestureNavigator(),r=select(n,[pointing(angle)]);
 expect(r.command).toBe(target);
 const p=roomToMaster(...navigationAngles[target]);
 expect(r.target).toEqual({x:p[0],y:p[1]});
 }
});
it("rejects brief misdetections and conflicting or diagonal pointing",()=>{
 const n=new GestureNavigator();
 n.updateHands([pointing(-Math.PI/2)],0,defaults);
 expect(n.updateHands([pointing(Math.PI/2)],100,defaults).command).toBeNull();
 expect(n.updateHands([pointing(-Math.PI/2)],200,defaults).command).toBeNull();
 expect(select(n,[pointing(-Math.PI/2),pointing(Math.PI/2)],400).selected).toBe("home");
 expect(select(n,[pointing(Math.PI/4)],700).selected).toBe("home");
});
it("held poses trigger once, neutral hand movements cannot move the selected goal",()=>{
 const n=new GestureNavigator();const target=select(n,[pointing(-Math.PI/2)]).target;
 expect(n.updateHands([pointing(-Math.PI/2)],300,defaults).command).toBeNull();
 for(let t=400;t<2000;t+=50){
 const h=pointing();h.landmarks=hand([5,9,13,17]).map(l=>({...l,x:l.x+Math.sin(t)*.1}));
 expect(n.updateHands([h],t,defaults).target).toEqual(target);
 }
});
it("peace selects back, fist selects sweet spot",()=>{
 const n=new GestureNavigator(),h=pointing();
 h.landmarks=hand([5,9]);h.gesture="Victory";h.score=.98;
 expect(select(n,[h]).selected).toBe("back");
 h.landmarks=hand([]);h.gesture="Closed_Fist";
 expect(select(n,[h],300).selected).toBe("home");
});
it("either hand can control, and losing one of two hands retains the goal",()=>{
 const input=new HandInputController(),h=pointing(-Math.PI/2,"Right");
 input.update([h],0,defaults);
 expect(input.update([h],160,defaults).actions.some(a=>a.type==="target")).toBe(true);
 const pair=[pointing(),pointing(0,"Right")];
 input.update(pair,300,defaults);
 const up=input.update(pair,460,defaults);
 expect(up.positionLabel).toContain("Upp");
 expect(input.update([pair[1]],500,defaults).positionLabel).toContain("Upp");
 expect(input.update([],600,defaults).actions).toEqual([{type:"hand-lost"}]);
 expect(input.update([pointing()],700,defaults).actions).toEqual([{type:"hand-lost"}]);
});


it("accepts a stable pointing command within two 30fps intervals, rejects a single frame",()=>{
 const n=new GestureNavigator(),h=pointing(-Math.PI/2);
 expect(n.updateHands([h],0,defaults).command).toBeNull();
 expect(n.updateHands([h],33,defaults).command).toBeNull();
 expect(n.updateHands([h],67,defaults).command).toBe("right");
});
