// Market rates library (input rates) used in rate analyses.
// Every rate has a source and date. The engineer can update any rate; updates are kept on this device.
// Inputs not in this list keep their MRS-2017 rate and are marked "update" in red.

export type Source = { name: string; url?: string; date: string }
export type RateEntry = {
  key: string
  name: string        // shown to the engineer
  unit: string        // e.g. "Bag", "Cft", "No", "Kg", "Day"
  per: number         // rate is for this many units (100 Cft, 1000 No ...)
  rate: number
  src: Source
  note?: string
  match: RegExp       // MRS-2017 input names this rate replaces
  survey: string      // search words for "check online"
}

export const SOURCES = {
  pbsCement: { name: 'PBS average price, reported by Pakistan Observer (13 Oct 2026) — Peshawar', url: 'https://pakobserver.net/cement-prices-in-pakistan-increase-check-city-wise-rates-in-october-2026/', date: '2026-10-13' },
  finishes: { name: 'Finishes.pk Construction Rates Index (Lahore baseline, updated 21 Aug 2026)', url: 'https://finishes.pk/construction-rates-pakistan/', date: '2026-08-21' },
  office: { name: 'Your office analysis file "Cladding Analysis.xlsx" (Govt School, Gulbahar Peshawar) — date not stated', date: '' },
} satisfies Record<string, Source>

export const DEFAULT_RATES: RateEntry[] = [
  { key: 'opc', name: 'Ordinary Portland Cement (50 kg)', unit: 'Bag', per: 1, rate: 1600, src: SOURCES.pbsCement, match: /^ordinary portland cement$/i, survey: 'cement bag price Peshawar today' },
  { key: 'white', name: 'White cement', unit: 'Bag', per: 1, rate: 1150, src: SOURCES.office, match: /^white cement$/i, survey: 'white cement bag price Pakistan today' },
  { key: 'sand', name: 'Sand', unit: 'Cft', per: 100, rate: 6000, src: SOURCES.finishes, note: 'Rs 60/cft, range 52–90 (Lahore). Your office file uses Rs 3,100/100 Cft (coarse sand, Peshawar) — choose the one that fits your site.', match: /^(sand|local sand)$/i, survey: 'sand price per cft Peshawar today' },
  { key: 'crush', name: 'Crushed aggregate (bajri)', unit: 'Cft', per: 100, rate: 17500, src: SOURCES.finishes, note: 'Rs 175/cft, range 95–330 (Lahore).', match: /^crushed aggregate$/i, survey: 'crush bajri price per cft Peshawar today' },
  { key: 'brick', name: 'Burnt brick (A-class)', unit: 'No', per: 1000, rate: 17000, src: SOURCES.finishes, note: 'Range 16,500–22,000 per 1000 (Lahore).', match: /^burnt brick$/i, survey: 'first class brick price per 1000 Peshawar today' },
  { key: 'steel', name: 'Steel bars (Grade 60)', unit: 'Kg', per: 1, rate: 262, src: SOURCES.finishes, note: 'Range 258–265/kg (Lahore).', match: /^(steel \(bars\/rods\/section\)|rfcnt steel: grd-60 ksm)$/i, survey: 'steel sariya grade 60 price per kg today Pakistan' },
  { key: 'mud', name: 'Mud / clay', unit: 'Cft', per: 100, rate: 1316, src: SOURCES.office, match: /^mud \/ clay$/i, survey: 'mitti clay price per cft Peshawar' },
  { key: 'mason', name: 'Mason (mistri)', unit: 'Day', per: 1, rate: 1500, src: SOURCES.office, match: /^mason$/i, survey: 'mason mistri daily wage Peshawar 2026' },
  { key: 'carpenter', name: 'Carpenter', unit: 'Day', per: 1, rate: 1400, src: SOURCES.office, match: /^carpenter$/i, survey: 'carpenter daily wage Peshawar 2026' },
  { key: 'labourer', name: 'Labourer / Beldar', unit: 'Day', per: 1, rate: 800, src: SOURCES.office, match: /^(beldar|labourer|labour)$/i, survey: 'mazdoor daily wage Peshawar 2026' },
  { key: 'coolie', name: 'Coolie', unit: 'Day', per: 1, rate: 750, src: SOURCES.office, match: /^coolie$/i, survey: 'coolie daily wage Peshawar 2026' },
  { key: 'bhishti', name: 'Bhishti / Water man', unit: 'Day', per: 1, rate: 800, src: SOURCES.office, match: /^bhishti$/i, survey: 'daily wage labour Peshawar 2026' },
]

// KP minimum wage (legal floor for unskilled labour)
export const MIN_WAGE = {
  monthly: 40000,
  perDay: Math.round((40000 / 26) * 100) / 100, // 26 working days a month (assumption)
  text: 'KP minimum wage Rs 40,000/month (notified Sept 2025); Rs 45,000 announced in the 2026-27 budget but not yet notified as of Oct 2026. Daily equivalent = monthly ÷ 26 working days.',
  src: { name: 'LegalPK (updated 24 Oct 2026); Pakera (16 Oct 2026)', url: 'https://legalpk.com/blog-post/minimum-wage-pakistan-2026', date: '2026-10-24' },
}
export const UNSKILLED = /^(coolie|beldar|labourer|labour|bhishti|helper|skilled coolie|water carrier|water sprinkler)$/i

const STORE = 'market-rates-v1'
type Saved = Record<string, { rate: number; date: string }>

export function loadRates(): RateEntry[] {
  let saved: Saved = {}
  try { saved = JSON.parse(localStorage.getItem(STORE) ?? '{}') } catch { /* ignore */ }
  return DEFAULT_RATES.map(r => (saved[r.key]
    ? { ...r, rate: saved[r.key].rate, src: { name: 'Your market survey', date: saved[r.key].date } }
    : r))
}
export function saveRate(key: string, rate: number) {
  try {
    const saved: Saved = JSON.parse(localStorage.getItem(STORE) ?? '{}')
    saved[key] = { rate, date: new Date().toISOString().slice(0, 10) }
    localStorage.setItem(STORE, JSON.stringify(saved))
  } catch { /* ignore */ }
}
export function resetRate(key: string) {
  try {
    const saved: Saved = JSON.parse(localStorage.getItem(STORE) ?? '{}')
    delete saved[key]
    localStorage.setItem(STORE, JSON.stringify(saved))
  } catch { /* ignore */ }
}
export const findRate = (lib: RateEntry[], inputName: string) => lib.find(r => r.match.test(inputName.trim()))
export const surveyUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`
