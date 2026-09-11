// Sanity checks on the default animation library, no browser needed. Run: node tools/check-lib.js
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','src','rig.js'),'utf8');
const {SFX,PROPS,lib}=new Function('module',src+'\n;return {SFX,PROPS,lib:makeDefaultLib()};')({});
const fail=[];const ok=(c,m)=>{if(!c)fail.push(m);};
ok(!lib.slap_party,'slap_party should be gone (renamed to dance_party)');
ok(lib.dance_party,'dance_party missing');
if(lib.dance_party){const d=lib.dance_party;
  ok(d.frames.length===80,'dance_party should have 80 frames, has '+d.frames.length);
  ok(d.music==='party','dance_party.music should be "party"');
  ok(JSON.stringify(d.props)==='["flagL","flagR","partyHat"]','dance_party props should be flagL, flagR, partyHat');
  const horns=d.frames.filter(f=>f.sound==='horn').length;ok(horns>=5,'expected at least 5 horn frames, got '+horns);
  ok(d.frames.some(f=>f.sound==='boing'),'finale jump has no boing');
  ok(d.frames.some(f=>f.sound==='spin'),'no headspin sound');
  ok(d.frames.filter(f=>f.fx==='confetti').length>=4,'expected at least 4 confetti bursts');}
for(const [k,a] of Object.entries(lib)){ok(a.frames.reduce((s,f)=>s+f.hold,0)>0,k+' has no frames');
  if(k.startsWith('dance_'))ok(a.music,k+' has no music');
  a.frames.forEach((f,i)=>{if(f.sound)ok(SFX.names.includes(f.sound),k+' frame '+i+' has unknown sound '+f.sound);});
  if(a.music)ok(SFX.names.includes(a.music),k+' has unknown music '+a.music);
  for(const p of a.props||[])ok(p in PROPS,k+' has unknown prop '+p);}
if(fail.length){console.error('FAIL\n- '+fail.join('\n- '));process.exit(1);}
console.log('OK: '+Object.keys(lib).length+' animations, dance_: '+Object.keys(lib).filter(k=>k.startsWith('dance_')).join(', '));
