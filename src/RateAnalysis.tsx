import { useEffect, useMemo, useState } from 'react'
import { OVERHEADS, OVERHEAD_TOTAL } from './districts'
import { parseUnit } from './extras'
import { search } from './search'
import { useMrs2017, type A17Item } from './useMrs2017'
import { loadRates, saveRate, resetRate, findRate, surveyUrl, DEFAULT_RATES, MIN_WAGE, UNSKILLED, type RateEntry } from './rates'
import type { Text } from './i18n'
import type { ItemState, JustifyState } from './item'
import type { Mrs } from './useMrs'
import { perBase } from './extras'

// Rate analysis in the MRS / C&W format:
// A Material + B Labour + C Equipment, Sundries 3% of labour,
// 23.5% (4% KP ST + 2% OH + 7.5% IT + 10% profit) on M + L + E, then per unit, metric and "Say" rate.
// Lines fill automatically: extras from step 3, and/or official MRS-2017 quantities x current market rates.

type Sec = 'M' | 'L' | 'E'
type Line = { id: number; sec: Sec; desc: string; qty: string; unit: string; rate: string; per: string; src: 'extra' | 'tpl' | 'user'; key?: string }

const SUNDRIES = 3 // % of labour (MRS analysis format)
const num = (s: string) => parseFloat((s ?? '').replace(/,/g, '')) || 0
const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const q4 = (n: number) => String(Math.round(n * 10000) / 10000)
let nextId = 1

// Metric equivalent of a British unit (per m2 / m / m3)
function metric(unit: string): { label: string; mult: number } | null {
  if (/^\s*(m2|m²|sqm|m3|m³|cum|m|rm|rmt|mtr|meter|metre)\s*$/i.test(unit)) return null // already metric
  const p = parseUnit(unit)
  if (!p) return null
  if (p.base === 'sft') return { label: 'm²', mult: 10.7639 / p.per }
  if (p.base === 'rft') return { label: 'm', mult: 3.28084 / p.per }
  if (p.base === 'cft') return { label: 'm³', mult: 35.3147 / p.per }
  return null
}

