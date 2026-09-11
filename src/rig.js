// ===== Shared rig for Cutout Studio + game =====
const R = {
  root:   {parent:null,    px:120, py:205, tip:[0,0],   move:true},
  torso:  {parent:'root',  px:0,   py:0,   tip:[0,-26]},
  head:   {parent:'torso', px:0,   py:-58, tip:[0,10]},
  top:    {parent:'head',  px:0,   py:0,   tip:null},
  lIris:  {parent:'top',   px:-9,  py:-28, tip:[0,0],   move:true, small:true},
  rIris:  {parent:'top',   px:9,   py:-28, tip:[0,0],   move:true, small:true},
  hat:    {parent:'top',   px:0,   py:-60, tip:[0,-12], move:true},
  lUpper: {parent:'torso', px:-30, py:-40, tip:[0,34]},
  lLower: {parent:'lUpper',px:0,   py:34,  tip:[0,30]},
  lHand:  {parent:'lLower',px:0,   py:30,  tip:[0,14]},
  rUpper: {parent:'torso', px:30,  py:-40, tip:[0,34]},
  rLower: {parent:'rUpper',px:0,   py:34,  tip:[0,30]},
  rHand:  {parent:'rLower',px:0,   py:30,  tip:[0,14]},
  lThigh: {parent:'torso', px:-14, py:8,   tip:[0,22]},
  lShin:  {parent:'lThigh',px:0,   py:22,  tip:[0,20]},
  lFoot:  {parent:'lShin', px:0,   py:20,  tip:[-14,6]},
  rThigh: {parent:'torso', px:14,  py:8,   tip:[0,22]},
  rShin:  {parent:'rThigh',px:0,   py:22,  tip:[0,20]},
  rFoot:  {parent:'rShin', px:0,   py:20,  tip:[14,6]},
};
const ORDER=['root','torso','lThigh','lShin','lFoot','rThigh','rShin','rFoot','lUpper','lLower','lHand','rUpper','rLower','rHand','head','top','lIris','rIris','hat'];
const PRETTY={root:'Body position',torso:'Torso',head:'Head',top:'Head top',lIris:'Left eye',rIris:'Right eye',hat:'Hat',
  lUpper:'Left arm',lLower:'Left elbow',lHand:'Left hand',rUpper:'Right arm',rLower:'Right elbow',rHand:'Right hand',
  lThigh:'Left hip',lShin:'Left knee',lFoot:'Left foot',rThigh:'Right hip',rShin:'Right knee',rFoot:'Right foot'};
const MOUTH=[[0,0,0],[0,-10,0],[0,-10,-12],[0,-10,12],[0,-26,0]];
const DEFAULT={lUpper:{r:-20},rUpper:{r:20},lLower:{r:-10},rLower:{r:10}};
const clone=o=>JSON.parse(JSON.stringify(o));
function blankPose(){const p={mouth:0,eyes:0};for(const k in R)p[k]={x:0,y:0,r:0};return p;}
function defaultPose(){const p=blankPose();for(const k in DEFAULT)Object.assign(p[k],DEFAULT[k]);return p;}
// pose(over): default pose with overrides, e.g. pose({rUpper:{r:-150},mouth:2})
function pose(over={}){const p=defaultPose();for(const k in over){if(typeof over[k]==='object')Object.assign(p[k],over[k]);else p[k]=over[k];}return p;}

