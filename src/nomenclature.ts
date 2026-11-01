// Nomenclature corrector: turns an NSI description into MRS-style wording.
// It only fixes wording and flags problems. It never invents sizes or specifications.

export type Change = { from: string; to: string; why: 'abbr' | 'spelling' | 'brand' | 'closing' | 'tidy' | 'detail' }
export type FlagKind = 'brand' | 'subjective' | 'noSize' | 'money' | 'vagueUnit' | 'long' | 'typo' | 'noAction'
export type Flag = { kind: FlagKind; words: string[] }
export type Result = { text: string; changes: Change[]; flags: Flag[] }

// Details the engineer enters so the wording explains (justifies) the rate
export type Details = { size?: string; material?: string; standard?: string; make?: string; includes?: string[]; extra?: string }

// Inclusions that usually drive the cost of an NSI item (wording used in the nomenclature)
export const INCLUDES = [
  'all necessary fittings and accessories',
  'fixing materials (screws, rawl plugs, adhesive etc.)',
  'cutting, wastage and making good the damages',
  'surface preparation, primer and finishing coats',
  'carriage to site, loading and unloading',
  'installation at any height including scaffolding',
  'testing and commissioning',
  'removal of debris from site',
  "manufacturer's warranty",
]

// Opening abbreviations used in C&W estimates -> MRS wording
const OPENERS: [RegExp, string][] = [
  [/^\s*p\s*\/\s*f\b\.?(\s*of)?/i, 'Providing and fixing'],
  [/^\s*p\s*\/\s*l\b\.?(\s*of)?/i, 'Providing and laying'],
  [/^\s*p\s*\/\s*a\b\.?(\s*of)?/i, 'Providing and applying'],
  [/^\s*p\s*\/\s*e\b\.?(\s*of)?/i, 'Providing and erecting'],
  [/^\s*p\s*\/\s*i\b\.?(\s*of)?/i, 'Providing and installing'],
  [/^\s*s\s*\/\s*f\b\.?(\s*of)?/i, 'Supply and fixing of'],
  [/^\s*s\s*\/\s*e\b\.?(\s*of)?/i, 'Supply and erection of'],
  [/^\s*s\s*\/\s*i\b\.?(\s*of)?/i, 'Supply and installation of'],
  [/^\s*s\s*\/\s*l\b\.?(\s*of)?/i, 'Supply and laying of'],
  [/^\s*r\s*\/\s*f\b\.?(\s*of)?/i, 'Removing and re-fixing of'],
  [/^\s*provide\s*&\s*fix\b/i, 'Providing and fixing'],
  [/^\s*provide\s*&\s*lay\b/i, 'Providing and laying'],
]

// Abbreviations inside the sentence
const INLINE: [RegExp, string][] = [
  [/\bi\s*\/\s*c\b\.?/gi, 'including'],
  [/\bw\s*\/\s*o\b\.?/gi, 'without'],
  [/\bc\s*\/\s*s\b\.?/gi, 'cement sand'],
  [/\bspd\b\.?/gi, 'specified'],
  [/\bapprvd\b\.?/gi, 'approved'],
  [/\bacc\s*to\b/gi, 'according to'],
]