export default function RateAnalysis({ t, item, just, mrs }: { t: Text; item: ItemState; just: JustifyState; mrs: Mrs }) {
  const [project, setProject] = useState('')
  const [sub, setSub] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [rates, setRates] = useState<RateEntry[]>(loadRates)
  const [tpl, setTpl] = useState<{ c: string; n: string; u: string; pg: number; factor: number } | null>(null)
  const [aUnit, setAUnit] = useState('')        // analysis unit if it differs from the item unit
  const [includeBase, setIncludeBase] = useState(true)
  const [showMarket, setShowMarket] = useState(false)

  const a17 = useMrs2017(item.started)
  const unit = aUnit || item.unit
  const libByKey = useMemo(() => new Map(rates.map(r => [r.key, r])), [rates])

  // 1) Extras from step 3 are kept in sync automatically
  const extrasKey = JSON.stringify(just.extras)
  useEffect(() => {
    const ex: { text: string; cost: number }[] = JSON.parse(extrasKey)
    setLines(l => [
      ...ex.map(x => ({ id: nextId++, sec: 'M' as Sec, desc: x.text, qty: '1', unit: item.unit || 'No', rate: String(x.cost), per: '1', src: 'extra' as const })),
      ...l.filter(x => x.src !== 'extra'),
    ])
  }, [extrasKey, item.unit])

  // 2) Official MRS-2017 analyses that match this item
  const suggestions = useMemo(() => {
    if (!a17.index || !item.input.trim()) return []
    return search(a17.index, item.input, { limit: 3 }).filter(h => h.score >= 35).map(h => ({ score: h.score, it: a17.byCode.get(h.item.c)! }))
  }, [a17.index, a17.byCode, item.input])

  const loadTpl = (it: A17Item) => {
    const np = parseUnit(item.unit), tp = parseUnit(it.u)
    const same = !!(np && tp && np.base === tp.base)
    const factor = same ? np!.per / tp!.per : 1
    setAUnit(same ? '' : it.u)
    setTpl({ c: it.c, n: it.n, u: it.u, pg: it.pg, factor })
    if (item.base) setIncludeBase(false) // the analysis now builds the whole rate
    setLines(l => [
      ...l.filter(x => x.src === 'extra' || x.src === 'user'),
      ...it.lines.map(x => {
        const lib = findRate(rates, x.d)
        // MRS-2017 is used only for quantities; rates come from the market rates list or are typed by the engineer
        return { id: nextId++, sec: x.s, desc: x.d, qty: q4(x.q * factor), unit: x.u, rate: '', per: String(lib ? lib.per : x.p), src: 'tpl' as const, key: lib?.key }
      }),
    ])
  }

  const rateOf = (x: Line) => (x.key ? libByKey.get(x.key)?.rate ?? 0 : num(x.rate))
  const add = (sec: Sec) => setLines(l => [...l, { id: nextId++, sec, desc: '', qty: '1', unit: sec === 'L' ? 'Day' : 'No', rate: '', per: '1', src: 'user' }])
  const set = (id: number, k: keyof Line, v: string) => setLines(l => l.map(x => (x.id === id
    ? (k === 'rate' ? { ...x, rate: v, key: undefined } : { ...x, [k]: v })
    : x)))
  const del = (id: number) => setLines(l => l.filter(x => x.id !== id))
  const setLib = (key: string, v: string) => {
    const r = num(v)
    setRates(rs => rs.map(x => (x.key === key ? { ...x, rate: r, src: { name: 'Your market survey', date: new Date().toISOString().slice(0, 10) } } : x)))
    saveRate(key, r)
  }
  const resetLib = (key: string) => { resetRate(key); setRates(rs => rs.map(x => (x.key === key ? DEFAULT_RATES.find(d => d.key === key)! : x))) }

  const amt = (x: Line) => (num(x.qty) * rateOf(x)) / (num(x.per) || 1)
  const total = (sec: Sec) => lines.filter(x => x.sec === sec).reduce((s, x) => s + amt(x), 0)
  const M = total('M'), L = total('L'), E = total('E')
  const S = (L * SUNDRIES) / 100
  const ohBase = M + L + E
  const oh = OVERHEADS.map(o => ({ ...o, amount: (ohBase * o.pct) / 100 }))
  const addTotal = ohBase + S + oh.reduce((s, o) => s + o.amount, 0)
  const ref = includeBase && !aUnit ? just.ref : 0
  const grand = ref + addTotal
  const say = Math.floor(grand)
  const m = metric(unit)
  const nsi = num(item.rate)
  const nomen = just.finalText || item.corrected

  // Cross-check: the same kind of item in the current MRS-2025, converted to this analysis unit
  const mrsCheck = useMemo(() => {
    const q = tpl?.n || item.input
    if (!mrs.index || !q.trim() || !unit) return null
    const h = search(mrs.index, q, { limit: 1 })[0]
    if (!h || h.score < 70 || h.item.r === null) return null
    const mine = perBase(1, unit), theirs = perBase(h.item.r, h.item.u)
    if (!mine || !theirs || mine.base !== theirs.base) return null
    return { code: h.item.c, d: h.item.d, u: h.item.u, r: h.item.r, perUnit: theirs.rate / mine.rate, score: h.score }
  }, [mrs.index, tpl, item.input, unit])

  const needRate = lines.filter(x => !x.key && num(x.rate) <= 0 && x.desc.trim())
  const lowWage = lines.filter(x => x.sec === 'L' && UNSKILLED.test(x.desc.trim()) && /day/i.test(x.unit) && rateOf(x) > 0 && rateOf(x) < MIN_WAGE.perDay)
  const usedSources = [...new Map(lines.filter(x => x.key).map(x => libByKey.get(x.key!)!).filter(Boolean).map(r => [r.src.name, r.src])).values()]

  const cell = 'border border-slate-300 px-1 py-0.5'
  const box = 'w-full min-w-0 rounded border border-slate-300 px-1 py-0.5 print:border-0'
  const section = (sec: Sec, title: string) => {
    const rows = lines.filter(x => x.sec === sec)
    const hideInPrint = rows.length === 0 ? ' print:hidden' : ''
    return (
      <>
        <tr className={'bg-slate-100 font-semibold' + hideInPrint}><td className={cell} colSpan={7}>{title}</td></tr>
        {rows.map(x => (
          <tr key={x.id} className={!x.key && num(x.rate) <= 0 ? 'bg-amber-50' : ''}>
            <td className={cell}><input value={x.desc} onChange={e => set(x.id, 'desc', e.target.value)} className={box} /></td>
            <td className={cell + ' w-16'}><input inputMode="decimal" value={x.qty} onChange={e => set(x.id, 'qty', e.target.value)} className={box + ' text-right'} /></td>
            <td className={cell + ' w-14'}><input value={x.unit} onChange={e => set(x.id, 'unit', e.target.value)} className={box} /></td>
            <td className={cell + ' w-28'}>
              <input inputMode="decimal" value={x.key ? String(rateOf(x)) : x.rate} onChange={e => set(x.id, 'rate', e.target.value)}
                placeholder={t.ra_enterRate} className={box + ' text-right'} />
              {x.key && <span className="block text-[10px] leading-tight text-green-700 print:hidden">✓ {t.ra_marketTag}</span>}
              {!x.key && x.desc.trim() && (
                <a href={surveyUrl(`${x.desc} price ${x.unit === 'Day' ? 'daily wage' : ''} Peshawar Pakistan`)} target="_blank" rel="noreferrer" className="block text-[10px] leading-tight text-blue-800 underline print:hidden">🔎 {t.ra_findPrice}</a>
              )}
            </td>
            <td className={cell + ' w-14'}><input inputMode="decimal" value={x.per} onChange={e => set(x.id, 'per', e.target.value)} className={box + ' text-right'} /></td>
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
        <p className="text-sm"><b>Rate analysis per:</b> {unit || '—'}</p>
        {tpl && (
          <p className="text-xs text-slate-600">
            Quantities taken from MRS-2017 rate analysis <b>{tpl.c}</b> (template only) ({tpl.n}, per {tpl.u}, book page {tpl.pg}){tpl.factor !== 1 ? ` × ${q4(tpl.factor)} to convert to per ${unit}` : ''}.
          </p>
        )}

        {/* Official MRS-2017 quantities for this item */}
        {item.started && (
          <div className="mt-3 rounded-lg border-2 border-blue-200 bg-blue-50 p-3 text-sm print:hidden">
            <h3 className="font-semibold text-blue-900">{t.ra_tplTitle}</h3>
            <p className="text-xs text-slate-700">{t.ra_tplHint}</p>
            {!a17.items && !a17.error && <p className="mt-1 text-xs">{t.loading}</p>}
            {a17.error && <p className="mt-1 text-xs text-red-700">{t.loadError}</p>}
            {a17.items && suggestions.length === 0 && <p className="mt-1 text-xs text-slate-600">{t.ra_tplNone}</p>}
            <ul className="mt-2 space-y-1">
              {suggestions.map(s => (
                <li key={s.it.c} className="flex flex-wrap items-start justify-between gap-2">
                  <span><b className="font-mono">{s.it.c}</b> ({s.score}%) — {s.it.n} <span className="text-slate-500">[per {s.it.u}]</span></span>
                  <button onClick={() => loadTpl(s.it)} className="shrink-0 rounded bg-blue-800 px-2 py-1 text-xs font-semibold text-white">{tpl?.c === s.it.c ? '↻ ' : ''}{t.ra_tplUse}</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Market rates (survey) */}
        <div className="mt-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm print:hidden">
          <button onClick={() => setShowMarket(s => !s)} className="font-semibold text-green-900">{showMarket ? '▲' : '▼'} {t.ra_market}</button>
          {showMarket && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-slate-700">{t.ra_marketHint}</p>
              {rates.map(r => (
                <div key={r.key} className="rounded border border-green-200 bg-white p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="min-w-40">{r.name}</b>
                    <span>Rs</span>
                    <input inputMode="decimal" value={r.rate} onChange={e => setLib(r.key, e.target.value)} className="w-28 rounded border border-slate-300 px-1 py-0.5 text-right" />
                    <span>per {r.per !== 1 ? r.per + ' ' : ''}{r.unit}</span>
                    <a href={surveyUrl(r.survey)} target="_blank" rel="noreferrer" className="rounded bg-green-700 px-2 py-0.5 text-xs font-semibold text-white">🔎 {t.ra_check}</a>
                    {r.src.name === 'Your market survey' && <button onClick={() => resetLib(r.key)} className="text-xs text-slate-600 underline">{t.ra_reset}</button>}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {t.ra_srcCol}: {r.src.url ? <a href={r.src.url} target="_blank" rel="noreferrer" className="underline">{r.src.name}</a> : r.src.name}{r.src.date ? ` (${r.src.date})` : ''}
                    {r.note ? ` — ${r.note}` : ''}
                  </p>
                </div>
              ))}
              <p className="text-xs text-slate-600">{MIN_WAGE.text} {t.ra_srcCol}: <a href={MIN_WAGE.src.url} target="_blank" rel="noreferrer" className="underline">{MIN_WAGE.src.name}</a></p>
            </div>
          )}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
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
              <tr className="bg-blue-50 font-bold"><td className={cell} colSpan={5}>{t.ra_total} {unit}</td><td className={cell + ' text-right'}>{fmt(grand)}</td><td className={cell + ' print:hidden'} /></tr>
              {m && (
                <tr><td className={cell} colSpan={5}>{t.ra_metric} {m.label} (× {m.mult.toFixed(4)})</td><td className={cell + ' text-right'}>{fmt(grand * m.mult)}</td><td className={cell + ' print:hidden'} /></tr>
              )}
              <tr className="font-bold"><td className={cell} colSpan={5}>{t.ra_say} {unit}</td><td className={cell + ' text-right'}>Rs {say.toLocaleString('en-PK')}</td><td className={cell + ' print:hidden'} /></tr>
              {m && (
                <tr className="font-bold"><td className={cell} colSpan={5}>{t.ra_say} {m.label}</td><td className={cell + ' text-right'}>Rs {Math.floor(grand * m.mult).toLocaleString('en-PK')}</td><td className={cell + ' print:hidden'} /></tr>
              )}
            </tbody>
          </table>
        </div>

        {item.base && just.ref > 0 && !aUnit && (
          <label className="mt-2 flex items-center gap-2 text-sm print:hidden">
            <input type="checkbox" checked={includeBase} onChange={e => setIncludeBase(e.target.checked)} /> {t.ra_includeBase} ({just.refLabel})
          </label>
        )}

        {/* Warnings */}
        {(needRate.length > 0 || lowWage.length > 0) && (
          <ul className="mt-3 list-disc space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 ps-8 text-sm text-amber-900 print:hidden">
            {needRate.length > 0 && <li>{t.ra_needRate} {needRate.map(x => x.desc).join(', ')}</li>}
            {lowWage.length > 0 && <li>{t.ra_wageWarn} Rs {fmt(MIN_WAGE.perDay)}/day: {lowWage.map(x => `${x.desc} Rs ${fmt(rateOf(x))}`).join(', ')}</li>}
          </ul>
        )}

        {nsi > 0 && grand > 0 && !aUnit && (
          <p className={`mt-3 rounded-lg p-3 text-sm font-semibold print:hidden ${Math.abs(grand - nsi) <= 1 ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
            {Math.abs(grand - nsi) <= 1 ? t.ra_match : <>{t.ra_diff} Rs {fmt(grand - nsi)} ({(((grand - nsi) / nsi) * 100).toFixed(1)}%) — NSI Rs {fmt(nsi)}</>}
          </p>
        )}
        {aUnit && <p className="mt-2 text-sm text-amber-900">{t.ra_unitNote} {aUnit}.</p>}
        {mrsCheck && addTotal > 0 && (
          <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 print:hidden">
            {t.ra_mrsCheck} <b className="font-mono">{mrsCheck.code}</b> ({mrsCheck.score}%): Rs {fmt(mrsCheck.r)} / {mrsCheck.u} = <b>Rs {fmt(mrsCheck.perUnit)} / {unit}</b>.{' '}
            {t.ra_yourAnalysis} <b className={grand > mrsCheck.perUnit * 1.1 ? 'text-red-700' : grand < mrsCheck.perUnit * 0.9 ? 'text-amber-800' : 'text-green-700'}>
              {grand >= mrsCheck.perUnit ? '+' : ''}{(((grand - mrsCheck.perUnit) / mrsCheck.perUnit) * 100).toFixed(1)}%</b>.
            <span className="block text-xs text-slate-600">{mrsCheck.d}</span>
          </p>
        )}

        {/* Sources (printed) */}
        {(usedSources.length > 0 || tpl) && (
          <div className="mt-3 text-xs text-slate-600">
            <b>{t.ra_sources}:</b>
            <ul className="list-disc ps-5">
              {tpl && <li>Quantities (template): MRS-2017 rate analysis book, CSR Cell, Finance Department KP — item {tpl.c}, page {tpl.pg}. Rates are current market rates, not 2017 rates.</li>}
              {usedSources.map(s => <li key={s.name}>{s.name}{s.date ? `, ${s.date}` : ''}{s.url ? ` — ${s.url}` : ''}</li>)}
            </ul>
          </div>
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
