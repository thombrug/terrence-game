# Slapstick-uitbreiding — implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Doel:** De aantekeningen van Thomas (11 sept 2026) omzetten in werkende gags: bal tegen het hoofd, aarde doortrekken, grotere vogel met geluid, tikken op het poppetje, dieren-cameo, vuurwerkdans, en een dansje met muziek na 10 goede antwoorden.

**Architectuur:** Eerst drie kleine mechanismes toevoegen aan `src/rig.js` die alle gags nodig hebben: (1) een `fx`-veld per keyframe dat de speler aan het spel doorgeeft, net als `sound`; (2) "props" (kostuum-onderdelen zoals fakkels, afropruik, zonnebril) die per animatie aan/uit gaan; (3) een `music`-veld per animatie. Het spel (`src/game.html`) krijgt een `jointXY()`-helper die de schermpositie van een gewricht geeft, zodat overlays (bal, vonken, steekvlam, sterretjes, discobal) op de goede plek landen. Daarna is elke gag: keyframes in `makeDefaultLib()` + een fx-handler in het spel + geluiden via `tools/build-sfx.js`.

**Tech stack:** Vanilla JS/SVG, één HTML-bestand, ElevenLabs sound-generation voor geluid en muziek, Node 18 voor de build-scripts. Geen tests-framework: verificatie gebeurt in de browser via `npm run build` + `npm run serve` en de studio (`docs/studio.html`).

---

## Aannames en open vragen (eerst even checken met Thomas)

1. **"Klap tegen het hoofd"** = `slap_headspin` (de enige animatie waarbij het hoofd een tik lijkt te krijgen). De bal vliegt van rechts in, raakt het hoofd, en dán begint de headspin.
2. **Score is onzichtbaar.** Er komt geen cijfer op het scherm (past bij "geen scores, geen menu's"). Elke 10e goede antwoord → dansje. Optie voor later: een rijtje van 10 kleine sterretjes onderin dat volloopt.
3. **Twee dansjes** worden gebouwd: eerst riverdance (alleen poses, geen kostuum), dan disco (met afro, zonnebril, wijde pijpen en discobal). Het spel kiest willekeurig.
4. **Muziek via ElevenLabs sound-generation** (max 22 s per clip, past ruim bij ~10 s). Kwaliteit is een gok; als het niks is, kan Thomas een eigen mp3 in `assets/sounds/disco.mp3` / `jig.mp3` zetten en het werkt hetzelfde.
5. **Dieren-cameo** wordt een extra beloning (`bonus_animal`, naast de vogelpoep), niet een idle-actie. Twee varianten: kop om de hoek (koe/varken/schaap, met moo/oink/bèh) of doorloop-met-drol. De drol blijft liggen tot de volgende ronde.
6. **Vuurwerkdans** wordt een gewone `slap_`-gag (~5 s), dus hij zit in de normale beloningsrotatie.
7. **Tik op het poppetje** werkt alleen als het spel wacht op een antwoord (niet tijdens praten/beloning). Hoofd (incl. hoed) = sterretjes; al het andere = scheetje. Bubbels tikken tijdens zo'n tik-animatie wint gewoon.
8. **Credits ElevenLabs:** ~12 nieuwe clips waarvan 2 muziekjes van 11 s. Check het saldo op het gratis plan voor je `npm run sfx` draait; het script slaat bestaande bestanden over, dus je kunt per stuk gaan.

---

## Volgorde

| # | Taak | Afhankelijk van |
|---|------|-----------------|
| 1 | Aarde en lucht doortrekken | – |
| 2 | Mechanisme: `fx` per frame + `props`/`music` per animatie + studio bewaart ze | – |
| 3 | Mechanisme: `jointXY()` en `SFX.play` geeft Audio terug + `music` in het spel | 2 |
| 4 | Nieuwe geluiden genereren (build-sfx.js) | – |
| 5 | Vogel 2× zo groot + kaaa | 4 |
| 6 | Bal tegen het hoofd | 2, 3, 4 |
| 7 | Tikken op het poppetje | 2, 3 |
| 8 | Dieren-cameo | 3, 4 |
| 9 | Vuurwerkdans | 2, 3, 4 |
| 10 | Teller + riverdance met muziek | 2, 3, 4 |
| 11 | Disco met kostuum en discobal | 10 |
| 12 | Build, telefoon-test, CLAUDE.md bijwerken | alles |

Taken 5–11 zijn onafhankelijk van elkaar zodra 2–4 klaar zijn. Na elke taak: `npm run build`, checken in browser, commit.

---

### Taak 1: Aarde en lucht doortrekken

Het probleem: de SVG is 360×520 en wordt gecentreerd in het scherm. Op een telefoon (hoger dan 360:520) zie je boven en onder de SVG de blauwe body-achtergrond, dus de aarde "stopt". Oplossing: de SVG mag buiten zijn kader tekenen (`overflow:visible`) en we tekenen extra lucht boven en extra aarde onder (en opzij, voor tablets in landscape).

**Files:**
- Modify: `src/game.html` (CSS-regel `svg{...}` en de eerste rects in de SVG)

**Stap 1:** In de CSS `svg{display:block;max-height:100%;max-width:100%;touch-action:manipulation}` wijzigen naar:

```css
svg{display:block;max-height:100%;max-width:100%;touch-action:manipulation;overflow:visible}
```

**Stap 2:** Direct na `<svg ...>` de eerste regel `<rect width="360" height="520" fill="#7fb4e6"/>` vervangen door:

```html
<rect x="-600" y="-900" width="1560" height="1420" fill="#7fb4e6"/>
<rect x="-600" y="484" width="1560" height="900" fill="#7a5230"/>
```

De tweede rect vervangt ook de bestaande `<rect x="0" y="484" width="360" height="36" fill="#7a5230"/>`; die regel weghalen. De donkere rand `y="484" height="4"` en het gras (`y="466"` en `y="470"`) ook verbreden naar `x="-600" width="1560"`.

