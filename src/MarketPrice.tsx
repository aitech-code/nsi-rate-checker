import { useMemo, useState } from 'react'
import { OVERHEADS, OVERHEAD_TOTAL } from './districts'
import { perBase } from './extras'
import { GUIDE, ALL_OPTIONS, detectOption } from './priceGuide'
import type { Text } from './i18n'

// Market price check for the whole item (e.g. an AC, floor tiles, marble):
// 1. "What is the item?" — picked automatically from the wording, or chosen / typed by the engineer
// 2. Built-in market price guide (sourced, dated) appears immediately
// 3. Optional own quotations override the guide
// 4. Market price + fixing + 23.5% is compared with the NSI rate

const TOLERANCE = 10 // % around the typical market rate treated as "in line"
const num = (s: string) => parseFloat((s ?? '').replace(/,/g, '')) || 0
const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const OH = 1 + OVERHEAD_TOTAL / 100

// Main words of the item for a price search ("Supply and erection of ... complete ..." -> the thing itself)
export function priceQuery(text: string): string {
  let q = ' ' + text + ' '
  q = q.replace(/\b(providing|provide|supplying|supply|erection|erecting|installation|installing|fixing|fix|laying|lay|applying|making|and|of|the|at site)\b/gi, ' ')
  q = q.split(/,|\bincluding\b|\bcomplete\b|\bas per\b|\bas directed\b/i)[0]
  q = q.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
  return q.split(' ').slice(0, 10).join(' ')
}

type Quote = { price: string; source: string }

