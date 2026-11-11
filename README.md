# ORBI — The Living Wisdome

Interactive WebGL fulldome character with MediaPipe hand tracking.

## Run

Node.js 20.19+ or 22.12+ required. Run `npm ci`, then `npm run dev`, and open the printed localhost URL in Chrome.

## English voice routines

Click **Start voice** and allow microphone access. Camera and voice can run together.

- **“Take a lap”**: animated lap around the dome.
- **“Flirt”**: move to the side, heart eyes, kiss mouth and wink.

Voice routines temporarily take control from gestures for eight seconds, then return control. Space/center or reset cancels a routine. Silent pauses keep listening; network and permission errors show a recovery message. Chrome speech recognition may require internet. Real microphone recognition remains dependent on the browser, permissions and speech service.

**C** camera · **D** controls · **V** camera preview · **F** fullscreen.

Run `npm test` and `npm run build` for checks. GPL-3.0-or-later; see LICENSE and THIRD_PARTY.md.

---

# ORBI — direkt i webbläsaren

Webbsidan öppnar som en ren 160° domprojektion. Kontrollpanelen är dold som standard.

- **D** visar/döljer kontroller, kamera, kalibrering och simulator.
- **V** visar/döljer den lilla kamerarutan utan att stoppa styrningen.
- **C** startar/stoppar kameran (webbläsaren ber om tillstånd första gången).
- **F** döljer panelen och växlar helskärm. I helskärm är verktygsraden och markören dolda.
- **1–6** ändrar känsla. **Piltangenter** provar längre rörelser över domen. **Mellanslag** återgår hem.
- För ett separat helt rent fönster finns Launch dome output i kontrollpanelen.

## Geststyrning över hela domen

Håll upp vänster pekfinger och vik övriga fingrar. Endast den anatomiska vänsterhanden styr positionen; högerhanden kan fortfarande byta känslor. Redan på första tydliga kameradetekteringen börjar handens position i den speglade kamerabilden styra en plats i domcirkeln. Handen kan flyttas kontinuerligt utan att gesten behöver släppas mellan målen. Mitten av kamerabilden motsvarar domens zenit, nederkanten salens framsida och överkanten baksidan. Detta är en kalibrerad kamerakontroll, inte fysisk 3D-pekning.

Den gamla spärren vid ±25° azimut och +8…32° elevation gäller bara om Hela domen stängs av i kontrollpanelen. Standardläget kan passera zenit, gå åt sidorna och bakom publiken. Pekningen har ingen avsiktlig väntetid eller cooldown. Blicken och ansiktsgruppen börjar reagera vid nästa rendering, med en kort utjämning på normalt 50 ms. Maxhastighet är normalt 120°/s (justerbar 20–240°/s). Övriga känslogester använder fortsatt stabilisering mot felaktiga reaktioner. När vänsterhanden inte längre syns börjar ansiktet omedelbart återvända mjukt till sweet spot (0°/+20°), utan hållpaus. Även kamerastopp, urkoppling eller mer än 750 ms utan nya videobilder ger återgång.

Ansiktets centrum begränsas av den **fysiska 160° projektionsytan**, inte comfortable zone. Nära den verkliga kanten skalas ansiktet ned för att drag ska förbli synliga. En stabil lokal tangentbas undviker att ansiktet slår runt vid zenit. Bakgrundsfärgen täcker fortfarande hela domcirkeln; allt utanför är svart.

## Signalformat

Standardrendering 2160 × 2160. Den rena vyn använder en centrerad kvadrat i en 16:9-ram: vid en faktisk 3840 × 2160 HDMI-signal är kvadraten 2160² och börjar vid x=840. Bilden är equidistant fisheye 160°, lutning 26°, framsida nederst. Sätt projektorskärmen till 3840 × 2160 i operativsystemet och använd helskärm; webbsidan kan inte ändra HDMI-adapterns signalupplösning.

Den lilla startraden försvinner efter några sekunders inaktivitet och visas aldrig i ren helskärm. Tryck D för kontroller även i helskärm när du avsiktligt vill kalibrera. Det separata `?output=hdmi`-fönstret saknar all UI.

## Utveckling och kontroller

`npm install`, `npm run dev`, `npm run build`, `npm test`.

