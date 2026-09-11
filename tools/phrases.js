// Builds the full list of phrases the game can say, from config.json + PHRASES in rig.js
const {PHRASES}=require('../src/rig.js');
module.exports=function phrases(cfg){
  const lang=cfg.lang, out=new Set();
  PHRASES.letters.forEach(l=>out.add(l));
  cfg.names.forEach(n=>out.add(n));
  PHRASES.numbers[lang].forEach(w=>out.add(w));
  PHRASES.praise[lang].forEach(w=>out.add(w));
  PHRASES.oops[lang].forEach(w=>out.add(w));
  return [...out];
};
