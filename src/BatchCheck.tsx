import { useState } from 'react'
import { readFile } from './batch/read'
import { checkAll, type Checked } from './batch/check'
import type { RawItem } from './batch/parse'
import type { Text } from './i18n'
import type { Mrs } from './useMrs'

export type LoadRequest = { text: string; unit: string; rate: string; n: number }
const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = (s: string) => parseFloat((s ?? '').replace(/,/g, ''))

export default function BatchCheck({ t, mrs, onOpen }: { t: Text; mrs: Mrs; onOpen: (r: LoadRequest) => void }) {
  const [items, setItems] = useState<RawItem[]>([])
  const [results, setResults] = useState<Checked[] | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'strong' | 'possible' | 'none' | 'dup'>('all')
  const [open, setOpen] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError(''); setResults(null)
    const got: RawItem[] = []
    for (const f of Array.from(files)) {
      try { got.push(...(await readFile(f, setBusy))) }
      catch (e) {
        const code = (e as Error).message
        setError(prev => prev + `${f.name}: ${code === 'OLD_XLS' ? t.bOldXls : code === 'UNSUPPORTED' ? t.bUnsupported : t.bReadError} `)
      }
    }
    setBusy('')
    setItems(prev => [...prev, ...got])
    if (!got.length) setError(prev => prev || t.bNothing)
  }

  const set = (i: number, k: keyof RawItem, v: string) => { setItems(x => x.map((it, j) => (j === i ? { ...it, [k]: v } : it))); setResults(null) }
  const del = (i: number) => { setItems(x => x.filter((_, j) => j !== i)); setResults(null) }
  const run = () => { if (mrs.index) setResults(checkAll(items.filter(i => i.desc.trim()), mrs.index, mrs.vocab)) }

  const counts = results && {
    strong: results.filter(r => r.verdict === 'strong').length,
    possible: results.filter(r => r.verdict === 'possible').length,
    none: results.filter(r => r.verdict === 'none').length,
    dup: results.filter(r => r.dupOf).length,
  }
  const shown = (results ?? []).filter(r => filter === 'all' || (filter === 'dup' ? !!r.dupOf : r.verdict === filter))
  const vStyle = { strong: 'bg-red-100 text-red-800', possible: 'bg-amber-100 text-amber-900', none: 'bg-green-100 text-green-800' }
  const vText = { strong: t.bStrong, possible: t.bPossible, none: t.bNone }

  const exportXlsx = async () => {
    if (!results) return
    const { default: writeExcelFile } = await import('write-excel-file/browser')
    const head = ['S.No', 'Description (as received)', 'Unit', 'NSI rate', 'Result', 'MRS code', 'MRS description', 'MRS unit', 'MRS rate', 'NSI vs MRS %', 'Corrected nomenclature', 'Points to check', 'Duplicate of', 'Source']
    const rows = results.map(r => {
      const b = r.hits[0]?.item
      const showMrs = r.verdict !== 'none' && b
      return [r.n, r.desc, r.unit, num(r.rate) || null, vText[r.verdict],
        showMrs ? b.c : null, showMrs ? b.d : null, showMrs ? b.u : null, showMrs ? b.r : null,
        r.diffPct !== null ? Math.round(r.diffPct * 10) / 10 : null, r.corrected,
        r.flags.map(f => f.kind + (f.words.length ? ': ' + f.words.join(', ') : '')).join('; ') || null,
        r.dupOf, r.source]
    })
    await writeExcelFile([head.map(h => ({ value: h, fontWeight: 'bold' as const })), ...rows]).toFile('NSI-check-MRS-2025.xlsx')
  }

  const inp = 'w-full rounded border border-slate-300 px-1 py-0.5 text-sm'
  return (
    <section className="rounded-xl border-2 border-blue-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">📂 {t.bTitle}</h2>
      <p className="mt-1 text-sm text-slate-600">{t.bHint}</p>
      <label className="mt-3 inline-block cursor-pointer rounded-lg bg-blue-800 px-4 py-2.5 font-semibold text-white active:scale-95">
        {t.bChoose}
        <input type="file" multiple accept=".xlsx,.csv,.txt,.pdf,.jpg,.jpeg,.png,.webp,image/*" className="hidden"
          onChange={e => { onFiles(e.target.files); e.target.value = '' }} />
      </label>
      <p className="mt-1 text-xs text-slate-500">{t.bPrivacy}</p>
      {busy && <p className="mt-2 animate-pulse text-sm font-semibold text-blue-800">{busy}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      {items.length > 0 && !results && (
        <div className="mt-4">
          <h3 className="font-semibold">{t.bReview} ({items.length})</h3>
          <p className="text-xs text-slate-500">{t.bReviewHint}</p>
          <div dir="ltr" className="mt-2 max-h-[28rem] space-y-2 overflow-y-auto text-left">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr] gap-2 rounded border border-slate-200 p-2">
                <span className="pt-1 text-xs text-slate-500">{i + 1}</span>
                <div className="space-y-1">
                  <textarea rows={2} value={it.desc} onChange={e => set(i, 'desc', e.target.value)} className={inp} />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span>Rs</span><input value={it.rate} onChange={e => set(i, 'rate', e.target.value)} className={inp + ' w-28'} />
                    <span>/</span><input value={it.unit} onChange={e => set(i, 'unit', e.target.value)} className={inp + ' w-20'} />
                    <span className="text-slate-400">{it.source}</span>
                    <button onClick={() => del(i)} className="ms-auto text-red-700">✕ {t.bDelete}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={run} disabled={!mrs.index} className="rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white disabled:opacity-40">✔ {t.bCheckAll}</button>
            <button onClick={() => setItems(x => [...x, { desc: '', rate: '', unit: '', source: 'typed' }])} className="rounded-lg border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-800">+ {t.bAddRow}</button>
            <button onClick={() => { setItems([]); setResults(null) }} className="rounded-lg border border-slate-400 px-3 py-2 text-sm">{t.bClear}</button>
          </div>
        </div>
      )}

      {results && counts && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {([['all', `${t.bAll} (${results.length})`], ['strong', `${t.bStrong} (${counts.strong})`], ['possible', `${t.bPossible} (${counts.possible})`], ['none', `${t.bNone} (${counts.none})`], ['dup', `${t.bDups} (${counts.dup})`]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3 py-1 ${filter === k ? 'bg-blue-800 text-white' : 'bg-slate-100'}`}>{label}</button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={exportXlsx} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">⬇ {t.bExport}</button>
            <button onClick={() => setResults(null)} className="rounded-lg border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-800">✎ {t.bEditList}</button>
          </div>

          <ul className="mt-3 space-y-2">
            {shown.map(r => {
              const b = r.hits[0]?.item
              return (
                <li key={r.n} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-slate-500">#{r.n}</span>
                    <span className={`rounded px-2 py-0.5 font-semibold ${vStyle[r.verdict]}`}>{vText[r.verdict]}</span>
                    {r.dupOf && <span className="rounded bg-purple-100 px-2 py-0.5 text-purple-800">{t.bDupOf} #{r.dupOf}</span>}
                    {r.flags.length > 0 && <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">⚠ {r.flags.length}</span>}
                  </div>
                  <p dir="ltr" className="mt-1 text-left text-sm">{r.desc}</p>
                  <p dir="ltr" className="text-left text-xs text-slate-500">NSI: {num(r.rate) > 0 ? `Rs ${fmt(num(r.rate))}` : '—'} / {r.unit || '—'}</p>
                  {r.verdict !== 'none' && b && (
                    <p dir="ltr" className="mt-1 text-left text-xs text-blue-900">
                      MRS <b className="font-mono">{b.c}</b> ({r.hits[0].score}%) — Rs {b.r !== null ? fmt(b.r) : '—'} / {b.u} · p.{b.p}
                      {r.diffPct !== null && <b className={r.diffPct > 0 ? ' text-red-700' : ' text-green-700'}> · NSI {r.diffPct > 0 ? '+' : ''}{r.diffPct.toFixed(1)}%</b>}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => setOpen(open === r.n ? null : r.n)} className="text-xs font-semibold text-blue-800 underline">{open === r.n ? '▲' : '▼'} {t.bDetails}</button>
                    <button onClick={() => onOpen({ text: r.desc, unit: r.unit, rate: r.rate, n: Date.now() })} className="rounded bg-blue-800 px-2 py-1 text-xs font-semibold text-white">{t.bOpen}</button>
                  </div>
                  {open === r.n && (
                    <div dir="ltr" className="mt-2 space-y-2 text-left text-sm">
                      <div className="rounded bg-green-50 p-2">
                        <div className="flex items-center justify-between"><b className="text-green-900">{t.resultTitle}</b>
                          <button onClick={() => navigator.clipboard?.writeText(r.corrected).then(() => setCopied(r.n)).catch(() => {})} className="rounded bg-green-700 px-2 py-0.5 text-xs text-white">{copied === r.n ? t.copied : t.copyBtn}</button></div>
                        <p className="mt-1">{r.corrected}</p>
                      </div>
                      {r.flags.length > 0 && <ul className="list-disc ps-5 text-xs text-amber-900">{r.flags.map((f, i) => <li key={i}>{(t as Record<string, string>)['f_' + f.kind]} {f.words.join(', ')}</li>)}</ul>}
                      {r.hits.length > 0 && <ul className="text-xs text-slate-600">{r.hits.map(h => <li key={h.item.c}><b className="font-mono">{h.item.c}</b> {h.score}% — {h.item.d} (Rs {h.item.r !== null ? fmt(h.item.r) : '—'} / {h.item.u})</li>)}</ul>}
                      <p className="text-xs text-slate-400">{r.source}</p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
