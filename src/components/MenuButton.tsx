import Icon from './Icon'

/** Animated menu icon: the 4-square "apps" icon spins into a cross when open. */
export default function MenuButton({ open, onClick, red = true }: { open: boolean; onClick: () => void; red?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      className={`relative h-10 w-10 shrink-0 rounded-xl transition-colors ${red ? 'bg-peach-100 text-mred-700 hover:bg-peach-200' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}
    >
      <span className={`absolute inset-0 grid place-items-center transition-all duration-300 ${open ? 'rotate-90 scale-0 opacity-0' : ''}`}><Icon name="apps" /></span>
      <span className={`absolute inset-0 grid place-items-center transition-all duration-300 ${open ? '' : '-rotate-90 scale-0 opacity-0'}`}><Icon name="close" /></span>
    </button>
  )
}