**Stap 3:** `npm run build && npm run serve`, open op telefoonformaat (DevTools, iPhone). Controleer: geen blauw meer onder het gras, lucht loopt door tot boven, botjes staan nog op hun plek, bubbels en wolk ongewijzigd.

**Stap 4:** Commit: `git commit -am "Extend earth and sky beyond the viewBox so tall phones show no blue below the grass"`

---

### Taak 2: `fx` per keyframe, `props` en `music` per animatie

**Files:**
- Modify: `src/rig.js` — `makePlayer`, `makeDefaultLib` (helper `F`), `buildRig`/`createDoll`
- Modify: `src/studio.html` — `frameFromUI`, `renderFrames`, `loadAnim`, save-knop (regels 179–198)

**Stap 1: PROPS-tabel in rig.js** (na `SHAPES`, vóór `buildRig`). Elke prop hoort bij een gewricht en wordt standaard verborgen getekend. `behind:true` zet hem áchter de vorm van dat gewricht.

```js
// ===== Props: costume pieces, hidden unless an animation lists them in anim.props =====
const PROPS={
  torchL:{joint:'lHand',draw:g=>{g.append(el('rect',{x:-4,y:-34,width:8,height:40,rx:3,fill:'#8a5a2b',...OUT}));g.append(el('rect',{x:-6,y:-38,width:12,height:8,rx:2,fill:'#c8322b',...OUT}));}},
  torchR:{joint:'rHand',draw:g=>{g.append(el('rect',{x:-4,y:-34,width:8,height:40,rx:3,fill:'#8a5a2b',...OUT}));g.append(el('rect',{x:-6,y:-38,width:12,height:8,rx:2,fill:'#c8322b',...OUT}));}},
  afro:{joint:'top',behind:true,draw:g=>{for(const [x,y,r] of [[0,-56,40],[-34,-40,26],[34,-40,26],[-40,-14,20],[40,-14,20],[-18,-70,22],[18,-70,22]])g.append(el('circle',{cx:x,cy:y,r,fill:'#2b2622',...OUT}));}},
  shades:{joint:'top',draw:g=>{for(const s of[-1,1])g.append(el('circle',{cx:s*12,cy:-30,r:12,fill:'#2b2622',...OUT}));g.append(el('rect',{x:-3,y:-32,width:6,height:3,fill:'#2b2622'}));}},
  flareL:{joint:'lShin',behind:true,draw:g=>g.append(el('path',{d:'M-8,0 L-22,26 L22,26 L8,0 Z',fill:'#8e44ad',...OUT}))},
  flareR:{joint:'rShin',behind:true,draw:g=>g.append(el('path',{d:'M-8,0 L-22,26 L22,26 L8,0 Z',fill:'#8e44ad',...OUT}))},
  discoShirt:{joint:'torso',draw:g=>g.append(el('rect',{x:-32,y:-48,width:64,height:60,rx:14,fill:'#f39c12',...OUT}))},
};
```

**Stap 2: props bouwen in `buildRig`** — vóór `return groups;`:

```js
  groups.props={};
  for(const name in PROPS){const p=PROPS[name],g=el('g',{class:'prop_'+name});g.style.display='none';p.draw(g);
    const host=groups[p.joint];if(p.behind)host.insertBefore(g,host.firstChild);else host.append(g);groups.props[name]=g;}
```

Let op: `afro` hoort bij `top` maar moet ook achter de `head`-onderhelft blijven; met `behind:true` op `top` staat hij achter het gezicht maar vóór de onderste helft. Dat ziet er als cutout prima uit (het haar zit "op" de kin-helft). Als het toch stoort in de studio: prop aan `head` hangen met `behind:true`.

**Stap 3: `setProps` op de doll** — in `createDoll`:

```js
function createDoll(container){const groups=buildRig(container);
  const d={groups,pose:defaultPose(),apply(){applyPose(groups,d.pose);},set(p){d.pose=clone(p);d.apply();},
    setProps(list){list=list||[];for(const n in groups.props)groups.props[n].style.display=list.includes(n)?'':'none';}};
  d.apply();return d;}
```

**Stap 4: player geeft `fx` door en zet props** — `makePlayer` wordt:

```js
function makePlayer(doll,{fx}={}){
  let timer=null,onDone=null;
  function stop(){if(timer){clearInterval(timer);timer=null;}doll.setProps([]);}
  function play(anim,{loop=false,step=true,done}={}){stop();if(!anim||!anim.frames.length){done&&done();return;}
    const fr=anim.frames,fps=anim.fps||8;let i=0,sub=0;onDone=done;doll.setProps(anim.props);
    const tick=()=>{const k=fr[i],n=fr[(i+1)%fr.length];
      if(sub===0&&k.sound)SFX.play(k.sound);
      if(sub===0&&k.fx&&fx)fx(k.fx,k,anim);
      doll.set(step?k.pose:lerpPose(k.pose,n.pose,sub/k.hold));
      if(++sub>=k.hold){sub=0;i++;if(i>=fr.length){if(loop)i=0;else{stop();onDone&&onDone();}}}};
    tick();timer=setInterval(tick,1000/fps);}
  return {play,stop,playing:()=>!!timer,duration:a=>a.frames.reduce((s,k)=>s+k.hold,0)/(a.fps||8)*1000};
}
```

`duration(anim)` geeft de lengte in ms; overlays (discobal, vonken) gebruiken dat om zichzelf op te ruimen.

**Stap 5: helper `F` accepteert fx** — in `makeDefaultLib`:

```js
  const F=(hold,over,sound,fx)=>({hold,sound:sound||'',fx:fx||'',pose:pose(over)});
  const A=(fps,frames,extra={})=>({fps,frames,...extra});   // extra: {props:[...], music:'disco'}
```