34 enhetstester verifierar bland annat projektionsmatematik, geststabilisering, löpande helmål från handen, övergångar, rörelse över zenit/bakom publiken, fysisk kantbegränsning, serialisering och hastighetsgräns. Den här uppdateringen har byggts och enhetstestats. Interaktiv webbläsarkontroll saknas i den här managed Sites-miljön; kamera och fullscreen måste fortfarande provas på användarens dator.

Den inbyggda simulatorn finns i kontrollpanelen för repetition; det är alltid den riktiga fisheye-bilden som går till projektorn. Se THIRD_PARTY.md och LICENSE för projektionskällans och simulatorns GPL-licens.

## Levande ansikte

Proceduralt ljussatta elfenbensfärgade ögon med turkosa irisar, separata pupiller, två reflexljus och mjuka kontaktskuggor ger volym utan bildassets. Munnen har mörkare hålighet, formade tänder, rundad tunga och en belyst läppkant. Små blickskiften, ögonlocksvariation, brynrörelser och en periodisk lekfull blinkning kompletterar den oregelbundna blinkningen. Färgerna är klarare; standardljusstyrkan är 0,84 och fortfarande justerbar. Ingen blixt/strobning har lagts till. Den rena dommappningen är oförändrad.

## Kameraruta och vänsterhand

Den lilla kamerarutan visas uppe till höger när kameran startas. Den delar samma ström som gestmodellen, med gröna markeringar på den styrande vänsterhanden och blå markeringar på den andra handen. **V** eller rutans kryss döljer bara förhandsvisningen. Kameran och positionsstyrningen fortsätter.

Den nuvarande MediaPipe Tasks-modellens handetiketter beskriver personens händer. CSS-spegling av förhandsvisningen byter inte hand. Om kamerans eget bildflöde avviker: visa endast din verkliga vänsterhand och välj **Kalibrera: det här är min vänstra hand** under D. Två händer upptäcks så att högerhanden inte tar över positionen när vänsterhanden försvinner eller resultatordningen ändras.

För helt ren venue-signal: dölj kamerarutan med V eller dela det separata `?output=hdmi`-fönstret. Kamerarutan är ett DOM-lager och ingår aldrig i den renderade eller inspelade dome-master-canvasen.

## Wisdome-granskning

Se [källsammanställningen](docs/WISDOME-SPEC.md). Mappningen matchar EX-03. Ansiktets aktuella vinkelfotavtryck används för att skala ned detaljer vid den verkliga 80°-radien; en minsta skala får inte tvinga drag utanför kanten. Orienteringen hålls kontinuerlig vid zenit och ställer sig mjukt rättvänd sett från rummet när ansiktet rör sig åt sidan/bakom publiken. Det är ansiktets egen orientering, inte global kamerarullning.

Rumsdiametern påverkar simulatorns sätesperspektiv men ändrar inte den centrala vinkelbaserade fisheye-mappningen. Ingen enda bild kan se identisk ut från samtliga förskjutna stolar. Nederkant=framsida är fortfarande den officiella exempelkonventionen som måste bekräftas med venue-teknikerna; verklig ljusstyrka, frontorientering, kamerafördröjning och kantutseende behöver prov på plats.

Gestinferens är synkron i MediaPipe Web. Applikationen mäter CPU-tiden och anpassar intervallet mellan inferenser (upp till valt FPS), använder bara senaste videobilden och undviker att rita dolda handlager. Detta är belastningsstyrning, inte en verifierad fysisk latensgaranti.

## Stil och rotationskalibrering

Ansiktet använder nu ett stiliserat speluttryck: mörka ovala ögon, grafiska reflexer, enkla bryn, en tydlig mun, en sammanhängande tandrad och en liten korallfärgad tunga. De realistiska vita ögongloberna, turkosa irisfibrerna och hud-/läppmaterialen är borttagna. Det finns fortfarande mjuk djupkänsla, men den är grafisk/cel-shadad.

Tryck **Q/E** för att rotera ansiktet −/+5° (Shift:15°); **0** återställer rotationsjusteringen. Under **D → Räta upp ansiktet** finns hela intervallet **−180°…+180°**, snabbval −90/0/+90/180, automatisk upprätning och justerbar upprätningshastighet. Automatisk upprätning följer rummets upp-riktning snabbare och vinkelberäkningen tar kortaste vägen även efter flera varv. Manuell rotation ändrar bara ansiktets lokala orientering; 160°-projektionen, 26°-lutningen och det svarta området ändras inte.

