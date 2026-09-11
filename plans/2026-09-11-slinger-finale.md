# Slinger naar het feestje — implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Doel:** Een slinger met 10 vlaggetjes die per goed antwoord volloopt; bij 10 wappert hij, start willekeurig een van drie 10-seconden feestjes (riverdance, disco, party) en vallen de vlaggetjes af. Het partygag wordt daarvoor een volwaardig eindfeestje met muziek.

**Architectuur:** Ontwerp staat in `plans/2026-09-11-slinger-finale-design.md`. Drie lagen: (1) muziek via `tools/build-sfx.js`; (2) `slap_party` → `dance_party` in `src/rig.js` (80 frames, `music:'party'`), zodat de bestaande `pick('dance_')` hem oppakt en hij uit de gewone gag-pool verdwijnt; (3) in `src/game.html` een `slinger`-groep, `addFlag()` bij een goed antwoord, `cfg.flags` in localStorage, en `danceParty()` uitgebreid met wapperen vooraf en afvallen achteraf.

**Tech stack:** Vanilla JS/SVG in één HTML-bestand, Web Animations API voor de overlays, ElevenLabs sound-generation voor de muziek, Node 18 voor de scripts. Geen testframework: een Node-script checkt de animatiebibliotheek, de rest via `npm run build` + Playwright MCP (`browser_navigate`, `browser_evaluate`) tegen de dev-server (launch-config `game`, poort 3456). Zie de memory-notitie: de desktop Browser-pane is vaak verborgen en dan lopen WAAPI-animaties niet; gebruik Playwright.

---

## Volgorde

| # | Taak | Afhankelijk van |
|---|------|-----------------|
| 1 | Partymuziek genereren | – |
| 2 | `dance_party` (80 frames) + Node-check | – |
| 3 | Slinger tekenen + `cfg.flags` laden | – |
| 4 | Vlaggetje erbij bij goed antwoord | 3 |
| 5 | Finale: wapperen, feestje, afvallen | 2, 4 |
| 6 | CLAUDE.md, build, afronden | 1–5 |

Taak 1, 2 en 3 zijn onafhankelijk en kunnen parallel.

---

### Taak 1: Partymuziek genereren

**Files:**
- Modify: `tools/build-sfx.js:45-46` (de `SFX`-tabel, naast `disco` en `jig`)

**Stap 1: Regel toevoegen**

Direct onder de `jig:`-regel:

```js
  party:   ['cheerful children\'s birthday party tune, polonaise march, accordion and brass band, hand claps, upbeat, instrumental',10],
```

**Stap 2: Genereren**

Run: `npm run sfx`
Verwacht: het script slaat bestaande bestanden over en maakt alleen `assets/sounds/party.mp3`. Bij een 402/429 van ElevenLabs: het gratis plan zit vol, meld dat aan Thomas; het feestje werkt ook zonder bestand (alleen toeters en pops).

**Stap 3: Controleren**

Run (PowerShell): `(Get-Item assets/sounds/party.mp3).Length`
Verwacht: ruim boven 100000 bytes (10 s mp3). Luister het bestand even af of open het in de browser; is het niks, dan mag Thomas er een eigen 10 s mp3 overheen zetten, naam blijft `party.mp3`.

**Stap 4: Commit**

```bash
git add tools/build-sfx.js assets/sounds/party.mp3
git commit -m "Party music for the flag finale (ElevenLabs sound generation)"
```

---

### Taak 2: `slap_party` wordt `dance_party` van 10 seconden

**Files:**
- Create: `tools/check-lib.js`
- Modify: `src/rig.js:353-357` (de `slap_party`-definitie in `makeDefaultLib()`)

**Stap 1: Check-script schrijven (faalt eerst)**

`tools/check-lib.js`:

```js
// Sanity checks on the default animation library, no browser needed. Run: node tools/check-lib.js
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','src','rig.js'),'utf8');
const lib=new Function('module',src+';return makeDefaultLib();')({});
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
  if(k.startsWith('dance_'))ok(a.music,k+' has no music');}
if(fail.length){console.error('FAIL\n- '+fail.join('\n- '));process.exit(1);}
console.log('OK: '+Object.keys(lib).length+' animations, dance_: '+Object.keys(lib).filter(k=>k.startsWith('dance_')).join(', '));
```

