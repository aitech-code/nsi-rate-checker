import { useEffect, useMemo, useState } from 'react'
import { buildIndex, type MrsItem } from './search'

// MRS-2017 rate-analysis book (Finance Dept KP): quantities per unit for 2,679 items.
// Every analysis was checked: its lines recompute exactly to the composite rate printed in the PDF.
export type A17Line = { s: 'M' | 'L' | 'E'; d: string; q: number; u: string; r: number; p: number }
export type A17Item = { c: string; n: string; u: string; pg: number; lines: A17Line[]; sund: number; oh: number | null; rate: number | null }

export function useMrs2017(enabled: boolean) {
  const [items, setItems] = useState<A17Item[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!enabled || items) return
    fetch('/data/mrs-2017-analysis.json')
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then(d => setItems(d.items))
      .catch(() => setError(true))
  }, [enabled, items])
  // Re-use the MRS search engine on the 2017 item names
  const index = useMemo(() => (items
    ? buildIndex(items.map(i => ({ c: i.c, ch: i.c.slice(0, 2), p: i.pg, d: i.n, u: i.u, l: null, r: i.rate, mu: '', ml: null, mr: null, s: '', rm: '', del: false }) as MrsItem))
    : null), [items])
  const byCode = useMemo(() => new Map((items ?? []).map(i => [i.c, i])), [items])
  return { items, error, index, byCode }
}
