import { Link } from 'react-router-dom'
import { values } from '../data/site'
import { useSite } from '../context/SiteContext'
import { SectionHead } from '../components/Section'
import DepartmentCard from '../components/DepartmentCard'
import Reveal from '../components/Reveal'
import CountUp from '../components/CountUp'
import Icon from '../components/Icon'
import { useImpactStats } from '../lib/useImpactStats'
import { usePageTitle } from '../lib/usePageTitle'

const steps = [
  { n: '01', title: 'One identity', text: 'A single brand, design system and central organization shared by every department.' },
  { n: '02', title: 'Separate departments', text: 'Each department has its own workflow and team, opened only when it is ready.' },
  { n: '03', title: 'Central accountability', text: 'Central management controls policies, access and finance oversight across the ecosystem.' },
]

export default function Home() {
  usePageTitle()
  const stats = useImpactStats()
  const { departments, allDepartments, setting } = useSite()
  const market = allDepartments.find((d) => d.slug === 'marketplace')!
  const others = departments.filter((d) => d.slug !== 'marketplace')

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gold-100/80 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-brand-100/80 blur-3xl" />
        <div className="container-x relative grid items-center gap-14 py-14 md:py-24 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
              <span className="h-2 w-2 rounded-full bg-gold-500" />Building Hope • Empowering Lives
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] text-brand-900 sm:text-5xl lg:text-6xl">
              {setting('hero_title', 'Building Hope.')}<br /><span className="text-gold-600">{setting('hero_highlight', 'Creating a Better Tomorrow.')}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600">
              {setting('hero_text', 'Umeed of Life is building an ecosystem where commerce, opportunities, welfare and global connections work together to create meaningful change.')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/marketplace" className="btn bg-mred-600 text-white hover:bg-mred-700"><Icon name="store" className="mr-2 h-4 w-4" />Shop on Marketplace</Link>
              <a href="#departments" className="btn-outline">Explore Departments</a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-brand-700">
              {['Transparent', 'People-focused', 'Built for growth'].map((t) => <li key={t} className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-gold-600" />{t}</li>)}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border-2 border-dashed border-gold-400/60" />
            <div className="relative animate-float rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-brand-100">
              <img src="/images/umeed-logo.jpg" alt="Umeed of Life logo" className="w-full mix-blend-multiply" />
            </div>
            {market.status === 'Now open' && (
            <div className="absolute -left-2 bottom-6 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-gray-100 md:-left-8">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" /></span>
              <span className="text-xs font-semibold text-gray-800">Marketplace is open</span>
            </div>
            )}
            <div className="absolute -right-2 top-6 rounded-2xl bg-brand-800 px-4 py-3 text-center text-white shadow-lg md:-right-6">
              <p className="font-display text-2xl font-bold text-gold-400">{String(departments.length).padStart(2, '0')}</p>
              <p className="text-[11px] text-brand-100">Departments</p>
            </div>
          </div>
        </div>
        <div className="relative bg-brand-800 py-4 text-center text-sm text-brand-100">
          <div className="container-x">One ecosystem. Many possibilities — commerce, careers, welfare and global opportunities under one vision.</div>
        </div>
      </section>

      {/* ===== Departments ===== */}
      <section id="departments" className="py-20">
        <div className="container-x">
          <Reveal><SectionHead kicker="Our Ecosystem" title="Departments built around real needs.">
            Marketplace is open today. The other departments open one by one, once their workflows and legal requirements are ready.
          </SectionHead></Reveal>

          {market.visible && <Reveal className="mt-10">
            <Link to="/marketplace" className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-mred-600 to-mred-800 p-8 text-white shadow-xl md:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute bottom-[-5rem] right-40 h-56 w-56 rounded-full bg-white/10" />
              <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-green-300" />{market.status}</span>
                  <h3 className="mt-4 text-3xl font-bold md:text-4xl">{market.name}</h3>
                  <p className="mt-3 max-w-lg text-peach-100">{market.short}</p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-mred-700 transition group-hover:gap-3">Visit Marketplace <Icon name="arrow" className="h-4 w-4" /></span>
                </div>
                <div className="hidden justify-self-end rounded-3xl bg-white p-4 shadow-lg md:block"><img src="/images/umeed-marketplace-logo.png" alt="" className="h-40 w-auto" /></div>
              </div>
            </Link>
          </Reveal>}

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((d, i) => <Reveal key={d.slug} delay={i * 90}><DepartmentCard d={d} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ===== About ===== */}
      <section id="about" className="bg-brand-50/60 py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHead kicker="About Umeed" title="One vision. Multiple ways to make an impact.">
              Umeed of Life is designed as a connected ecosystem. From products and marketplaces to employment, welfare and international services, every department has a distinct purpose while sharing the same mission.
            </SectionHead>
            <Link to="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:gap-3">Read our story <Icon name="arrow" className="h-4 w-4" /></Link>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 90}>
                <div className="h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold-600"><Icon name={v.icon} className="h-5 w-5" /></span>
                  <h3 className="mt-4 text-xl font-bold text-brand-900">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="bg-brand-900 py-20 text-white">
        <div className="container-x">
          <Reveal><SectionHead center kicker="How Umeed works" title="Built to stay organised as it grows." /></Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 120}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-white/5 p-7">
                  <span className="font-display text-5xl font-bold text-gold-400/80">{s.n}</span>
                  <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-100">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Impact ===== */}
      <section id="impact" className="container-x py-20">
        <Reveal><SectionHead kicker="Our Impact" title="Growing with purpose.">
          These figures come from the central management system, so impact information stays accurate, transparent and up to date.
        </SectionHead></Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.key} delay={i * 80}>
              <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 p-6 text-center text-white shadow-lg">
                <p className="font-display text-4xl font-bold text-gold-400 md:text-5xl"><CountUp value={s.value} /></p>
                <p className="mt-2 text-sm text-brand-200">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Careers ===== */}
      <section id="careers" className="container-x pb-20">
        <Reveal>
          <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-sky-50 p-8 ring-1 ring-blue-100 md:grid-cols-2 md:p-12">
            <div>
              <h2 className="text-3xl font-bold text-brand-900">Grow with Umeed.</h2>
              <p className="mt-3 leading-relaxed text-gray-600">As Umeed grows, new opportunities will become available across our departments. Our WorkHub will bring jobs, internships and professional opportunities together.</p>
              <Link to="/careers" className="btn-primary mt-6">Explore Opportunities</Link>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-600"><Icon name="briefcase" /></span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Coming Soon</span></div>
              <h3 className="mt-3 text-xl font-bold text-brand-900">Umeed WorkHub</h3>
              <p className="mt-1 text-sm text-gray-600">Jobs, internships, skills and professional opportunities under one platform.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ===== Contact CTA ===== */}
      <section className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-8 py-14 text-center text-white">
            <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-gold-400/20 blur-2xl" />
            <p className="relative text-sm font-semibold text-gold-400">Contact Umeed</p>
            <h2 className="relative mx-auto mt-2 max-w-xl text-3xl font-bold md:text-4xl">Let's build something meaningful together.</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-brand-100">For partnerships, business opportunities, investment discussions or general inquiries, connect with the Umeed team.</p>
            <Link to="/contact" className="btn relative mt-7 bg-gold-500 text-brand-900 hover:bg-gold-400">Contact Us</Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}