**Stap 2: Draaien, moet falen**

Run: `node tools/check-lib.js`
Verwacht: `FAIL` met "slap_party should be gone" en "dance_party missing", exit code 1.

**Stap 3: Animatie vervangen**

Vervang in `src/rig.js` het hele `slap_party:(()=>{ ... })(),`-blok (regel 353 t/m 357, eindigend op `{props:['flagL','flagR','partyHat']});})(),`) door:

```js
    // party finale (10 s): horn + confetti, marching hops, two headspins, a horn salvo, a big jump with the hat flying, laughing on the knees
    dance_party:(()=>{const wave=d=>({lUpper:{r:150+15*d},lLower:{r:0},lHand:{r:-150-5*d},rUpper:{r:-150-15*d},rLower:{r:0},rHand:{r:150+5*d}});   // hand r keeps the stick upright, minus a little tilt
      const hop=(i,d)=>({...wave(d),root:{y:i%2?-16:0},torso:{r:5*d},head:{r:-4*d},hat:{y:i%2?-6:0},mouth:i%2?4:1,eyes:0});
      const kneel={lThigh:{r:20},rThigh:{r:-20},lShin:{r:-35},rShin:{r:35}};
      const straight={lUpper:{r:175},rUpper:{r:-175},lLower:{r:0},rLower:{r:0},lHand:{r:-175},rHand:{r:175}};   // both flags straight up
      return seq(8,80,i=>{const d=i%4<2?1:-1;
        if(i<16)return {...wave(d),root:{y:i%2?-4:0},mouth:4,eyes:0,sound:i%8===0?'horn':'',fx:i%8===0?'confetti':''};            // opening: two horns
        if(i<40)return {...hop(i,d),sound:i%4===0?'pop':''};                                                                     // marching hops
        if(i<56){const ph=(i-40)%8;if(ph<4)return {...straight,head:{r:[0,90,180,-90][ph]},mouth:4,eyes:0,sound:ph===0?'spin':''};return hop(i,d);}   // headspin, hop, headspin, hop
        if(i<68){const t=(i-56)%4;return {...wave(t<2?1:-1),root:{y:t===0?-8:0},torso:{r:t===0?-6:0},mouth:4,eyes:0,sound:t===0?'horn':'',fx:t===0?'confetti':''};}   // salvo: three horns, half a second apart
        const f=i-68;
        if(f<2)return {...wave(1),...kneel,root:{y:6},mouth:1,eyes:0};                                                          // wind up
        if(f<5)return {...straight,root:{y:[-34,-44,-30][f-2]},hat:{y:[-30,-46,-24][f-2]},mouth:4,eyes:0,sound:f===2?'boing':''};   // jump, hat flies higher
        if(f<8)return {...wave(-1),...kneel,root:{y:8},hat:{y:f===5?-10:0},mouth:4,eyes:2,sound:f===5?'plof':''};               // landing on the knees
        return {...wave(f%2?1:-1),mouth:4,eyes:f<11?1:0};                                                                        // laughing, flags up
      },{music:'party',props:['flagL','flagR','partyHat']});})(),
```

Let op: `seq` is al gedefinieerd bovenaan `makeDefaultLib()` (regel 270) en wordt door de twee andere dansjes gebruikt.

**Stap 4: Check draaien**

Run: `node tools/check-lib.js`
Verwacht: `OK: 33 animations, dance_: dance_riverdance, dance_disco, dance_party`

**Stap 5: Oude geëxporteerde bibliotheken opruimen**

Een eerder in de ⚙ geplakte `animations.json` in localStorage kan nog een `slap_party` bevatten. In `src/game.html:100` staat de regel die begint met `try{const s=localStorage.getItem('cutout-game');`. Voeg direct daarna toe:

```js
delete lib.slap_party;   // renamed to dance_party; drop it from any older animations.json that was pasted into the settings
```

**Stap 6: Studio-check**

Run: `npm run build`, dan `preview_start` met config `game`, open `http://localhost:3456/studio.html`. In de animatielijst staat `dance_party` en geen `slap_party`; afspelen toont vlaggen en feesthoed, geen JS-fouten in de console.

**Stap 7: Commit**

```bash
git add tools/check-lib.js src/rig.js src/game.html
git commit -m "Party gag becomes a 10 s dance_party finale with music; library sanity check script"
```

