import {it,expect} from 'vitest';
import {StateStore} from '../src/app/StateStore';
it('reserves routine control, restores hand control, and allows reset',()=>{
 const store=new StateStore();store.dispatch({type:'routine',value:'flirt'});
 store.time=1500;expect(store.animator.sample(store.time,store.settings).hearts).toBeGreaterThan(.9);
 const state=store.animator.spatial.snapshot();store.dispatch({type:'hand-lost'});
 expect(store.animator.spatial.snapshot()).toEqual(state);
 store.time=8100;store.animator.sample(store.time,store.settings);
 store.dispatch({type:'target',value:{x:-.5,y:0}});
 expect(store.animator.spatial.snapshot().target).toEqual([-.5,0]);
 store.dispatch({type:'routine',value:'lap'});store.dispatch({type:'reset'});
 expect(store.animator.routineActive(store.time)).toBe(false);
});

it('blows exactly two kisses during one flirt routine',()=>{
 const store=new StateStore();
 store.dispatch({type:'routine',value:'flirt'});
 let kissing=false, kisses=0;
 for(let time=0;time<8000;time+=20){
  const active=store.animator.sample(time,store.settings).kiss>.7;
  if(active&&!kissing)kisses++;
  kissing=active;
 }
 expect(kisses).toBe(2);
});
