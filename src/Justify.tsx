import { useEffect, useMemo, useState } from 'react'
import { correct } from './nomenclature'
import { detectCategories, slots, fill, perBase } from './extras'
import { DISTRICTS, OVERHEADS, OVERHEAD_TOTAL } from './districts'
import type { Text } from './i18n'
import type { Mrs } from './useMrs'
import type { ItemState, JustifyState } from './item'
import MarketPrice from './MarketPrice'

const TOLERANCE = 5 // % of the NSI rate that may stay unexplained
const OH = 1 + OVERHEAD_TOTAL / 100
const num = (s: string) => parseFloat((s ?? '').replace(/,/g, '')) || 0
const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Pick = { vals: string[]; cost: string }
type Custom = { text: string; cost: string }

export default function Justify({ t, mrs, item, onUpdate }: { t: Text; mrs: Mrs; item: ItemState; onUpdate: (j: JustifyState) => void }) {
  const [picked, setPicked] = useState<Record<string, Pick>>({})
  const [custom, setCustom] = useState<Custom[]>([])
  const [district, setDistrict] = useState('Peshawar')
  const [manualRef, setManualRef] = useState('')
  const [copied, setCopied] = useState(false)

  const factor = DISTRICTS.find(d => d.name === district)?.factor ?? 1
  const nsi = num(item.rate)

  // Reference: MRS base rate x district factor, converted to the NSI unit; otherwise typed by the engineer
  const mrsRef = (() => {
    const b = item.base
    if (!b || b.r === null || !item.unit) return null
    const mine = perBase(1, item.unit), theirs = perBase(b.r * factor, b.u)
    if (!mine || !theirs || mine.base !== theirs.base) return null
    return theirs.rate / mine.rate
  })()
  const ref = manualRef.trim() ? num(manualRef) : mrsRef ?? 0

  const cats = useMemo(() => detectCategories(item.input + ' ' + (item.base?.d ?? '')), [item.input, item.base])

  // Lines that are complete (all values typed) go into the nomenclature and the sum
  const lines = [
    ...Object.entries(picked).map(([tpl, p]) => ({ key: tpl, text: fill(tpl, p.vals), cost: num(p.cost) })),
    ...custom.map((c, i) => ({ key: 'c' + i, text: c.text.trim() || null, cost: num(c.cost) })),
  ]
  const done = lines.filter((l): l is { key: string; text: string; cost: number } => !!l.text)
  const incomplete = lines.filter(l => !l.text)
  const explained = done.reduce((s, l) => s + l.cost * OH, 0)
  const gap = nsi - ref
  const remaining = gap - explained
  const verdict = !nsi || !ref ? null : gap <= 0 ? 'none' : remaining <= (nsi * TOLERANCE) / 100 ? 'ok' : 'short'
  const maxRate = ref + explained

  const finalText = item.started && item.input.trim()
    ? correct(item.input, item.unit, mrs.vocab, { ...item.details, includes: [...done.map(l => l.text), ...(item.details.includes ?? [])] }).text
    : ''

  // Hand the extras, reference and final wording to step 4 (rate analysis)
  const refLabel = manualRef.trim() ? 'Reference rate (typed / market price guide)' : item.base && mrsRef !== null ? `MRS-2025 ${item.base.c} × ${factor.toFixed(2)} (${district})` : ''
  const doneKey = JSON.stringify(done)
  useEffect(() => {
    onUpdate({ extras: JSON.parse(doneKey).map((l: { text: string; cost: number }) => ({ text: l.text, cost: l.cost })), ref, refLabel, finalText })
  }, [doneKey, ref, refLabel, finalText, onUpdate])

  const toggle = (tpl: string) => setPicked(p => { const n = { ...p }; if (n[tpl]) delete n[tpl]; else n[tpl] = { vals: slots(tpl).map(() => ''), cost: '' }; return n })
  const setVal = (tpl: string, i: number, v: string) => setPicked(p => ({ ...p, [tpl]: { ...p[tpl], vals: p[tpl].vals.map((x, k) => (k === i ? v : x)) } }))
  const setCost = (tpl: string, v: string) => setPicked(p => ({ ...p, [tpl]: { ...p[tpl], cost: v } }))
  const setC = (i: number, k: keyof Custom, v: string) => setCustom(c => c.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const copy = () => { if (finalText) navigator.clipboard?.writeText(finalText).then(() => setCopied(true)).catch(() => {}) }

  const inp = 'rounded-lg border border-slate-300 p-2 focus:border-blue-600 focus:outline-none'
  const costBox = (value: string, onChange: (v: string) => void) => (
    <input dir="ltr" inputMode="decimal" placeholder={t.jCost} value={value} onChange={e => onChange(e.target.value)}
      className="w-32 rounded border border-slate-400 px-2 py-1 text-sm" />
  )
  const vStyle = { ok: 'border-green-300 bg-green-50 text-green-800', short: 'border-red-300 bg-red-50 text-red-800', none: 'border-slate-300 bg-slate-50 text-slate-700' }

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 font-bold text-white">3</span>
        <h2 className="text-lg font-semibold">{t.step3}</h2>
      </div>

      {!item.started || !nsi ? <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{t.jNoItem}</p> : (
        <>
          {/* What does this item cost in the market today? */}
          <MarketPrice t={t} text={item.base?.d || item.corrected || item.input} unit={item.unit} nsi={nsi} onUse={v => setManualRef(String(v))} />

          {/* Reference and gap */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm"><span className="block text-slate-600">{t.mkDistrict}</span>
              <select dir="ltr" value={district} onChange={e => setDistrict(e.target.value)} className={inp + ' mt-1 w-full'}>
                {DISTRICTS.map(d => <option key={d.name} value={d.name}>{d.name} ({d.factor.toFixed(2)})</option>)}
              </select></label>
            <label className="text-sm"><span className="block text-slate-600">{t.jRefManual}</span>
              <input dir="ltr" inputMode="decimal" value={manualRef} onChange={e => setManualRef(e.target.value)}
                placeholder={mrsRef !== null ? fmt(mrsRef) : ''} className={inp + ' mt-1 w-full'} /></label>
          </div>

          <table dir="ltr" className="mt-3 w-full text-left text-sm">
            <tbody>
              <tr className="border-b"><td className="py-1">{t.nsiRateL}</td><td className="text-right font-semibold">{fmt(nsi)} / {item.unit}</td></tr>
              <tr className="border-b"><td className="py-1">{t.jRef}{!manualRef && item.base && mrsRef !== null ? ` — MRS ${item.base.c} × ${factor.toFixed(2)}` : ''}</td>
                <td className="text-right">{ref ? fmt(ref) : '—'}</td></tr>
              <tr className="font-bold text-blue-900"><td className="py-1">{t.jGap}</td><td className="text-right">{ref ? fmt(Math.max(gap, 0)) : '—'}</td></tr>
            </tbody>
          </table>
          {item.base && mrsRef === null && !manualRef && <p className="mt-1 text-sm text-amber-800">{t.unitMismatch} <b dir="ltr">{item.unit} ≠ {item.base.u}</b></p>}

          {/* Extras with costs */}
          <div className="mt-4 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-3">
            <h3 className="font-semibold text-blue-900">{t.extrasTitle}{cats.length > 0 && <> — <span dir="ltr">{cats.map(c => c.name).join(', ')}</span></>}</h3>
            <p className="mt-1 text-xs text-slate-700">{t.jHonesty}</p>
            {cats.map(c => (
              <div key={c.id} dir="ltr" className="mt-2 space-y-2 text-left text-sm">
                {c.extras.map(tpl => {
                  const p = picked[tpl]
                  let k = -1
                  return (
                    <div key={tpl} className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-yellow-200 pb-1">
                      <input type="checkbox" className="me-1" checked={!!p} onChange={() => toggle(tpl)} />
                      {tpl.split(/(\{[^}]+\})/).map((part, i) => {
                        if (!part.startsWith('{')) return <span key={i}>{part}</span>
                        k++; const idx = k
                        return p
                          ? <input key={i} value={p.vals[idx]} placeholder={part.slice(1, -1)} onChange={e => setVal(tpl, idx, e.target.value)} className="w-24 rounded border border-slate-400 px-1 py-0.5" />
                          : <span key={i} className="text-slate-400">[{part.slice(1, -1)}]</span>
                      })}
                      {p && <span className="ms-auto">{costBox(p.cost, v => setCost(tpl, v))}</span>}
                    </div>
                  )
                })}
              </div>
            ))}
            <div dir="ltr" className="mt-3 space-y-2 text-left text-sm">
              {custom.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input value={c.text} placeholder={t.jCustomPh} onChange={e => setC(i, 'text', e.target.value)} className="min-w-0 flex-1 rounded border border-slate-400 px-2 py-1" />
                  {costBox(c.cost, v => setC(i, 'cost', v))}
                  <button onClick={() => setCustom(x => x.filter((_, j) => j !== i))} className="text-red-700">✕</button>
                </div>
              ))}
              <button onClick={() => setCustom(x => [...x, { text: '', cost: '' }])} className="rounded border border-blue-800 px-3 py-1 text-sm font-semibold text-blue-800">+ {t.jCustom}</button>
            </div>
            {incomplete.length > 0 && <p className="mt-2 text-sm text-red-800">{t.missingValue} {incomplete.length}</p>}
          </div>

          {/* Summary */}
          {done.length > 0 && (
            <table dir="ltr" className="mt-4 w-full text-left text-sm">
              <thead><tr className="border-b text-slate-500"><th className="py-1 font-normal">{t.jExtra}</th><th className="ps-3 text-right font-normal">{t.jCost}</th><th className="ps-3 text-right font-normal">+{OVERHEAD_TOTAL}%</th></tr></thead>
              <tbody>
                {done.map(l => (
                  <tr key={l.key} className="border-b"><td className="py-1 pe-2">{l.text}</td><td className="ps-3 text-right">{fmt(l.cost)}</td><td className="ps-3 text-right">{fmt(l.cost * OH)}</td></tr>
                ))}
                <tr className="font-semibold"><td className="py-1">{t.jExplained}</td><td /><td className="text-right">{fmt(explained)}</td></tr>
                {ref > 0 && gap > 0 && <tr className={`font-bold ${remaining > 0 ? 'text-red-800' : 'text-green-800'}`}><td className="py-1">{t.jRemaining}</td><td /><td className="text-right">{fmt(Math.max(remaining, 0))}</td></tr>}
              </tbody>
            </table>
          )}
          <p className="mt-1 text-xs text-slate-500" dir="ltr">{OVERHEADS.map(o => `${o.label} ${o.pct}%`).join(' + ')} = {OVERHEAD_TOTAL}% (MRS-2025, Preface para 2)</p>

          {verdict && (
            <div className={`mt-3 rounded-lg border p-3 font-semibold ${vStyle[verdict]}`}>
              {verdict === 'ok' && t.j_ok}
              {verdict === 'none' && t.j_none}
              {verdict === 'short' && <>{t.j_short} <span dir="ltr">Rs {fmt(maxRate)} / {item.unit}</span></>}
              {verdict !== 'none' && <p className="mt-1 text-sm font-normal" dir="ltr">Rs {fmt(ref)} + Rs {fmt(explained)} = Rs {fmt(maxRate)} vs NSI Rs {fmt(nsi)} (±{TOLERANCE}%)</p>}
            </div>
          )}

          {/* Final nomenclature */}
          {finalText && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-green-900">{t.jFinal}</h3>
                <button onClick={copy} className="rounded bg-green-700 px-3 py-1 text-sm font-semibold text-white">{copied ? t.copied : t.copyBtn}</button>
              </div>
              <p dir="ltr" className="mt-2 text-left text-slate-900">{finalText}</p>
              {item.base && <p className="mt-2 text-xs text-slate-600" dir="ltr">Remarks: MRS-2025 item {item.base.c} with additional features listed above.</p>}
            </div>
          )}
        </>
      )}
    </section>
  )
}