**Stap 6: studio bewaart de nieuwe velden.** In `src/studio.html`:
- Naast `<label>sound ...</label>` (regel 73): `<label>fx <input type="text" id="nFx" placeholder="ball, sparks…" style="width:90px"></label>`
- `frameFromUI` → `({hold:+$('nHold').value||3,sound:$('selSound').value,fx:$('nFx').value.trim(),pose:clone(doll.pose)})`
- In `renderFrames` klik-handler en in `loadAnim`: `$('nFx').value=k.fx||'';` toevoegen naast `$('selSound').value=...`; badge `${k.fx?' ✨':''}` naast het 🔊-icoon.
- Save-knop (regel 198): `lib[n]={...(lib[n]||{}),fps:+$('nFps').value||8,frames:clone(keys)};` zodat `props` en `music` van een bestaande animatie blijven staan.
- Play-knop (regel 187): `player.play({...(lib[$('animName').value]||{}),fps:...,frames:keys},...)` zodat props ook in de studio zichtbaar zijn.

**Stap 7:** `npm run build`, open `docs/studio.html`: bestaande animaties spelen nog, fx-veld verschijnt, na "save" en "download" staat `fx` in de JSON. Open `docs/index.html`: spel werkt als voorheen.

**Stap 8:** Commit: `git commit -am "Rig: fx per keyframe, props and music per animation, player duration helper; studio keeps the new fields"`

---

### Taak 3: `jointXY()`, `SFX.play` geeft Audio terug, muziekspeler

**Files:**
- Modify: `src/rig.js` — `SFX.play` (twee `return`-paden) en synth-fallbacks voor nieuwe namen
- Modify: `src/game.html` — na `const player=makePlayer(doll);`

**Stap 1: `SFX.play` geeft het Audio-element terug** zodat het spel muziek kan stoppen:

```js
    if(f){const a=f.cloneNode();a.volume=1;a.play().catch(()=>{});return a;}
    const a=new Audio(base+k+'.mp3');files[k]=undefined;
    ...
    a.load();return a;}
```

**Stap 2: synth-fallbacks voor de nieuwe namen** in de `S`-tabel (anders weigert `play` ze). Muziek heeft geen synth: leeg blijft stil, dat is prima.

```js
    bird:()=>{sweep('square',900,600,0.12,0.15);sweep('square',950,500,0.14,0.15,0.15);},
    bonk:()=>{burst(0.12,'bandpass',900,0.6);sweep('sine',400,120,0.18,0.4);},
    moo:()=>sweep('sawtooth',180,120,0.8,0.2), oink:()=>{sweep('square',500,250,0.12,0.2);sweep('square',520,240,0.12,0.2,0.16);}, baa:()=>sweep('sawtooth',420,300,0.6,0.15),
    sparkle:()=>burst(2.5,'highpass',5000,0.15), whoosh:()=>{burst(0.6,'lowpass',900,0.9);sweep('sawtooth',200,60,0.6,0.2);},
    disco:()=>{}, jig:()=>{},
```

**Stap 3: `jointXY` en `music` in game.html**, direct na `const player=makePlayer(doll);` (de `fx`-handler komt in taak 6):

```js
// Screen position (svg user units) and rotation of a rig joint; dx,dy is an offset in the joint's own space.
function jointXY(id,dx=0,dy=0){const m=doll.groups[id].getCTM();const p=svg.createSVGPoint();p.x=dx;p.y=dy;const q=p.matrixTransform(m);
  return {x:q.x,y:q.y,r:Math.atan2(m.b,m.a)*180/Math.PI};}
const music={cur:null,play(n){this.stop();this.cur=SFX.play(n)||null;},stop(){if(this.cur){try{this.cur.pause();}catch(e){}this.cur=null;}}};
```

**Stap 4:** Check in console van `docs/index.html`: `jointXY('head')` geeft ongeveer `{x:126, y:245}`; `jointXY('lHand',0,14)` beweegt mee als je `doll.set(pose({lUpper:{r:-90}}))` doet.

**Stap 5:** Commit: `git commit -am "Game: jointXY helper and music player; SFX.play returns the Audio element"`

---

### Taak 4: Nieuwe geluiden genereren

**Files:**
- Modify: `tools/build-sfx.js` — `SFX`-tabel

**Stap 1:** Toevoegen aan de `SFX`-tabel:

```js
  bird_1:  ['cartoon crow caw, single loud kaaa, comedic, short',0.8],
  bird_2:  ['cartoon seagull squawk, single, short, comedic',0.8],
  bonk:    ['cartoon bonk, hollow coconut hit on a head, single, short',0.5],
  moo:     ['cartoon cow moo, single, comedic, short',1.2],
  oink:    ['cartoon pig oink oink, short, comedic',0.8],
  baa:     ['cartoon sheep baa, single, comedic',1.0],
  sparkle: ['handheld sparkler fizzing and crackling, fireworks, continuous, bright',3.0],
  whoosh:  ['big fire whoosh, flamethrower burst, short, cartoon',1.0],
  disco:   ['upbeat funky 70s disco groove, four on the floor drums, slap bass, wah guitar, cheerful, instrumental, loopable',11],
  jig:     ['fast irish jig, fiddle and tin whistle and bodhran, riverdance style, upbeat, instrumental, loopable',11],
```

De sound-generation API kent ook `loop:true` in de body; voor de twee muziekjes mag dat aan (naadloos), maar het is niet nodig.

**Stap 2:** `npm run sfx`. Bestaande bestanden worden overgeslagen; alleen de 10 nieuwe worden gemaakt. Luister ze na in `assets/sounds/`. Slecht? Naam als argument meegeven om opnieuw te genereren: `node tools/build-sfx.js disco`.