---

### Taak 3: Slinger tekenen en `cfg.flags` laden

**Files:**
- Modify: `src/game.html:47` (SVG, na de gras-rects, vóór `<defs>`)
- Modify: `src/game.html:96` (`cfg`-defaults)
- Modify: `src/game.html:100` (na het laden uit localStorage)

**Stap 1: SVG-groep**

Direct na de regel met `fill="#5ea24a"` / `fill="#3f7a33"` (de grasranden, regel 47) en vóór `<defs>`:

```html
  <g id="slinger"></g>
```

Hij staat vóór `target`, `rig`, `fx` en `bubbles`, dus alles wordt eroverheen getekend.

**Stap 2: Default**

In de `cfg`-regel (regel 96): `rate:1.05` wordt `rate:1.05,flags:0`.

**Stap 3: Tekenfuncties**

Voeg na de `saveCfg`-functie (regel 101) toe:

```js
// ---------- slinger: 10 flags fill up towards the party ----------
const FLAG_COLORS=['#ffd400','#ff7a00','#c8322b','#5ea24a','#3a7bd5'];
const ROPE={a:[-10,102],c:[180,198],b:[370,102]};   // quadratic curve; control y 198 puts the lowest point at y 150, just above the hat (y 160 at rest)
function ropePt(t){const {a,c,b}=ROPE,u=1-t;return {x:u*u*a[0]+2*u*t*c[0]+t*t*b[0],y:u*u*a[1]+2*u*t*c[1]+t*t*b[1]};}
const flagPt=i=>ropePt(0.05+i*0.1);
const flagEls=()=>[...$('slinger').querySelectorAll('.flag')];
function drawSlinger(){const g=$('slinger');g.innerHTML='';const {a,c,b}=ROPE;
  g.append(el('path',{d:`M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`,fill:'none',stroke:'#2b2622','stroke-width':3}));
  for(let i=0;i<10;i++){const p=flagPt(i);
    g.append(el('path',{class:'flag',d:'M-12,0 L12,0 L0,26 Z',fill:'#fff',stroke:'#2b2622','stroke-width':2.5,'stroke-linejoin':'round',transform:`translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`}));}
  paintFlags();}
function paintFlags(){flagEls().forEach((f,i)=>f.setAttribute('fill',i<cfg.flags?FLAG_COLORS[i%5]:'#fff'));}
```

`el(tag, attrs)` en `$` bestaan al (rig.js en game.html regel 81).

**Stap 4: Tekenen bij laden**

Na de `delete lib.slap_party;`-regel uit taak 2 (of, als taak 2 nog niet is gedaan, direct na de `try{const s=localStorage.getItem('cutout-game')...`-regel):

```js
cfg.flags=Math.min(10,Math.max(0,+cfg.flags||0));drawSlinger();
```

**Stap 5: Build + Playwright**

Run: `npm run build`. Start `preview_start` config `game`. Met Playwright MCP: `browser_navigate` naar `http://localhost:3456/`, dan `browser_evaluate`:

```js
({flags:document.querySelectorAll('#slinger .flag').length, white:[...document.querySelectorAll('#slinger .flag')].filter(f=>f.getAttribute('fill')==='#fff').length, rope:!!document.querySelector('#slinger path:not(.flag)')})
```
Verwacht: `{flags:10, white:10, rope:true}`.

Dan: `localStorage.setItem('cutout-game',JSON.stringify({...JSON.parse(localStorage.getItem('cutout-game')||'{}'),flags:4}))`, `browser_navigate` opnieuw naar dezelfde URL (geen `location.reload()` in evaluate), en de eerste evaluate weer: verwacht `white:6`. Zet daarna `flags` terug op 0.

Screenshot met `browser_take_screenshot`: de slinger hangt onder de wolk, boven de hoed, vlaggetjes raken de bubbels niet. Zit hij te laag of te hoog: pas `ROPE` aan (control-y = 2·gewenste-laagste-y − 102).

**Stap 6: Commit**

```bash
git add src/game.html
git commit -m "Bunting under the cloud: 10 flags, filled count persisted in cfg.flags"
```

---

### Taak 4: Vlaggetje erbij bij een goed antwoord

**Files:**
- Modify: `src/game.html` (na `paintFlags`, en in `onTap`)