const NS='http://www.w3.org/2000/svg';
const el=(t,a={})=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;};
const OUT={stroke:'#2b2622','stroke-width':2.5,'stroke-linejoin':'round'};
const limb=(w,h,fill)=>g=>g.append(el('rect',{x:-w/2,y:-4,width:w,height:h+4,rx:w/2,fill,...OUT}));
let clipN=0;
const SHAPES={
  torso:g=>g.append(el('rect',{x:-32,y:-48,width:64,height:60,rx:14,fill:'#c8322b',...OUT})),
  lUpper:limb(16,36,'#c8322b'),rUpper:limb(16,36,'#c8322b'),lLower:limb(14,32,'#c8322b'),rLower:limb(14,32,'#c8322b'),
  lHand:g=>g.append(el('circle',{cx:0,cy:6,r:9,fill:'#f2c9a0',...OUT})),rHand:g=>g.append(el('circle',{cx:0,cy:6,r:9,fill:'#f2c9a0',...OUT})),
  lThigh:limb(18,24,'#2f3e6b'),rThigh:limb(18,24,'#2f3e6b'),lShin:limb(16,22,'#2f3e6b'),rShin:limb(16,22,'#2f3e6b'),
  lFoot:g=>g.append(el('rect',{x:-20,y:-2,width:30,height:12,rx:5,fill:'#2b2622',...OUT})),
  rFoot:g=>g.append(el('rect',{x:-10,y:-2,width:30,height:12,rx:5,fill:'#2b2622',...OUT})),
  head(g){const id='clipBot'+(clipN++);const cp=el('clipPath',{id});cp.append(el('rect',{x:-60,y:-16,width:120,height:70}));g.append(cp);
    const b=el('g',{'clip-path':`url(#${id})`});b.append(el('ellipse',{cx:0,cy:-22,rx:46,ry:44,fill:'#f2c9a0',...OUT}));g.append(b);
    g.append(el('rect',{x:-24,y:-19,width:48,height:6,rx:3,fill:'#2b2622'}));},
  top(g){const id='clipTop'+(clipN++);const cp=el('clipPath',{id});cp.append(el('rect',{x:-60,y:-90,width:120,height:74}));g.append(cp);
    const t=el('g',{'clip-path':`url(#${id})`});
    t.append(el('ellipse',{cx:0,cy:-22,rx:46,ry:44,fill:'#f2c9a0',...OUT}));
    t.append(el('path',{d:'M-46,-28 Q-40,-64 0,-66 Q40,-64 46,-28 Q30,-54 0,-52 Q-30,-54 -46,-28 Z',fill:'#5a3a1e',...OUT}));
    g.append(t);
    for(const s of[-1,1])g.append(el('ellipse',{cx:s*12,cy:-30,rx:9,ry:11,fill:'#fff',...OUT}));},
  lIris:g=>g.append(el('circle',{cx:0,cy:0,r:2.8,fill:'#2b2622'})),
  rIris:g=>g.append(el('circle',{cx:0,cy:0,r:2.8,fill:'#2b2622'})),
  hat(g){g.append(el('path',{d:'M-30,8 Q-30,-14 0,-16 Q30,-14 30,8 Z',fill:'#2f7d3a',...OUT}));
    g.append(el('rect',{x:-32,y:2,width:64,height:12,rx:5,fill:'#e0d7c2',...OUT}));
    g.append(el('circle',{cx:0,cy:-15,r:5,fill:'#c8322b',...OUT}));},
  root(){}
};
function buildRig(container){
  const groups={};
  for(const id of ORDER){const g=el('g',{class:'j_'+id});SHAPES[id]&&SHAPES[id](g);groups[id]=g;(R[id].parent?groups[R[id].parent]:container).append(g);}
  // eyelids drawn on top of irises
  const lids=el('g',{class:'lids'});
  for(const s of[-1,1])lids.append(el('ellipse',{cx:s*12,cy:-30,rx:9,ry:11,fill:'#f2c9a0',...OUT}));
  groups.top.insertBefore(lids,groups.hat);groups.lids=lids;
  return groups;
}
function applyPose(groups,pose){
  for(const id of ORDER){const j=R[id];let p=pose[id]||{x:0,y:0,r:0};
    if(id==='top'){const m=MOUTH[pose.mouth||0];p={x:m[0],y:m[1],r:m[2]};}
    groups[id].setAttribute('transform',`translate(${j.px+p.x},${j.py+p.y}) rotate(${p.r})`);}
  groups.lids.style.display=pose.eyes?'':'none';
}
function createDoll(container){const groups=buildRig(container);const d={groups,pose:defaultPose(),apply(){applyPose(groups,d.pose);},set(p){d.pose=clone(p);d.apply();}};d.apply();return d;}

