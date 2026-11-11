import {it,expect,vi,afterEach} from 'vitest';
import {installVoice} from '../src/gesture/VoiceInput';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
function setup(){
 const elements:any[]=[];
 vi.stubGlobal('document',{createElement:(tag:string)=>{const e:any={tag,textContent:'',children:[],append(...v:any[]){this.children.push(...v);},setAttribute:vi.fn()};elements.push(e);return e;}});
 const recognizers:any[]=[];
 class Speech{start=vi.fn();abort=vi.fn();constructor(){recognizers.push(this);}}
 vi.stubGlobal('window',{SpeechRecognition:Speech,setTimeout});
 const track={stop:vi.fn()};const getUserMedia=vi.fn().mockResolvedValue({getTracks:()=>[track]});
 vi.stubGlobal('navigator',{mediaDevices:{getUserMedia}});
 vi.stubGlobal('cancelAnimationFrame',vi.fn());
 const dispatch=vi.fn();const voice=installVoice({after:vi.fn()} as any,dispatch);
 return {elements,recognizers,track,getUserMedia,dispatch,voice};
}
it('releases microphone preflight before recognition and dispatches only final English commands',async()=>{
 vi.useFakeTimers();const s=setup();const button=s.elements[1];
 await button.onclick();expect(s.track.stop).toHaveBeenCalledOnce();expect(s.recognizers).toHaveLength(0);
 await vi.advanceTimersByTimeAsync(250);const r=s.recognizers[0];expect(r.lang).toBe('en-US');
 const interim:any=[{transcript:'take a lap'}];interim.isFinal=false;r.onresult({resultIndex:0,results:[interim]});expect(s.dispatch).not.toHaveBeenCalled();
 interim.isFinal=true;r.onresult({resultIndex:0,results:[interim]});expect(s.dispatch).toHaveBeenCalledWith({type:'routine',value:'lap'});
 r.onerror({error:'no-speech'});r.onend();await vi.advanceTimersByTimeAsync(500);expect(s.recognizers).toHaveLength(2);
 s.voice.stop();s.recognizers[1].onend();await vi.advanceTimersByTimeAsync(1000);expect(s.recognizers).toHaveLength(2);
});
it('shows capture failures and never starts recognition when the microphone cannot open',async()=>{
 vi.useFakeTimers();const s=setup();s.getUserMedia.mockRejectedValue(Object.assign(new Error(),{name:'NotReadableError'}));
 await s.elements[1].onclick();await vi.runAllTimersAsync();expect(s.recognizers).toHaveLength(0);
 expect(s.elements[4].textContent).toContain('Microphone unavailable');expect(s.elements[1].textContent).toBe('Start voice');
});
it('cancels pending microphone startup when voice is stopped',async()=>{
 vi.useFakeTimers();const s=setup();let resolve:any;s.getUserMedia.mockReturnValue(new Promise(r=>resolve=r));
 const pending=s.elements[1].onclick();s.voice.stop();resolve({getTracks:()=>[s.track]});await pending;
 await vi.runAllTimersAsync();expect(s.track.stop).toHaveBeenCalled();expect(s.recognizers).toHaveLength(0);
});
