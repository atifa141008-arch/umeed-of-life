import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function SectionHead({ kicker, title, children, center }: { kicker?: string; title: string; children?: ReactNode; center?: boolean }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {kicker && <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-gold-600"><span className="h-px w-6 bg-gold-500" />{kicker}</p>}
      <h2 className="text-3xl font-bold leading-tight text-brand-900 md:text-4xl">{title}</h2>
      {children && <p className="mt-4 leading-relaxed text-gray-600">{children}</p>}
    </div>
  )
}

export function PageHero({ title, children, crumb, gradient = 'from-brand-50 to-white' }: { title: string; children?: ReactNode; crumb?: string; gradient?: string }) {
  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold-100/70 blur-3xl" />
      <div className="container-x relative py-14 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <Link to="/" className="hover:text-brand-700">Home</Link><span>/</span><span className="font-medium text-gray-700">{crumb ?? title}</span>
        </nav>
        <h1 className="max-w-3xl animate-fade-in text-4xl font-bold leading-tight text-brand-900 md:text-5xl">{title}</h1>
        {children && <p className="mt-5 max-w-2xl leading-relaxed text-gray-600">{children}</p>}
      </div>
    </section>
  )
}
