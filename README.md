# NSI Rate Checker 

**Live app:** https://nsi-rate-checker.aitech-code.workers.dev
**Code:** https://github.com/aitech-code/nsi-rate-checker
**Owner:** Engr. ZA
**Current version:** v9.3 (1 Nov 2026) — data: **MRS-2025 1st Bi-Annual**

This file is the project's memory. Read it before changing anything, and give it to
Claude at the start of any new chat about this app (see section 8).

---

## 1. What the app does

| Card | What it does |
|---|---|
| Upload (top) | Reads an xlsx / pdf / jpg list of NSI items and checks each one against MRS |
| 1. Search MRS | Finds whether the item already exists in MRS (Strong / Possible match) |
| 2. Nomenclature | Corrects the wording to C&W style and adds the standard closing phrase |
| 3. Justify | "What is the item?" market price guide, district factor, MRS reference, extras that justify a higher rate, verdict ±5% / ±10% |
| 4. Rate analysis | MRS-format analysis: Material + Labour + Equipment, 3% sundries on labour, 23.5% (4% KP ST + 2% OH + 7.5% IT + 10% profit). Office form, print / PDF with signatures |

Everything runs in the browser. No database, no login, no secret keys.
Saved on the user's device only: language, Name of Office, his own market rates.

## 2. Where things are

```
public/data/mrs-2025-1.json          MRS-2025 items (4,584 items, built from sources/ CSV)
public/data/mrs-2017-analysis.json   MRS-2017 analysis book — QUANTITIES ONLY (template)
sources/mrs-2025-1st-biannual.csv    The checked MRS-2025 table the JSON is built from
scripts/build_mrs_json.py            CSV  -> public/data/mrs-XXXX.json
scripts/build_mrs2017_json.py        2017 analysis PDF text -> JSON (only if a new analysis book is issued)
scripts/copy-ocr.mjs                 copies OCR files at build time (do not edit)

src/useMrs.ts        which MRS data file is loaded (DATA_URL)
src/districts.ts     location factors + the 23.5% breakup
src/rates.ts         default market rates (cement, sand, labour...) with source + date; KP minimum wage
src/priceGuide.ts    market price guide for AC, tiles, marble, granite, windows, fans, lights, geyser, ceiling
src/search.ts        MRS search
src/nomenclature.ts  wording correction rules
src/extras.ts        extras that justify a higher rate (AC: stabilizer, warranty, ...)
src/i18n.ts          all English + Urdu text
src/App.tsx          page layout; VERSION label shown in the header
src/MarketPrice.tsx, Justify.tsx, RateAnalysis.tsx, NomenclatureCard.tsx, MrsSearch.tsx, BatchCheck.tsx  the cards
```

## 3. Where every number comes from

| Data | Source | Date |
|---|---|---|
| MRS item rates | Market Rate System 2025 1st Bi-Annual, MRS Cell, Finance Dept KP (PDF) | 2025 |
| 23.5% breakup | MRS-2025 Preface, para 2 | 2025 |
| District / merged-area factors | MRS-2025 opening pages | 2025 |
| Analysis quantities | MRS-2017 rate analysis book, CSR Cell, Finance Dept KP — template only, its rates are NOT used | 2017 |
| Market rates (cement, sand, steel...) | listed in `src/rates.ts`, each with source and date | Aug–Oct 2026 |
| Market price guide (AC, tiles...) | listed in `src/priceGuide.ts`, each with link and date | researched 1 Nov 2026 |
| KP minimum wage | Rs 40,000/month notified (Rs 45,000 announced, not notified as of Oct 2026) | `src/rates.ts` |

Rule: **never type a number without a source and a date.**

## 4. When a new MRS is issued (e.g. MRS-2026 1st Bi-Annual)

**Easiest way:** open a new chat with Claude, attach the new MRS PDF and this README,
and paste the prompt in section 8. Claude extracts the table, checks it against the PDF
and gives you the files.

**What has to change (checklist):**

