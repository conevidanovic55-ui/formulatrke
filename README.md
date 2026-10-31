# Formulacija — besplatna arhiva video linkova

Sajt Formule 1 sa sezonama, pretragom, vrstama snimaka i linkovima ka profilima Formulacija. Video snimci ostaju na drugim servisima. Sajt nema video skladište, plaćeni server ni zahtev za karticom.

## Pokretanje

Node.js 22+ (preporučeno 24 iz `.nvmrc`). Nema npm zavisnosti.

```sh
cd /workspace/Web-sajt
npm test
npm run build
npm start
```

Server koristi `public/` na portu 3000. `PORT` menja port. `npm run preview` služi `dist/`. Ne pokreći oba na istom portu. Okruženje zadatka je već izolovano; koristi postojeći checkout, bez dodatnog worktree-a osim na izričit zahtev korisnika.

## Zastave umesto ilustracija

Svaka trka u `public/content.json` može da ima polje `"image": "Kina.png"` ili `"image": "Monako.jpg"`. Ne koristi se više polje `art`; ilustracije izmišljenih staza i SVG putanje su uklonjene iz prikaza.

1. Otvori [public/assets](https://github.com/conevidanovic55-ui/formulatrke/tree/main/public/assets), izaberi **Add file → Upload files** i ubaci zastavu sa računara. Sačuvaj sa **Commit changes**.
2. Otvori [content.json](https://github.com/conevidanovic55-ui/formulatrke/blob/main/public/content.json). U unosu željene trke postavi naziv datoteke u polju `image`, bez prefiksa `public/assets/`.
3. Sačuvaj izmene (**Commit changes**) i proveri GitHub Pages objavu. Pošto je putanja relativna, slike rade i na podadresi `/formulatrke/public/`.

Nazivi se razlikuju po velikim/malim slovima: `Kina.png` i `kina.png` nisu isto. Podržane su PNG, JPG/JPEG, WEBP i AVIF slike. Slika se prikazuje sa `object-fit: cover`, pa popunjava celo polje kartice; ivice mogu biti blago odsečene ako odnos širine i visine slike nije isti kao odnos polja. Bez slike, kartica ostaje tamna, bez nacrtane staze.

Umesto ručnog editovanja JSON-a možeš koristiti [Urednik](https://conevidanovic55-ui.github.io/formulatrke/public/urednik.html). Polje „Zastava na kartici“ unosi naziv već otpremljene slike. Urednik čuva nacrt lokalno; „Preuzmi nacrt“ omogućava objavu bez tokena. Objavljivanje iz Urednika sa GitHub tokenom piše u repozitorijum `conevidanovic55-ui/formulatrke`, ne u stari `Web-sajt`.

## Nasumična početna fotografija staze

Početna stranica nasumično prikazuje jednu od **23 trenutno dostupne fotografije**, uz naziv i geografske koordinate baš te staze. Fotografija se promeni kada posetilac otvori/osveži stranicu. U okviru iste kartice pregledača pamti se prethodna fotografija kako se ne bi ponovila odmah. Ova funkcija ne zavisi od arhive trka niti menja `content.json`.

Spisak uređuješ samo u **`public/staze.json`**. Svaki unos ima tri polja:

```json
{
  "name": "SUZUKA",
  "image": "suzuka.jpg",
  "coordinates": "34°50′30″ N · 136°32′20″ E"
}
```

Za novu stazu:
1. Otpremi fotografiju u `public/assets/` u GitHub repozitorijumu **formulatrke**, preporučeno kao optimizovan horizontalan JPG.
2. U `public/staze.json` dodaj novi objekat u niz `tracks`; upiši **identičan naziv datoteke** (uključujući velika/mala slova i ekstenziju), naziv staze i proverene koordinate staze, ne grada.
3. Sačuvaj izmene preko **Commit changes**; GitHub Pages objavljuje novu verziju.
4. Osveži javni sajt i proveri prikaz.

Nema potrebe za dodatnim izmenama `index.html`, `styles.css` ili `app.js`. Modul `public/hero.js` zasebno učitava spisak, bira fotografiju, proverava njeno učitavanje i istovremeno prikazuje njene koordinate; oštećene/nedostupne fotografije preskače. Ako spisak ne može da se učita ili nijedna fotografija nije dostupna, ostaje samo jednobojna pozadina, bez rezervne fotografije, naziva i koordinata. Početna fotografija i odgovarajući natpis pojavljuju se zajedno tek po uspešnom učitavanju. Prikazuje se samo jedna fotografija, ne učitava se svih 23 istovremeno.

**Autorska prava:** pre dodavanja fotografije proveri prava za javno objavljivanje; za CC BY / CC BY-SA navedi autora, izvor i odgovarajuću licencu na sajtu. Ime datoteke ne predstavlja atribuciju.

### Izvori koordinata za trenutne 23 staze

Koordinate su proverene na stranicama konkretnih staza (uglavnom Vikipedija), uključujući zvanični sajt Monce: [Albert Park](https://en.wikipedia.org/wiki/Albert_Park_Circuit), [Bahrein](https://en.wikipedia.org/wiki/Bahrain_International_Circuit), [Džeda](https://en.wikipedia.org/wiki/Jeddah_Corniche_Circuit), [Hungaroring](https://en.wikipedia.org/wiki/Hungaroring), [Lusail](https://en.wikipedia.org/wiki/Lusail_International_Circuit), [Majami](https://en.wikipedia.org/wiki/Miami_International_Autodrome), [Monca](https://www.monzanet.it/en/circuit/), [Red Bull Ring](https://en.wikipedia.org/wiki/Red_Bull_Ring), [Spa](https://en.wikipedia.org/wiki/Circuit_de_Spa-Francorchamps), [Suzuka](https://en.wikipedia.org/wiki/Suzuka_Circuit), [Šangaj](https://en.wikipedia.org/wiki/Shanghai_International_Circuit).


Novih 12 staza: [Jas Marina](https://en.wikipedia.org/wiki/Yas_Marina_Circuit), [Baku](https://en.wikipedia.org/wiki/Baku_City_Circuit), [Barselona](https://en.wikipedia.org/wiki/Circuit_de_Barcelona-Catalunya), [Istanbul Park](https://en.wikipedia.org/wiki/Istanbul_Park), [Žil Vilnev](https://en.wikipedia.org/wiki/Circuit_Gilles_Villeneuve), [Meksiko](https://en.wikipedia.org/wiki/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez), [Monako](https://en.wikipedia.org/wiki/Circuit_de_Monaco), [Interlagos](https://en.wikipedia.org/wiki/Interlagos_Circuit), [Silverston](https://en.wikipedia.org/wiki/Silverstone_Circuit), [Marina Bej](https://en.wikipedia.org/wiki/Marina_Bay_Street_Circuit), [Circuit of the Americas](https://en.wikipedia.org/wiki/Circuit_of_the_Americas) i [Zandvort](https://en.wikipedia.org/wiki/Circuit_Zandvoort).


## Dodavanje trke

Otvori `/urednik.html` na sajtu:

1. Dodaj sezonu ako nedostaje.
2. Unesi naziv, stazu, sezonu, vrstu snimka i HTTPS video link.
3. „Proveri plejer“ otvara probni prikaz. „Dodaj link u nacrt“ dodaje unos.
4. Objavi nacrt jednim od načina ispod.

Nacrt se automatski čuva u lokalnom skladištu tog pregledača. **Nacrt nije javna izmena sajta.** Preuzmi `content.json` kao rezervnu kopiju. Možeš ga vratiti kroz „Učitaj JSON nacrt“. Dugme Izmeni menja postojeći unos; Ukloni uklanja link iz nacrta, bez brisanja videa na izvornom servisu.

### Objavljivanje bez tokena

Klikni „Preuzmi nacrt“. Prijavi se na GitHub, otvori https://github.com/conevidanovic55-ui/formulatrke/upload/main/public , izaberi preuzeti `content.json` i klikni **Commit changes**. Datoteka mora ostati nazvana `content.json`, u direktorijumu `public`. GitHub Actions zatim objavljuje novu verziju sajta. Posle uspešnog procesa promene postaju javne.

### Objavljivanje iz urednika

Opciono napravi fine-grained GitHub token na https://github.com/settings/personal-access-tokens/new :

- Resource owner: `conevidanovic55-ui`.
- Repository access: samo `formulatrke`.
- Repository permission: **Contents — Read and write** (Metadata read dolazi automatski).
- Postavi kratak rok važenja i obnovi ga kada istekne.

Unesi token isključivo u polje urednika na sopstvenom sajtu. Nemoj ga slati u čet. Klikni „Poveži nalog i učitaj arhivu“ pre uređivanja; učitava se najnovija verzija sa GitHub-a. Token ostaje samo u memoriji kartice: ne čuva se u localStorage-u, JSON-u, repozitorijumu ni kolačićima. Zatvaranje/ponovno učitavanje kartice ga uklanja. „Objavi na sajtu“ pravi izmenu datoteke `public/content.json` na grani main. GitHub Pages objavljuje izmenu nakon uspešnog workflow-a, obično za nekoliko minuta; potvrda API-ja ne znači da je deployment već završen.

Zaštita SHA verzijom sprečava prepisivanje novijih promena iz druge kartice. Ako se pojavi konflikt, preuzmi nacrt, ponovo poveži nalog i uskladi izmene sa najnovijom arhivom. Postojeći nacrt se ne odbacuje pri povezivanju bez potvrde.

## Podržani servisi

- **OK.ru**: običan video link ili videoembed link. Primer korisnika: `https://ok.ru/video/11719629212384` postaje `https://ok.ru/videoembed/11719629212384`.
- YouTube, Vimeo, Dailymotion, Streamable i Streamtape: prepoznavanje linkova i ugrađeni plejer.
- Rumble: HTTPS `/embed/v…/` link.
- Direktni HTTPS MP4/WebM linkovi: HTML video plejer.
- Drugi HTTPS linkovi: otvaranje originalnog snimka u novoj kartici, bez obećanja da servis podržava ugrađivanje.

Ne unosi iframe HTML kod niti linkove za preuzimanje koji zahtevaju prijavu. Snimak mora biti dostupan gledaocima. Servis može zabraniti ugrađivanje, tražiti prijavu, ograničiti region ili ukloniti video; sajt to ne zaobilazi. U plejeru postoji i link ka izvornom snimku. Spoljni iframe je sandboxovan bez iskačućih prozora i preusmeravanja glavne stranice.

Javna arhiva sadrži korisnikov OK.ru snimak „VN Kine — Sport Klub Hrvatska“, sezona 2025, i tabove za 2025. i 2026. godinu. Početno je izabrana najnovija sezona koja ima video linkove. Testovi koriste zasebnu probnu arhivu sa više sezona. Početna prikazuje fotografije pravih staza iz `public/staze.json` bez generičke rezervne F1 slike. Sajt je nezavisna zajednica, a ne zvaničan sajt Formule 1.

## Besplatno javno objavljivanje

Predviđen je **GitHub Pages za javni repozitorijum na GitHub Free**, bez kartice. Nema kupovine domena: dobija se projektna podadresa oblika:

`https://conevidanovic55-ui.github.io/formulatrke/`

Ovo je očekivana adresa; aktivna je tek nakon uspešnog objavljivanja i provere. Ako je repozitorijum privatan, nemoj uključivati plaćeni plan: vlasnik prvo treba da odobri javnost repozitorijuma ili izabere drugi besplatan statički hosting. Pages ima standardna ograničenja usluge, dok video saobraćaj ide ka servisu na kojem je snimak.

Za javno objavljivanje izaberi **Settings → Pages → Build and deployment → Source: Deploy from a branch → main → / (root)** i klikni Save. Nije potrebno ručno pokretati workflow niti birati GitHub Actions kao izvor. GitHub automatski objavljuje promene posle svakog push-a na main.

Korenski `index.html` preusmerava u `public/`, a `.nojekyll` čuva statičke fajlove. Direktna putanja sajta je i `https://conevidanovic55-ui.github.io/formulatrke/public/`. Kontrolni workflow Provera sajta proverava kod, ali ne menja objavljivanje. `dist/` ostaje dostupan za lokalni preview ili drugi statički hosting.

Ne traži se Cloudflare nalog, R2, Cloudflare token niti kartica. Stari ignorisani `.data/` fajlovi prethodne razvojne verzije nisu deo novog sajta i sačuvani su kako korisnički podaci ne bi bili obrisani. Prethodni Cloudflare zahtevi mogu ostati u starom nacrtu podešavanja okruženja; alat ne podržava njihovo brisanje, pa se po potrebi uklanjaju u korisničkom panelu. Aplikacija ih ne koristi.

## Provere

```sh
npm test
npm run build
python3 tests/browser_smoke.py
```

Prve dve komande traže samo Node. Browser test koristi preinstalirani Python Playwright i Chromium. Proverava mobilni prikaz, filtere, projektni `/formulatrke/` prefiks, OK.ru embed URL i sandbox, spoljne linkove, čuvanje/uvoz/izvoz nacrta i GitHub objavljivanje sa presretnutim API odgovorima. GitHub i video frejmovi u testu su simulirani: test ne potvrđuje stvarnu reprodukciju na OK.ru niti živo javno objavljivanje. Slike prikaza su u ignorisanom `test-results/`.

## Dodatna besplatna adresa: formulatrke.netlify.app

Pripremljen je `netlify.toml`: Node 24, izgradnja `npm run build`, objavljivanje `dist/`, bez serverskih funkcija ili video skladišta. Postojeći `/public/` linkovi se na Netlify-u preusmeravaju na koren sajta. GitHub Pages adresa ostaje dostupna.

Željeni naziv Netlify projekta je **formulatrke**. Dostupnost tog imena i javna adresa nisu potvrđene dok Netlify ne kreira projekat. Ne koristi naziv formulacija za adresu. Brend i društvene mreže ostaju Formulacija.

Vlasnik se prijavljuje na svoj Netlify nalog preko GitHub-a, bira besplatan plan i izabere **Add new project → Import an existing project → GitHub → conevidanovic55-ui/Web-sajt**:

https://app.netlify.com/start

Poveži postojeći repozitorijum, bez pravljenja njegove kopije, jer urednik menja baš formulatrke. Pri kreiranju projekta treba izabrati naziv `formulatrke`, granu `main` i postojeću konfiguraciju iz `netlify.toml`, pa pokrenuti objavljivanje. Hosting zatim automatski ažurira sajt nakon promena na main. Nije potrebno dostavljati lozinku ili token u četu. Ako kreiranje traži karticu ili plaćeni paket, ne aktivirati plaćanje; javiti šta prikazuje i zadržati postojeći besplatan GitHub Pages sajt.

Urednik i dalje menja isti `public/content.json` na GitHub-u; time se ažuriraju oba povezana hostinga. Postojeći nacrt iz starog domena ne prenosi se automatski u novi pregledački origin: preuzmi content.json ako želiš da ga uvezeš na novoj adresi.

## Vizuelni identitet

Crvena, crna i bela paleta usklađena je sa korisnikovom profilnom referencom. Beli logo u zaglavlju, dnu i delu O nama prikazuje se iz `public/assets/formulacija-logo.png`. Pošto se zasebni korisnikov prilog prikazivao kao potpuno bela slika i nije imao dostupan lokalni fajl, ova verzija je generisana prema vidljivom logotipu iz profilne reference, a nije predstavljena kao originalni izvorni PNG/SVG. Asset je crn na providnoj pozadini i CSS filter ga prikazuje belo; to čuva čiste konture pri prikazu na tamnom sajtu. Izvorni logo može naknadno da ga zameni.