**Stap 3:** `npm run build` (bakt ze in). Commit: `git commit -am "Sounds: bird, bonk, farm animals, sparkler, whoosh, disco and jig music"`

---

### Taak 5: Vogel 2× zo groot met geluid

**Files:**
- Modify: `src/game.html` — `birdPoop()`

**Stap 1:** Vogel wordt een groepje met een lijf, 2× schaal, en roept bij binnenkomst:

```js
async function birdPoop(){const fx=$('fx');const bird=el('g');
  bird.append(el('ellipse',{cx:0,cy:0,rx:14,ry:9,fill:'#2b2622'}));                       // body
  bird.append(el('path',{d:'M-6,-2 Q0,-22 10,-6',fill:'#2b2622'}));                         // wing
  bird.append(el('circle',{cx:13,cy:-4,r:6,fill:'#2b2622'}));                               // head
  bird.append(el('path',{d:'M18,-4 L27,-2 L18,0 Z',fill:'#ffb300'}));                       // beak
  bird.append(el('circle',{cx:14,cy:-5,r:1.6,fill:'#fff'}));                                // eye
  fx.append(bird);SFX.play('bird');
  const flight=bird.animate([{transform:'translate(-40px,50px) scale(2)'},{transform:'translate(420px,30px) scale(2)'}],{duration:3000,easing:'linear'});
  const flap=bird.firstChild.nextSibling.animate([{transform:'scaleY(1)'},{transform:'scaleY(-0.6)'},{transform:'scaleY(1)'}],{duration:260,iterations:12});
  await wait(1100);/* rest as before: blob, drop, splat */
```

De rest van de functie blijft gelijk. De poepklodder start op `translate(150px,40px)`; met de grotere vogel op y≈40 klopt dat nog.

**Stap 2:** Test: in de console `birdPoop()` aanroepen na "Spelen!". Vogel is duidelijk groter, kaaa klinkt, klodder valt op het hoofd.

**Stap 3:** Commit: `git commit -am "Bigger cutout bird with a caw"`

---

### Taak 6: Bal tegen het hoofd

**Files:**
- Modify: `src/rig.js` — `slap_headspin`
- Modify: `src/game.html` — fx-handler (nieuw) + `makePlayer(doll,{fx})`

**Stap 1: fx-registry in game.html.** Vervang `const player=makePlayer(doll);` door:

```js
const FX={};   // name -> (frame, anim) => void; filled in below
const player=makePlayer(doll,{fx:(n,k,a)=>{if(FX[n])FX[n](k,a);}});
```

En de bal-handler (bij de andere overlay-functies):

```js
FX.ball=()=>{const fx=$('fx'),h=jointXY('head',0,-26);const b=el('g');
  b.append(el('circle',{r:16,fill:'#c8322b',stroke:'#2b2622','stroke-width':2.5}));b.append(el('path',{d:'M-16,0 Q0,-8 16,0 Q0,8 -16,0',fill:'#fff',stroke:'#2b2622','stroke-width':2}));
  fx.append(b);
  b.animate([{transform:`translate(420px,${h.y-40}px) rotate(0deg)`},{transform:`translate(${h.x+30}px,${h.y}px) rotate(-360deg)`}],{duration:420,easing:'linear',fill:'forwards'}).onfinish=()=>{
    b.animate([{transform:`translate(${h.x+30}px,${h.y}px)`},{transform:`translate(${h.x-80}px,${h.y-60}px)`},{transform:`translate(${h.x-200}px,${480}px)`}],{duration:700,easing:'ease-in',fill:'forwards'}).onfinish=()=>b.remove();};};
```

**Stap 2: headspin krijgt een aanloop-frame.** In `makeDefaultLib` de eerste twee frames van `slap_headspin` vervangen door:

```js
    slap_headspin:A(8,[F(4,{mouth:1,lIris:{x:3},rIris:{x:3}},'','ball'),   // 500 ms: ball flies in from the right, he looks the other way
      F(1,{head:{r:0},mouth:4,eyes:2},'bonk'),F(1,{head:{r:90},mouth:4},'spin'),F(1,{head:{r:180},mouth:4}),F(1,{head:{r:-90},mouth:4}),F(1,{head:{r:0},mouth:4}),
      ...rest ongewijzigd
```

De bal-vlucht duurt 420 ms, het eerste frame houdt 500 ms, dus de bonk valt op de inslag.

**Stap 3:** Test in de console: `player.play(lib.slap_headspin)`. Bal komt van rechts, raakt het hoofd, stuitert weg naar links, hoofd draait.

**Stap 4:** Commit: `git commit -am "Ball flies in and bonks his head before the headspin"`

---

### Taak 7: Tikken op het poppetje

**Files:**
- Modify: `src/rig.js` — twee animaties `tap_belly`, `tap_head`
- Modify: `src/game.html` — pointer-listener op `#rig`, `poke()`, `FX.headstars`

**Stap 1: animaties.**

```js
    // poke on the belly: quick surprised toot
    tap_belly:A(8,[F(1,{torso:{y:3},mouth:1,eyes:0,lIris:{y:2},rIris:{y:2}}),F(1,{root:{y:-8,x:4},torso:{r:-10},head:{r:-6},lUpper:{r:-80},rUpper:{r:-60},mouth:4,eyes:2},'fart'),
      F(2,{root:{y:-4,x:4},torso:{r:-8},head:{r:-4},lUpper:{r:-70},rUpper:{r:-50},mouth:4,eyes:2}),F(2,{mouth:1,eyes:0,lIris:{x:-4},rIris:{x:4}}),F(2,base)]),
    // poke on the head: dazed, stars circle the head, eyes squeezed
    tap_head:A(8,[F(1,{head:{y:4},mouth:1},'bonk','headstars'),F(3,{head:{r:-14},mouth:1,eyes:2}),F(3,{head:{r:12},mouth:1,eyes:2}),F(3,{head:{r:-8},mouth:2,eyes:2}),
      F(2,{head:{r:0},mouth:0,eyes:0,lIris:{x:-5},rIris:{x:5}}),F(2,base)]),
```

