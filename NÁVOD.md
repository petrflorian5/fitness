# Fitness Tracker 2.0 — návod na zprovoznění

Nová verze má dvě části:
1. **Webovka** (`index.html`) — běží zdarma na GitHub Pages, jako dosud.
2. **Cloudflare Worker** (`worker.js`) — malý server zdarma, který ukládá tvoje data a bezpečně schovává API klíč pro chat s koučem.

Celý setup zabere ~15 minut a dělá se jen jednou.

---

## Krok 1 — Anthropic API klíč (5 min)

1. Jdi na **https://console.anthropic.com** a zaregistruj se (klidně stejným e-mailem).
2. Vlevo **Billing** → dobij kredit (minimum $5 — na běžné povídání s koučem vydrží měsíce).
3. Vlevo **API Keys** → **Create Key** → pojmenuj třeba `fitness` → zkopíruj klíč (začíná `sk-ant-…`) a někam si ho ulož. Ukáže se jen jednou!

## Krok 2 — Cloudflare Worker (10 min)

1. Jdi na **https://dash.cloudflare.com** a zaregistruj se (Free plán stačí).
2. V levém menu **Workers & Pages** → **Create** → **Create Worker**.
3. Pojmenuj ho `fitness-tracker` → **Deploy**.
4. Klikni **Edit code**, smaž ukázkový kód a vlož celý obsah souboru `worker.js` z tohoto repa → **Deploy** (vpravo nahoře).
5. Vytvoř úložiště dat (KV):
   - Zpět v menu: **Storage & Databases** → **KV** → **Create namespace** → název `fitness-data` → Create.
   - Jdi na svůj Worker → **Settings** → **Bindings** → **Add** → **KV namespace**:
     - Variable name: `TRACKER_KV` (přesně takto!)
     - KV namespace: `fitness-data`
   - Ulož.
6. Nastav tajné klíče: Worker → **Settings** → **Variables and Secrets** → **Add**:
   - Type **Secret**, název `ANTHROPIC_API_KEY`, hodnota = klíč z Kroku 1.
   - Type **Secret**, název `APP_TOKEN`, hodnota = **vymysli si delší heslo** (např. 20+ znaků, cokoliv). Tímhle heslem se do appky přihlásíš z PC i mobilu.
7. Zkopíruj si adresu Workera — najdeš ji na přehledu Workera, vypadá takto:
   `https://fitness-tracker.NĚCO.workers.dev`

## Krok 3 — Nahrát nový web na GitHub (2 min)

Ve složce s repem (tam, kde je tento soubor):

```
git add -A
git commit -m "Tracker 2.0 — novy design + kouc Claude"
git push
```

(Nebo soubory `index.html`, `worker.js` a `NÁVOD.md` nahraj ručně přes github.com → repo `fitness` → Add file → Upload files.)

Za ~1 minutu bude nová verze na https://petrflorian5.github.io/fitness/

## Krok 4 — Propojit (1 min)

1. Otevři web → vpravo nahoře **⚙ Nastavení**.
2. Vlož adresu Workera z Kroku 2.7 a svoje heslo (`APP_TOKEN`).
3. **Připojit a synchronizovat** → zelená tečka = hotovo.
4. Totéž udělej jednou na mobilu. Od té chvíle se vše synchronizuje mezi zařízeními.

---

## Co umí kouč Claude

- **Vidí všechno** — plán, všechny check-iny, dnešní trénink, doplňky.
- **Zapisuje za tebe** — napiš „dnes 83,9 kg, 2100 kcal, 12k kroků, spánek 7h skóre 81" a uloží to jako check-in.
- **Týdenní vyhodnocení** — „vyhodnoť poslední týden" → porovná s plánem a navrhne úpravy.
- **Odškrtává doplňky** — „vzal jsem kreatin a omegu".
- Historie konverzace se ukládá a synchronizuje.

## Kolik to stojí

- GitHub Pages: **zdarma** · Cloudflare Worker + KV: **zdarma** (free limity bohatě stačí)
- Anthropic API: platíš jen za použité tokeny — běžná zpráva kouči ≈ $0,01–0,03.

## Když něco nefunguje

- **Červená tečka / „Sync selhal"** → zkontroluj adresu Workera a heslo v ⚙.
- **„HTTP 401"** → špatný APP_TOKEN (musí se přesně shodovat se secretem ve Workeru).
- **Chat píše chybu o API** → zkontroluj `ANTHROPIC_API_KEY` secret a kredit na console.anthropic.com.
- **Data z původní verze**: nová verze začíná s čistým úložištěm (tak jsme se domluvili). Stará verze zůstává v gitu (`index-old.html`, historie commitů), kdyby bylo potřeba cokoli dohledat.
