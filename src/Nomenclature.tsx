import { useEffect, useMemo, useState } from 'react'
import { correct, INCLUDES, type Details } from './nomenclature'
import { search, type MrsItem } from './search'
import type { Text } from './i18n'
import type { Mrs } from './useMrs'
import type { ItemState } from './item'
import type { LoadRequest } from './BatchCheck'

const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function Nomenclature({ t, mrs, fromStep1, onUpdate, load }: { t: Text; mrs: Mrs; fromStep1: string; onUpdate: (s: ItemState) => void; load: LoadRequest | null }) {
  const [input, setInput] = useState('')
  const [unit, setUnit] = useState('')
  const [d, setD] = useState<Details>({ includes: [] })
  const [started, setStarted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [base, setBase] = useState<MrsItem | null>(null)
  const [nsiRate, setNsiRate] = useState('')

  // An item opened from the batch list fills this card
  useEffect(() => {
    if (!load) return
    setInput(load.text); setUnit(load.unit); setNsiRate(load.rate); setBase(null); setStarted(true); setCopied(false)
    document.getElementById('step2')?.scrollIntoView({ behavior: 'smooth' })
  }, [load])

  // Result updates live once the engineer has pressed the button
  const res = useMemo(() => (started && input.trim() ? correct(input, unit, mrs.vocab, d) : null), [started, input, unit, d, mrs.vocab])

  // Share the item with step 3 (justify the rate) and step 4 (rate analysis)
  useEffect(() => {
    onUpdate({ started, input, unit, rate: nsiRate, base, details: d, corrected: res?.text ?? '' })
  }, [started, input, unit, nsiRate, base, d, res?.text, onUpdate])

  const hits = started && mrs.index ? search(mrs.index, input, { limit: 5 }).filter(h => h.score >= 35) : []
  const unitHint = base ? `${base.u} (${base.c})` : hits[0] ? `${hits[0].item.u} (${hits[0].item.c})` : null

  const pickBase = (it: MrsItem) => { setBase(it); setInput(it.d); setUnit(it.u); setStarted(true); setCopied(false) }
  const toggleInc = (inc: string) =>
    setD(x => ({ ...x, includes: x.includes?.includes(inc) ? x.includes.filter(i => i !== inc) : [...(x.includes ?? []), inc] }))
  const copy = () => { if (res) navigator.clipboard?.writeText(res.text).then(() => setCopied(true)).catch(() => {}) }

  const field = (key: keyof Omit<Details, 'includes'>, label: string) => (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <input dir="ltr" value={(d[key] as string) ?? ''} onChange={e => setD(x => ({ ...x, [key]: e.target.value }))}
        className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:border-blue-600 focus:outline-none" />
    </label>
  )
  const flagText = (k: string) => (t as Record<string, string>)['f_' + k]
  const whyText = (k: string) => (t as Record<string, string>)['why_' + k]
  const inp = 'mt-1 rounded-lg border border-slate-300 p-2 focus:border-blue-600 focus:outline-none'

  return (
    <section id="step2" className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 font-bold text-white">2</span>
        <h2 className="text-lg font-semibold">{t.step2}</h2>
      </div>
      <p className="mt-3 text-sm text-slate-600">{t.nomHint}</p>
      <textarea dir="ltr" rows={3} value={input} onChange={e => { setInput(e.target.value); setCopied(false) }}
        className="mt-2 w-full rounded-lg border border-slate-300 p-3 focus:border-blue-600 focus:outline-none" />
      <div className="mt-2 flex flex-wrap items-end gap-3">
        {fromStep1 && (
          <button onClick={() => setInput(fromStep1)} className="rounded-lg border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-800">
            {t.copyFrom1}
          </button>
        )}
        <label className="text-sm"><span className="block text-slate-600">{t.unitL}</span>
          <input dir="ltr" value={unit} onChange={e => setUnit(e.target.value)} className={inp + ' w-32'} /></label>
        <label className="text-sm"><span className="block text-slate-600">{t.nsiRateL}</span>
          <input dir="ltr" inputMode="decimal" value={nsiRate} onChange={e => setNsiRate(e.target.value)} className={inp + ' w-40'} /></label>
      </div>

      {base && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <span>{t.baseLabel} <b dir="ltr" className="font-mono">{base.c}</b> — <b dir="ltr">Rs {base.r !== null ? fmt(base.r) : '—'} / {base.u}</b> · {t.page} {base.p}</span>
          <button onClick={() => setBase(null)} className="text-xs text-blue-800 underline">✕</button>
        </div>
      )}

      <details className="mt-4 rounded-lg border border-slate-200 p-3">
        <summary className="cursor-pointer font-semibold text-blue-900">{t.detailsTitle}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {field('size', t.sizeL)}
          {field('material', t.materialL)}
          {field('standard', t.standardL)}
          {field('make', t.makeL)}
        </div>
        <p className="mt-3 text-sm text-slate-600">{t.includesL}</p>
        <div dir="ltr" className="mt-1 grid gap-1 text-left text-sm sm:grid-cols-2">
          {INCLUDES.map(inc => (
            <label key={inc} className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={d.includes?.includes(inc) ?? false} onChange={() => toggleInc(inc)} />
              {inc}
            </label>
          ))}
        </div>
        <div className="mt-3">{field('extra', t.extraL)}</div>
        <p className="mt-2 text-xs text-slate-500">{t.nomNote}</p>
      </details>

      <button onClick={() => { setStarted(true); setCopied(false) }} disabled={!input.trim()}
        className="mt-4 rounded-lg bg-blue-800 px-5 py-2.5 font-semibold text-white disabled:opacity-40 active:scale-95">
        {t.correctBtn}
      </button>

      {res && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-green-900">{t.resultTitle}</h3>
              <button onClick={copy} className="rounded bg-green-700 px-3 py-1 text-sm font-semibold text-white">{copied ? t.copied : t.copyBtn}</button>
            </div>
            <p dir="ltr" className="mt-2 text-left text-slate-900">{res.text}</p>
            {unitHint && <p className="mt-2 text-sm text-slate-600">{t.suggestedUnit} <b dir="ltr">{unitHint}</b></p>}
          </div>

          {res.flags.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <h3 className="font-semibold">{t.checkTitle}</h3>
              <ul className="mt-1 list-disc space-y-1 ps-5">
                {res.flags.map((f, i) => <li key={i}>{flagText(f.kind)} {f.words.length > 0 && <b dir="ltr">{f.words.join(', ')}</b>}</li>)}
              </ul>
            </div>
          )}

          {res.changes.filter(c => c.why !== 'tidy').length > 0 && (
            <div className="rounded-lg border border-slate-200 p-3 text-sm">
              <h3 className="font-semibold">{t.changesTitle}</h3>
              <ul className="mt-1 space-y-1">
                {res.changes.filter(c => c.why !== 'tidy').map((c, i) => (
                  <li key={i}><span className="text-slate-500">{whyText(c.why)}:</span>{' '}
                    <span dir="ltr">{c.from && <><s className="text-red-700">{c.from}</s> → </>}<b className="text-green-800">{c.to}</b></span></li>
                ))}
              </ul>
            </div>
          )}

          {!base && hits.length > 0 && (
            <div className="rounded-lg border border-slate-200 p-3 text-sm">
              <h3 className="font-semibold">{t.closestMrs}</h3>
              <ul className="mt-1 space-y-2">
                {hits.slice(0, 3).map(h => (
                  <li key={h.item.c} dir="ltr" className="flex flex-wrap items-start justify-between gap-2 text-left">
                    <span><span className="font-mono font-bold text-blue-900">{h.item.c}</span> ({h.item.u}, Rs {h.item.r !== null ? fmt(h.item.r) : '—'}) — {h.item.d}</span>
                    <button onClick={() => pickBase(h.item)} className="shrink-0 rounded bg-blue-800 px-2 py-1 text-xs font-semibold text-white">{t.useBase}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
