'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'id' | 'en'

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (id: string, en: string) => string }

const LangCtx = createContext<Ctx>({ lang: 'id', setLang: () => {}, t: (id) => id })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('id')
  useEffect(() => {
    try { const s = localStorage.getItem('sw_lang'); if (s === 'en' || s === 'id') setLangState(s) } catch {}
  }, [])
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem('sw_lang', l) } catch {} }
  const t = (id: string, en: string) => (lang === 'en' ? en : id)
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)

// Toggle ID / EN
export function LangToggle({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const { lang, setLang } = useLang()
  const base = 'px-2.5 py-1 text-xs font-semibold rounded-md transition'
  const on = dark ? 'bg-white/20 text-white' : 'bg-[var(--brand)] text-[var(--on-brand)]'
  const off = dark ? 'text-white/60 hover:text-white' : 'text-[var(--ink-soft)] hover:text-[var(--brand)]'
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg ${dark ? 'bg-white/10' : 'bg-[var(--surface)] border border-[var(--line)]'} p-0.5 ${className}`}>
      <button onClick={() => setLang('id')} className={`${base} ${lang === 'id' ? on : off}`}>ID</button>
      <button onClick={() => setLang('en')} className={`${base} ${lang === 'en' ? on : off}`}>EN</button>
    </div>
  )
}
