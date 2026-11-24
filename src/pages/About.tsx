import { PageHero, SectionHead } from '../components/Section'
import { values } from '../data/site'
import Reveal from '../components/Reveal'
import Icon from '../components/Icon'
import { usePageTitle } from '../lib/usePageTitle'

export default function About() {
  usePageTitle('About Us')
  return (
    <>
      <PageHero title="About Umeed of Life">
        Umeed (hope) is the idea behind everything we build: one central organization, one consistent identity and several departments that each serve a real need.
      </PageHero>
      <section className="container-x grid gap-6 py-16 md:grid-cols-2">
        <Reveal><div className="h-full rounded-3xl bg-brand-50 p-8">
          <SectionHead title="Our mission" />
          <p className="mt-4 leading-relaxed text-gray-600">To build a connected ecosystem where commerce, opportunities, welfare and global connections create lasting change for people, families and businesses.</p>
        </div></Reveal>
        <Reveal delay={100}><div className="h-full rounded-3xl bg-gold-100/50 p-8">
          <SectionHead title="How we work" />
          <p className="mt-4 leading-relaxed text-gray-600">Each department has its own team and workflow. Central management sets organization-wide policies, controls access and finance oversight, and keeps every department accountable.</p>
        </div></Reveal>
      </section>
      <section className="container-x pb-8">
        <Reveal><SectionHead kicker="Our values" title="What guides every department." /></Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-gray-200 p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold-600"><Icon name={v.icon} className="h-5 w-5" /></span>
                <h3 className="mt-4 text-xl font-bold text-brand-900">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
