# Slinger naar het feestje — ontwerp

Datum: 11 september 2026. Gesprek met Thomas: "een extra dimensie, maar simpel houden". Gekozen richting: iets voor de kinderen om naartoe te werken, zonder score. Vorm: een slinger in de lucht die volloopt naar een eindfeestje.

## Wat het kind ziet

Onder de wolk met de letter hangt een touw met 10 lege witte vlaggetjes. Elk goed antwoord vliegt een ster van Terrance naar het volgende lege vlaggetje, dat van kleur wordt ("pop"). Bij 10 gekleurde vlaggetjes wappert de hele slinger, de toeter gaat, en er start willekeurig een van drie feestjes: riverdance, disco of het partyfeest. Daarna vallen de vlaggetjes een voor een van het touw en begint het opnieuw. Het aantal wordt onthouden, dus de app dichtdoen bij 7 kost niets.

Bewust niet: geen getal, geen "nog drie te gaan", geen verschillende feestjes per rij.

## 1. Slinger (src/game.html)

- Nieuwe SVG-groep `slinger`, direct na de lucht-rects en vóór `target`, dus achter alles getekend.
- Touw: kwadratische boog van (-10, 102) via (180, 150) naar (370, 102), inktkleur, 3 px.
- 10 vlaggetjes op het touw (parameter t van 0,05 tot 0,95), driehoek 24 breed en 26 hoog, hangend naar beneden, wit met de inktrand (uitgeknipt-papier stijl). Gevuld = een van vijf kleuren: geel `#ffd400`, oranje `#ff7a00`, rood `#c8322b`, groen `#5ea24a`, blauw `#3a7bd5`.
- De hoed van Terrance staat in rust op y 160, dus de slinger hangt net erboven. Bij sprongen gaat de hoed er gewoon voorlangs.

## 2. Vlaggetje erbij

- In `onTap` bij een goed antwoord, direct na `stars()`: `addFlag()`. Niet awaiten, loopt parallel aan de gag.
- Eén ster (zelfde pad als de sterrenregen) vliegt in 500 ms van (126, 300) naar het vlaggetje, ease-in. Bij aankomst: vlaggetje krijgt zijn kleur, schaalt kort 1 → 1,3 → 1 en klinkt `pop`.
- Kleur per vlaggetje: cyclisch uit de vijf kleuren (positie modulo 5), dus de rij ziet er altijd hetzelfde uit.

## 3. Bij tien

- De check `score%10===0` wordt vervangen door `flags===10` (het aantal gevulde vlaggetjes).
- `danceParty()` doet dan: alle vlaggetjes wapperen (rotatie -12° / +12° afwisselend, 600 ms, twee keer) met `horn`; dan `pick('dance_')` zoals nu (muziek starten, animatie, muziek stoppen, lofzin); dan vallen de vlaggetjes af: om de 80 ms valt er een (translate 60 px omlaag, roteren, opacity naar 0, 500 ms) met `pop`, daarna zijn ze weer wit en staat de teller op 0.
- Dansjes zijn nu: `dance_riverdance`, `dance_disco`, `dance_party` (zie 5). Een nieuwe `dance_xyz` doet automatisch mee.

## 4. Onthouden

- `cfg.flags` (0–9) in het bestaande `cutout-game` localStorage-object, opgeslagen via `saveCfg()` na elk goed antwoord en na het feestje.
- Bij laden worden de gevulde vlaggetjes meteen gekleurd getekend.
- Instellingen opslaan reset `score`, maar niet `cfg.flags`. `score` blijft bestaan als onzichtbare teller, het spel gebruikt hem niet meer voor de dans.

## 5. Partygag wordt eindfeestje (src/rig.js)

- `slap_party` wordt hernoemd naar `dance_party`. Daarmee verdwijnt hij uit de gewone gag-pool (68%) en wordt hij door `pick('dance_')` opgepakt. Props blijven `flagL`, `flagR`, `partyHat`; `music:'party'` erbij.
- Van 3 s naar 10 s (80 frames op 8 fps), in blokken:
  1. Opening (frames 0–15): `horn` + `confetti`, zwaaien met beide vlaggen, mond 4.
  2. Hup-marcheren (16–39): de huidige hopjes, elke vierde tel `pop`, hoed stuitert mee.
  3. Rondje draaien (40–55): hoofd in stappen 0/90/180/-90 zoals de headspin in disco, `spin`-geluid, vlaggen recht omhoog.
  4. Toeter-salvo (56–67): drie korte `horn` achter elkaar (frames 56, 60, 64), elk met `confetti`. Korte snelle geluiden achter elkaar, de comedy-regel.
  5. Finale (68–79): grote sprong (`root.y` -30), feesthoed vliegt omhoog (`hat.y` -30 en terug), `boing` bij de sprong, `plof` bij de landing, ogen dicht van het lachen, zakt door de knieën, laatste frame lachend met vlaggen omhoog.

## 6. Muziek

- `tools/build-sfx.js`: nieuwe regel `party: ['cheerful children's party tune, polonaise, accordion and brass, clapping, upbeat, instrumental', 10]`.
- `npm run sfx` genereert alleen ontbrekende bestanden, dus dit maakt alleen `assets/sounds/party.mp3`. Kost een paar credits van het gratis plan.
- Zonder bestand speelt het feestje met toeters en pops; `music.play` van een onbekende naam doet niets (geen synth-fallback voor muziek, zoals disco/jig).

## Testen

Playwright tegen `docs/index.html` na `npm run build`:
- Na start: 10 witte vlaggetjes.
- Tien keer op de goede bubbel klikken (met `SFX`/speech gestubd of gewoon afwachten): na elke klik één vlaggetje meer gekleurd; na de tiende start `danceParty`, de gekozen animatie is een van de drie, daarna 10 witte vlaggetjes.
- Herlaad bij 4 vlaggetjes: 4 gekleurd.
- `dance_party` speelt 80 frames zonder JS-fouten, props zichtbaar, `party`-muziek gestart en gestopt.
- Geen `slap_party` meer in `lib`.

Studio: geen wijziging nodig, `dance_party` verschijnt automatisch in de lijst. Build: geen wijziging, `party.mp3` wordt meegebakken zoals de rest.
