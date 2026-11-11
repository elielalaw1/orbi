import {it,expect} from 'vitest';
import {voiceCommand,acceptedVoiceCommand} from '../src/gesture/VoiceInput';
import {StateStore} from '../src/app/StateStore';
it('recognizes English routines and rejects partial words and gesture navigation',()=>{
 expect(voiceCommand('Orbi, run!')).toBe('lap');
 expect(voiceCommand('Flirt.')).toBeNull();
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

it('requires a whole command and rejects negations, similar words and extra phrases',()=>{
 for(const text of ['take a lap','do not run','running','please run','do not flirt','stop flirting','please take a lap','take a laptop','flirt with me','take a lap and flirt','Orbi do not flirt','take-a-lap'])expect(voiceCommand(text)).toBeNull();
 expect(voiceCommand('  ORBI, run! ')).toBe('lap');
 expect(voiceCommand('Orbi flirt')).toBeNull();
});
it('rejects low-confidence final matches without guessing from alternatives',()=>{
 expect(acceptedVoiceCommand('run',.79)).toBeNull();
 expect(acceptedVoiceCommand('run',.8)).toBe('lap');
 expect(acceptedVoiceCommand('run',0)).toBe('lap');
 expect(acceptedVoiceCommand('run')).toBe('lap');
 expect(acceptedVoiceCommand('flirting',.99)).toBeNull();
});
