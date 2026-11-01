import { useEffect, useState } from 'react'
import { text, loadLang, saveLang, type Lang } from './i18n'
import MrsSearch from './MrsSearch'
import Nomenclature from './Nomenclature'
import Justify from './Justify'
import RateAnalysis from './RateAnalysis'
import BatchCheck, { type LoadRequest } from './BatchCheck'
import { EMPTY_ITEM, EMPTY_JUSTIFY, type ItemState, type JustifyState } from './item'
import { useMrs } from './useMrs'

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang)
  const t = text[lang]
  const mrs = useMrs()
  const [step1Text, setStep1Text] = useState('')
  const [item, setItem] = useState<ItemState>(EMPTY_ITEM)
  const [just, setJust] = useState<JustifyState>(EMPTY_JUSTIFY)
  const [load, setLoad] = useState<LoadRequest | null>(null)

  // Urdu reads right-to-left: update the whole page direction
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'
    saveLang(lang)
  }, [lang])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 print:bg-white">
      <header className="bg-blue-800 text-white print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 p-4">
          <div>
            <h1 className="text-xl font-bold">{t.appName}</h1>
            <p className="text-sm text-blue-100">{t.subtitle}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-blue-900 active:scale-95"
          >
            {t.switchTo}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 p-4 print:max-w-none print:p-0">
        {/* Steps 1-3 are hidden when printing; only the rate analysis is printed */}
        <div className="space-y-3 print:hidden">
          <BatchCheck t={t} mrs={mrs} onOpen={r => { setStep1Text(r.text); setLoad(r) }} />
          <MrsSearch t={t} mrs={mrs} onAsk={setStep1Text} />
          <Nomenclature t={t} mrs={mrs} fromStep1={step1Text} onUpdate={setItem} load={load} />
          <Justify t={t} mrs={mrs} item={item} onUpdate={setJust} />
        </div>
        <RateAnalysis t={t} item={item} just={just} />

        <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900 print:hidden">{t.install}</p>
        <p className="text-xs text-slate-500 print:hidden">{t.dataNote}</p>
      </main>
    </div>
  )
}
