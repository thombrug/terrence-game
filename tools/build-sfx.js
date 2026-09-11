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
  // new gags (2026-09-11)
  bird_1:  ['cartoon crow caw, single loud kaaa, comedic, short',0.8],
  bird_2:  ['cartoon seagull squawk, single, short, comedic',0.8],
  bonk:    ['cartoon bonk, hollow coconut hit on a head, single, short',0.5],
  moo:     ['cartoon cow moo, single, comedic, short',1.2],
  oink:    ['cartoon pig oink oink, short, comedic',0.8],
  baa:     ['cartoon sheep baa, single, comedic',1.0],
  sparkle: ['handheld sparkler fizzing and crackling, fireworks, continuous, bright',3.0],
  whoosh:  ['big fire whoosh, flamethrower burst, short, cartoon',1.0],
  // party, ice cream, sleep gags
  horn:    ['cartoon party horn blower toot, single short honk, birthday party, comedic',0.8],
  slurp:   ['cartoon lick, short wet slurp, single, comedic',0.5],
  snore_1: ['cartoon snoring, one loud rasping inhale and a whistling exhale, comedic',1.4],
  snore_2: ['cartoon snore, single deep rumbling inhale then a soft puff exhale, comedic',1.4],
  // dance music, same length as the dance (10 s at 8 fps x 80 frames)
  disco:   ['upbeat funky 70s disco groove, four on the floor drums, slap bass, wah guitar, cheerful, instrumental',10],
  jig:     ['fast irish jig, fiddle and tin whistle and bodhran, riverdance style, upbeat, instrumental',10],
  party:   ['cheerful children\'s birthday party tune, polonaise march, accordion and brass band, hand claps, upbeat, instrumental',10],
};
// file name -> text spoken by the game's voice (short, in character)
const YELPS={
  oef_1:'Euh!', oef_2:'Uh!', oef_3:'Hmpf!',
  sneeze_1:'Hatsjoe!', sneeze_2:'Hatsjie!',
  au_1:'Au!', au_2:'Auw!', au_3:'Au au au!',
  // snickering when the farm animal poops (eleven_v3 audio tags make real laughs instead of spoken "haha")
  snicker_1:'[giggles] Hihihi!', snicker_2:'[laughs] Hèhèhè!', snicker_3:'[mischievously] Hihi... [laughs]',
  // peekaboo, ice cream, sleep
  kiekeboe_1:'Kiekeboe!', kiekeboe_2:'[playfully] Kiekeboe!',
  yawn_1:'[yawning] Aaaahhh.', mmm_1:'[happily] Mmm!', ohnee_1:'[sad] Oh nee...',
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
