// Turns rows (Excel/CSV) or text lines (PDF/OCR) into NSI items.
// Works on "random" layouts with simple, explainable rules; the engineer reviews the result.

export type RawItem = { desc: string; rate: string; unit: string; source: string }

const UNIT_WORDS = 'p\\/?sft|psft|sft|sq\\.?\\s*ft|rft|r\\.?ft|cft|m2|m²|sqm|m3|cum|rm|rmt|mtr|m|no\\.?|nos\\.?|each|job|kg|ton|tonne|pair|set|point|item|ls|l\\.s|lump\\s*sum|meter|metre|ltr|litre|gallon|day'
const UNIT_RE = new RegExp(`^\\s*(?:per\\s+|p\\/)?(?:\\d+\\s*)?(${UNIT_WORDS})\\s*\\.?\\s*$`, 'i')
const NUM_RE = /^\s*(?:rs\.?\s*)?([\d,]+(?:\.\d+)?)\s*(?:\/-)?\s*$/i

const words = (s: string) => (s.match(/[A-Za-z]{2,}/g) ?? []).length
const clean = (s: string) => s.replace(/\s+/g, ' ').trim()
const isNum = (v: unknown) => typeof v === 'number' || (typeof v === 'string' && NUM_RE.test(v))
const toNum = (v: unknown) => (typeof v === 'number' ? v : parseFloat(String(v).replace(/rs\.?/i, '').replace(/,/g, '')))
const isUnit = (v: unknown) => typeof v === 'string' && UNIT_RE.test(v)
// Leading serial numbers: "12", "12.", "i)", "(a)", "a."
const SERIAL = /^\s*(?:\(?[ivx]{1,4}\)|\(?[a-z]\)|\d{1,4}[.)]?|[a-z]\.)\s+/i
const stripSerial = (s: string) => s.replace(SERIAL, '').replace(SERIAL, '')
// Labels that are not part of a description
const NOISE = /\b(n\.?\s*s\.?\s*i?\.?|i?ns[iu1l]|non[\s-]*schedule|csr-?\d*)\b/gi

const HEAD_DESC = /description|nomencl|nomencalture|particular|name of item|item of work|^item$|^items?\b|work/i
const HEAD_RATE = /rate|price|cost/i
const HEAD_UNIT = /^unit|per$|^u\/m|^uom/i

// ---------- Rows from Excel / CSV ----------
export function rowsToItems(rows: unknown[][], source: string): RawItem[] {
  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))

  // 1. C&W analysis sheets: "Item Code (NSI) ..." then the item text, then "Say Rate Per <unit>"
  const flat = rows.map(r => r.map(str))
  if (flat.some(r => r.some(c => /item\s*code/i.test(c)))) {
    const out: RawItem[] = []
    for (let i = 0; i < flat.length; i++) {
      if (!flat[i].some(c => /item\s*code/i.test(c))) continue
      const descRow = flat.slice(i + 1, i + 4).map(r => r.filter(c => words(c) >= 2).join(' ')).find(x => words(x) >= 2) ?? ''
      let rate = '', unit = ''
      for (let j = i + 1; j < Math.min(flat.length, i + 60); j++) {
        if (flat[j].some(c => /item\s*code/i.test(c))) break
        const label = flat[j].find(c => /say\s*rate|total\s*rate/i.test(c))
        if (label) {
          const n = rows[j].filter(isNum).map(toNum).filter(x => x > 0)
          if (n.length) { rate = String(n[0]); unit = (label.match(/per\s+(.+)$/i)?.[1] ?? '').trim() }
          if (/say/i.test(label)) break
        }
      }
      if (descRow) out.push({ desc: clean(descRow), rate, unit, source: `${source} row ${i + 2}` })
    }
    if (out.length) return out
  }

  // 2. Table with a header row (first 15 rows)
  let header = -1, cD = -1, cR = -1, cU = -1
  for (let i = 0; i < Math.min(15, flat.length) && header < 0; i++) {
    const r = flat[i]
    const d = r.findIndex(c => HEAD_DESC.test(c.trim()) && c.length < 40)
    if (d >= 0) {
      header = i; cD = d
      cR = r.findIndex((c, k) => k !== d && HEAD_RATE.test(c) && c.length < 30)
      cU = r.findIndex((c, k) => k !== d && HEAD_UNIT.test(c.trim()) && c.length < 20)
    }
  }
  const out: RawItem[] = []
  flat.forEach((r, i) => {
    if (i <= header) return
    let desc = '', rate = '', unit = ''
    if (header >= 0) {
      desc = r[cD] ?? ''
      if (cR >= 0 && isNum(rows[i][cR])) rate = String(toNum(rows[i][cR]))
      if (cU >= 0 && /[a-z]/i.test(r[cU] ?? '')) unit = (r[cU] ?? '').trim()
    }
    if (words(desc) < 2) {
      // 3. No usable header: longest text cell is the description
      const k = r.reduce((best, c, idx) => (words(c) > words(r[best] ?? '') ? idx : best), 0)
      desc = r[k] ?? ''
      const after = rows[i].slice(k + 1)
      const n = after.filter(isNum).map(toNum).filter(x => x > 0)
      if (!rate && n.length) rate = String(n[n.length - 1])
      if (!unit) unit = (after.find(isUnit) as string | undefined)?.trim() ?? ''
    }
    // only numbers to the right of the description can be a rate (left side is usually S.No)
    if (!rate) { const dk = r.indexOf(desc); const n = rows[i].filter((c, k) => k > dk && isNum(c)).map(toNum).filter(x => x > 0); if (n.length > 0 && words(desc) >= 2) rate = String(n[n.length - 1]) }
    if (!unit) unit = (r.find(isUnit) ?? '').trim()
    desc = clean(stripSerial(desc.replace(NOISE, ' ')))
    if (words(desc) >= 2 && desc.length >= 8) out.push({ desc, rate, unit, source: `${source} row ${i + 1}` })
  })
  return out
}

