# Terrance leert letters — project brief

Put this file in the repo root as `CLAUDE.md`. It explains what the project is, how it's built, and where we left off.

## What this is
A letter/number learning game for 3-year-olds, with a South Park "Terrance and Phillip"-style cutout character. The pedagogy is thin on purpose: Terrance says a letter, number, or a family name; two big bubbles appear; the kid taps one. **The reward is slapstick**: a correct answer triggers a faceplant, slip, sneeze, hat flying off, fart-launch, headspin, bird poop or giant fart. A wrong answer gets a low-key shrug/confused look and he repeats the target. No losing, no scores, no menus.

Owner: Thomas (Hengelo, NL). Kids speak Dutch. Testing has been on an iPhone; target is iPhone + an Android tablet, **not via app stores** — a single HTML file on GitHub Pages, added to the home screen.

## Repo layout
```
config.json            names, language, ElevenLabs voice settings
src/rig.js             SHARED: character rig, pose model, SVG drawing, synth sound effects,
                       keyframe player, speech/mouth sync, PHRASES, makeDefaultLib() (all animations)
src/game.html          game template. Placeholders: __ASSETS__ and __RIG__ (filled by build)
src/studio.html        animation editor template. Placeholder: __RIG__
tools/phrases.js       derives the full spoken-phrase list from config.json + PHRASES
tools/env.js           loads .env (ELEVENLABS_API_KEY) — never print it
tools/build-voice.js   ONE-OFF batch: generates missing phrase mp3s via ElevenLabs (v3, nl)
tools/build-sfx.js     ONE-OFF batch: generates sound effects via ElevenLabs sound-generation
tools/voice-test.js    sample clips per candidate voice into voice-test/ (gitignored)
tools/build.js         bakes rig + animations.json + all mp3s (base64) into docs/index.html and docs/studio.html
assets/sounds/*.mp3    sound effects (optional; synth fallback per missing file)
assets/voice/nl/*.mp3  generated voice clips, file name = slug(text)
animations.json        optional override exported from the studio (merged over defaults)
manifest.webmanifest, icon.png   PWA bits, copied to docs/
docs/                  build output — GitHub Pages serves this folder (Pages only allows / or /docs)
```
`npm run voice`, `npm run sfx` (both read `.env`), `npm run build`, `npm run serve`.

