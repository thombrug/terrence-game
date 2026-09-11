// Generates a few sample phrases for candidate voices so you can pick one by ear.
// Usage:  node tools/voice-test.js <voiceId|name=voiceId> [...]
// Output: voice-test/<name>/<phrase>.mp3   (folder is gitignored)
const fs=require('fs'),path=require('path');
const {key,slug}=require('./env.js');
const cfg=require('../config.json');
const out=path.join(__dirname,'..','voice-test');
const SAMPLES=['A','B','Mama','Ja! Goed zo!','Hmm, nee.'];
const args=process.argv.slice(2);
if(!args.length){console.error('Give at least one voice id, e.g. node tools/voice-test.js fin=D38z5RcWu1voky8WS1ja');process.exit(1);}
(async()=>{
  for(const a of args){
    const [name,id]=a.includes('=')?a.split('='):[a,a];
    const dir=path.join(out,name);fs.mkdirSync(dir,{recursive:true});
    for(const text of SAMPLES){
      const e=cfg.elevenlabs;
      const body={text,model_id:e.model,voice_settings:{stability:e.stability,similarity_boost:e.similarity,style:e.style}};
      if(e.languageCode)body.language_code=e.languageCode;
      const res=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_22050_32`,{
        method:'POST',headers:{'xi-api-key':key(),'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(!res.ok){console.error('FAILED',name,text,res.status,(await res.text()).slice(0,200));break;}
      fs.writeFileSync(path.join(dir,slug(text)+'.mp3'),Buffer.from(await res.arrayBuffer()));
      console.log('ok',name,text);
    }
  }
})();