Räta först upp från simulatorns referensstol. Olika förskjutna stolar kan ge perspektivlutning som inte går att eliminera för alla platser med en enda dome-master. Den här uppdateringen har byggts och enhetstestats; den visuella simulatorupplevelsen behöver bekräftas i användarens webbläsare.

## Full räckvidd med en synlig hand

Den gamla kameramappningen krävde att handens centrum var nära bildens ytterkant för att nå domkanten. Det tappar lätt handspårningen eftersom fingrarna då hamnar utanför kamerabilden. Standardförstärkningen är nu **2,8×**: handens centrum kan stanna ungefär inom 33–67 procent av kamerabilden och ändå nå vänster/höger/framsida/baksida av den projicerbara domen. **Handens räckvidd** under D justerar förstärkningen.

Vänsterhandens synliga position styr nu kontinuerligt även om den inte känns igen som en strikt pekfingerpose. Högerhanden kan fortsatt ändra känslor. Den vita inre ramen och ringen på styrpunkten i kamerarutan visar den användbara rörelseytan. När vänsterhanden försvinner återgår ansiktet till sweet spot som tidigare.

Det finns ingen avstängningsbar comfortable-zone-begränsning i webbkontrollerna längre. Den fysiska gränsen är fortfarande 160°-domens verkliga cirkel. Ansiktet skalas ned nära dess kant för att hålla dragen projicerbara; de svarta HDMI-sidorna är inte domyta.

**Testa hela domen (pausar kameran)** provar vänster, zenit, baksida, höger och framsida och återgår hem. Start av kameran avbryter testet. Detta gör det möjligt att kontrollera räckvidden utan handspårning.

## Närmare Sphere-uttryck

Proportionerna har omarbetats till stora svala ögonvitor, enkla svarta pupiller, breda bryn och en liten böjd neutral mun som kan växa till ett stort leende. Ingen fotorealistisk iris eller hudstruktur används. Blicken rör sig mer uttrycksfullt. En bildreferens som studerades var [Sphere-emojin vid Wynn Golf Club](https://www.mensjournal.com/news/golfer-trolled-las-vegas-sphere-emoji-face); fotot är inte inbäddat i appen.

## Pekkommandon med fasta mål (standard)

Den godkända navigationsfilmens ansikte, shader, projektion och rörelsemotor är oförändrade. Standardläget använder fingerorientering, inte svep eller handens position. Valfri hand kan styra.

- Ett pekfinger åt höger: azimut +75°, elevation +20°.
- Ett pekfinger åt vänster: azimut −75°, elevation +20°.
- Båda händernas pekfingrar uppåt samtidigt: rakt ovanför publiken, elevation +90°.
- Ett pekfinger nedåt: fram, azimut 0°, elevation 0°.
- Peace/Victory: bak, azimut 180°, elevation +50°.
- Knuten hand/Closed_Fist: sweet spot, azimut 0°, elevation +20°.

En pose måste vara stabil i 65 ms. Spegelinställningen används för riktningen. Ett ensamt pekfinger uppåt, diagonala och motstridiga pekningar väljer inget nytt mål. Hållna poser utlöses en gång, men det valda målet hålls kvar så länge minst en hand syns. När inga händer syns återgår Orbi till sweet spot. Navigationsposer har företräde framför känslor; andra känsloposer fungerar fortfarande.

Kamerarutan visar mål och kommandon. Tidigare vänsterhandsstyrning med handens position finns kvar som alternativ under D → Positionsstyrning.

43 enhetstester passerar, inklusive stillastående fingerpekning, spegling, tvåhandskravet för upp, motstridiga riktningar, stabilitet, hållna mål och förlust av händer. Checksummor bekräftar att renderingen är identisk med filmversionen. Faktisk gestigenkänning måste fortfarande provas med användarens kamera.

Responsjustering: maxfarten är 240°/s, positionsutjämningen 30 ms. Samma mål och projiceringsgeometri som tidigare; gestväntan är 65 ms, ungefär två kameraintervall vid 30 FPS. Verklig kamerafördröjning beror på datorn.
