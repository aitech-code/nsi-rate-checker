import { useEffect, useState } from 'react'

// "Install app" support (PWA). Chrome/Edge on Android and Windows fire
// `beforeinstallprompt`; we keep it and show our own Install button.
// iPhone/Safari has no prompt — the button shows instructions instead.
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

export function useInstall() {
  const [evt, setEvt] = useState<PromptEvent | null>(null)
  const standalone = typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true)
  const [installed, setInstalled] = useState(standalone)

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as PromptEvent) }
    const onInstalled = () => { setInstalled(true); setEvt(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  const install = async () => {
    if (!evt) return false
    await evt.prompt()
    const r = await evt.userChoice
    if (r.outcome === 'accepted') setInstalled(true)
    setEvt(null)
    return true
  }
  return { canPrompt: !!evt, installed, install }
}
