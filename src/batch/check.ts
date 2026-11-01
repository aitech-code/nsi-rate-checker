// Runs every uploaded item through the same checks as steps 1-2.
import { search, wordCount, tokens, type Hit, type Index } from '../search'
import { correct, type Flag } from '../nomenclature'
import { perBase } from '../extras'
import type { RawItem } from './parse'

export type Verdict = 'strong' | 'possible' | 'none'
export type Checked = RawItem & {
  n: number
  verdict: Verdict
  hits: Hit[]
  corrected: string
  flags: Flag[]
  diffPct: number | null // NSI rate vs top MRS item (same kind of unit only)
  dupOf: number | null   // number of an earlier item with (almost) the same description
}

const STRONG = 60, POSSIBLE = 35, MIN_WORDS = 4
const num = (s: string) => parseFloat((s ?? '').replace(/,/g, ''))

export function checkAll(items: RawItem[], ix: Index, vocab?: Set<string>): Checked[] {
  const sets = items.map(it => new Set(tokens(it.desc)))
  const nums = items.map(it => (it.desc.match(/\d+(?:\.\d+)?/g) ?? []).sort().join(','))
  return items.map((it, i) => {
    const hits = search(ix, it.desc, { limit: 3 })
    const top = hits[0]?.score ?? 0
    const verdict: Verdict = top >= STRONG && wordCount(it.desc) >= MIN_WORDS ? 'strong' : top >= POSSIBLE ? 'possible' : 'none'
    const fix = correct(it.desc, it.unit, vocab)

    let diffPct: number | null = null
    const best = hits[0]?.item
    if (best && best.r && verdict !== 'none' && num(it.rate) > 0 && it.unit) {
      const a = perBase(num(it.rate), it.unit), b = perBase(best.r, best.u)
      if (a && b && a.base === b.base) diffPct = ((a.rate - b.rate) / b.rate) * 100
    }

    // Duplicate: >= 85% of the words are shared with an earlier item
    let dupOf: number | null = null
    for (let j = 0; j < i && dupOf === null; j++) {
      const A = sets[i], B = sets[j]
      const inter = [...A].filter(w => B.has(w)).length
      // items that differ only in size (25mm vs 32mm) are not duplicates
      if (A.size && inter / Math.max(A.size, B.size) >= 0.85 && nums[i] === nums[j]) dupOf = j + 1
    }
    return { ...it, n: i + 1, verdict, hits, corrected: fix.text, flags: fix.flags, diffPct, dupOf }
  })
}