**Stap 1: `addFlag`**

Na `paintFlags()`:

```js
// One star flies from Terrance to the next empty flag; the flag takes its colour with a pop. Timing via setTimeout so it also works when the tab is hidden.
function addFlag(){if(cfg.flags>=10)return;const i=cfg.flags++;saveCfg();
  const f=flagEls()[i],p=flagPt(i),col=FLAG_COLORS[i%5];
  const s=el('path',{d:'M0,-10 L3,-3 L10,-3 L4,2 L6,9 L0,5 L-6,9 L-4,2 L-10,-3 L-3,-3 Z',fill:col,stroke:'#2b2622','stroke-width':1.5});$('fx').append(s);
  s.animate([{transform:'translate(126px,300px) scale(1.4)'},{transform:`translate(${p.x}px,${p.y+12}px) scale(.6)`}],{duration:500,easing:'ease-in'});
  setTimeout(()=>{s.remove();f.setAttribute('fill',col);SFX.play('pop');
    const tf=`translate(${p.x}px,${p.y}px)`;f.animate([{transform:tf+' scale(1)'},{transform:tf+' scale(1.3)'},{transform:tf+' scale(1)'}],{duration:300});},500);}
```

**Stap 2: Aanroepen**

In `onTap` (regel ~254): `if(g.dataset.ok){score++;hideBubbles();stars();` wordt
`if(g.dataset.ok){score++;hideBubbles();stars();addFlag();`

**Stap 3: Build + Playwright**

`npm run build`, `browser_navigate` naar `http://localhost:3456/`, dan evaluate (klik Spelen, wacht tot het spel op een antwoord wacht, tik de goede bubbel):

```js
document.getElementById('btnStart').click();
await new Promise(r=>{const t=setInterval(()=>{if(state==='waiting'){clearInterval(t);r();}},100);});
[...document.querySelectorAll('.bubble')].find(b=>b.dataset.ok).dispatchEvent(new PointerEvent('pointerdown'));
await new Promise(r=>setTimeout(r,800));
({flags:cfg.flags, filled:[...document.querySelectorAll('#slinger .flag')].filter(f=>f.getAttribute('fill')!=='#fff').length, saved:JSON.parse(localStorage.getItem('cutout-game')).flags})
```
Verwacht: `{flags:1, filled:1, saved:1}`. Herhaal de laatste drie regels nadat `state` weer `waiting` is: `{flags:2, filled:2, saved:2}`. Console (`browser_console_messages`): geen errors.

**Stap 4: Commit**

```bash
git add src/game.html
git commit -m "A star flies to the next flag on every correct answer"
```

---

### Taak 5: Finale — wapperen, feestje, afvallen

**Files:**
- Modify: `src/game.html:238` (`danceParty`) en `onTap` (`score%10`)

**Stap 1: Wapperen en afvallen**

Vervang de `danceParty`-regel door:

```js
// ---------- party (when all 10 flags are filled) ----------
async function waveFlags(){SFX.play('horn');flagEls().forEach((f,i)=>{const p=flagPt(i),tf=`translate(${p.x}px,${p.y}px)`,d=i%2?1:-1;
  f.animate([{transform:tf+' rotate(0)'},{transform:tf+` rotate(${12*d}deg)`},{transform:tf+` rotate(${-12*d}deg)`},{transform:tf+' rotate(0)'}],{duration:300,iterations:2});});
  await wait(700);}
async function dropFlags(){const fl=flagEls();
  for(let i=0;i<fl.length;i++){const p=flagPt(i);SFX.play('pop');
    fl[i].animate([{transform:`translate(${p.x}px,${p.y}px) rotate(0)`,opacity:1},{transform:`translate(${p.x+10}px,${p.y+70}px) rotate(120deg)`,opacity:0}],{duration:500,easing:'ease-in'});
    await wait(80);}
  await wait(500);cfg.flags=0;saveCfg();paintFlags();}
async function danceParty(){await waveFlags();const d=pick('dance_');stars();music.play(d.music);setTimeout(stars,600);await playAsync(d);music.stop();stars();await speakAsync(rnd(PRAISE[cfg.lang]));await dropFlags();}
```

**Stap 2: Trigger**

