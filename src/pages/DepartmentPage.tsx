import { Link, Navigate, useParams } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { PageHero } from '../components/Section'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import { usePageTitle } from '../lib/usePageTitle'

export default function DepartmentPage({ slug: fixed }: { slug?: string }) {
  const params = useParams()
  const slug = fixed ?? params.slug
  const { allDepartments } = useSite()
  const d = allDepartments.find((x) => x.slug === slug)
  usePageTitle(d?.name)
  if (!d || !d.visible) return <Navigate to="/departments" replace />
  const open = d.status === 'Now open'

  return (
    <>
      <PageHero title={d.name} crumb={d.name} gradient={d.gradient}>{d.description}</PageHero>
      <section className="container-x grid gap-8 py-16 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-brand-900">{open ? 'What you can do' : 'What is planned'}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {d.planned.map((p, i) => (
              <Reveal key={p} delay={i * 70}>
                <li className="flex h-full items-start gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${d.dot}`}><Icon name="check" className="h-4 w-4" /></span>{p}
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
        <aside className="h-fit rounded-3xl border border-gray-200 p-6">
          <span className={`grid h-14 w-14 place-items-center rounded-2xl ${d.dot}`}><Icon name={d.icon} className="h-7 w-7" /></span>
          <p className="mt-4 text-sm text-gray-500">Status</p>
          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${d.badge}`}>{d.status}</span>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            {open ? 'This department is live.' : 'This department is not open yet, so it does not accept orders, payments, donations or applications.'}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {open && <Link to={`/${d.slug}`} className="btn-primary">Open {d.name}</Link>}
            <Link to="/contact" className="btn-outline">Contact Umeed</Link>
            <Link to="/departments" className="text-center text-sm text-gray-500 hover:text-brand-700">← All departments</Link>
          </div>
        </aside>
      </section>
    </>
  )
}