// ---------- Text lines from PDF / OCR ----------
const RATE_IN_LINE = new RegExp(
  // "@ Rs. 500.00 p/sft"  |  "Each 650000.000"  |  "rft 46"  |  "1500.000 Job"
  `(?:@\\s*rs\\.?\\s*([\\d,]+(?:\\.\\d+)?)\\s*(${UNIT_WORDS})?)` +
  `|(?:\\b(${UNIT_WORDS})\\s+([\\d,]+(?:\\.\\d+)?)\\s*(?:[\\d,.]+\\s*)?$)` +
  `|(?:\\b([\\d,]+(?:\\.\\d+)?)\\s*(${UNIT_WORDS})\\s*(?:rs\\.?.*)?$)`,
  'i',
)

const STARTER = /^(p\s*\/\s*[flaei]\b|s\s*(?:&|\/)\s*[efil]\b|providing|provide|supply|supplying|construction|constructing|repair|removing|dismantling|installation|installing|fixing|manufacturing|fabricating|laying|painting|various)/i
// A new item starting in the middle of a line (PDF tables): "specified S&E OF ..."
const STARTER_MID = /\s((?:S\s*&\s*E|P\s*\/\s*[FLAE]|S\s*\/\s*[EFIL])\b|Providing\b|Supply\b|Supplying\b)/

export function linesToItems(lines: string[], source: string): RawItem[] {
  const out: RawItem[] = []
  let buffer: string[] = []
  let parent = ''
  // split lines where a new item starts mid-line
  const all: string[] = []
  for (const l of lines) {
    const m = l.match(STARTER_MID)
    if (m && m.index !== undefined && m.index > 0 && words(l.slice(0, m.index)) <= 6) { all.push(l.slice(0, m.index)); all.push(l.slice(m.index + 1)) }
    else all.push(l)
  }
  for (const raw of all) {
    const line = clean(raw)
    if (!line) continue
    let m = line.match(RATE_IN_LINE)
    let rate = '', unit = '', ownRaw = ''
    if (m) {
      rate = (m[1] ?? m[4] ?? m[5] ?? '').replace(/,/g, '')
      unit = (m[2] ?? m[3] ?? m[6] ?? '').trim()
      ownRaw = line.slice(0, m.index)
    } else {
      // short sub-item ending in a price, e.g. '6" dia 358.36' (unit taken from the previous item)
      const b = line.match(/^(.{0,40}?)\s+([\d,]+\.\d{2,3})\s*$/)
      if (b && words(b[1]) <= 5 && out.length && !/^[a-z]/.test(b[1].trim()) && parseFloat(b[2].replace(/,/g, '')) >= 10) { m = b; rate = b[2].replace(/,/g, ''); unit = out[out.length - 1].unit; ownRaw = b[1] }
    }
    if (m) {
      const own = clean(stripSerial(ownRaw.replace(NOISE, ' ').replace(/@\s*rs\.?/i, '')))
      let desc: string
      if (buffer.length) {
        desc = clean(buffer.join(' ') + (words(own) >= 1 ? ' ' + own : ''))
        parent = words(own) >= 1 && words(own) < 6 ? buffer.join(' ') : ''
        buffer = []
      } else desc = parent && words(own) < 8 && !STARTER.test(own) ? `${parent} — ${own}` : own
      if (words(desc) >= 2 && parseFloat(rate) > 0) out.push({ desc: clean(desc), rate, unit, source })
      continue
    }
    const text = clean(stripSerial(line.replace(NOISE, ' ')))
    if (words(text) === 0) continue
    if (/^(brief note|abstract|bill of quantities|schedule of|name of work|sub[\s-]*head)/i.test(text)) continue
    // Wrapped text of the item just read (starts in lower case, or "+", and is not a new item)
    if (!buffer.length && out.length && !STARTER.test(text) && /^[a-z+(&,]/.test(text)) {
      out[out.length - 1].desc = clean(out[out.length - 1].desc + ' ' + text)
      continue
    }
    if (!buffer.length && STARTER.test(text)) parent = ''
    buffer.push(text)
  }
  return out
}

// OCR text: remove table borders and stray symbols so rows read cleanly
export function cleanOcrLines(text: string): string[] {
  return text.split('\n').map(l => l.replace(/[|[\]{}_]+/g, ' ').replace(/\s—\s*$/, '').replace(/\s+/g, ' ').trim()).filter(Boolean)
}

// Group pdf.js text items into lines (by their y position)
export function pdfItemsToLines(items: { str: string; transform: number[] }[]): string[] {
  const rows = new Map<number, { x: number; s: string }[]>()
  for (const it of items) {
    if (!it.str.trim()) continue
    const y = Math.round(it.transform[5] / 3) * 3
    const key = [...rows.keys()].find(k => Math.abs(k - y) <= 3) ?? y
    if (!rows.has(key)) rows.set(key, [])
    rows.get(key)!.push({ x: it.transform[4], s: it.str })
  }
  return [...rows.entries()].sort((a, b) => b[0] - a[0]).map(([, r]) => r.sort((a, b) => a.x - b.x).map(c => c.s).join(' '))
}