**Stap 2: sterretjes-overlay.** Vijf sterren lopen 1,6 s in een ellips om het hoofd:

```js
FX.headstars=()=>{const fx=$('fx'),g=el('g');fx.append(g);const stars=[];
  for(let i=0;i<5;i++){const s=el('path',{d:'M0,-7 L2,-2 L7,-2 L3,1 L4,6 L0,3 L-4,6 L-3,1 L-7,-2 L-2,-2 Z',fill:'#ffd400',stroke:'#2b2622','stroke-width':1.5});g.append(s);stars.push(s);}
  const t0=performance.now();(function step(t){const el=t-t0;if(el>1600){g.remove();return;}
    const h=jointXY('head',0,-40);stars.forEach((s,i)=>{const a=el/250+i*Math.PI*2/5;const y=Math.sin(a);
      s.setAttribute('transform',`translate(${h.x+Math.cos(a)*46},${h.y+y*12}) scale(${0.7+0.3*y})`);});requestAnimationFrame(step);})(t0);};
```

**Stap 3: tik-detectie.** Eén listener op de rig-groep; hoofd/hoed = `.j_head`/`.j_top`, rest = buik:

```js
$('rig').addEventListener('pointerdown',e=>{const head=e.target.closest('.j_head, .j_top');poke(head?'head':'belly');});
async function poke(kind){if(state!=='waiting'&&state!=='idling')return;clearTimeout(idleT);player.stop();state='idling';
  await playAsync(lib['tap_'+kind]);if(state==='idling'){state='waiting';scheduleIdle();}}
```

`onTap` (bubbel) accepteert al `state==='idling'` en doet `player.stop()`, dus een bubbel-tik tijdens een poke wint.

**Stap 4:** Test op telefoonformaat: tik op buik → scheetje; tik op hoed → bonk + sterretjes rond het hoofd, ogen `><`; tijdens praten gebeurt er niets.

**Stap 5:** Commit: `git commit -am "Poke him: belly toots, head gets bonked with stars"`

---

### Taak 8: Dieren-cameo

**Files:**
- Modify: `src/rig.js` — `bonus_animal`
- Modify: `src/game.html` — `drawAnimal()`, `animalCameo()`, kansverdeling in `onTap`, opruimen in `nextRound`

**Stap 1: Terrance's reactie** (kijkt opzij, schrikt, lacht):

```js
    bonus_animal:A(6,[F(4,{head:{r:-18},mouth:1,lIris:{x:-6},rIris:{x:-6}}),F(3,{head:{r:-22},mouth:4,eyes:0,lIris:{x:-6},rIris:{x:-6},root:{y:-6}}),
      F(6,{head:{r:-12},mouth:1,lIris:{x:-6},rIris:{x:-6}}),F(5,{head:{r:6},mouth:3,eyes:2}),F(4,{head:{r:-6},mouth:2,eyes:2}),F(2,base)]),
```

De game speelt hem in een `loop` zolang de cameo duurt; `head.r` negatief = kijkt naar links. Bij een dier van rechts spiegelt de game niet de pose maar kiest gewoon links als standaardkant (dier komt altijd van links, loopt naar rechts). Simpel, YAGNI.

**Stap 2: dieren tekenen** (cutout, kijkend naar rechts, oorsprong = voeten op de grond):

```js
const ANIMALS={
  cow:{sound:'moo',body:'#fff',draw(g){g.append(el('rect',{x:-40,y:-52,width:80,height:40,rx:14,fill:'#fff',...OUT}));for(const [x,y,r] of[[-22,-40,9],[8,-28,11],[24,-44,7]])g.append(el('circle',{cx:x,cy:y,r,fill:'#2b2622'}));
    g.append(el('rect',{x:30,y:-70,width:34,height:30,rx:10,fill:'#fff',...OUT}));g.append(el('rect',{x:44,y:-56,width:24,height:16,rx:6,fill:'#f4a7b9',...OUT}));
    g.append(el('circle',{cx:50,cy:-62,r:2.5,fill:'#2b2622'}));g.append(el('path',{d:'M34,-70 l-6,-10 M58,-70 l6,-10',stroke:'#2b2622','stroke-width':3,'stroke-linecap':'round'}));}},
  pig:{sound:'oink',draw(g){g.append(el('rect',{x:-36,y:-46,width:72,height:36,rx:16,fill:'#f4a7b9',...OUT}));g.append(el('circle',{cx:38,cy:-52,r:17,fill:'#f4a7b9',...OUT}));
    g.append(el('ellipse',{cx:50,cy:-48,rx:8,ry:6,fill:'#e88aa0',...OUT}));g.append(el('circle',{cx:47,cy:-48,r:1.5,fill:'#2b2622'}));g.append(el('circle',{cx:53,cy:-48,r:1.5,fill:'#2b2622'}));
    g.append(el('circle',{cx:40,cy:-58,r:2.5,fill:'#2b2622'}));g.append(el('path',{d:'M-36,-36 q-12,-6 -6,-14 q-8,2 -4,8',fill:'none',stroke:'#2b2622','stroke-width':3,'stroke-linecap':'round'}));}},
  sheep:{sound:'baa',draw(g){for(const [x,y,r] of[[-30,-40,16],[-10,-48,18],[12,-46,17],[30,-38,15],[0,-32,18],[-22,-28,14],[22,-28,14]])g.append(el('circle',{cx:x,cy:y,r,fill:'#f4efe2',...OUT}));
    g.append(el('ellipse',{cx:44,cy:-46,rx:14,ry:11,fill:'#2b2622',...OUT}));g.append(el('circle',{cx:48,cy:-49,r:2.5,fill:'#fff'}));}},
};
function drawAnimal(kind){const g=el('g');const legs=el('g');for(const x of[-26,-12,14,28])legs.append(el('rect',{x:x-4,y:-16,width:8,height:16,rx:3,fill:'#2b2622'}));g.append(legs);ANIMALS[kind].draw(g);g.legs=legs;return g;}
```