// ===== Phrases (shared by game and the voice build script) =====
const PHRASES={
  praise:{'nl-NL':['Ja! Goed zo!','Super!','Hoera!','Jippie!','Knap hoor!'],'en-GB':['Yes! Well done!','Super!','Hooray!'],'de-DE':['Ja! Super!','Toll!','Hurra!']},
  oops:{'nl-NL':['Hmm, nee.','Oeps!','Nog een keer!'],'en-GB':['Hmm, no.','Oops!','Try again!'],'de-DE':['Hmm, nein.','Hoppla!','Nochmal!']},
  numbers:{'nl-NL':['één','twee','drie','vier','vijf'],'en-GB':['one','two','three','four','five'],'de-DE':['eins','zwei','drei','vier','fünf']},
  letters:[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
};
if(typeof module!=='undefined')module.exports={PHRASES};

// ===== Sound effects (synthesised; swap for mp3s later if you like) =====
const SFX=(()=>{
  let ctx;const ac=()=>{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx;};
  function sweep(type,f0,f1,dur,vol=0.3,at=0){const c=ac(),t=c.currentTime+at;const o=c.createOscillator(),g=c.createGain();o.type=type;
    o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur);}
  function burst(dur,ftype,freq,vol=0.5,at=0){const c=ac(),t=c.currentTime+at;const n=c.createBufferSource();const b=c.createBuffer(1,c.sampleRate*dur,c.sampleRate);
    const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;const f=c.createBiquadFilter();f.type=ftype;f.frequency.value=freq;
    const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);n.connect(f).connect(g).connect(c.destination);n.start(t);}
  function fart(big){const c=ac(),t=c.currentTime,d=big?1.1:0.45;const o=c.createOscillator();o.type='sawtooth';
    o.frequency.setValueAtTime(big?60:85,t);o.frequency.exponentialRampToValueAtTime(big?38:55,t+d);
    const lfo=c.createOscillator();lfo.frequency.value=big?9:14;const lg=c.createGain();lg.gain.value=big?28:18;lfo.connect(lg).connect(o.frequency);
    const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=c.createGain();g.gain.setValueAtTime(0.001,t);
    g.gain.exponentialRampToValueAtTime(0.7,t+0.03);g.gain.exponentialRampToValueAtTime(0.001,t+d);
    o.connect(f).connect(g).connect(c.destination);o.start(t);lfo.start(t);o.stop(t+d);lfo.stop(t+d);}
  const S={
    fart:()=>fart(false), bigfart:()=>fart(true),
    boing:()=>sweep('sine',180,720,0.28,0.35),
    slip:()=>sweep('sawtooth',900,180,0.3,0.15),
    thud:()=>{burst(0.25,'lowpass',180,0.9);sweep('sine',90,38,0.25,0.5);},
    whistle:()=>sweep('sine',1500,450,0.85,0.2),
    splat:()=>{burst(0.2,'bandpass',700,0.8);sweep('square',320,70,0.16,0.15);},
    sneeze:()=>{burst(0.14,'bandpass',1800,0.25);burst(0.35,'lowpass',1600,0.9,0.18);sweep('sawtooth',650,140,0.3,0.15,0.18);},
    ding:()=>{sweep('sine',880,880,0.16,0.25);sweep('sine',1320,1320,0.28,0.25,0.15);},
    pop:()=>sweep('sine',300,900,0.07,0.3),
    spin:()=>sweep('triangle',350,1500,0.5,0.2),
  };
  const files={};let base='sounds/';
  const baked=()=>(window.ASSETS&&window.ASSETS.sounds)||{};
  function play(n){if(!S[n])return;if(files[n]===undefined&&baked()[n]){files[n]=new Audio(baked()[n]);}const f=files[n];
    if(f===false){try{S[n]();}catch(e){}return;}
    if(f){const a=f.cloneNode();a.volume=1;a.play().catch(()=>{});return;}
    const a=new Audio(base+n+'.mp3');files[n]=undefined;
    a.addEventListener('canplaythrough',()=>{files[n]=a;a.play().catch(()=>{});},{once:true});
    a.addEventListener('error',()=>{files[n]=false;try{S[n]();}catch(e){}},{once:true});
    a.load();}
  return {names:Object.keys(S),play,unlock:ac,setBase(b){base=b;for(const k in files)delete files[k];}};
})();

