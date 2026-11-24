import { Link } from 'react-router-dom'
import { PageHero } from '../components/Section'
import Icon from '../components/Icon'
import { usePageTitle } from '../lib/usePageTitle'

export default function Careers() {
  usePageTitle('Careers')
  return (
    <>
      <PageHero title="Grow with Umeed." gradient="from-blue-50 to-white">
        As Umeed grows, new opportunities will open across our departments. Umeed WorkHub will bring jobs, internships and professional opportunities together.
      </PageHero>
      <section className="container-x py-16">
        <div className="flex flex-col items-start gap-5 rounded-3xl border border-gray-200 p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-600"><Icon name="briefcase" className="h-6 w-6" /></span>
            <div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Coming Soon</span>
              <h2 className="mt-2 text-2xl font-bold text-brand-900">No openings yet</h2>
              <p className="mt-1 max-w-xl text-gray-600">There are no open positions right now. If you would like to work with Umeed, send us a message and we will keep it on file.</p>
            </div>
          </div>
          <Link to="/contact" className="btn-primary shrink-0">Contact Umeed</Link>
        </div>
      </section>
    </>
  )
}