In `onTap`: `if(score%10===0)await danceParty();` wordt `if(cfg.flags>=10)await danceParty();`

**Stap 3: Build + Playwright (snelle route)**

`npm run build`, `browser_navigate`, evaluate:

```js
cfg.flags=9;saveCfg();paintFlags();
const picked=[];const _pick=pick;window.pick=(p)=>{const a=_pick(p);picked.push(Object.keys(lib).find(k=>lib[k]===a));return a;};
document.getElementById('btnStart').click();
await new Promise(r=>{const t=setInterval(()=>{if(state==='waiting'){clearInterval(t);r();}},100);});
[...document.querySelectorAll('.bubble')].find(b=>b.dataset.ok).dispatchEvent(new PointerEvent('pointerdown'));
await new Promise(r=>setTimeout(r,1500));
({flagsAfterTap:cfg.flags, filled:[...document.querySelectorAll('#slinger .flag')].filter(f=>f.getAttribute('fill')!=='#fff').length})
```
Verwacht: `{flagsAfterTap:10, filled:10}`. (`pick` is een `const`; als de override op `window.pick` niet pakt omdat `pick` lexicaal is, sla die regel over en kijk in plaats daarvan naar `doll.props`/`music.cur` tijdens de dans.)

Wacht dan tot `state==='waiting'` (gag + feestje + lofzin, tot ~40 s; gebruik `browser_wait_for` of een evaluate met een 60 s-promise) en evaluate:

```js
({flags:cfg.flags, white:[...document.querySelectorAll('#slinger .flag')].filter(f=>f.getAttribute('fill')==='#fff').length, saved:JSON.parse(localStorage.getItem('cutout-game')).flags, picked})
```
Verwacht: `{flags:0, white:10, saved:0, picked:[...een van dance_riverdance/dance_disco/dance_party...]}`. Herhaal de snelle route twee of drie keer tot alle drie de feestjes een keer gezien zijn; maak tijdens `dance_party` een `browser_take_screenshot` (vlaggen, feesthoed, confetti). Console: geen errors.

**Stap 4: Commit**

```bash
git add src/game.html
git commit -m "Ten flags: bunting waves, random dance/party finale, flags drop off"
```

---

### Taak 6: Documentatie, build, afronden

**Files:**
- Modify: `CLAUDE.md`
- Build: `docs/`

**Stap 1: CLAUDE.md bijwerken**

- In "How the character works", de zin over animatienaming: `dance_*` beschrijving wordt "`dance_*` (feestje bij 10 volle vlaggetjes, 10 s, met `music`; riverdance, disco en party)". De regel "Non-fart `slap_*` gags": `slap_party` eruit, met de opmerking dat hij `dance_party` is geworden.
- In "Game flow": na "Correct → stars + slapstick + praise" de slinger: "Onder de wolk hangt een slinger met 10 vlaggetjes (`drawSlinger`/`addFlag` in game.html, stand in `cfg.flags`, localStorage). Elk goed antwoord vult er een; bij 10: `danceParty()` = wapperen + willekeurig `dance_*` + vlaggetjes vallen af. `score` wordt niet meer voor de dans gebruikt."
- Sounds-regel: `disco/jig/party (10 s music, no synth fallback)`.
- Repo layout: `tools/check-lib.js   sanity checks on makeDefaultLib() (node, no browser)`.
- "Where we left off": nieuw punt 6: "DONE (2026-09-11, plan in `plans/2026-09-11-slinger-finale.md`): slinger naar het feestje, `dance_party` 10 s met `party.mp3`. Niet op de telefoon gecheckt: hoogte van de slinger t.o.v. de hoed, en of de party-muziek bevalt (anders eigen `party.mp3` in `assets/sounds/`)." In punt 5 (ideeën) de "visible row of 10 stars" weghalen.

**Stap 2: Volledige build + laatste check**

Run: `node tools/check-lib.js` (OK), `npm run build`. `browser_navigate` naar `http://localhost:3456/`, `browser_console_messages`: geen errors. Verwijder `.playwright-mcp/` en losse screenshot-PNG's uit de repo-root voordat je commit.

**Stap 3: Commit**

```bash
git add CLAUDE.md docs
git commit -m "Build: bunting finale, dance_party, party music; docs updated"
```

Pushen naar GitHub (Pages) alleen als Thomas dat vraagt.
