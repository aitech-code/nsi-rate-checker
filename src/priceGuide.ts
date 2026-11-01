// Built-in market price guide for items that often appear as NSI.
// Researched online on 1 Nov 2026 — every figure keeps its source and date.
// Prices are SUPPLY prices per unit unless "fixingIncluded" is true.
// Update this file (or ask Claude to) when prices move; the engineer can always override in the app.

export type GSource = { name: string; url: string; date: string }
export type GuideOption = {
  id: string
  label: string
  unit: string             // per this unit (No, Sft …)
  low: number; typical: number; high: number
  fixing: number           // default fixing / installation per unit (0 if unknown or included)
  fixingIncluded?: boolean
  match?: RegExp           // picks this option from the item wording
  note?: string
  src: GSource[]
}
export type GuideItem = { id: string; name: string; match: RegExp; options: GuideOption[] }

const S = {
  je: { name: 'Japan Electronics — AC price lists', url: 'https://japanelectronics.com.pk/collections/1-ton-ac-price-in-pakistan', date: 'Nov 2026' },
  fh: { name: 'Friends Home — AC price lists', url: 'https://friendshome.pk/collections/1-ton-ac-price-pakistan', date: 'Nov 2026' },
  nasir: { name: 'Nasir Tiles — tiles price in Pakistan', url: 'https://nasirtiles.com/tiles-price-in-pakistan/', date: '3 Sep 2026' },
  wb: { name: 'Wooden Box Trading — flooring cost Pakistan 2026', url: 'https://woodenboxtrading.com/flooring-cost-pakistan-2026/', date: '7 Oct 2026' },
  mpk: { name: 'MarblePK — floor marble rates 2026', url: 'https://marblepk.com/marble-price-in-pakistan/', date: 'updated Sep 2026' },
  tav: { name: 'Tavera Marble — granite wholesale rates (page undated)', url: 'https://taveramarble.com/granite-pakistan/', date: 'undated' },
  pd: { name: 'PriceDaan — ceiling fan prices', url: 'https://pricedaan.pk/ceiling-fan-price-in-pakistan/', date: '16 Aug 2026' },
  ae: { name: 'AE LED Light — LED panel price guide', url: 'https://aeledlight.pk/blog/buying-guide/led-panel-light-price-pakistan/', date: '14 Jun 2026' },
  dl: { name: 'Deltalite — LED light prices', url: 'https://deltalite.pk/pages/led-light-price-in-pakistan', date: '13 Oct 2026' },
  ccg: { name: 'Civil Construction Guide — finishing material rates', url: 'https://civilconstructionguide.com/finishing-material-rates-in-pakistan/', date: 'Sep 2026' },
  pkc: { name: 'PK Civil Works — aluminium & uPVC windows (contractor rates, incl. fitting)', url: 'https://pkcivilworks.com/services/aluminium-upvc-windows-doors/', date: '19 Oct 2026' },
  upvc: { name: 'uPVC Windows Pakistan — 2026 rates', url: 'https://upvcwindows.com.pk/upvc-windows-price-in-pakistan-2026-latest-rates/', date: '16 Jun 2026' },
} satisfies Record<string, GSource>