**Stap 3: cameo-flow.** Twee varianten; loopt op y=470 (gras), stopt in het midden, drol blijft (`class="stay"`):

```js
async function animalCameo(){const kind=rnd(Object.keys(ANIMALS)),fx=$('fx'),a=drawAnimal(kind);fx.append(a);
  player.play(lib.bonus_animal,{loop:true});   // Terrance keeps reacting for as long as the animal is on screen
  if(Math.random()<0.4){  // peek: head pokes in from the left edge
    a.setAttribute('transform','translate(-90,470)');await a.animate([{transform:'translate(-90px,470px)'},{transform:'translate(-20px,470px)'}],{duration:350,easing:'steps(3)',fill:'forwards'}).finished;
    SFX.play(ANIMALS[kind].sound);await wait(300);await a.animate([{transform:'translate(-20px,470px) rotate(0)'},{transform:'translate(-20px,470px) rotate(-8deg)'},{transform:'translate(-20px,470px) rotate(8deg)'},{transform:'translate(-20px,470px) rotate(0)'}],{duration:500,easing:'steps(4)'}).finished;
    await wait(400);await a.animate([{transform:'translate(-20px,470px)'},{transform:'translate(-90px,470px)'}],{duration:300,easing:'steps(3)',fill:'forwards'}).finished;
  }else{               // walk across, drop one in the middle, walk off
    const gait=a.legs.animate([{transform:'rotate(-12deg)'},{transform:'rotate(12deg)'},{transform:'rotate(-12deg)'}],{duration:400,iterations:Infinity,easing:'steps(4)'});
    SFX.play(ANIMALS[kind].sound);
    await a.animate([{transform:'translate(-100px,470px)'},{transform:'translate(190px,470px)'}],{duration:2600,easing:'steps(26)',fill:'forwards'}).finished;
    gait.pause();await wait(500);SFX.play('fart');
    const poo=el('path',{class:'stay',d:'M-16,0 Q-18,-8 -8,-8 Q-10,-16 0,-14 Q4,-22 8,-12 Q18,-12 14,-4 Q20,0 12,2 Z',fill:'#7a5230',stroke:'#2b2622','stroke-width':2,transform:'translate(150,474)'});
    fx.insertBefore(poo,a);SFX.play('plof');await wait(700);SFX.play(ANIMALS[kind].sound);gait.play();
    await a.animate([{transform:'translate(190px,470px)'},{transform:'translate(480px,470px)'}],{duration:2600,easing:'steps(26)',fill:'forwards'}).finished;
  }
  a.remove();player.stop();doll.set(defaultPose());}
```

**Stap 4: kansverdeling en opruimen.** In `onTap`:

```js
    const roll=Math.random();
    if(roll<0.10)await birdPoop();else if(roll<0.20)await animalCameo();else if(roll<0.32)await playAsync(pick('cheer_'));else await playAsync(pick('slap_'));
```

In `nextRound`, na `hideBubbles();`: `$('fx').querySelectorAll('.stay').forEach(e=>e.remove());`

**Stap 5:** Test via console: `animalCameo()` een paar keer. Dier loopt vóór Terrance langs (fx-laag ligt boven de rig, dat is de bedoeling), stopt, drol, geluid, loopt weg; drol verdwijnt bij de volgende ronde. Peek-variant: kop steekt links uit beeld.

**Stap 6:** Commit: `git commit -am "Farm animal cameo: peeks in or walks by and leaves a poo"`

---

### Taak 9: Vuurwerkdans (Romeinse kaarsen)

**Files:**
- Modify: `src/rig.js` — `slap_sparklers` met `props:['torchL','torchR']`
- Modify: `src/game.html` — `FX.sparks`, `FX.flame`

**Stap 1: animatie.** Armen gestrekt opzij, heupen wiegen (4 keer), dan rechterfakkel achter de billen, scheet, steekvlam.

```js
    slap_sparklers:(()=>{const arms={lUpper:{r:-95},rUpper:{r:95},lLower:{r:0},rLower:{r:0},lHand:{r:0},rHand:{r:0}};
      const sway=(d)=>({...arms,root:{x:6*d},torso:{r:8*d},head:{r:-6*d},lThigh:{r:-8*d},rThigh:{r:-8*d},mouth:d>0?2:3});
      const bum={root:{y:-6,x:10},torso:{r:-16},head:{r:-8},lThigh:{r:26},rThigh:{r:22},lShin:{r:-12},rShin:{r:-12},lUpper:{r:-100},lLower:{r:-20},rUpper:{r:150},rLower:{r:60},rHand:{r:30}};
      return A(8,[F(1,{...arms,mouth:1},'sparkle','sparks'),F(3,sway(1)),F(3,sway(-1)),F(3,sway(1)),F(3,sway(-1)),F(3,sway(1)),F(3,sway(-1)),
        F(3,{...arms,mouth:1,eyes:0,lIris:{x:4},rIris:{x:4}}),F(3,{...bum,mouth:0,eyes:1}),
        F(1,{...bum,mouth:4,eyes:2},'fart'),F(4,{...bum,mouth:4,eyes:2,hat:{y:-10,r:10}},'whoosh','flame'),F(3,{...bum,mouth:1,eyes:2}),
        F(2,{mouth:1,eyes:0,lIris:{x:-4},rIris:{x:4}}),F(2,base)],{props:['torchL','torchR']});})(),
```

