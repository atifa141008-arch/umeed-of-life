import Icon from './Icon'

/** < 1 of 20 > */
export default function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  const b = 'grid h-10 w-10 place-items-center rounded-full border border-peach-200 bg-white text-mred-700 transition hover:bg-peach-100 disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
      <button className={b} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><Icon name="left" /></button>
      <span className="min-w-[6rem] text-center text-sm font-semibold text-gray-700">{page} of {pages}</span>
      <button className={b} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><Icon name="right" /></button>
    </nav>
  )
}
