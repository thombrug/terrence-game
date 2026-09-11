// One-off batch: generate the game's sound effects and save as assets/sounds/<name>.mp3.
//   SFX   -> ElevenLabs Sound Effects API (prompt + seconds)
//   YELPS -> ElevenLabs TTS with the game's own voice (short exclamations like "Oef!")
// Variants: name_1, name_2 ... are picked at random by SFX.play(name) in the game.
// Usage:  node tools/build-sfx.js            (only missing files)
//         node tools/build-sfx.js fart_1 au_2 (force-regenerate these)
const fs=require('fs'),path=require('path');
const {key}=require('./env.js');
const cfg=require('../config.json');
const dir=path.join(__dirname,'..','assets','sounds');
fs.mkdirSync(dir,{recursive:true});
// file name -> [prompt, seconds]. Base names must match SFX names in src/rig.js.
const SFX={
  fart_1: ['very short high-pitched cartoon fart toot, squeaky, single note, like a tiny trumpet',0.5],
  fart_2: ['quick tiny cartoon fart squeak, one short pfft, comedic, dry',0.5],
  fart_3: ['short cartoon fart, single brief raspberry sound, bright, comedic, South Park style toot',0.6],
  fart_4: ['brief squeaky balloon fart toot, one short honk, cartoonish',0.5],
  boing:  ['cartoon spring boing, bouncy, single hit',0.8],
  thud:   ['cartoon body faceplant thud on the ground, dull heavy hit, comedic',0.8],
  slip:   ['cartoon slip on a banana peel, quick slide whistle down then thump',1.2],
  splat:  ['wet cartoon splat, single, comedic',0.7],
  ding:   ['bright happy cartoon ding, single bell, success',0.8],
  pop:    ['small cartoon pop, cork popping, single',0.5],
  spin:   ['cartoon spinning whoosh, fast wobble, comedic, short',1.2],
  plof:   ['short low muffled plop, body hit, padded, cartoon, single',0.5],
  // gut-punch exhale candidates (no hard consonants): oef_4..6 via sound effects, oef_1..3 via the voice below
  oef_4:  ['very short breathy grunt, air knocked out of a man by a punch to the belly, soft uh, cartoon, no words',0.5],
  oef_5:  ['quick winded exhale, oof with no f, breath punched out, short, comedic',0.5],
  oef_6:  ['tiny wheeze, man gets hit in the stomach, single short huh, cartoon',0.5],
};
// file name -> text spoken by the game's voice (short, in character)
const YELPS={
  oef_1:'Euh!', oef_2:'Uh!', oef_3:'Hmpf!',
  sneeze_1:'Hatsjoe!', sneeze_2:'Hatsjie!',
  au_1:'Au!', au_2:'Auw!', au_3:'Au au au!',
};
const force=process.argv.slice(2);
const want=name=>force.length?force.includes(name):!fs.existsSync(path.join(dir,name+'.mp3'));
(async()=>{
  let n=0;
  for(const [name,[text,duration_seconds]] of Object.entries(SFX)){
    if(!want(name))continue;
    const res=await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_22050_32',{
      method:'POST',headers:{'xi-api-key':key(),'Content-Type':'application/json'},
      body:JSON.stringify({text,duration_seconds,prompt_influence:0.6})});
    if(!res.ok){console.error('FAILED',name,res.status,await res.text());continue;}
    fs.writeFileSync(path.join(dir,name+'.mp3'),Buffer.from(await res.arrayBuffer()));
    n++;console.log('ok',name);
  }
  const e=cfg.elevenlabs;
  for(const [name,text] of Object.entries(YELPS)){
    if(!want(name))continue;
    const body={text,model_id:e.model,...(e.languageCode?{language_code:e.languageCode}:{}),voice_settings:{stability:e.stability,similarity_boost:e.similarity,style:e.style}};
    const res=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${e.voiceId}?output_format=mp3_22050_32`,{
      method:'POST',headers:{'xi-api-key':key(),'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!res.ok){console.error('FAILED',name,res.status,await res.text());continue;}
    fs.writeFileSync(path.join(dir,name+'.mp3'),Buffer.from(await res.arrayBuffer()));
    n++;console.log('ok',name,'('+text+')');
  }
  console.log(`\n${n} sounds generated in assets/sounds/. Now run: npm run build`);
})();
