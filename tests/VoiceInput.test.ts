import {it,expect} from 'vitest';
import {voiceCommand,acceptedVoiceCommand} from '../src/gesture/VoiceInput';
import {StateStore} from '../src/app/StateStore';
it('recognizes English routines and rejects partial words and gesture navigation',()=>{
 expect(voiceCommand('Orbi, run!')).toBe('lap');
 expect(voiceCommand('Flirt.')).toBe('flirt');
 expect(voiceCommand('flirting')).toBe('flirt');
 expect(voiceCommand('go right')).toBeNull();
});
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

it('requires a whole command and rejects negations, similar words and extra phrases',()=>{
 for(const text of ['do not run','do not flirt','stop flirting','take a laptop','take a lap and flirt','Orbi do not flirt','take-a-lap'])expect(voiceCommand(text)).toBeNull();
 expect(voiceCommand('  ORBI, run! ')).toBe('lap');
 expect(voiceCommand('Orbi flirt')).toBe('flirt');
});
it('rejects low-confidence final matches without guessing from alternatives',()=>{
 expect(acceptedVoiceCommand('run',.49)).toBeNull();
 expect(acceptedVoiceCommand('run',.8)).toBe('lap');
 expect(acceptedVoiceCommand('run',0)).toBe('lap');
 expect(acceptedVoiceCommand('run')).toBe('lap');
 expect(acceptedVoiceCommand('flirting',.65)).toBe('flirt');
});

it('accepts close English variants and polite requests',()=>{
 for(const phrase of ['running','ron','rum','ran','please run','Orbi take a lap']) expect(voiceCommand(phrase)).toBe('lap');
 for(const phrase of ['flert','flurt','flirting','please flirt','flirt with me']) expect(voiceCommand(phrase)).toBe('flirt');
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