// ===== Player =====
function makePlayer(doll){
  let timer=null,onDone=null;
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function play(anim,{loop=false,step=true,done}={}){stop();if(!anim||!anim.frames.length){done&&done();return;}
    const fr=anim.frames,fps=anim.fps||8;let i=0,sub=0;onDone=done;
    const tick=()=>{const k=fr[i],n=fr[(i+1)%fr.length];
      if(sub===0&&k.sound)SFX.play(k.sound);
      doll.set(step?k.pose:lerpPose(k.pose,n.pose,sub/k.hold));
      if(++sub>=k.hold){sub=0;i++;if(i>=fr.length){if(loop)i=0;else{stop();onDone&&onDone();}}}};
    tick();timer=setInterval(tick,1000/fps);}
  return {play,stop,playing:()=>!!timer};
}
function lerpPose(a,b,t){const p={mouth:t<.5?a.mouth:b.mouth,eyes:t<.5?a.eyes:b.eyes};for(const k in R)p[k]={x:a[k].x+(b[k].x-a[k].x)*t,y:a[k].y+(b[k].y-a[k].y)*t,r:a[k].r+(b[k].r-a[k].r)*t};return p;}

// ===== Speech-driven mouth =====
function mouthForChar(c){if(c==='!')return 4;const up=c!==c.toLowerCase();c=c.toLowerCase();if(!/[a-z]/.test(c))return 0;
  if('aeiouy'.includes(c))return up?4:1+(c.charCodeAt(0)%3);return 'mbpfv'.includes(c)?0:1;}
const VOICE={cfg:{key:'',voiceId:'',rate:1.05,base:'voice/'},cache:{}};
function slug(s){return s.toLowerCase().replace(/[^a-z0-9éèëïöü]+/g,'_').replace(/^_|_$/g,'');}
async function voiceUrl(text,lang){const k=lang+':'+text;if(VOICE.cache[k]!==undefined)return VOICE.cache[k];
  let url=null;
  if(window.ASSETS&&window.ASSETS.voice&&window.ASSETS.voice[k])url=window.ASSETS.voice[k];
  if(!url)try{const st=localStorage.getItem('v:'+k);if(st)url=st;}catch(e){}
  if(!url&&VOICE.cfg.key&&VOICE.cfg.voiceId){try{
    const res=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+VOICE.cfg.voiceId+'?output_format=mp3_22050_32',{method:'POST',
      headers:{'xi-api-key':VOICE.cfg.key,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.35,similarity_boost:0.7,style:0.6}})});
    if(res.ok){const b=await res.blob();url=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b);});try{localStorage.setItem('v:'+k,url);}catch(e){}}
  }catch(e){}}
  if(!url){const a=new Audio(VOICE.cfg.base+lang.slice(0,2)+'/'+slug(text)+'.mp3');
    url=await new Promise(r=>{a.addEventListener('canplaythrough',()=>r(a.src),{once:true});a.addEventListener('error',()=>r(null),{once:true});a.load();});}
  VOICE.cache[k]=url;return url;}
