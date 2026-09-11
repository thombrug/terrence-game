// Loads KEY=value lines from .env in the repo root into process.env (existing env wins). Never prints values.
const fs=require('fs'),path=require('path');
const f=path.join(__dirname,'..','.env');
if(fs.existsSync(f))for(const line of fs.readFileSync(f,'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(!m||line.trim().startsWith('#'))continue;
  const v=m[2].replace(/^['"]|['"]$/g,'');if(!process.env[m[1]])process.env[m[1]]=v;
}
module.exports={
  key(){const k=process.env.ELEVENLABS_API_KEY;if(!k){console.error('Set ELEVENLABS_API_KEY in .env or the environment first.');process.exit(1);}return k;},
  slug:s=>s.toLowerCase().replace(/[^a-z0-9éèëïöü]+/g,'_').replace(/^_|_$/g,''),
};
