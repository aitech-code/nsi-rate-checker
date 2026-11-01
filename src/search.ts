// MRS search: finds MRS items that match an NSI description, even with
// abbreviations (P/F, i/c), spelling mistakes or different word order.

export type MrsItem = {
  c: string; ch: string; p: number; d: string
  u: string; l: number | null; r: number | null
  mu: string; ml: number | null; mr: number | null
  s: string; rm: string; del: boolean
}
export type MrsData = {
  meta: { edition: string; publisher: string; itemCount: number; activeCount: number }
  chapters: Record<string, string>
  items: MrsItem[]
}
export type Hit = { item: MrsItem; score: number; matched: string[] }

// Common C&W abbreviations -> full words (applied before searching)
const ABBR: [RegExp, string][] = [
  [/\bp\s*\/\s*f\b/g, ' providing fixing '],
  [/\bp\s*\/\s*l\b/g, ' providing laying '],
  [/\bp\s*\/\s*a\b/g, ' providing applying '],
  [/\bs\s*\/\s*e\b/g, ' supply erection '],
  [/\bs\s*\/\s*f\b/g, ' supply fixing '],
  [/\bs\s*\/\s*i\b/g, ' supply installation '],
  [/\bi\s*\/\s*c\b/g, ' including '],
  [/\bi\s*\/\s*e\b/g, ' including '],
  [/\bc\s*\/\s*s\b/g, ' cement sand '],
  [/\bw\s*\/\s*/g, ' with '],
  [/\bdia\b/g, ' diameter '],
  [/\bsft\b|\bsq\.?\s*ft\b|\bpsft\b/g, ' sft '],
  [/\bcft\b/g, ' cft '],
  [/\bm\.\s*s\b|\bm\/s\b/g, ' ms '],
  [/\bg\.\s*i\b/g, ' gi '],
  [/\bac\b/g, ' air conditioner '],
]

// Trade names / local spellings -> words used in MRS. Add more as you find them.
const SYNONYMS: Record<string, string[]> = {
  jambolan: ['extruded', 'polystyrene'],
  jumbolon: ['extruded', 'polystyrene'],
  xps: ['extruded', 'polystyrene'],
  thermopol: ['thermopore'],
  styrofoam: ['thermopore', 'polystyrene'],
  tarrazo: ['terrazzo'],
  terrazo: ['terrazzo'],
  extinguisher: ['extinguisher'],
  extinghisher: ['extinguisher'],
  grille: ['grill'],
  aircon: ['air', 'conditioner'],
  tin: ['sheet'],
}

// Words that carry little meaning in BOQ descriptions
const STOP = new Set(('a an and the of to in on at for by or as per with from all any be is are complete ' +
  'completed respect respects approved directed engineer incharge charge site including providing fixing ' +
  'supply erection laying making etc i e ie no nos each job item quality best make same shown drawing ' +
  'drawings specification specifications specified required necessary').split(' '))

function normalize(s: string): string {
  let t = ' ' + s.toLowerCase() + ' '
  t = t.replace(/[‘’“”]/g, '"')
  t = t.replace(/(\d)\s*"|(\d)\s*''/g, '$1$2 inch ')     // 2"  -> 2 inch
  t = t.replace(/(\d)\s*'/g, '$1 ft ')                    // 2'  -> 2 ft
  for (const [re, rep] of ABBR) t = t.replace(re, rep)
  t = t.replace(/(\d)\s*(mm|cm|kg|kw|kva|ton|tonne|swg|watt|w|amp)\b/g, '$1 $2')
  t = t.replace(/[^a-z0-9.\s]/g, ' ')
  return t
}

export function tokens(s: string): string[] {
  const out: string[] = []
  for (let w of normalize(s).split(/\s+/)) {
    w = w.replace(/^\.+|\.+$/g, '')
    if (!w || STOP.has(w)) continue
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !/\d/.test(w)) w = w.slice(0, -1) // pipes -> pipe
    out.push(w)
    const syn = SYNONYMS[w]
    if (syn) out.push(...syn)
  }
  return out
}

// Allows one wrong / missing / extra letter in words of 5+ letters
function close(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length < 5 || b.length < 5 || /\d/.test(a) || /\d/.test(b)) return false
  if (Math.abs(a.length - b.length) > 1) return false
  if (a.startsWith(b) || b.startsWith(a)) return true
  let i = 0, j = 0, edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++edits > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else { i++; j++ }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

export type Index = { items: MrsItem[]; toks: Set<string>[]; idf: Map<string, number>; vocab: string[] }

export function buildIndex(items: MrsItem[]): Index {
  const toks = items.map(it => new Set(tokens(it.d)))
  const df = new Map<string, number>()
  for (const set of toks) for (const w of set) df.set(w, (df.get(w) ?? 0) + 1)
  const n = items.length
  const idf = new Map<string, number>()
  for (const [w, f] of df) idf.set(w, Math.log(1 + n / f))
  return { items, toks, idf, vocab: [...df.keys()] }
}

export function search(ix: Index, query: string, opts: { includeDeleted?: boolean; limit?: number } = {}): Hit[] {
  // Join split words that MRS writes as one word, e.g. "clean out" -> "cleanout"
  const raw = tokens(query)
  const joined: string[] = []
  for (let i = 0; i < raw.length; i++) {
    const pair = raw[i] + (raw[i + 1] ?? '')
    if (i + 1 < raw.length && !ix.idf.has(raw[i] + ' ') && ix.idf.has(pair) && !ix.idf.has(raw[i])) { joined.push(pair); i++ }
    else if (i + 1 < raw.length && ix.idf.has(pair) && (ix.idf.get(pair) ?? 0) > (ix.idf.get(raw[i]) ?? 0)) { joined.push(pair); i++ }
    else joined.push(raw[i])
  }
  const q = [...new Set(joined)]
  if (q.length === 0) return []
  const maxIdf = Math.log(1 + ix.items.length)
  // For each query word: which MRS words count as a match (exact or 1-letter typo)
  const variants = q.map(w => {
    const exact = ix.idf.has(w)
    const v = exact ? [w] : []
    if (!exact) for (const x of ix.vocab) if (close(w, x)) v.push(x)
    const weight = exact ? (ix.idf.get(w) ?? maxIdf) : maxIdf
    // A word matched only through a spelling correction earns half credit
    return { w, v, weight, credit: exact ? 1 : 0.5 }
  })
  const total = variants.reduce((s, x) => s + x.weight, 0)
  const hits: Hit[] = []
  ix.items.forEach((item, k) => {
    if (item.del && !opts.includeDeleted) return
    const set = ix.toks[k]
    let got = 0
    const matched: string[] = []
    for (const x of variants) {
      const m = x.v.find(v => set.has(v))
      if (m) { got += x.weight * x.credit; matched.push(m) }
    }
    if (got > 0) hits.push({ item, score: Math.round((got / total) * 100), matched })
  })
  hits.sort((a, b) => b.score - a.score || a.item.d.length - b.item.d.length)
  return hits.slice(0, opts.limit ?? 10)
}