function speak(text,doll,{lang='nl-NL',done}={}){
  const chars=[...text];let i=0,ended=false,mouthT;
  const startMouth=()=>{mouthT=setInterval(()=>{doll.pose.mouth=i<chars.length?mouthForChar(chars[i++]):0;doll.apply();},95/VOICE.cfg.rate);};
  const finish=()=>{if(ended)return;ended=true;clearInterval(mouthT);doll.pose.mouth=0;doll.apply();done&&done();};
  voiceUrl(text,lang).then(url=>{
    if(url){const a=new Audio(url);a.preservesPitch=false;a.mozPreservesPitch=false;a.playbackRate=VOICE.cfg.rate;a.onended=finish;a.onerror=finish;
      a.play().then(startMouth).catch(finish);setTimeout(finish,chars.length*200+3000);return;}
    if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=0.95;u.pitch=1.8;u.onend=finish;u.onerror=finish;
      speechSynthesis.cancel();speechSynthesis.speak(u);startMouth();setTimeout(finish,chars.length*150+1500);}
    else{startMouth();setTimeout(finish,chars.length*95+200);}
  });
}

// ===== Default animation library =====
function makeDefaultLib(){
  const F=(hold,over,sound)=>({hold,sound:sound||'',pose:pose(over)});
  const A=(fps,frames)=>({fps,frames});
  const base={};
  const armsUp={lUpper:{r:-160},rUpper:{r:160},lLower:{r:0},rLower:{r:0}};
  const crouch={root:{y:6},lThigh:{r:20},rThigh:{r:-20},lShin:{r:-35},rShin:{r:35},torso:{r:0}};
  const flat=(dir)=>({torso:{r:88*dir},root:{y:40,x:10*dir}});
  return {
    idle_breathe:A(4,[F(6,base),F(5,{torso:{y:1},head:{y:-1,r:1}}),F(4,base),F(1,{eyes:1}),F(2,base)]),
    idle_scratch:A(6,[F(2,{rUpper:{r:150},rLower:{r:40},head:{r:-6},torso:{r:-3}}),F(2,{rUpper:{r:150},rLower:{r:60},head:{r:-6},torso:{r:-3}}),
      F(2,{rUpper:{r:150},rLower:{r:40},head:{r:-6},torso:{r:-3}}),F(2,{rUpper:{r:150},rLower:{r:60},head:{r:-6},torso:{r:-3},eyes:1}),F(3,base)]),
    idle_fart:A(6,[F(3,{torso:{r:8},head:{r:8},eyes:1}),F(1,{torso:{r:8},head:{r:8},eyes:1,root:{y:-6},mouth:1},'fart'),F(2,{torso:{r:8},head:{r:8},eyes:1,mouth:1}),
      F(4,{head:{r:28},mouth:2,lIris:{x:3},rIris:{x:3}}),F(2,{head:{r:-6},mouth:0}),F(2,base)]),
    idle_eye_drift:A(3,[F(3,base),F(3,{lIris:{x:-2}}),F(3,{lIris:{x:-4}}),F(3,{lIris:{x:-6,y:1}}),F(3,{lIris:{x:-8,y:2}}),F(3,{lIris:{x:-9,y:3}}),F(1,{lIris:{x:-9,y:3},eyes:1}),F(2,base)]),
    mild_sigh:A(4,[F(3,{torso:{y:-2},head:{y:-2},mouth:1}),F(4,{torso:{r:4,y:2},head:{r:8},lUpper:{r:-10},rUpper:{r:10},mouth:0,eyes:1}),F(2,base)]),
    speak_point:A(8,[F(3,{rUpper:{r:-100},rLower:{r:-20},head:{r:-5},mouth:1}),F(2,{rUpper:{r:-100},rLower:{r:-20},head:{r:-5},mouth:2}),
      F(2,{rUpper:{r:-100},rLower:{r:-20},head:{r:-5},mouth:3}),F(2,{rUpper:{r:-100},rLower:{r:-20},head:{r:-5},mouth:0})]),
    cheer_jump:A(8,[F(2,{...crouch,lUpper:{r:-40},rUpper:{r:40}}),F(3,{root:{y:-55},...armsUp,mouth:4},'boing'),F(2,{root:{y:-25},...armsUp,mouth:1}),
      F(1,crouch,'thud'),F(2,base)]),
    cheer_dance:A(8,[F(2,{torso:{r:-8},root:{y:-4},lUpper:{r:-120},rUpper:{r:60},head:{r:-8},mouth:2},'ding'),F(2,{torso:{r:8},root:{y:-4},lUpper:{r:-60},rUpper:{r:120},head:{r:8},mouth:3}),
      F(2,{torso:{r:-8},root:{y:-4},lUpper:{r:-120},rUpper:{r:60},head:{r:-8},mouth:2}),F(2,{torso:{r:8},root:{y:-4},lUpper:{r:-60},rUpper:{r:120},head:{r:8},mouth:3}),
      F(2,{torso:{r:-8},root:{y:-4},lUpper:{r:-120},rUpper:{r:60},head:{r:-8},mouth:2}),F(2,{torso:{r:8},root:{y:-4},lUpper:{r:-60},rUpper:{r:120},head:{r:8},mouth:3}),F(2,base)]),
    slap_fart_launch:A(8,[F(3,{...crouch,eyes:1,torso:{r:6},head:{r:6}}),F(2,{root:{y:-30},...armsUp,mouth:4,lThigh:{r:30},rThigh:{r:-30}},'bigfart'),
      F(2,{root:{y:-75},...armsUp,mouth:4,torso:{r:15},lThigh:{r:-30},rThigh:{r:30}}),F(2,{root:{y:-95},...armsUp,mouth:4,torso:{r:-15},lThigh:{r:30},rThigh:{r:-30},hat:{y:-20,r:30}}),
      F(2,{root:{y:-60},...armsUp,mouth:1,torso:{r:10},hat:{y:-40,r:60}}),F(2,{root:{y:-20},mouth:1,eyes:1,hat:{y:-20,r:30}}),F(2,{...crouch,eyes:1},'thud'),F(3,base)]),
    slap_headspin:A(8,[F(1,{head:{r:0},mouth:4},'spin'),F(1,{head:{r:90},mouth:4}),F(1,{head:{r:180},mouth:4}),F(1,{head:{r:-90},mouth:4}),F(1,{head:{r:0},mouth:4}),
      F(1,{head:{r:90},mouth:4}),F(1,{head:{r:180},mouth:4}),F(1,{head:{r:-90},mouth:4}),F(2,{head:{r:10},mouth:1,lIris:{x:-4},rIris:{x:4}}),F(2,base)]),
    slap_faceplant:A(8,[F(2,{torso:{r:15},head:{r:10},mouth:1}),F(1,{torso:{r:45},root:{y:10},lUpper:{r:-90},rUpper:{r:-90},mouth:4}),
      F(4,{...flat(1),lUpper:{r:-90},rUpper:{r:-90},lThigh:{r:-10},rThigh:{r:10},mouth:4,eyes:1},'thud'),
      F(3,{torso:{r:25},root:{y:25},head:{r:-15},mouth:1,lIris:{x:-5},rIris:{x:5},lThigh:{r:-60},rThigh:{r:-60},lShin:{r:70},rShin:{r:70}}),
      F(3,{torso:{r:25},root:{y:25},head:{r:15},mouth:1,lIris:{x:5,y:3},rIris:{x:-5},lThigh:{r:-60},rThigh:{r:-60},lShin:{r:70},rShin:{r:70}}),F(2,base)]),
    slap_slip:A(8,[F(1,{lThigh:{r:-70},rThigh:{r:-90},torso:{r:-20},root:{y:-10},...armsUp,mouth:4},'slip'),
      F(4,{...flat(-1),lThigh:{r:20},rThigh:{r:-20},mouth:4},'thud'),F(3,{...flat(-1),lThigh:{r:20},rThigh:{r:-20},mouth:0,eyes:1}),
      F(2,{torso:{r:-30},root:{y:20},mouth:1,lIris:{x:6}}),F(2,base)]),
    slap_hat:A(8,[F(1,{hat:{y:-20,r:20},head:{r:-5},mouth:1},'slip'),F(1,{hat:{y:-55,x:25,r:90},head:{r:-15},mouth:2,lIris:{y:-3},rIris:{y:-3}}),
      F(3,{hat:{y:-90,x:55,r:180},head:{r:-25},mouth:4,lIris:{y:-3},rIris:{y:-3}}),F(2,{hat:{y:-40,x:55,r:180},head:{r:-15},mouth:1}),
      F(2,{hat:{y:0,x:0,r:0},head:{r:5},mouth:0,eyes:1},'pop'),F(2,base)]),
    slap_sneeze:A(8,[F(3,{head:{r:-20},torso:{r:-8},mouth:1,eyes:1}),F(2,{head:{r:-32},torso:{r:-12},mouth:2,eyes:1}),
      F(1,{head:{r:35},torso:{r:22},mouth:4,hat:{y:-30,r:40}},'sneeze'),F(2,{head:{r:25},torso:{r:15},mouth:4,hat:{y:-60,x:40,r:120}}),
      F(3,{head:{r:5},mouth:0,eyes:0,lIris:{x:-4},rIris:{x:4}}),F(2,base)]),
    bonus_poop:A(8,[F(3,{head:{r:-12},mouth:1,lIris:{y:-3},rIris:{y:-3}},'whistle'),F(3,{head:{r:-12},mouth:2,lIris:{y:-3},rIris:{y:-3}}),
      F(3,{head:{r:0},mouth:4,eyes:1},'splat'),F(3,{head:{r:10},mouth:0,eyes:1}),F(3,{head:{r:10},mouth:1,lIris:{x:-6},rIris:{x:6}}),F(2,base)]),
    slap_bigfart:A(8,[F(3,{...crouch,eyes:1,torso:{r:6}}),F(2,{root:{y:-40},...armsUp,mouth:4,lThigh:{r:30},rThigh:{r:-30}},'bigfart'),
      F(2,{root:{y:-90},...armsUp,mouth:4,torso:{r:40},hat:{y:-30,r:60}}),F(2,{root:{y:-60},...armsUp,mouth:4,torso:{r:70},hat:{y:-60,x:40,r:120}}),
      F(4,{...flat(1),lUpper:{r:-90},rUpper:{r:-90},mouth:4,eyes:1,hat:{y:-40,x:60,r:180}},'thud'),F(3,{torso:{r:25},root:{y:25},head:{r:-15},mouth:1,lIris:{x:-5},rIris:{x:5},lThigh:{r:-60},rThigh:{r:-60},lShin:{r:70},rShin:{r:70}}),F(2,base)]),
    mild_shrug:A(6,[F(3,{lUpper:{r:-70},rUpper:{r:70},lLower:{r:-60},rLower:{r:60},head:{r:8},mouth:1,torso:{y:-2}}),F(3,{lUpper:{r:-70},rUpper:{r:70},lLower:{r:-60},rLower:{r:60},head:{r:-8},mouth:0,torso:{y:-2}}),F(2,base)]),
    mild_confused:A(5,[F(3,{head:{r:-12},lIris:{x:-3},rIris:{x:5},mouth:1}),F(3,{head:{r:12},lIris:{x:4},rIris:{x:-4},mouth:2}),F(2,{head:{r:0},eyes:1}),F(2,base)]),
    mild_scratch_head:A(6,[F(3,{rUpper:{r:-160},rLower:{r:-50},head:{r:-6},mouth:1}),F(2,{rUpper:{r:-160},rLower:{r:-70},head:{r:-6},mouth:1}),F(2,{rUpper:{r:-160},rLower:{r:-50},head:{r:-6},mouth:0}),F(2,base)]),
    count_hop:A(8,[F(1,crouch),F(2,{root:{y:-35},rUpper:{r:-170},rLower:{r:0},mouth:1},'boing'),F(1,{root:{y:-10},rUpper:{r:-170},rLower:{r:0}}),F(1,{...crouch,rUpper:{r:-170},rLower:{r:0}})]),
  };
}