Hoe `rUpper:150` de fakkel precies achter de billen krijgt: afstellen in de studio (props zijn daar zichtbaar na taak 2 stap 6).

**Stap 2: vonken** vanaf beide fakkeltoppen (top van de fakkel is `(0,-38)` in hand-ruimte), 2,6 s lang:

```js
FX.sparks=()=>{const fx=$('fx'),t0=performance.now();(function step(t){if(t-t0>2600)return;
  for(const hand of['lHand','rHand']){const p=jointXY(hand,0,-38);for(let i=0;i<2;i++){const s=el('circle',{r:2+Math.random()*2,fill:rnd(['#ffd400','#ff7a00','#fff'])});fx.append(s);
    const a=Math.random()*Math.PI*2,d=25+Math.random()*30;
    s.animate([{transform:`translate(${p.x}px,${p.y}px)`,opacity:1},{transform:`translate(${p.x+Math.cos(a)*d}px,${p.y+Math.sin(a)*d-10}px)`,opacity:0}],{duration:300+Math.random()*200}).onfinish=()=>s.remove();}}
  requestAnimationFrame(step);})(t0);};
```

**Stap 3: steekvlam** achter de billen, uitgelijnd op de romp-rotatie:

```js
FX.flame=()=>{const fx=$('fx'),p=jointXY('torso',-30,8);const g=el('g',{transform:`translate(${p.x},${p.y}) rotate(${p.r})`});
  g.append(el('path',{d:'M0,-14 Q-60,-30 -130,0 Q-60,30 0,14 Z',fill:'#ff7a00',stroke:'#2b2622','stroke-width':2.5}));
  g.append(el('path',{d:'M0,-7 Q-40,-14 -90,0 Q-40,14 0,7 Z',fill:'#ffd400'}));fx.append(g);
  g.animate([{transform:`translate(${p.x}px,${p.y}px) rotate(${p.r}deg) scale(0.2,0.6)`},{transform:`translate(${p.x}px,${p.y}px) rotate(${p.r}deg) scale(1.1,1)`},{transform:`translate(${p.x}px,${p.y}px) rotate(${p.r}deg) scale(1,0.9)`},{transform:`translate(${p.x}px,${p.y}px) rotate(${p.r}deg) scale(0.3,0.2)`}],{duration:550,easing:'steps(5)'}).onfinish=()=>g.remove();};
```

**Stap 4:** Test: `player.play(lib.slap_sparklers)`. Fakkels verschijnen alleen tijdens deze animatie en verdwijnen daarna. Vonken komen uit de toppen, de vlam schiet naar links uit de billen. Poses fijnslijpen in de studio, exporteren naar `animations.json`.

**Stap 5:** Commit: `git commit -am "Sparkler dance: torches, sparks, one behind the bum, fart-powered flame jet"`

---

### Taak 10: Teller en riverdance met muziek

**Files:**
- Modify: `src/rig.js` — dans-generator + `dance_riverdance`
- Modify: `src/game.html` — `danceParty()`, aanroep in `onTap`

**Stap 1: generator in `makeDefaultLib`.** Bouwt `n` frames van elk hold 1 met een functie per frame-index:

```js
  const seq=(fps,n,fn,extra)=>A(fps,Array.from({length:n},(_,i)=>{const o=fn(i);return {hold:1,sound:o.sound||'',fx:o.fx||'',pose:pose(o)};}),extra);
```

(`pose()` negeert onbekende sleutels als `sound`/`fx` niet: pas `pose()` aan zodat het alleen sleutels uit `R` plus `mouth`/`eyes` overneemt: `for(const k in over){if(k in p)...}` — `p` heeft precies die sleutels, dus `if(!(k in p))continue;` toevoegen.)

**Stap 2: riverdance** — stijve armen, hoge kicks, knieën de verkeerde kant op, hopje elke 8 frames. 80 frames op 8 fps = 10 s.

```js
    dance_riverdance:seq(8,80,i=>{const ph=i%8,stiff={lUpper:{r:4},rUpper:{r:-4},lLower:{r:0},rLower:{r:0},mouth:0,eyes:0,lIris:{x:2},rIris:{x:-2}};
      const bob={root:{y:i%2?-10:0}};
      if(i>=64)return {...stiff,root:{y:i%2?-30:-6},lThigh:{r:-100+(i%2)*30},rThigh:{r:100-(i%2)*30},lShin:{r:90},rShin:{r:-90},head:{r:i%2?8:-8},mouth:4,sound:i%2?'':'boing'};   // finale: both legs out, knees backwards, bouncing
      if(ph<2)return {...stiff,...bob,lThigh:{r:-120},lShin:{r:-70},lFoot:{r:40},rShin:{r:5}};        // left kick, knee bent the wrong way
      if(ph<4)return {...stiff,...bob,lThigh:{r:20},lShin:{r:60},rThigh:{r:0}};                       // left leg back
      if(ph<6)return {...stiff,...bob,rThigh:{r:120},rShin:{r:70},rFoot:{r:-40},lShin:{r:-5}};       // right kick
      return {...stiff,root:{y:ph===7?-26:0},sound:ph===6?'thud':''};                                  // hop
    },{music:'jig'}),
```

**Stap 3: `danceParty` in het spel**, na de lofzin in `onTap` (goed-tak), vóór `await wait(400);nextRound();`:

```js
    if(score%10===0){await danceParty();}
```

```js
async function danceParty(){const d=pick('dance_');stars();music.play(d.music);await playAsync(d);music.stop();stars();await speakAsync(rnd(PRAISE[cfg.lang]));}
```

`score` wordt al bijgehouden en op 0 gezet bij "Opslaan en spelen". Aan het begin van `danceParty` mag `stars()` een tweede keer met een kleine vertraging voor extra feest.

**Stap 4:** Test: in de console `score=9` zetten en één goed antwoord geven, of direct `danceParty()`. Muziek start en stopt samen met de dans (~10 s). Zonder mp3 (synth leeg) is er alleen de dans; dat is acceptabel gedrag.