export const GUIDE: GuideItem[] = [
  {
    id: 'ac', name: 'Air conditioner (split, inverter)',
    match: /\b(a\.?c|air[\s-]?condition\w*|split\s+(unit|ac|type)|inverter\s+ac)\b/i,
    options: [
      { id: 'ac1', label: '1 ton inverter split AC', unit: 'No', low: 105000, typical: 125000, high: 194908, fixing: 0, match: /\b1(\.0)?\s*-?\s*ton\b|12\s*k\b|12,?000\s*btu/i, note: 'Retail prices; installation kit/charges not included (add as extras).', src: [S.je, S.fh] },
      { id: 'ac15', label: '1.5 ton inverter split AC', unit: 'No', low: 119900, typical: 162000, high: 208000, fixing: 0, match: /\b1\.5\s*-?\s*tons?\b|18\s*k\b|18,?000\s*btu/i, note: 'Premium brands up to Rs 335,000 (Daikin). Installation not included.', src: [S.je, S.fh] },
      { id: 'ac2', label: '2 ton inverter split AC', unit: 'No', low: 169900, typical: 210000, high: 274000, fixing: 0, match: /\b2(\.0)?\s*-?\s*tons?\b|24\s*k\b|24,?000\s*btu/i, note: 'Some models up to Rs 360,000. Installation not included.', src: [S.je, S.fh] },
    ],
  },
  {
    id: 'marble', name: 'Marble flooring',
    match: /\bmarble\b|ziarat|botticino|boticino|tavera|trevera|verona|sunny|badal/i,
    options: [
      { id: 'mtav', label: 'Tavera / Trevera (local)', unit: 'Sft', low: 45, typical: 90, high: 110, fixing: 150, match: /tavera|trevera|travera|golden/i, note: 'Laying ~Rs 120–180 + polish Rs 70–120/sft (Peshawar).', src: [S.wb, S.mpk] },
      { id: 'mzia', label: 'Ziarat white (local)', unit: 'Sft', low: 200, typical: 275, high: 350, fixing: 150, match: /ziarat/i, note: 'Larger sizes cost more (see MarblePK size table).', src: [S.wb] },
      { id: 'msun', label: 'Sunny white / Sunny grey / Badal', unit: 'Sft', low: 80, typical: 140, high: 180, fixing: 150, match: /sunny|badal/i, src: [S.mpk, S.wb] },
      { id: 'mver', label: 'Verona', unit: 'Sft', low: 150, typical: 200, high: 260, fixing: 150, match: /verona/i, src: [S.mpk] },
      { id: 'mbot', label: 'Botticino cream (local)', unit: 'Sft', low: 280, typical: 340, high: 400, fixing: 150, match: /botticino|boticino/i, note: 'Italian Botticino Rs 500–800/sft (Wooden Box).', src: [S.mpk, S.wb] },
    ],
  },
  {
    id: 'granite', name: 'Granite',
    match: /\bgranite\b/i,
    options: [
      { id: 'grl', label: 'Granite — local grey / pink', unit: 'Sft', low: 350, typical: 415, high: 480, fixing: 150, match: /grey|gray|pink/i, note: 'Wholesale yard rates; freight Rs 15–25/sft extra.', src: [S.tav] },
      { id: 'grb', label: 'Granite — black / imported calibrated', unit: 'Sft', low: 520, typical: 635, high: 750, fixing: 150, match: /black|absolute|galaxy|imported/i, note: 'Wholesale yard rates; freight Rs 15–25/sft extra.', src: [S.tav] },
    ],
  },
  {
    id: 'tile', name: 'Floor tiles',
    match: /\btiles?\b/i,
    options: [
      { id: 'tcer', label: 'Ceramic floor tiles (local)', unit: 'Sft', low: 90, typical: 150, high: 250, fixing: 150, match: /ceramic/i, note: 'Fixing in Peshawar Rs 120–180/sft (Wooden Box).', src: [S.wb, S.nasir] },
      { id: 'tpor', label: 'Porcelain tiles 24"x24" (local / glazed)', unit: 'Sft', low: 130, typical: 300, high: 700, fixing: 150, match: /porcelain|24\s*"?\s*x\s*24|2\s*'?\s*x\s*2/i, note: 'Fixing in Peshawar Rs 120–180/sft.', src: [S.nasir, S.wb] },
      { id: 'timp', label: 'Imported tiles (Spanish / Chinese)', unit: 'Sft', low: 250, typical: 600, high: 1500, fixing: 150, match: /imported|spanish|china|chinese|italian/i, note: 'Nasir Tiles: Rs 250–800; Wooden Box: Rs 250–1,500+.', src: [S.wb, S.nasir] },
    ],
  },
  {
    id: 'ceiling', name: 'False ceiling',
    match: /false\s+ceiling|gypsum|pvc\s+(ceiling|panel)|suspended\s+ceiling/i,
    options: [
      { id: 'cgy', label: 'Gypsum board ceiling — plain (Peshawar)', unit: 'Sft', low: 160, typical: 188, high: 215, fixing: 0, match: /gypsum/i, note: 'Source does not say whether installation is included.', src: [S.ccg] },
      { id: 'cgyd', label: 'Gypsum board ceiling — with design / cove lights', unit: 'Sft', low: 200, typical: 275, high: 350, fixing: 0, match: /gypsum.*(design|cove|light)/i, note: 'Source does not say whether installation is included.', src: [S.ccg] },
      { id: 'cpvc', label: 'PVC ceiling panels (Peshawar)', unit: 'Sft', low: 85, typical: 115, high: 145, fixing: 0, match: /pvc/i, note: 'Source does not say whether installation is included.', src: [S.ccg] },
    ],
  },
  {
    id: 'window', name: 'Windows (aluminium / uPVC)',
    match: /\b(window|windows|upvc|aluminium|aluminum|glazing)\b/i,
    options: [
      { id: 'wal', label: 'Aluminium sliding window 1.2 mm, 5 mm glass', unit: 'Sft', low: 850, typical: 950, high: 1050, fixing: 0, fixingIncluded: true, match: /alumin/i, src: [S.pkc] },
      { id: 'walh', label: 'Aluminium heavy 1.6 mm, double glazed', unit: 'Sft', low: 1250, typical: 1425, high: 1600, fixing: 0, fixingIncluded: true, match: /alumin.*(double|heavy|1\.6)|(double|heavy|1\.6).*alumin/i, src: [S.pkc] },
      { id: 'wup', label: 'uPVC sliding window, single glass', unit: 'Sft', low: 1200, typical: 1325, high: 1450, fixingIncluded: true, fixing: 0, match: /upvc|u\.p\.v\.c/i, note: 'Another source gives Rs 1,500–3,000 + installation 300–700 (uPVC Windows Pakistan, Jun 2026).', src: [S.pkc, S.upvc] },
      { id: 'wupd', label: 'uPVC double glazed window', unit: 'Sft', low: 1600, typical: 1900, high: 2200, fixingIncluded: true, fixing: 0, match: /upvc.*double|double.*upvc/i, note: 'Another source gives Rs 3,500–7,000 (uPVC Windows Pakistan, Jun 2026).', src: [S.pkc, S.upvc] },
    ],
  },
  {
    id: 'fan', name: 'Ceiling fan 56"',
    match: /\b(ceiling\s+)?fans?\b/i,
    options: [
      { id: 'fstd', label: 'Ceiling fan 56" (standard AC)', unit: 'No', low: 8195, typical: 11000, high: 24195, fixing: 0, src: [S.pd] },
      { id: 'fes', label: 'Ceiling fan 56" energy-saver (AC/DC, inverter)', unit: 'No', low: 8500, typical: 10500, high: 20300, fixing: 0, match: /ac\s*\/\s*dc|inverter|energy|saver|dc\b|30\s*w/i, src: [S.pd] },
    ],
  },
  {
    id: 'geyser', name: 'Water heater / geyser',
    match: /\b(geyser|water\s+heater)\b/i,
    options: [
      { id: 'gel', label: 'Electric geyser 15–30 litres', unit: 'No', low: 15000, typical: 25000, high: 35000, fixing: 0, note: 'No reliable gas-geyser prices found — use your own quotations.', src: [S.ccg] },
    ],
  },
  {
    id: 'light', name: 'LED light',
    match: /\b(led|panel\s+light|down\s*light|ceiling\s+light|light)\b/i,
    options: [
      { id: 'lp22', label: 'LED panel 2x2 ft (36–48 W)', unit: 'No', low: 2500, typical: 3500, high: 4500, fixing: 550, match: /2\s*'?\s*x\s*2|24\s*"?\s*x\s*24|panel/i, note: 'Electrician charge Rs 300–800 per panel (AE LED).', src: [S.ae, S.dl] },
      { id: 'ldl', label: 'LED downlight 12–18 W', unit: 'No', low: 315, typical: 470, high: 629, fixing: 0, match: /down\s*light|12\s*w|18\s*w/i, src: [S.dl] },
    ],
  },
]

export const ALL_OPTIONS = GUIDE.flatMap(g => g.options.map(o => ({ ...o, group: g.name })))

// Best guess from the item wording: category first, then the most specific option
export function detectOption(text: string): string | null {
  const g = GUIDE.find(x => x.match.test(text))
  if (!g) return null
  const specific = [...g.options].reverse().find(o => o.match?.test(text))
  return (specific ?? g.options[0]).id
}