## How the character works (src/rig.js)
- `R` = joint table, parent-relative, y down. Root at hips. Chain: root → torso → head (bottom half, pivot at neck) → top (upper half of head) → lIris/rIris/hat. Arms: torso → lUpper → lLower → lHand (same right). Legs: torso → lThigh → lShin → lFoot.
- Each joint has `{x,y,r}` (offset + rotation). A pose also has `mouth` (0–4) and `eyes` (0 open / 1 closed / 2 squint "><" / 3 knocked-out "X X").
- **Mouth is the South Park split head**: the *top* half lifts off the *bottom* half. States: 0 closed, 1 open (+10px), 2 open tilted left, 3 open tilted right, 4 "Loud!" (+26px). Table `MOUTH`.
- Character is cross-eyed by default (comedic); irises are draggable joints so they can drift.
- `pose(overrides)` builds a full pose from defaults; `makeDefaultLib()` defines every animation as keyframes `{hold, sound, fx, pose}` at a given fps, played stepped (jerky) by `makePlayer`. `seq(fps, n, i => overrides)` generates long animations (the dances) frame by frame; the overrides may carry `sound`/`fx`.
- **`fx` per keyframe**: a name the player hands to the game (`makePlayer(doll, {fx})`), which draws an overlay: `ball` (flies in and bonks the head), `headstars`, `sparks` (from both torch tips), `flame` (jet out of the bum), `discoball`. Handlers live in `FX` in game.html and use `jointXY(joint, dx, dy)` for screen position + rotation of a joint.
- **Props** (`PROPS` in rig.js): costume pieces attached to a joint, hidden unless `anim.props` lists them: torchL/torchR, afro, shades, flareL/flareR, discoShirt. `z:'back'|'mid'` controls layering; `doll.setProps(list)`. `anim.music` names a long mp3 the game starts/stops around the animation.
- Animation naming drives game behaviour: `idle_*` (between rounds), `slap_*` (correct answer, 68%), `cheer_*` (12%), `bonus_poop` (10%, bird overlay), `bonus_animal` (10%, looped while a cow/pig/sheep peeks in or walks by and leaves a poo — `ANIMALS` in game.html), `mild_*` (wrong answer), `tap_belly`/`tap_head` (kid pokes the character; head incl. hat = stars, anything else = toot), `dance_*` (every 10th correct answer, 10 s, with `music`), `speak_point`, `count_hop`. Add a `slap_xyz` and the game picks it up.
- Sounds: `SFX.play(name)` returns the Audio element — names: fart, bigfart, boing, thud, slip, whistle, splat, sneeze, ding, pop, spin, plof (dull body hit), oef, au (short yelps in the game voice via TTS), bird (kaaa), bonk, moo, oink, baa, sparkle (3 s fizz), whoosh, disco/jig (10 s music, no synth fallback). Comedy rule from Thomas: short, fast sounds in quick succession. Lookup order: baked `window.ASSETS.sounds` → `sounds/<name>.mp3` next to the html → WebAudio synth. Variants: `fart_1.mp3`, `fart_2.mp3` … are picked at random for `fart` (any name works the same).
- Voice: `speak(text, doll, {lang, done})`. Lookup: baked `window.ASSETS.voice['nl-NL:text']` → localStorage cache → live ElevenLabs (only if a key is set in the game's ⚙) → `voice/<lang>/<slug>.mp3` → phone TTS pitched up. Playback uses `preservesPitch=false` + `playbackRate` (VOICE.cfg.rate, default 1.25, "Gekke stem" slider) for the nasal T&P sound. Mouth is driven per character while audio plays (`mouthForChar`).
- `PHRASES` (praise/oops/number words per language, letters A–Z) lives in rig.js so the build script and the game share it. Names come from config.json / ⚙ settings.

## Game flow (src/game.html)
Start overlay ("Spelen!") unlocks audio. Rounds cycle `letter, letter, number, letter, word`. Letters come from the configured names (so Mama/Papa/kids' names first), distractor from the alphabet. Numbers 1–5 show dots too and are counted with hops. Words are the names. Correct → stars + slapstick + praise (every 10th correct answer: `danceParty()`, riverdance or disco with music); wrong → mild anim + "Hmm, nee." + wrong bubble shakes, correct bubble pulses, target repeated. Idle animations fire randomly while waiting; tapping the character while waiting plays `tap_head`/`tap_belly` (bubble taps still win). The `score` counter is invisible on purpose. The svg has `overflow:visible` and oversized sky/earth rects so tall phones never show the body background. Settings (⚙): names, language, optional ElevenLabs key/voice, absurdity slider, paste animations.json. Persisted in localStorage.

## Studio (src/studio.html)
Touch-first editor. Drag the white dot at the end of a bone and it follows your finger; big dot at hips moves the body; irises and hat are move-joints. Buttons for mouth states/eyes, "Say it" test, keyframe timeline with hold + sound + fx per frame, fps, jerky/tween, save to library (keeps `props`/`music` of an existing animation), download animations.json. Pre-loaded with all default animations for tuning; props show while an animation with `props` plays.

## Where we left off / next steps
1. DONE (2026-09-11): voice + sound effects both come from ElevenLabs (free plan, key in `.env`, loaded by tools/env.js). Custom voice "Nederlandse terrence V1" made with Voice Design in the ElevenLabs web UI (API voice design is paid-only). Model `eleven_v3` + `language_code: nl`; single letters are sent as "A." (config `letters.suffix`) — plain "A" on multilingual_v2 came out English. Sound effects via `npm run sfx` (tools/build-sfx.js). Build output is `docs/` (GitHub Pages only allows / or /docs). Default "Gekke stem" rate 1.05.
2. Free-plan limits: legacy library voices give 402 via API, only current premade voices and own voices work. Voice design/remix via API gives 403.
3. DONE (2026-09-11, plan in `plans/2026-09-11-slapstick-uitbreiding.md`): earth extended, bigger bird with caw, ball before the headspin, poke gags, farm animal cameo, sparkler dance, riverdance + disco every 10th correct answer with ElevenLabs-generated music. Not yet checked on the phone: the new poses (sparkler bum pose, dance kicks, animal sizes) probably need studio tuning. If the generated music is poor, drop a royalty-free `disco.mp3`/`jig.mp3` (10 s) into `assets/sounds/` and rebuild.
4. Tune animations in the studio — faceplant and slip poses were expected to need the most work. Export → `animations.json` → rebuild.
5. Ideas not built yet: a visible row of 10 stars filling up towards the dance, photo heads (the `top` and `head` groups are clipped halves designed so a photo can be dropped into each), a Phillip character, more `slap_*` gags, letters of the kids' own names as a level, sound preview button in the studio. Plans/design docs go in `plans/`, never `docs/` (that is the Pages output).

## Conventions
- Single-file outputs; no build framework, no bundler, no dependencies. Node 18+ only for the two scripts.
- Keep everything touch-friendly and phone-portrait first (viewBox 360×520 for the game, 360×440 studio).
- Don't call ElevenLabs from the game at runtime by default — cost control. Batch via tools/build-voice.js.
- Animations stay "jerky": stepped playback at ~8 fps is the look, not a bug. `densify()` in rig.js adds automatic in-between frames (~30% more keyframes) where a keyframe is followed by a big pose change, so falls read better; tune with its `threshold`/`big` defaults. Falls to the left use `flat(-1)` with the hips shifted right so the head stays on screen.
