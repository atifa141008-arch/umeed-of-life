import { ReactNode, useEffect } from 'react'
import Icon from './Icon'

/** Slide-in side menu with overlay fade and staggered items. Mobile only (hide with lg:hidden by the caller). */
export default function Drawer({ open, onClose, header, children, red = true }: { open: boolean; onClose: () => void; header: ReactNode; children: ReactNode; red?: boolean }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside
        role="dialog" aria-modal="true" aria-label="Menu"
        className={`absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'drawer-open translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center justify-between px-4 py-3 ${red ? 'bg-peach-100' : 'bg-brand-50'}`}>
          {header}
          <button onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-xl bg-white text-gray-700 shadow-sm"><Icon name="close" /></button>
        </div>
        <div className="flex-1 px-3 py-4">{children}</div>
      </aside>
    </div>
  )
}

export function DrawerItem({ i, children }: { i: number; children: ReactNode }) {
  return <div className="drawer-item" style={{ ['--i' as any]: i }}>{children}</div>
}
