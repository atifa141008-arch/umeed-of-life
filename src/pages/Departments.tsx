import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { PageHero } from '../components/Section'
import DepartmentCard from '../components/DepartmentCard'
import Reveal from '../components/Reveal'
import { usePageTitle } from '../lib/usePageTitle'

export default function Departments() {
  usePageTitle('Departments')
  const { departments } = useSite()
  return (
    <>
      <PageHero title="Departments built around real needs.">
        Each department opens only when its workflows and legal requirements are ready. Marketplace is open now.
      </PageHero>
      <div className="container-x grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d, i) => <Reveal key={d.slug} delay={(i % 3) * 90}><DepartmentCard d={d} /></Reveal>)}
      </div>
      <div className="container-x text-center">
        <Link to="/contact" className="btn-outline">Ask about a department</Link>
      </div>
    </>
  )
}
