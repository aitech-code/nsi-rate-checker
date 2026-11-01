import { useState } from 'react'
import { DISTRICTS, OVERHEADS, OVERHEAD_TOTAL } from './districts'
import { perBase } from './extras'
import type { MrsItem } from './search'
import type { Text } from './i18n'

export type ItemState = { text: string; unit: string; rate: string; base: MrsItem | null }
type Quote = { source: string; date: string; price: string }

const TOLERANCE = 10 // % band treated as "reasonable"
const OLD_DAYS = 180 // quotations older than this are flagged
const num = (s: string) => parseFloat((s ?? '').replace(/,/g, ''))
const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MarketCheck({ t, item }: { t: Text; item: ItemState }) {
  const [quotes, setQuotes] = useState<Quote[]>([{ source: '', date: '', price: '' }, { source: '', date: '', price: '' }, { source: '', date: '', price: '' }])
  const [basis, setBasis] = useState<'avg' | 'low'>('avg')
  const [labour, setLabour] = useState('')
  const [carriage, setCarriage] = useState('')
  const [district, setDistrict] = useState('Peshawar')
  const [now] = useState(() => Date.now())

  const setQ = (i: number, k: keyof Quote, v: string) => setQuotes(q => q.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const valid = quotes.filter(q => num(q.price) > 0)
  const prices = valid.map(q => num(q.price))
  const market = prices.length ? (basis === 'low' ? Math.min(...prices) : prices.reduce((a, b) => a + b, 0) / prices.length) : 0
  const cost = market + (num(labour) || 0) + (num(carriage) || 0)
  const parts = OVERHEADS.map(o => ({ ...o, amount: (cost * o.pct) / 100 }))
  const justified = cost * (1 + OVERHEAD_TOTAL / 100)

  const nsi = num(item.rate)
  const diffPct = nsi > 0 && justified > 0 ? ((nsi - justified) / justified) * 100 : null
  const verdict = diffPct === null ? null : diffPct > TOLERANCE ? 'high' : diffPct < -TOLERANCE ? 'low' : 'ok'
  const vStyle = { ok: 'bg-green-50 border-green-200 text-green-800', high: 'bg-red-50 border-red-200 text-red-800', low: 'bg-amber-50 border-amber-200 text-amber-900' }

  const old = valid.filter(q => q.date && (now - new Date(q.date).getTime()) / 86400000 > OLD_DAYS)
  const factor = DISTRICTS.find(d => d.name === district)?.factor ?? 1

  // MRS reference adjusted for district, in the same unit as the NSI item where possible
  const mrsRef = (() => {
    const b = item.base
    if (!b || b.r === null || !item.unit) return null
    const mine = perBase(1, item.unit), theirs = perBase(b.r * factor, b.u)
    if (!mine || !theirs || mine.base !== theirs.base) return null
    return theirs.rate / mine.rate // MRS rate per NSI unit
  })()

  const inp = 'rounded-lg border border-slate-300 p-2 focus:border-blue-600 focus:outline-none'
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 font-bold text-white">3</span>
        <h2 className="text-lg font-semibold">{t.step3}</h2>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
        {item.text
          ? <p dir="ltr" className="text-left text-slate-800">{item.text}</p>
          : <p className="text-slate-500">{t.mkNoItem}</p>}
        <p className="mt-1">{t.nsiRateL}: <b dir="ltr">{nsi > 0 ? `Rs ${fmt(nsi)} / ${item.unit || '?'}` : '—'}</b></p>
      </div>

      <h3 className="mt-4 font-semibold">{t.mkQuotes}</h3>
      <p className="text-xs text-slate-500">{t.mkQuotesHint} <b dir="ltr">{item.unit || '?'}</b></p>
      <div className="mt-2 space-y-2">
        {quotes.map((q, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr]">
            <input dir="ltr" placeholder={`${t.mkSource} ${i + 1}`} value={q.source} onChange={e => setQ(i, 'source', e.target.value)} className={inp} />
            <input type="date" value={q.date} onChange={e => setQ(i, 'date', e.target.value)} className={inp} aria-label={t.mkDate} />
            <input dir="ltr" inputMode="decimal" placeholder={t.mkPrice} value={q.price} onChange={e => setQ(i, 'price', e.target.value)} className={inp} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1"><input type="radio" checked={basis === 'avg'} onChange={() => setBasis('avg')} /> {t.mkAvg}</label>
        <label className="flex items-center gap-1"><input type="radio" checked={basis === 'low'} onChange={() => setBasis('low')} /> {t.mkLow}</label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm"><span className="block text-slate-600">{t.mkLabour}</span>
          <input dir="ltr" inputMode="decimal" value={labour} onChange={e => setLabour(e.target.value)} className={inp + ' mt-1 w-full'} /></label>
        <label className="text-sm"><span className="block text-slate-600">{t.mkCarriage}</span>
          <input dir="ltr" inputMode="decimal" value={carriage} onChange={e => setCarriage(e.target.value)} className={inp + ' mt-1 w-full'} /></label>
        <label className="text-sm"><span className="block text-slate-600">{t.mkDistrict}</span>
          <select dir="ltr" value={district} onChange={e => setDistrict(e.target.value)} className={inp + ' mt-1 w-full'}>
            {DISTRICTS.map(d => <option key={d.name} value={d.name}>{d.name} ({d.factor.toFixed(2)})</option>)}
          </select></label>
      </div>

      {valid.length > 0 && (
        <table dir="ltr" className="mt-4 w-full text-left text-sm">
          <tbody>
            <tr className="border-b"><td className="py-1">{basis === 'low' ? t.mkLow : t.mkAvg} ({valid.length})</td><td className="text-right">{fmt(market)}</td></tr>
            {num(labour) > 0 && <tr className="border-b"><td className="py-1">{t.mkLabour}</td><td className="text-right">{fmt(num(labour))}</td></tr>}
            {num(carriage) > 0 && <tr className="border-b"><td className="py-1">{t.mkCarriage}</td><td className="text-right">{fmt(num(carriage))}</td></tr>}
            <tr className="border-b font-semibold"><td className="py-1">{t.mkCost}</td><td className="text-right">{fmt(cost)}</td></tr>
            {parts.map(o => (
              <tr key={o.key} className="border-b text-slate-600"><td className="py-1">+ {o.label} @ {o.pct}%</td><td className="text-right">{fmt(o.amount)}</td></tr>
            ))}
            <tr className="font-bold text-blue-900"><td className="py-1">{t.mkJustified} (+{OVERHEAD_TOTAL}%) / {item.unit || '?'}</td><td className="text-right">Rs {fmt(justified)}</td></tr>
          </tbody>
        </table>
      )}

      {verdict && diffPct !== null && (
        <div className={`mt-3 rounded-lg border p-3 font-semibold ${vStyle[verdict]}`}>
          {t[`mk_${verdict}` as 'mk_ok']}
          <p className="mt-1 text-sm font-normal" dir="ltr">
            NSI Rs {fmt(nsi)} vs market Rs {fmt(justified)} → {diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}% (±{TOLERANCE}% = {t.mkReasonable})
          </p>
        </div>
      )}

      {mrsRef !== null && item.base && (
        <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
          {t.mkMrsRef} <b dir="ltr" className="font-mono">{item.base.c}</b> × {factor.toFixed(2)} ({district}) = <b dir="ltr">Rs {fmt(mrsRef)} / {item.unit}</b>
        </p>
      )}

      {(valid.length > 0 && valid.length < 3) || old.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 ps-8 text-sm text-amber-900">
          {valid.length < 3 && <li>{t.mkFewQuotes}</li>}
          {old.length > 0 && <li>{t.mkOldQuotes} <span dir="ltr">{old.map(q => q.source || q.date).join(', ')}</span></li>}
        </ul>
      ) : null}

      <p className="mt-3 text-xs text-slate-500">{t.mkNote}</p>
    </section>
  )
}
