// One-off batch: generate the game's sound effects with ElevenLabs Sound Effects and save as assets/sounds/<name>.mp3.
// Usage:  node tools/build-sfx.js            (only missing files)
//         node tools/build-sfx.js fart boing (force-regenerate these)
const fs=require('fs'),path=require('path');
const {key}=require('./env.js');
const dir=path.join(__dirname,'..','assets','sounds');
fs.mkdirSync(dir,{recursive:true});
// name -> [prompt, seconds]. Names must match SFX names in src/rig.js.
const SFX={
  fart:   ['short squeaky cartoon fart, comedic, single toot',1.0],
  bigfart:['long wet rumbling cartoon fart, very loud, comedic, ends with a squeak',2.5],
  boing:  ['cartoon spring boing, bouncy, single hit',0.8],
  thud:   ['cartoon body faceplant thud on the ground, dull heavy hit, comedic',0.8],
  slip:   ['cartoon slip on a banana peel, quick slide whistle down then thump',1.2],
  whistle:['cartoon slide whistle going up, quick',1.0],
  splat:  ['wet cartoon splat, single, comedic',0.7],
  sneeze: ['big exaggerated cartoon sneeze, achoo, comedic',1.2],
  ding:   ['bright happy cartoon ding, single bell, success',0.8],
  pop:    ['small cartoon pop, cork popping, single',0.5],
  spin:   ['cartoon spinning whoosh, fast wobble, comedic, short',1.2],
};
const force=process.argv.slice(2);
(async()=>{
  let n=0;
  for(const [name,[text,duration_seconds]] of Object.entries(SFX)){
    if(force.length&&!force.includes(name))continue;
    const file=path.join(dir,name+'.mp3');
    if(!force.length&&fs.existsSync(file))continue;
    const res=await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_22050_32',{
      method:'POST',headers:{'xi-api-key':key(),'Content-Type':'application/json'},
      body:JSON.stringify({text,duration_seconds,prompt_influence:0.6})});
    if(!res.ok){console.error('FAILED',name,res.status,await res.text());continue;}
    fs.writeFileSync(file,Buffer.from(await res.arrayBuffer()));
    n++;console.log('ok',name,'->',fs.statSync(file).size,'bytes');
  }
  console.log(`\n${n} sound effects generated in assets/sounds/. Now run: npm run build`);
})();
