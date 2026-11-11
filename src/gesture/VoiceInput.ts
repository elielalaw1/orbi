import type { Action } from '../app/types';
export function voiceCommand(text:string): 'lap'|'flirt'|null {
 const phrase=text.toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
 if (/\btake a lap\b/.test(phrase)) return 'lap';
 if (/\bflirt\b/.test(phrase)) return 'flirt';
 return null;
}
export function installVoice(anchor:HTMLElement, dispatch:(a:Action)=>void) {
 const button=document.createElement('button'); button.textContent='Start voice';
 button.title='English commands: take a lap, flirt. Speech recognition may use your browser’s online speech service.';
 anchor.after(button);
 const status=document.createElement('span');status.setAttribute('role','status');button.after(status);
 const Speech=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
 let wanted=false, restart:number|undefined;
 if(!Speech){button.disabled=true;status.textContent='Voice unavailable. Open in Chrome.';return {stop:()=>{}};}
 const recognition=new Speech();recognition.lang='en-US';recognition.continuous=true;recognition.interimResults=false;
 const stop=()=>{wanted=false;clearTimeout(restart);recognition.abort();button.textContent='Start voice';status.textContent='Voice stopped';};
 recognition.onstart=()=>{status.textContent='Listening · “take a lap” · “flirt”';};
 recognition.onresult=(event:any)=>{
  for(let i=event.resultIndex;i<event.results.length;i++){
   if(!event.results[i].isFinal)continue;
   const spoken=event.results[i][0].transcript, command=voiceCommand(spoken);
   status.textContent=command?`Heard: ${spoken}`:`Heard: ${spoken}. Say “take a lap” or “flirt”.`;
   if(command)dispatch({type:'routine',value:command});
  }
 };
 recognition.onerror=(event:any)=>{
  if(event.error==='no-speech'){status.textContent='Still listening. Say “take a lap” or “flirt”.';return;}
  stop();status.textContent=event.error==='network'?'Speech service unavailable. Check your connection and restart voice.':event.error==='not-allowed'?'Microphone blocked. Allow microphone access in Chrome’s site settings.':`Voice error: ${event.error}. Restart voice to retry.`;
 };
 recognition.onend=()=>{if(wanted)restart=window.setTimeout(()=>{if(wanted)try{recognition.start();}catch{stop();}},400);};
 button.onclick=()=>{
  if(wanted){stop();return;}
  wanted=true;button.textContent='Stop voice';status.textContent='Starting microphone…';
  try{recognition.start();}catch{stop();status.textContent='Unable to start microphone. Check permissions.';}
 };
 return {stop};
}