- [ ] 1. Get the new MRS PDF from the Finance Department KP website. Keep it in a folder
      outside the project, e.g. `Projects\nsi-sources\`.
- [ ] 2. Make the CSV table (same columns as `sources/mrs-2025-1st-biannual.csv`):
      `Code, Chapter, Chapter name, PDF page, Description, Unit, Labour, Composite,
      Metric unit, Labour (metric), Composite (metric), Spec No, Remarks, Deleted`.
      Claude does this from the PDF and **cross-checks every rate against the PDF**.
      Save it as `sources/mrs-2026-1st-biannual.csv`.
- [ ] 3. In `scripts/build_mrs_json.py` change the `edition` and `sourceFile` text, then run:
      ```
      python scripts/build_mrs_json.py sources/mrs-2026-1st-biannual.csv public/data/mrs-2026-1.json
      ```
- [ ] 4. In `src/useMrs.ts` change `DATA_URL` to `'/data/mrs-2026-1.json'`.
- [ ] 5. Check the new PDF for changes in:
      - the 23.5% breakup (Preface) → `src/districts.ts` `OVERHEADS`
      - district location factors → `src/districts.ts` `DISTRICTS`
- [ ] 6. Change the label "MRS-2025" everywhere: in VS Code press **Ctrl+Shift+H**,
      find `MRS-2025` → replace `MRS-2026`, Replace All. Do the same for the Urdu
      `ایم آر ایس 2025` → `ایم آر ایس 2026`.
- [ ] 7. Update `VERSION` in `src/App.tsx` and the "Current version" line at the top of this file.
- [ ] 8. Build, push and test (section 6). Test: search 3 known items and compare the rate with the PDF.
- [ ] 9. Add a line to the change log (section 9).

Old JSON files can stay in `public/data/` — only the one in `DATA_URL` is loaded.

## 5. Other regular updates

| What | File | How often |
|---|---|---|
| Market rates (cement, sand, labour...) | `src/rates.ts` | every 3–6 months |
| Market price guide (AC, tiles, marble...) | `src/priceGuide.ts` | every 3–6 months |
| KP minimum wage | `src/rates.ts` `MIN_WAGE` | after each budget / notification |
| Nomenclature rules, extras | `src/nomenclature.ts`, `src/extras.ts` | when needed |

Always keep `source` and `date` next to every number.

## 6. Build, push and check (every change)

In the VS Code terminal (project folder):

```
npm install            # only if package.json changed
npm run build          # must end with "built in ..."
git add .
git commit -m "short description"
git push
git status             # must say "up to date with 'origin/main'"
```

Cloudflare builds automatically (Workers & Pages → nsi-rate-checker → Deployments; top row must be green).
Open the live app in **Incognito** and check the version label in the header.

## 7. Problems already solved (look here first)

| Symptom | Cause | Fix |
|---|---|---|
| Cloudflare: `npm ci ... Missing: ... from lock file` | `package-lock.json` not pushed | `npm install`, then commit and push `package-lock.json` |
| Cloudflare: fails at "Cloning" | repo linked to old GitHub name zeeshan4801 | Settings → Build → reconnect `aitech-code/nsi-rate-checker` |
| Build error TS1149 / TS1192 (casing) | Windows treats `Nomenclature.tsx` and `nomenclature.ts` as clashing | card file is named `NomenclatureCard.tsx`; don't create `Nomenclature.tsx` |
| Changes not visible | old version cached, or not pushed | check VERSION in header, open Incognito, check `git status` |
| VS Code puts old code back | open editor tabs overwrite new files | before building: **Ctrl+K W**, "Don't Save" |
| Urdu text scrambled after copy-paste | editor/clipboard encoding | let Claude write the file directly into the folder |
| Web address printed at page bottom | browser headers/footers | fixed in CSS (`@page margin: 0`); else untick "Headers and footers" |

## 8. Prompt to start a new Claude chat

Attach **this README.md** (and the new MRS PDF if it's an MRS update), link your project
folder if using Claude desktop, then paste:

```
I'm Engr. ZA). I maintain the NSI Rate Checker app
(React + Vite + TypeScript + Tailwind, PWA, deployed on Cloudflare Workers from
GitHub aitech-code/nsi-rate-checker). The attached README.md describes the whole
project — read it first.

Task: [e.g. update the app to MRS-2026 1st Bi-Annual using the attached PDF]

Rules:
- Never make up data. Use official sources and show where each number came from.
- Cross-check extracted MRS rates against the PDF before using them.
- I'm a beginner: one step at a time, exact VS Code terminal commands, Windows.
- After each change: build, test, then give me the git commands to push.
- Write files directly into my project folder; tell me to press Ctrl+K W first.
- Update README.md (version, change log) when done.
```

## 9. Change log

| Version | Date | Change |
|---|---|---|
| v1–v4 | Oct–Nov 2026 | App set up, MRS-2025 data, search, PWA, English/Urdu, Cloudflare deploy |
| v5–v7 | 1 Nov 2026 | Nomenclature correction, extras to justify rates, 23.5% breakup, rate analysis (card 4) |
| v8 | 1 Nov 2026 | Upload xlsx/pdf/jpg and check every item; MRS-2017 quantities as template |
| v9 | 1 Nov 2026 | Card 3 "What is the item?" market price guide with sources |
| v9.3 | 1 Nov 2026 | Office / work / sub-head / date form, Install app button, clean printout, version label |
