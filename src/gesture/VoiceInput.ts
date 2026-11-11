import type { Action } from '../app/types';
export function voiceCommand(text:string): 'lap'|'flirt'|null {
 const phrase=text.toLowerCase().replace(/[.,!?;:]/g,' ').replace(/\s+/g,' ').trim();
 if (phrase==='take a lap'||phrase==='orbi take a lap') return 'lap';
 if (phrase==='flirt'||phrase==='orbi flirt') return 'flirt';
 return null;
}
export function acceptedVoiceCommand(text:string,confidence?:number) {
 const command=voiceCommand(text);
 // Some engines provide zero when confidence is unavailable. Exact text is still required.
 if(command&&typeof confidence==='number'&&Number.isFinite(confidence)&&confidence>0&&confidence<.8)return null;
 return command;
}

export function voiceErrorMessage(error:string) {
 if(error==='audio-capture'||error==='NotReadableError'||error==='NotFoundError') return 'Microphone unavailable. Select your built-in microphone in Chrome settings, close other microphone apps, then fully quit and reopen Chrome.';
 if(error==='not-allowed'||error==='NotAllowedError'||error==='service-not-allowed') return 'Microphone blocked. Allow this site in Chrome and Google Chrome in macOS Privacy & Security → Microphone.';
 if(error==='network') return 'Chrome’s speech service is unreachable. Check your connection or try another network, then restart voice.';
 return `Voice error: ${error}. Restart voice to retry.`;
}
export function installVoice(anchor:HTMLElement, dispatch:(a:Action)=>void) {
 const panel=document.createElement('div');panel.className='voice-controls';anchor.after(panel);
 const button=document.createElement('button');button.textContent='Start voice';panel.append(button);
 const test=document.createElement('button');test.textContent='Test microphone';panel.append(test);
 const meter=document.createElement('meter');meter.min=0;meter.max=1;meter.value=0;meter.setAttribute('aria-label','Microphone level');meter.hidden=true;panel.append(meter);
 const status=document.createElement('span');status.setAttribute('role','status');status.textContent='English: “take a lap” or “flirt”';panel.append(status);
 for(const [label,command] of [['Try lap','lap'],['Try flirt','flirt']] as const){const b=document.createElement('button');b.textContent=label;b.onclick=()=>dispatch({type:'routine',value:command});panel.append(b);}
 const Speech=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
 let wanted=false,recognition:any=null,restart:number|undefined,generation=0;
 let stream:MediaStream|null=null,context:AudioContext|null=null,frame=0;
 const releaseMicrophone=()=>{cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());stream=null;void context?.close();context=null;meter.hidden=true;meter.value=0;test.textContent='Test microphone';};
 const stop=()=>{wanted=false;generation++;clearTimeout(restart);recognition?.abort();recognition=null;releaseMicrophone();button.textContent='Start voice';status.textContent='Voice stopped';};
 const capture=async()=>{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Microphone capture is unavailable. Open this page over HTTPS in Chrome.');
  return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
 };
 const startRecognition=()=>{
  if(!wanted)return;
  const current=new Speech();recognition=current;
  current.lang='en-US';current.continuous=true;current.interimResults=true;current.maxAlternatives=1;
  current.onstart=()=>{if(wanted)status.textContent='Listening in English · say “take a lap” or “flirt”';};
  current.onaudiostart=()=>{if(wanted)status.textContent='Microphone connected · speak now';};
  current.onspeechstart=()=>{if(wanted)status.textContent='Speech detected…';};
  current.onresult=(event:any)=>{
   if(!wanted||recognition!==current)return;
   for(let i=event.resultIndex;i<event.results.length;i++){
    const spoken=event.results[i][0].transcript;
    if(!event.results[i].isFinal){status.textContent=`Hearing: ${spoken}`;continue;}
    const command=acceptedVoiceCommand(spoken,event.results[i][0].confidence);
    status.textContent=command?`Heard: ${spoken}`:`Ignored: “${spoken}”. Please say exactly “take a lap” or “flirt” clearly.`;
    if(command)dispatch({type:'routine',value:command});
   }
  };
  current.onerror=(event:any)=>{
   if(!wanted||recognition!==current)return;
   if(event.error==='no-speech'){status.textContent='No speech yet · still listening';return;}
   stop();status.textContent=voiceErrorMessage(event.error);
  };
  current.onend=()=>{if(wanted&&recognition===current)restart=window.setTimeout(startRecognition,500);};
  try{current.start();}catch(error){stop();status.textContent=voiceErrorMessage((error as Error).name);}
 };
 button.onclick=async()=>{
  if(wanted){stop();return;}
  releaseMicrophone();wanted=true;const attempt=++generation;button.textContent='Stop voice';status.textContent='Checking microphone…';
  try{
   // Open and release the selected input first, so stale device routes and permission failures surface before speech starts.
   const input=await capture();input.getTracks().forEach(t=>t.stop());
   if(!wanted||attempt!==generation)return;
   status.textContent='Microphone ready · connecting speech service…';
   restart=window.setTimeout(startRecognition,250);
  }catch(error){if(attempt!==generation)return;stop();status.textContent=voiceErrorMessage((error as Error).name);}
 };
 test.onclick=async()=>{
  if(stream){releaseMicrophone();status.textContent='Microphone test stopped';return;}
  stop();const attempt=generation;status.textContent='Opening microphone test…';
  try{
   const input=await capture();if(attempt!==generation){input.getTracks().forEach(t=>t.stop());return;}
   stream=input;context=new AudioContext();await context.resume();if(attempt!==generation)return;
   const source=context.createMediaStreamSource(input),analyser=context.createAnalyser();analyser.fftSize=512;source.connect(analyser);
   const data=new Uint8Array(analyser.fftSize);meter.hidden=false;test.textContent='Stop microphone test';
   status.textContent=`Testing ${input.getAudioTracks()[0]?.label||'microphone'} · speak and watch the level. Then stop the test and start voice.`;
   const update=()=>{analyser.getByteTimeDomainData(data);meter.value=Math.min(1,Math.sqrt(data.reduce((sum,n)=>sum+((n-128)/128)**2,0)/data.length)*5);frame=requestAnimationFrame(update);};update();
  }catch(error){if(attempt!==generation)return;releaseMicrophone();status.textContent=voiceErrorMessage((error as Error).name);}
 };
 if(!Speech){button.disabled=true;status.textContent='Speech recognition unavailable in this browser. Use Google Chrome. You can still test the microphone and try animations.';}
 return {stop};
}