// Common misspellings seen in C&W estimates (wrong -> right). Add more as you find them.
const SPELLING: Record<string, string> = {
  mechine: 'machine', machin: 'machine', extinghisher: 'extinguisher', extingusher: 'extinguisher',
  poluthene: 'polythene', polythine: 'polythene', polyethylene: 'polyethylene', cehemicalas: 'chemicals',
  chemicalas: 'chemicals', chemcial: 'chemical', tarrazo: 'terrazzo', terrazo: 'terrazzo', tarazzo: 'terrazzo',
  guage: 'gauge', gage: 'gauge', guaze: 'gauze', encharge: 'In-charge', inchrage: 'In-charge', incharge: 'In-charge',
  directe: 'directed', comlete: 'complete', complet: 'complete', compelete: 'complete', completee: 'complete',
  shishem: 'shisham', shisem: 'shisham', sheesham: 'shisham', chowkate: 'chowkat', errection: 'erection',
  erraction: 'erection', cylendrical: 'cylindrical', paiting: 'painting', painitng: 'painting', ornamentel: 'ornamental',
  omamental: 'ornamental', equalent: 'equivalent', equivelant: 'equivalent', equivalant: 'equivalent', eqivalent: 'equivalent',
  acsesories: 'accessories', accesories: 'accessories', accessries: 'accessories', fittngs: 'fittings', fitings: 'fittings',
  approvd: 'approved', aproved: 'approved', quaility: 'quality', qualty: 'quality', specificatins: 'specifications',
  specfications: 'specifications', specifcations: 'specifications', alluminium: 'aluminium', aluminum: 'aluminium',
  ceilling: 'ceiling', cieling: 'ceiling', celing: 'ceiling', cocking: 'cooking', cockery: 'crockery', cockery_: 'crockery',
  matresses: 'mattresses', matress: 'mattress', almirah: 'almirah', wardrob: 'wardrobe', railling: 'railling',
  tempred: 'tempered', temperd: 'tempered', galvanised: 'galvanized', insullation: 'insulation', insulaton: 'insulation',
  conduct: 'conduit', condiut: 'conduit', cabel: 'cable', cabels: 'cables', switchs: 'switches', socketts: 'sockets',
  plaster_: 'plaster', concete: 'concrete', cncrete: 'concrete', morter: 'mortar', mortor: 'mortar', brik: 'brick',
  respect: 'respects',
}
// "respect" -> "respects" only inside "in all respect"
delete SPELLING.respect
delete SPELLING.cockery_
delete SPELLING.plaster_
delete SPELLING.conduct // "conduct" is a real word
SPELLING.railling = 'railing'

// Brand / trade names common in Pakistani estimates. Audit expects "or equivalent".
const BRANDS = [
  'Schneider', 'ABB', 'Siemens', 'Legrand', 'Philips', 'Osram', 'Gree', 'Haier', 'Dawlance', 'Orient', 'Kenwood',
  'PEL', 'Pak Fan', 'GFC', 'Royal Fan', 'Super Asia', 'National', 'Panasonic', 'Samsung', 'LG', 'Clasiko', 'Porta',
  'Master', 'Sonex', 'Faisal', 'Shabbir', 'Stile', 'Dadex', 'Polydex', 'Beta', 'Pakistan Cables', 'Newage', 'Pioneer',
  'Fast Cables', 'ICI', 'Berger', 'Brighto', 'Nippon', 'Diamond Paint', 'Kansai', 'Jotun', 'Dulux', 'Grohe', 'Lucky',
  'Bestway', 'Maple Leaf', 'Fauji', 'Cherat', 'Askari', 'Amreli', 'Mughal', 'Ittefaq', 'Renai', 'Rinnai', 'Singer',
  'Nasgas', 'NesGas', 'Hair', 'Jumbolon', 'Jambolan', 'Thermopore', 'Formica', 'Sika', 'Fosroc', 'Mapei', 'Hilti',
]
const SUBJECTIVE = ['premium', 'luxury', 'luxurious', 'monumental', 'meticulously', 'meticulous', 'rigorously',
  'zero-defect', 'flawless', 'flawlessly', 'superior', 'world-class', 'high-end', 'best quality', 'top quality',
  'excellent', 'perfect', 'perfectly', 'state-of-the-art', 'imported']
const MONEY = /\b(rs\.?|rupees|tax|taxes|overheads?|profit|gst|sales tax|income tax)\b/i
const VAGUE_UNITS = ['job', 'ls', 'l.s', 'lump sum', 'lumpsum', 'item', 'set']