**Stap 5:** Commit: `git commit -am "Every 10th correct answer: riverdance with music"`

---

### Taak 11: Disco met kostuum en discobal

**Files:**
- Modify: `src/rig.js` — `dance_disco`
- Modify: `src/game.html` — `FX.discoball`

**Stap 1: disco** — Travolta-wijsvinger, heupen, elke 16 frames een headspin, finale in spagaat.

```js
    dance_disco:seq(8,80,i=>{const d=i%4<2?1:-1,ph=i%16,base2={eyes:0,mouth:i%2?1:3,lIris:{x:2},rIris:{x:-2}};
      const hips={root:{x:8*d,y:i%2?-4:0},torso:{r:-8*d},head:{r:6*d},lThigh:{r:-12*d},rThigh:{r:-12*d},lShin:{r:14*d},rShin:{r:14*d}};
      if(i===0)return {...base2,...hips,fx:'discoball'};
      if(i>=72)return {...base2,root:{y:34},lThigh:{r:88},rThigh:{r:-88},lShin:{r:0},rShin:{r:0},lFoot:{r:-90},rFoot:{r:90},lUpper:{r:-170},rUpper:{r:20},lLower:{r:0},rLower:{r:60},mouth:4,eyes:i%2?2:0,sound:i===72?'plof':''};
      if(ph>=12)return {...base2,...hips,head:{r:[0,90,180,-90][ph-12]},lUpper:{r:-160},rUpper:{r:160},lLower:{r:0},rLower:{r:0},sound:ph===12?'spin':''};
      return {...base2,...hips,lUpper:{r:d>0?-170:-30},lLower:{r:0},rUpper:{r:d>0?30:170},rLower:{r:0},lHand:{r:d>0?0:-40}};   // point up / point down
    },{music:'disco',props:['afro','shades','flareL','flareR','discoShirt']}),
```

**Stap 2: discobal** hangt rechtsboven (bubbels zijn verborgen tijdens de beloning), draait, en ruimt zichzelf op na de duur van de animatie:

```js
FX.discoball=(k,anim)=>{const fx=$('fx'),g=el('g');g.append(el('line',{x1:0,y1:-140,x2:0,y2:-26,stroke:'#2b2622','stroke-width':2}));
  const ball=el('g');ball.append(el('circle',{r:26,fill:'#dfe6ee',stroke:'#2b2622','stroke-width':2.5}));
  for(let y=-20;y<=20;y+=10)ball.append(el('line',{x1:-26,y1:y,x2:26,y2:y,stroke:'#2b2622','stroke-width':1}));
  for(let x=-20;x<=20;x+=10)ball.append(el('line',{x1:x,y1:-26,x2:x,y2:26,stroke:'#2b2622','stroke-width':1}));g.append(ball);
  for(const c of['#ff3b3b','#3bff5c','#3b8bff','#ffe83b']){const spot=el('circle',{r:22,fill:c,opacity:0.35});g.append(spot);
    spot.animate([{transform:`translate(${-120+Math.random()*240}px,${120+Math.random()*250}px)`},{transform:`translate(${-120+Math.random()*240}px,${120+Math.random()*250}px)`}],{duration:900+Math.random()*600,direction:'alternate',iterations:Infinity,easing:'steps(6)'});}
  fx.append(g);g.setAttribute('transform','translate(280,110)');
  ball.animate([{transform:'scaleX(1)'},{transform:'scaleX(-1)'},{transform:'scaleX(1)'}],{duration:1200,iterations:Infinity,easing:'steps(8)'});
  g.animate([{transform:'translate(280px,-60px)'},{transform:'translate(280px,110px)'}],{duration:600,easing:'steps(6)',fill:'forwards'});
  setTimeout(()=>g.remove(),player.duration(anim));};
```

**Stap 3:** Test `player.play(lib.dance_disco)` in spel én studio. Afro, bril en pijpen verschijnen alleen tijdens de dans. Kostuumvormen fijnslijpen in `PROPS` (kleuren, groottes) totdat het als cutout klopt.

**Stap 4:** Commit: `git commit -am "Disco dance with afro, shades, flares and a disco ball"`

---

### Taak 12: Build, telefoon-test, documentatie

**Stap 1:** `npm run build` → commit `docs/`. Let op de bestandsgrootte die het script print (twee muziekclips van 11 s erbij ≈ +0,4 MB base64; dat kan de home-screen-app nog prima aan).

**Stap 2:** Push, wacht op GitHub Pages, test op de iPhone: aarde onderin, tik op buik/hoofd, een paar rondes tot het dansje (tijdelijk `score%10` op `%3` zetten om sneller te testen; daarna terug).

**Stap 3:** `CLAUDE.md` bijwerken:
- Naamregels: `tap_*` (tik op poppetje), `bonus_animal`, `dance_*` (elke 10e goed, met `music`), `props` en `fx` per animatie/keyframe.
- SFX-namen: bird, bonk, moo, oink, baa, sparkle, whoosh, disco, jig.
- "Where we left off": dit plan afgevinkt; ideeën die overblijven (zichtbare sterren-teller, Phillip, fotohoofden).

**Stap 4:** Commit: `git commit -am "Docs: new animation categories, props/fx, new sounds"`

---

## Geluiden-overzicht (nieuw)

| Naam | Waar | Bron |
|------|------|------|
| bird_1, bird_2 | vogel vliegt in | sound-generation |
| bonk | bal op hoofd, tik op hoofd | sound-generation |
| moo, oink, baa | dieren-cameo | sound-generation |
| sparkle (3 s) | fakkels | sound-generation |
| whoosh | steekvlam | sound-generation |
| disco, jig (11 s) | dansje | sound-generation (of eigen mp3) |
