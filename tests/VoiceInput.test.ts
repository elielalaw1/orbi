import {it,expect} from 'vitest';
import {voiceCommand} from '../src/gesture/VoiceInput';
import {StateStore} from '../src/app/StateStore';
it('recognizes English routines and rejects partial words and gesture navigation',()=>{
 expect(voiceCommand('Orbi, take a lap!')).toBe('lap');
 expect(voiceCommand('Flirt.')).toBe('flirt');
 expect(voiceCommand('flirting')).toBeNull();
 expect(voiceCommand('go right')).toBeNull();
});
it('reserves routine control, restores hand control, and allows reset',()=>{
 const store=new StateStore();store.dispatch({type:'routine',value:'flirt'});
 store.time=1500;expect(store.animator.sample(store.time,store.settings).hearts).toBe(1);
 const state=store.animator.spatial.snapshot();store.dispatch({type:'hand-lost'});
 expect(store.animator.spatial.snapshot()).toEqual(state);
 store.time=8100;store.animator.sample(store.time,store.settings);
 store.dispatch({type:'target',value:{x:-.5,y:0}});
 expect(store.animator.spatial.snapshot().target).toEqual([-.5,0]);
 store.dispatch({type:'routine',value:'lap'});store.dispatch({type:'reset'});
 expect(store.animator.routineActive(store.time)).toBe(false);
});
