import { Link } from 'react-router-dom'
import type { Department } from '../data/site'
import Icon from './Icon'

export default function DepartmentCard({ d }: { d: Department }) {
  return (
    <Link to={`/${d.slug}`} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-500 hover:shadow-xl">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${d.gradient} opacity-0 transition group-hover:opacity-100`} />
      <div className="relative flex items-center justify-between">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${d.dot}`}><Icon name={d.icon} className="h-6 w-6" /></span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${d.badge}`}>{d.status}</span>
      </div>
      <h3 className="relative mt-5 text-xl font-bold text-brand-900">{d.name}</h3>
      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-gray-600">{d.short}</p>
      <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Learn more <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span>
    </Link>
  )
}
