// One-off batch: generate every phrase with ElevenLabs and save as mp3.
// Usage:  node tools/build-voice.js   (reads ELEVENLABS_API_KEY from .env)
// Re-running only fetches phrases that don't have an mp3 yet.
const fs=require('fs'),path=require('path');
const cfg=require('../config.json');
const phrases=require('./phrases.js')(cfg);
const {key:getKey,slug}=require('./env.js');const key=getKey();
const dir=path.join(__dirname,'..','assets','voice',cfg.lang.slice(0,2));
fs.mkdirSync(dir,{recursive:true});
(async()=>{
  let n=0,chars=0;
  for(const text of phrases){
    const file=path.join(dir,slug(text)+'.mp3');
    if(fs.existsSync(file)){continue;}
    const e=cfg.elevenlabs;const isLetter=/^[A-Z]$/.test(text);const L=isLetter&&e.letters||{};const model=L.model||e.model,langCode=L.languageCode||e.languageCode,say=(isLetter&&L.spell&&L.spell[text])||(isLetter&&L.suffix?text+L.suffix:text);
    const res=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${e.voiceId}?output_format=mp3_22050_32`,{
      method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},
      body:JSON.stringify({text:say,model_id:model,...(langCode?{language_code:langCode}:{}),voice_settings:{stability:e.stability,similarity_boost:e.similarity,style:e.style}})});
    if(!res.ok){console.error('FAILED',text,res.status,await res.text());continue;}
    fs.writeFileSync(file,Buffer.from(await res.arrayBuffer()));
    n++;chars+=text.length;console.log('ok',text,'->',path.basename(file));
  }
  console.log(`\n${n} clips generated (${chars} characters billed). Now run: node tools/build.js`);
})();
