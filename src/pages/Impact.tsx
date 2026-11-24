import { PageHero } from '../components/Section'
import CountUp from '../components/CountUp'
import Reveal from '../components/Reveal'
import { useImpactStats } from '../lib/useImpactStats'
import { usePageTitle } from '../lib/usePageTitle'

export default function Impact() {
  usePageTitle('Our Impact')
  const stats = useImpactStats()
  return (
    <>
      <PageHero title="Growing with purpose.">Our impact figures are maintained by central management and published here once verified.</PageHero>
      <div className="container-x grid grid-cols-2 gap-5 py-16 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.key} delay={i * 80}>
            <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 p-8 text-center text-white shadow-lg">
              <p className="font-display text-5xl font-bold text-gold-400"><CountUp value={s.value} /></p>
              <p className="mt-2 text-sm text-brand-200">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  )
}
