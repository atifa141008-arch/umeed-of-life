import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import Icon from './Icon'

type T = { id: number; text: string; kind: 'ok' | 'err' }
const Ctx = createContext<(text: string, kind?: 'ok' | 'err') => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<T[]>([])
  const push = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random()
    setList((l) => [...l, { id, text, kind }])
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col gap-2" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`animate-toast pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl ${t.kind === 'ok' ? 'bg-brand-800' : 'bg-red-700'}`}>
            <Icon name={t.kind === 'ok' ? 'check' : 'close'} className="h-4 w-4 shrink-0" />{t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
export const useToast = () => useContext(Ctx)
