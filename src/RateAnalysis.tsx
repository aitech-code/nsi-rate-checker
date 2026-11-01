import { useState } from 'react'
import { OVERHEADS, OVERHEAD_TOTAL } from './districts'
import { parseUnit } from './extras'
import type { Text } from './i18n'
import type { ItemState, JustifyState } from './item'

// Rate analysis in the MRS / C&W format:
// A Material + B Labour + C Equipment, Sundries 3% of labour,
// 23.5% (4% KP ST + 2% OH + 7.5% IT + 10% profit) on M + L + E, then per unit, metric and "Say" rate.

type Sec = 'M' | 'L' | 'E'
type Line = { id: number; sec: Sec; desc: string; qty: string; unit: string; rate: string; per: string }

const SUNDRIES = 3 // % of labour (MRS analysis format)
const num = (s: string) => parseFloat((s ?? '').replace(/,/g, '')) || 0
const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
let nextId = 1

// Metric equivalent of a British unit (per m2 / m / m3)
function metric(unit: string): { label: string; mult: number } | null {
  const p = parseUnit(unit)
  if (!p) return null
  if (p.base === 'sft') return { label: 'm²', mult: 10.7639 / p.per }
  if (p.base === 'rft') return { label: 'm', mult: 3.28084 / p.per }
  if (p.base === 'cft') return { label: 'm³', mult: 35.3147 / p.per }
  return null
}