const CLOSING = 'complete in all respects as per specifications and as directed by the Engineer In-charge.'

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function correct(input: string, unit = '', vocab?: Set<string>, details: Details = {}): Result {
  const changes: Change[] = []
  const flags: Flag[] = []
  let t = input.replace(/\s+/g, ' ').trim()
  if (!t) return { text: '', changes, flags }

  // 1. Opening abbreviation
  for (const [re, rep] of OPENERS) {
    const m = t.match(re)
    if (m) { changes.push({ from: m[0].trim(), to: rep, why: 'abbr' }); t = t.replace(re, rep); break }
  }
  // 2. Inline abbreviations
  for (const [re, rep] of INLINE) {
    const m = t.match(re)
    if (m) { changes.push({ from: m[0].trim(), to: rep, why: 'abbr' }); t = t.replace(re, rep) }
  }
  // 3. Spelling
  t = t.replace(/[A-Za-z][A-Za-z-]*/g, w => {
    const fix = SPELLING[w.toLowerCase()]
    if (!fix || fix.toLowerCase() === w.toLowerCase()) return w
    const out = w[0] === w[0].toUpperCase() && fix !== 'In-charge' ? fix[0].toUpperCase() + fix.slice(1) : fix
    changes.push({ from: w, to: out, why: 'spelling' })
    return out
  })
  t = t.replace(/\bin all respect\b(?!s)/gi, m => { changes.push({ from: m, to: 'in all respects', why: 'spelling' }); return 'in all respects' })
  t = t.replace(/\b(Engineer|Engg?\.?:?)[\s-]*(In[\s-]*)?(charge|In-charge)\b/gi, m => {
    if (m !== 'Engineer In-charge') changes.push({ from: m, to: 'Engineer In-charge', why: 'tidy' })
    return 'Engineer In-charge'
  })

  // 4. Brands without "or equivalent"
  const found = BRANDS.filter(b => new RegExp(`\\b${esc(b)}\\b`, 'i').test(t))
  const hasEquiv = /\bor\s+(approved\s+)?equivalent\b|\bequivalent\s+approved\b/i.test(t)
  if (found.length && !hasEquiv) {
    // insert after the last brand mention (inside its bracket if there is one)
    const last = found.map(b => ({ b, i: t.search(new RegExp(`\\b${esc(b)}\\b`, 'i')) })).sort((a, z) => z.i - a.i)[0]
    const end = last.i + last.b.length
    const after = t.slice(end)
    const close = after.match(/^[^()]*?\)/)
    const pos = close ? end + close[0].length - 1 : end
    t = t.slice(0, pos) + ' or equivalent approved' + t.slice(pos)
    changes.push({ from: found.join(', '), to: found.join(', ') + ' or equivalent approved', why: 'brand' })
    flags.push({ kind: 'brand', words: found })
  }

  // 5. Tidy punctuation
  const before = t
  t = t.replace(/\s+([,.;])/g, '$1').replace(/(\D)\s+:/g, '$1:').replace(/([,;])(?=\S)/g, '$1 ').replace(/:(?=[^\s\d])/g, ': ').replace(/,\s*,/g, ',')
    .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s+/g, ' ').trim()
  t = t[0].toUpperCase() + t.slice(1)
  if (t !== before) changes.push({ from: '', to: '', why: 'tidy' })

  // 6. Remove old closing phrases, add details, then one standard closing phrase
  const TAILS = [
    /,?\s*(and\s+)?as\s+(directed|specified|approved)\s*,?\s*by\s+(the\s+)?Engineer In-charge\b/gi,
    /,?\s*(and\s+)?as\s+per\s+(the\s+)?directions?\s+of\s+(the\s+)?Engineer In-charge\b/gi,
    /,?\s*(all\s+)?as\s+per\s+(the\s+)?(approved\s+)?(specifications?|design|drawings?)(\s+and\s+drawings?)?(?=\s*([,.;]|$|and\b|as\b))/gi,
    /,?\s*complete\s+in\s+all\s+respects(?=\s*([,.;]|$|as\b))/gi,
    /,?\s*complete(?=\s*[.]?\s*$)/gi,
  ]
  let stripped = t
  for (let pass = 0; pass < 3; pass++) for (const re of TAILS) stripped = stripped.replace(re, '')
  stripped = stripped.replace(/(\s*(,|\.|;|\band\b|\bincluding all\b|\bincluding\b))+\s*$/i, '').trim()
  t = stripped + addDetails(stripped, details, changes) + ', ' + CLOSING
  changes.push({ from: '', to: CLOSING, why: 'closing' })

  // 7. Flags
  const subj = SUBJECTIVE.filter(w => new RegExp(`\\b${esc(w)}\\b`, 'i').test(t))
  if (subj.length) flags.push({ kind: 'subjective', words: subj })
  if (!/\d/.test(input + ' ' + (details.size ?? ''))) flags.push({ kind: 'noSize', words: [] })
  if (!/^(providing|provide|supply|supplying|removing|dismantling|repair|repairing|construction|constructing|manufacturing|fabricating|making|laying|fixing|installation|installing|replacement|replacing|cleaning|painting|applying|excavation|carriage|filling|cutting|drilling|testing|rehabilitation|demolition|erection|civil)/i.test(t))
    flags.push({ kind: 'noAction', words: [] })
  const money = t.match(MONEY)
  if (money) flags.push({ kind: 'money', words: [money[0]] })
  if (unit && VAGUE_UNITS.includes(unit.trim().toLowerCase())) flags.push({ kind: 'vagueUnit', words: [unit] })
  const words = t.split(/\s+/).length
  if (words > 70) flags.push({ kind: 'long', words: [String(words)] })
  if (vocab) {
    const odd = [...new Set((t.toLowerCase().match(/[a-z]{6,}/g) ?? []))]
      .filter(w => !vocab.has(w) && !vocab.has(w.replace(/s$/, '')) && !COMMON.has(w) && !BRANDS.some(b => b.toLowerCase() === w))
    if (odd.length) flags.push({ kind: 'typo', words: odd.slice(0, 8) })
  }
  return { text: t, changes, flags }
}