export default function MarketPrice({ t, text, unit, nsi, onUse }: { t: Text; text: string; unit: string; nsi: number; onUse: (rate: number) => void }) {
  const auto = useMemo(() => detectOption(text), [text])
  const [picked, setPicked] = useState<string | null>(null) // null = automatic
  const optId = picked ?? auto ?? 'other'
  const opt = ALL_OPTIONS.find(o => o.id === optId) ?? null
  const [otherName, setOtherName] = useState('')

  const autoQuery = useMemo(() => priceQuery(text), [text])
  const [query, setQuery] = useState<string | null>(null)
  const q = query ?? (opt ? `${opt.label}` : otherName || autoQuery)

  const [quotes, setQuotes] = useState<Quote[]>([{ price: '', source: '' }, { price: '', source: '' }, { price: '', source: '' }])
  const [fixingTyped, setFixingTyped] = useState<string | null>(null)
  const [carriage, setCarriage] = useState('')
  const [used, setUsed] = useState(false)

  // Guide prices converted to the NSI unit (e.g. per Sft -> per m2)
  const conv = (() => {
    if (!opt) return null
    const a = perBase(1, opt.unit), b = perBase(1, unit || opt.unit)
    if (!a || !b || a.base !== b.base) return null
    return a.rate / b.rate // multiply a guide price by this (e.g. per Sft -> per m2 = x 10.7639)
  })()
  const g = opt && conv !== null ? { low: opt.low * conv, typical: opt.typical * conv, high: opt.high * conv, fixing: opt.fixing * conv } : null

  const prices = quotes.map(x => num(x.price)).filter(x => x > 0)
  const ownAvg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  const supply = ownAvg || g?.typical || 0
  const fixing = fixingTyped !== null ? num(fixingTyped) : g?.fixing ?? 0
  const cost = supply + fixing + num(carriage)
  const parts = OVERHEADS.map(o => ({ ...o, amount: (cost * o.pct) / 100 }))
  const market = cost * OH
  const rangeLow = g ? (g.low + fixing + num(carriage)) * OH : 0
  const rangeHigh = g ? (g.high + fixing + num(carriage)) * OH : 0
  const diff = nsi > 0 && market > 0 ? ((nsi - market) / market) * 100 : null
  const verdict = diff === null ? null : diff > TOLERANCE ? 'high' : diff < -TOLERANCE ? 'low' : 'ok'
  const vStyle = { ok: 'bg-green-100 text-green-800', high: 'bg-red-100 text-red-800', low: 'bg-amber-100 text-amber-900' }

  const enc = encodeURIComponent
  const links = [
    { name: 'Google', url: `https://www.google.com/search?q=${enc(q + ' price in Pakistan')}` },
    { name: 'Google Shopping', url: `https://www.google.com/search?tbm=shop&q=${enc(q)}` },
    { name: 'Daraz', url: `https://www.daraz.pk/catalog/?q=${enc(q)}` },
  ]
  const setQ = (i: number, k: keyof Quote, v: string) => setQuotes(x => x.map((y, j) => (j === i ? { ...y, [k]: v } : y)))
  const inp = 'rounded border border-slate-300 px-2 py-1'

  return (
    <div className="mt-3 rounded-lg border-2 border-green-300 bg-green-50 p-3 text-sm">
      <h3 className="font-semibold text-green-900">🛒 {t.mpTitle}</h3>

      {/* 1. What is the item? */}
      <label className="mt-2 block">
        <span className="text-xs text-slate-700">{t.mpWhat} {picked === null && auto ? <i className="text-green-800">({t.mpAuto})</i> : null}</span>
        <select dir="ltr" value={optId} onChange={e => { setPicked(e.target.value); setFixingTyped(null); setQuery(null) }} className={inp + ' mt-1 w-full bg-white'}>
          {GUIDE.map(gr => (
            <optgroup key={gr.id} label={gr.name}>
              {gr.options.map(o => <option key={o.id} value={o.id}>{o.label} — Rs {o.low.toLocaleString('en-PK')}–{o.high.toLocaleString('en-PK')} / {o.unit}</option>)}
            </optgroup>
          ))}
          <option value="other">{t.mpOther}</option>
        </select>
      </label>
      {optId === 'other' && (
        <input dir="ltr" value={otherName} onChange={e => setOtherName(e.target.value)} placeholder={t.mpOtherPh} className={inp + ' mt-2 w-full'} />
      )}

      {/* 2. Built-in guide */}
      {opt && (
        <div dir="ltr" className="mt-2 rounded border border-green-200 bg-white p-2 text-left text-xs">
          <p className="font-semibold text-green-900">
            {t.mpGuide}: Rs {fmt(opt.low)} – {fmt(opt.high)} {t.mpTypical} Rs {fmt(opt.typical)} / {opt.unit}
            {opt.fixingIncluded ? ` (${t.mpInclFix})` : ''}
          </p>
          {conv !== null && conv !== 1 && <p>= Rs {fmt(g!.typical)} / {unit} ({t.mpConverted})</p>}
          {conv === null && <p className="text-red-700">{t.unitMismatch} {unit} ≠ {opt.unit}</p>}
          {opt.note && <p className="text-slate-600">{opt.note}</p>}
          <p className="text-slate-500">{t.ra_srcCol}: {opt.src.map((s, i) => <span key={i}>{i > 0 && '; '}<a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.name}</a> ({s.date})</span>)}</p>
        </div>
      )}

      {/* 3. Own quotations (optional) */}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-semibold text-green-900">{t.mpOwn}</summary>
        <div dir="ltr" className="mt-2 flex flex-wrap items-center gap-2 text-left">
          <input value={q} onChange={e => setQuery(e.target.value)} className={inp + ' w-full basis-full'} />
          {links.map(l => (
            <a key={l.name} href={l.url} target="_blank" rel="noreferrer" className="rounded bg-green-700 px-3 py-1.5 text-xs font-semibold text-white">🔎 {l.name}</a>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-700">{t.mpEnter} <b dir="ltr">{unit || '?'}</b>):</p>
        <div dir="ltr" className="mt-1 space-y-1 text-left">
          {quotes.map((x, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <input inputMode="decimal" placeholder={`${t.mkPrice} ${i + 1}`} value={x.price} onChange={e => setQ(i, 'price', e.target.value)} className={inp + ' w-32'} />
              <input placeholder={t.mpSource} value={x.source} onChange={e => setQ(i, 'source', e.target.value)} className={inp + ' min-w-0 flex-1'} />
            </div>
          ))}
        </div>
      </details>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="text-xs"><span className="text-slate-600">{t.mkLabour}</span>
          <input dir="ltr" inputMode="decimal" value={fixingTyped ?? (fixing ? String(Math.round(fixing * 100) / 100) : '')} onChange={e => setFixingTyped(e.target.value)} className={inp + ' mt-1 w-full'} /></label>
        <label className="text-xs"><span className="text-slate-600">{t.mkCarriage}</span>
          <input dir="ltr" inputMode="decimal" value={carriage} onChange={e => setCarriage(e.target.value)} className={inp + ' mt-1 w-full'} /></label>
      </div>

      {/* 4. Market-based rate and comparison */}
      {supply > 0 && (
        <>
          <table dir="ltr" className="mt-3 w-full text-left text-xs">
            <tbody>
              <tr className="border-b"><td className="py-0.5">{ownAvg ? `${t.mkAvg} (${prices.length})` : `${t.mpGuide} — ${t.mpTypical}`}</td><td className="text-right">{fmt(supply)}</td></tr>
              {fixing > 0 && <tr className="border-b"><td className="py-0.5">{t.mkLabour}</td><td className="text-right">{fmt(fixing)}</td></tr>}
              {num(carriage) > 0 && <tr className="border-b"><td className="py-0.5">{t.mkCarriage}</td><td className="text-right">{fmt(num(carriage))}</td></tr>}
              {parts.map(o => <tr key={o.key} className="border-b text-slate-600"><td className="py-0.5">+ {o.label} @ {o.pct}%</td><td className="text-right">{fmt(o.amount)}</td></tr>)}
              <tr className="font-bold text-green-900"><td className="py-0.5">{t.mpMarketRate} / {unit || opt?.unit || '?'}</td><td className="text-right">Rs {fmt(market)}</td></tr>
              {g && !ownAvg && <tr className="text-slate-600"><td className="py-0.5">{t.mpRange}</td><td className="text-right">Rs {fmt(rangeLow)} – {fmt(rangeHigh)}</td></tr>}
            </tbody>
          </table>
          {verdict && diff !== null && (
            <p className={`mt-2 rounded p-2 font-semibold ${vStyle[verdict]}`}>
              {t[`mk_${verdict}` as 'mk_ok']}
              <span dir="ltr" className="block text-xs font-normal">
                NSI Rs {fmt(nsi)} vs market Rs {fmt(market)} → {diff > 0 ? '+' : ''}{diff.toFixed(1)}% (±{TOLERANCE}%)
                {g && !ownAvg && (nsi > rangeHigh ? ` — ${t.mpAboveRange}` : nsi < rangeLow ? ` — ${t.mpBelowRange}` : ` — ${t.mpInRange}`)}
              </span>
            </p>
          )}
          {ownAvg > 0 && prices.length < 3 && <p className="mt-1 text-xs text-amber-800">{t.mkFewQuotes}</p>}
          <button onClick={() => { onUse(Math.round(market * 100) / 100); setUsed(true) }} className="mt-2 rounded bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white">
            {used ? '✓ ' : ''}{t.mpUse}
          </button>
        </>
      )}
      <p className="mt-2 text-[11px] text-slate-500">{t.mpHint}</p>
    </div>
  )
}