export default function RateAnalysis({ t, item, just }: { t: Text; item: ItemState; just: JustifyState }) {
  const [project, setProject] = useState('')
  const [sub, setSub] = useState('')
  const [lines, setLines] = useState<Line[]>([])

  const add = (sec: Sec, desc = '', rate = '') =>
    setLines(l => [...l, { id: nextId++, sec, desc, qty: '1', unit: sec === 'L' ? 'Day' : 'No', rate, per: '1' }])
  const importExtras = () =>
    setLines(l => [...l, ...just.extras.map(x => ({ id: nextId++, sec: 'M' as Sec, desc: x.text, qty: '1', unit: item.unit || 'No', rate: String(x.cost), per: '1' }))])
  const set = (id: number, k: keyof Line, v: string) => setLines(l => l.map(x => (x.id === id ? { ...x, [k]: v } : x)))
  const del = (id: number) => setLines(l => l.filter(x => x.id !== id))

  const amt = (x: Line) => (num(x.qty) * num(x.rate)) / (num(x.per) || 1)
  const total = (sec: Sec) => lines.filter(x => x.sec === sec).reduce((s, x) => s + amt(x), 0)
  const M = total('M'), L = total('L'), E = total('E')
  const S = (L * SUNDRIES) / 100
  const ohBase = M + L + E
  const oh = OVERHEADS.map(o => ({ ...o, amount: (ohBase * o.pct) / 100 }))
  const addTotal = ohBase + S + oh.reduce((s, o) => s + o.amount, 0)
  const ref = just.ref
  const grand = ref + addTotal
  const say = Math.floor(grand)
  const m = metric(item.unit)
  const nsi = num(item.rate)
  const nomen = just.finalText || item.corrected

  const cell = 'border border-slate-300 px-1 py-0.5'
  const box = 'w-full min-w-0 rounded border border-slate-300 px-1 py-0.5 print:border-0'
  const section = (sec: Sec, title: string) => {
    const rows = lines.filter(x => x.sec === sec)
    const hideInPrint = rows.length === 0 ? ' print:hidden' : ''
    return (
      <>
        <tr className={'bg-slate-100 font-semibold' + hideInPrint}><td className={cell} colSpan={7}>{title}</td></tr>
        {rows.map(x => (
          <tr key={x.id}>
            <td className={cell}><input value={x.desc} onChange={e => set(x.id, 'desc', e.target.value)} className={box} /></td>
            <td className={cell + ' w-14'}><input inputMode="decimal" value={x.qty} onChange={e => set(x.id, 'qty', e.target.value)} className={box + ' text-right'} /></td>
            <td className={cell + ' w-14'}><input value={x.unit} onChange={e => set(x.id, 'unit', e.target.value)} className={box} /></td>
            <td className={cell + ' w-24'}><input inputMode="decimal" value={x.rate} onChange={e => set(x.id, 'rate', e.target.value)} className={box + ' text-right'} /></td>
            <td className={cell + ' w-12'}><input inputMode="decimal" value={x.per} onChange={e => set(x.id, 'per', e.target.value)} className={box + ' text-right'} /></td>
            <td className={cell + ' w-24 text-right'}>{fmt(amt(x))}</td>
            <td className={cell + ' w-6 text-center print:hidden'}><button onClick={() => del(x.id)} className="text-red-700">✕</button></td>
          </tr>
        ))}
        <tr className="print:hidden"><td className={cell} colSpan={7}>
          <button onClick={() => add(sec)} className="text-sm font-semibold text-blue-800">+ {t.ra_add}</button>
        </td></tr>
        <tr className={'font-semibold' + hideInPrint}><td className={cell} colSpan={5}>{t.ra_totalOf} {title}</td><td className={cell + ' text-right'}>{fmt(total(sec))}</td><td className={cell + ' print:hidden'} /></tr>
      </>
    )
  }

  return (
    <section id="rate-analysis" className="rounded-xl bg-white p-4 shadow-sm print:shadow-none">
      <div className="flex items-center gap-3 print:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 font-bold text-white">4</span>
        <h2 className="text-lg font-semibold">{t.step4}</h2>
      </div>

      <div dir="ltr" className="mt-3 text-left">
        <div className="hidden text-center print:block">
          <p className="font-bold">GOVERNMENT OF KHYBER PAKHTUNKHWA</p>
          <p className="font-semibold">COMMUNICATION &amp; WORKS DEPARTMENT</p>
          <p className="font-semibold underline">RATE ANALYSIS — NON-SCHEDULE ITEM (NSI)</p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <label><span className="text-slate-600">{t.ra_project}</span>
            <input value={project} onChange={e => setProject(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2 print:hidden" />
            <span className="hidden font-semibold print:block">{project}</span></label>
          <label><span className="text-slate-600">{t.ra_sub}</span>
            <input value={sub} onChange={e => setSub(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2 print:hidden" />
            <span className="hidden font-semibold print:block">{sub}</span></label>
        </div>
        <p className="mt-3 text-sm"><b>Item (NSI):</b> {nomen || <span className="text-slate-400">{t.ra_empty}</span>}</p>
        <p className="text-sm"><b>Rate analysis per:</b> {item.unit || '—'}</p>

        <div className="mt-2 flex flex-wrap gap-2 print:hidden">
          {just.extras.length > 0 && (
            <button onClick={importExtras} className="rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-semibold text-blue-900">{t.ra_import} ({just.extras.length})</button>
          )}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-blue-800 text-white print:bg-white print:text-black">
                <th className={cell + ' text-left'}>{t.ra_desc}</th><th className={cell}>{t.ra_qty}</th><th className={cell}>{t.ra_unit}</th>
                <th className={cell}>{t.ra_rate}</th><th className={cell}>{t.ra_per}</th><th className={cell}>{t.ra_amount}</th><th className={cell + ' print:hidden'} />
              </tr>
            </thead>
            <tbody>
              {section('M', t.ra_material)}
              {section('L', t.ra_labour)}
              {section('E', t.ra_equipment)}
              <tr><td className={cell} colSpan={5}>{t.ra_sundries} {SUNDRIES}% ({t.ra_labour})</td><td className={cell + ' text-right'}>{fmt(S)}</td><td className={cell + ' print:hidden'} /></tr>
              {oh.map(o => (
                <tr key={o.key}><td className={cell} colSpan={5}>{o.label} @ {o.pct}% {t.ra_ohOn}</td><td className={cell + ' text-right'}>{fmt(o.amount)}</td><td className={cell + ' print:hidden'} /></tr>
              ))}
              <tr className="font-semibold"><td className={cell} colSpan={5}>{ref > 0 ? t.ra_addTotal : t.ra_totalOf} (A+B+C + {SUNDRIES}% + {OVERHEAD_TOTAL}%)</td><td className={cell + ' text-right'}>{fmt(addTotal)}</td><td className={cell + ' print:hidden'} /></tr>
              {ref > 0 && (
                <tr><td className={cell} colSpan={5}>{t.ra_base}: {just.refLabel}</td><td className={cell + ' text-right'}>{fmt(ref)}</td><td className={cell + ' print:hidden'} /></tr>
              )}
              <tr className="bg-blue-50 font-bold"><td className={cell} colSpan={5}>{t.ra_total} {item.unit}</td><td className={cell + ' text-right'}>{fmt(grand)}</td><td className={cell + ' print:hidden'} /></tr>
              {m && (
                <tr><td className={cell} colSpan={5}>{t.ra_metric} {m.label} (× {m.mult.toFixed(4)})</td><td className={cell + ' text-right'}>{fmt(grand * m.mult)}</td><td className={cell + ' print:hidden'} /></tr>
              )}
              <tr className="font-bold"><td className={cell} colSpan={5}>{t.ra_say} {item.unit}</td><td className={cell + ' text-right'}>Rs {say.toLocaleString('en-PK')}</td><td className={cell + ' print:hidden'} /></tr>
              {m && (
                <tr className="font-bold"><td className={cell} colSpan={5}>{t.ra_say} {m.label}</td><td className={cell + ' text-right'}>Rs {Math.floor(grand * m.mult).toLocaleString('en-PK')}</td><td className={cell + ' print:hidden'} /></tr>
              )}
            </tbody>
          </table>
        </div>

        {nsi > 0 && grand > 0 && (
          <p className={`mt-3 rounded-lg p-3 text-sm font-semibold print:hidden ${Math.abs(grand - nsi) <= 1 ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
            {Math.abs(grand - nsi) <= 1 ? t.ra_match : <>{t.ra_diff} Rs {fmt(grand - nsi)} ({(((grand - nsi) / nsi) * 100).toFixed(1)}%) — NSI Rs {fmt(nsi)}</>}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">{t.ra_note}</p>

        <div className="mt-6 hidden justify-between text-sm print:flex">
          <span>Prepared by: ____________</span><span>Checked by: ____________</span><span>Executive Engineer: ____________</span>
        </div>
      </div>

      <button onClick={() => window.print()} className="mt-4 rounded-lg bg-blue-800 px-5 py-2.5 font-semibold text-white print:hidden">🖨 {t.ra_print}</button>
    </section>
  )
}