function addDetails(text: string, d: Details, changes: Change[]): string {
  const has = (v: string) => text.toLowerCase().includes(v.toLowerCase())
  const parts: string[] = []
  const add = (label: string, v?: string) => {
    const x = v?.trim()
    if (x && !has(x)) { parts.push(label + x); changes.push({ from: '', to: label + x, why: 'detail' }) }
  }
  add('size ', d.size)
  add('made of ', d.material)
  add('conforming to ', d.standard)
  if (d.make?.trim() && !has(d.make.trim())) add('make ', d.make.trim() + ' or equivalent approved')
  const inc = (d.includes ?? []).filter(i => !has(i))
  if (inc.length) {
    const txt = 'including ' + (inc.length > 1 ? inc.slice(0, -1).join(', ') + ', and ' + inc[inc.length - 1] : inc[0])
    parts.push(txt); changes.push({ from: '', to: txt, why: 'detail' })
  }
  add('', d.extra)
  return parts.length ? ', ' + parts.join(', ') : ''
}

// Ordinary English words that are not in MRS but are spelled correctly
const COMMON = new Set(('respects specifications directed including providing erecting installing complete ' +
  'approved equivalent according without removing charge engineer erection installation supply fixing laying ' +
  'applying testing commissioning cutting jointing') .split(' '))

// Words used in MRS descriptions, for the "check spelling" hint
export function mrsVocab(descriptions: string[]): Set<string> {
  const v = new Set<string>()
  for (const d of descriptions) for (const w of d.toLowerCase().match(/[a-z]+/g) ?? []) v.add(w)
  return v
}

// Most common MRS unit among similar items (suggestion only)
export function suggestUnit(units: string[]): string | null {
  if (!units.length) return null
  const c = new Map<string, number>()
  for (const u of units) { const k = u.trim(); if (k) c.set(k, (c.get(k) ?? 0) + 1) }
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}
