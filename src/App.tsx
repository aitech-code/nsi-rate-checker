import { useEffect, useState } from 'react'
import { text, loadLang, saveLang, type Lang } from './i18n'
import MrsSearch from './MrsSearch'
import Nomenclature from './Nomenclature'
import { useMrs } from './useMrs'

export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang)
  const t = text[lang]
  const mrs = useMrs()
  const [step1Text, setStep1Text] = useState('')

  // Urdu reads right-to-left: update the whole page direction
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'
    saveLang(lang)
  }, [lang])

  const placeholder = (n: number, s: string) => (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 opacity-70 shadow-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">{n}</span>
      <div>
        <p className="font-semibold">{s}</p>
        <p className="text-sm text-slate-500">{t.comingSoon}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-blue-800 text-white">
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

      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <MrsSearch t={t} mrs={mrs} onAsk={setStep1Text} />
        {placeholder(2, t.step2)}
        <Nomenclature t={t} mrs={mrs} fromStep1={step1Text} />
        {placeholder(4, t.step4)}

        <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{t.install}</p>
        <p className="text-xs text-slate-500">{t.dataNote}</p>
      </main>
    </div>
  )
}
