// Bakes rig + animations + all mp3s into docs/index.html (game) and docs/studio.html
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const cfg=require('../config.json');
const rig=fs.readFileSync(path.join(root,'src/rig.js'),'utf8');
const slug=s=>s.toLowerCase().replace(/[^a-z0-9éèëïöü]+/g,'_').replace(/^_|_$/g,'');
const dataUrl=f=>'data:audio/mpeg;base64,'+fs.readFileSync(f).toString('base64');
const assets={sounds:{},voice:{}};
// sound effects: assets/sounds/<name>.mp3
const sdir=path.join(root,'assets/sounds');
if(fs.existsSync(sdir))for(const f of fs.readdirSync(sdir))if(f.endsWith('.mp3'))assets.sounds[f.slice(0,-4)]=dataUrl(path.join(sdir,f));
// voice: assets/voice/<lang>/<slug>.mp3, keyed by 'lang:text' so the game finds them without guessing slugs
const phrases=require('./phrases.js')(cfg);
const vdir=path.join(root,'assets/voice',cfg.lang.slice(0,2));
for(const text of phrases){const f=path.join(vdir,slug(text)+'.mp3');if(fs.existsSync(f))assets.voice[cfg.lang+':'+text]=dataUrl(f);}
// custom animations override the built-in defaults if present
let anim='';
const af=path.join(root,'animations.json');
if(fs.existsSync(af)){const d=JSON.parse(fs.readFileSync(af,'utf8'));anim=`window.CUSTOM_ANIMS=${JSON.stringify(d.animations||d)};`;}
const assetsJs=`window.ASSETS=${JSON.stringify(assets)};${anim}window.DEFAULT_CFG=${JSON.stringify({names:cfg.names,lang:cfg.lang})};`;
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
const game=fs.readFileSync(path.join(root,'src/game.html'),'utf8').replace('__ASSETS__',assetsJs).replace('__RIG__',rig);
fs.writeFileSync(path.join(root,'docs/index.html'),game);
fs.writeFileSync(path.join(root,'docs/studio.html'),fs.readFileSync(path.join(root,'src/studio.html'),'utf8').replace('__RIG__',rig));
for(const f of ['manifest.webmanifest','icon.png'])if(fs.existsSync(path.join(root,f)))fs.copyFileSync(path.join(root,f),path.join(root,'docs',f));
const mb=(fs.statSync(path.join(root,'docs/index.html')).size/1e6).toFixed(2);
console.log(`docs/index.html ${mb} MB — ${Object.keys(assets.sounds).length} sounds, ${Object.keys(assets.voice).length}/${phrases.length} voice clips baked`);
