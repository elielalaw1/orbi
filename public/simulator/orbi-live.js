/* ORBI live adapter. Official Wisdome simulator remains GPL-3.0.
   Direct same-origin canvas input preserves the original 160-degree master. */
const embedded = new URLSearchParams(location.search).has('embedded');
if (embedded) {
  Object.assign(S, {view:'dome',guide:false,venue:false,frontMark:false,rim:true,haze:false,vfov:160,tilt:26,front:0,cropSize:100,cropX:0,cropY:0,mirror:false,camFov:90});
  setSeat('ref');lookSweet();syncUI();
  document.getElementById('ui').classList.add('hidden');
  document.getElementById('toggle').style.display='none';
  document.getElementById('hud').style.display='none';
  const controls=document.createElement('div');
  controls.className='orbi-simulator-controls';
  controls.innerHTML='<label>Seat <select aria-label="Simulator seat"><option value="ref">Reference seat</option><option value="back">Back row</option><option value="side">Left side</option><option value="right">Right side</option></select></label><button type="button" id="orbi-recenter">Recenter view</button><button type="button" id="orbi-fullscreen" title="Toggle simulator fullscreen (F)">Fullscreen</button><label class="haze"><input type="checkbox" aria-label="Simulate cross-reflection"> Cross-reflection</label><span>Drag to look around · Scroll to zoom</span>';
  document.body.append(controls);
  controls.querySelector('select').onchange=e=>{
    if(e.target.value==='right'){Object.assign(S,{seat:'custom',ex:2.6,ey:1,ez:2.4});syncUI();}else setSeat(e.target.value);
    lookSweet();
  };
  controls.querySelector('input').onchange=e=>{S.haze=e.target.checked;};
  controls.querySelector('#orbi-recenter').onclick=()=>{S.camFov=90;lookSweet();syncUI();};
  const fullscreenButton = controls.querySelector('#orbi-fullscreen');
  fullscreenButton.onclick = fullscreen;
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  });
  const style=document.createElement('style');
  style.textContent='.orbi-simulator-controls{position:fixed;top:10px;left:10px;right:10px;z-index:10;display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:8px 10px;border:1px solid #ffffff20;background:#17241cdd;border-radius:7px;color:#f4f6ee;font:11px system-ui}.orbi-simulator-controls label{display:flex;align-items:center;gap:6px}.orbi-simulator-controls select,.orbi-simulator-controls button{width:auto;margin:0;background:#2d4031;border:1px solid #ffffff26;color:#f4f6ee;border-radius:4px;padding:5px 7px;font:10px system-ui}.orbi-simulator-controls input{width:auto;margin:0;accent-color:#b9d596}.orbi-simulator-controls>span{margin-left:auto;color:#d3dcc9;font-size:9px}.haze{font-size:10px}@media(max-width:600px){.orbi-simulator-controls>span{display:none}}';
  document.head.append(style);
  function connect(){
    try{
      const source=window.parent.document.getElementById('dome');
      if(!(source instanceof window.parent.HTMLCanvasElement)){setTimeout(connect,100);return;}
      stopSource();src={el:source,kind:'canvas',name:'ORBI live dome master',w:source.width,h:source.height};
      window.__orbiLive={connected:true,projection:'160-degree fisheye',input:'actual ORBI canvas'};
    }catch(error){controls.querySelector('span').textContent='Live source unavailable. Reload the studio.';}
  }
  connect();
  window.addEventListener('keydown',e=>{
    if (e.key.toLowerCase() === 'f' && !e.target.matches('input,select,textarea')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) fullscreen();
      return;
    }
    if(e.target.matches('input,select,button'))return;
    if(['1','2','3','4','5','6','ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','g','G','r','R','d','D','c','C','v','V','q','Q','e','E','0'].includes(e.key)){
      e.preventDefault();e.stopImmediatePropagation();window.parent.postMessage({type:'orbi-key',key:e.key,code:e.code,repeat:e.repeat,shiftKey:e.shiftKey},location.origin);
    }
  },true);
}
