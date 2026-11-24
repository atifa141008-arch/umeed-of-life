import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const TONES: Record<string, string> = {
  red: 'from-mred-600 to-mred-800', orange: 'from-orange-500 to-mred-600', peach: 'from-peach-400 to-orange-600', green: 'from-brand-600 to-brand-800',
}
type Slide = { title: string; text: string; cta: string; to: string; tone: string }

const DEFAULTS: Slide[] = [
  { title: 'Discover more. Shop with Umeed.', text: 'Explore categories, new products and trusted stores.', cta: 'Shop now', to: '/marketplace/shop', tone: 'red' },
  { title: 'Shop by category', text: 'Fashion, electronics, home, beauty and more in one place.', cta: 'Browse categories', to: '/marketplace/categories', tone: 'orange' },
  { title: 'Meet our verified sellers', text: 'Products from stores reviewed by the Umeed team.', cta: 'See stores', to: '/marketplace/vendors', tone: 'peach' },
]

export default function Banner() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULTS)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.from('banners').select('*').eq('active', true).order('sort_order').order('created_at').then(({ data, error }) => {
      if (!error && data && data.length) setSlides(data.map((b: any) => ({ title: b.title, text: b.text ?? '', cta: b.cta_label ?? '', to: b.link ?? '/marketplace', tone: b.tone })))
    })
  }, [])
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [paused, slides.length])

  return (
    <section aria-roledescription="carousel" aria-label="Promotions" className="relative overflow-hidden rounded-2xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${(i % slides.length) * 100}%)` }}>
        {slides.map((s) => (
          <div key={s.title} className={`relative min-w-full bg-gradient-to-r ${TONES[s.tone] ?? TONES.red} px-6 py-8 text-white sm:px-12 sm:py-12 lg:py-16`}>
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 sm:h-72 sm:w-72" />
            <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative max-w-md">
              <h2 className="font-display text-2xl font-bold leading-tight sm:text-4xl">{s.title}</h2>
              {s.text && <p className="mt-2 text-sm text-white/90 sm:text-base">{s.text}</p>}
              {s.cta && (s.to.startsWith('http') ? <a href={s.to} className="btn mt-4 bg-white !py-2 text-mred-700 hover:bg-peach-100">{s.cta}</a> : <Link to={s.to} className="btn mt-4 bg-white !py-2 text-mred-700 hover:bg-peach-100">{s.cta}</Link>)}
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 && <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
        {slides.map((s, n) => <button key={s.title + n} onClick={() => setI(n)} aria-label={`Slide ${n + 1}`} className={`h-2 rounded-full transition-all ${n === i % slides.length ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />)}
      </div>}
    </section>
  )
}
