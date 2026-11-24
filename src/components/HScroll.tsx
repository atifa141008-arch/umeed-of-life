import { ReactNode, useRef } from 'react'
import Icon from './Icon'

/** Horizontal swipe/scroll row with arrow buttons on desktop. */
export default function HScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * 400, behavior: 'smooth' })
  const arrow = 'absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-mred-700 shadow-md ring-1 ring-peach-200 hover:bg-peach-50 md:grid'
  return (
    <div className="relative">
      <button onClick={() => go(-1)} aria-label="Scroll left" className={`${arrow} -left-3`}><Icon name="left" /></button>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2">{children}</div>
      <button onClick={() => go(1)} aria-label="Scroll right" className={`${arrow} -right-3`}><Icon name="right" /></button>
    </div>
  )
}
