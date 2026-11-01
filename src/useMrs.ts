import { useEffect, useMemo, useState } from 'react'
import { buildIndex, type MrsData } from './search'
import { mrsVocab, INCLUDES } from './nomenclature'
import { CATEGORIES } from './extras'

const DATA_URL = '/data/mrs-2025-1.json'

// Loads the MRS data once and shares it with every card
export function useMrs() {
  const [data, setData] = useState<MrsData | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then(setData)
      .catch(() => setError(true))
  }, [])
  const index = useMemo(() => (data ? buildIndex(data.items) : null), [data])
  // Words for the spelling check: MRS wording plus the wording of the extras lists
  const vocab = useMemo(
    () => (data ? mrsVocab([...data.items.map(i => i.d), ...CATEGORIES.flatMap(c => c.extras), ...INCLUDES]) : undefined),
    [data],
  )
  return { data, error, index, vocab }
}
export type Mrs = ReturnType<typeof useMrs>
