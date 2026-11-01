import { useEffect, useMemo, useState } from 'react'
import { buildIndex, search, type Hit, type MrsData } from './search'
import type { Text } from './i18n'

const DATA_URL = '/data/mrs-2025-1.json'
const STRONG = 60   // % match for "strong"
const POSSIBLE = 35 // % match for "possible"

const fmt = (n: number | null) =>
  n === null ? '—' : n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MrsSearch({ t }: { t: Text }) {
  const [data, setData] = useState<MrsData | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [asked, setAsked] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then(setData)
      .catch(() => setError(true))
  }, [])

  const index = useMemo(() => (data ? buildIndex(data.items) : null), [data])
  const hits: Hit[] = useMemo(
    () => (index && asked.trim() ? search(index, asked, { includeDeleted: showDeleted, limit: 8 }) : []),
    [index, asked, showDeleted],
  )

  const top = hits[0]?.score ?? 0
  const verdict = !asked ? null : top >= STRONG ? 'strong' : top >= POSSIBLE ? 'possible' : 'none'
  const verdictStyle = {
    strong: 'bg-red-50 text-red-800 border-red-200',
    possible: 'bg-amber-50 text-amber-900 border-amber-200',
    none: 'bg-green-50 text-green-800 border-green-200',
  }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 font-bold text-white">1</span>
        <h2 className="text-lg font-semibold">{t.step1}</h2>
      </div>

      <p className="mt-3 text-sm text-slate-600">{t.searchHint}</p>
      <textarea
        dir="ltr"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={t.placeholder}
        rows={3}
        className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-base focus:border-blue-600 focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setAsked(query)}
          disabled={!index || !query.trim()}
          className="rounded-lg bg-blue-800 px-5 py-2.5 font-semibold text-white disabled:opacity-40 active:scale-95"
        >
          {t.checkBtn}
        </button>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} />
          {t.showDeleted}
        </label>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {error ? <span className="text-red-700">{t.loadError}</span>
          : !data ? t.loading
          : <>{data.meta.activeCount.toLocaleString('en-PK')} {t.itemsLoaded} · {data.meta.edition}</>}
      </p>

      {verdict && (
        <div className={`mt-4 rounded-lg border p-3 font-semibold ${verdictStyle[verdict]}`}>{t[verdict]}</div>
      )}

      <ul className="mt-3 space-y-3">
        {hits.map(({ item, score }) => (
          <li key={item.c} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded bg-blue-100 px-2 py-0.5 font-mono font-bold text-blue-900">{item.c}</span>
              <span className={`rounded px-2 py-0.5 font-semibold ${score >= STRONG ? 'bg-red-100 text-red-800' : score >= POSSIBLE ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                {score}% {t.match}
              </span>
              {item.del && <span className="rounded bg-slate-800 px-2 py-0.5 text-white">{t.deleted}</span>}
              <span className="text-slate-500">{t.chapter} {item.ch} · {t.page} {item.p}{item.s ? ` · ${t.spec} ${item.s}` : ''}</span>
            </div>
            <p dir="ltr" className="mt-2 text-left text-slate-800">{item.d}</p>
            <div dir="ltr" className="mt-2 grid grid-cols-2 gap-2 text-left text-sm sm:grid-cols-4">
              <div className="rounded bg-slate-50 p-2"><div className="text-xs text-slate-500">{t.composite}</div><b>Rs {fmt(item.r)}</b> / {item.u}</div>
              <div className="rounded bg-slate-50 p-2"><div className="text-xs text-slate-500">{t.labour}</div>Rs {fmt(item.l)} / {item.u}</div>
              <div className="rounded bg-slate-50 p-2"><div className="text-xs text-slate-500">{t.composite} ({t.metric})</div>Rs {fmt(item.mr)} / {item.mu}</div>
              <div className="rounded bg-slate-50 p-2"><div className="text-xs text-slate-500">{t.labour} ({t.metric})</div>Rs {fmt(item.ml)} / {item.mu}</div>
            </div>
            {item.rm && <p className="mt-1 text-xs text-slate-500" dir="ltr">Remarks: {item.rm}</p>}
          </li>
        ))}
      </ul>

      {asked && (
        <div className="mt-4 space-y-1 text-xs text-slate-500">
          <p>{t.districtNote}</p>
          <p>{t.disclaimer}</p>
        </div>
      )}
    </section>
  )
}
