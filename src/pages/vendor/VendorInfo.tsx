import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import Reveal from '../../components/Reveal'
import VendorLoginCard from '../../components/VendorLoginCard'

const B = '/marketplace/vendor'

const benefits = [
  ['store', 'Your own store', 'A store identity with your name, logo and description, listed with the other marketplace stores.'],
  ['users', 'Reach customers', 'Your approved products are listed in one connected marketplace that customers browse and search.'],
  ['package', 'Easy product management', 'Add products with images, price, sale price, stock and SKU from your dashboard.'],
  ['truck', 'Order management', 'See new orders, accept them, process them and enter courier and tracking details.'],
  ['trend', 'Transparent finance', 'A clear statement of sales, commission, refunds and payouts — downloadable as CSV.'],
  ['shield', 'Private and secure', 'Your documents and payment details are stored privately and visible only to authorised staff.'],
]

const steps = [
  ['Apply online', 'Create your vendor account and fill in the application. Your progress is saved at each step.'],
  ['Umeed reviews', 'The marketplace team reviews your details. Submitting a form never activates a store automatically.'],
  ['Verification', 'If anything is missing, we ask for more information and you update it from your application page.'],
  ['Store approval', 'Once approved, you sign in to your private vendor dashboard.'],
  ['Add products', 'List your products. Each product is checked by the team before it goes live.'],
  ['Receive orders', 'Customers order your products; you only see your own orders.'],
  ['Fulfil orders', 'Accept, pack and dispatch, then add courier and tracking details.'],
  ['Settlement', 'Delivered orders are reconciled and settled according to the disclosed rules.'],
]

const form = [
  ['Account', 'Email and password for your vendor login.'],
  ['About you', 'Applicant type, legal name, ID number, phone and address.'],
  ['Business', 'Business name, type, category, address, experience and what you plan to sell.'],
  ['Documents', 'ID front and back; business registration and proof of address if you have them.'],
  ['Store', 'Store display name, description, return address and support contact.'],
  ['Settlement', 'Account holder and bank / payment details for payouts.'],
  ['Review & submit', 'Check everything, accept the vendor policies and submit.'],
]

const faqs: [string, string][] = [
  ['Who can apply?', 'Individuals, sole proprietors and registered businesses selling genuine, lawful products and able to fulfil orders.'],
  ['Which documents are needed?', 'An identity document and, where applicable, business documents. We explain why each is needed and who can see it before you upload.'],
  ['How long does approval take?', 'Applications are reviewed by the Umeed team. You can follow the status, and any request for more information, on your application status page.'],
  ['What does it cost?', 'Commission, delivery charges, payment fees, taxes and settlement rules are disclosed to you before your store is activated.'],
  ['How and when do I get paid?', 'Delivered orders are reconciled and settled according to the settlement rules shared during onboarding. You can see every entry in your finance statement.'],
  ['Who handles shipping and returns?', 'You dispatch your orders and cooperate on returns and refunds under the marketplace policies.'],
  ['What can I not sell?', 'Unlawful, counterfeit or prohibited products. The full list is part of the vendor agreement.'],
  ['Can I apply with the email I shop with?', 'Please use a separate email for your vendor account, so your shopping and store accounts stay apart.'],
]

export default function VendorInfo() {
  return (
    <>
      {/* ===== Hero + login ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-peach-100 via-peach-50 to-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-mred-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.25fr_1fr] lg:py-20">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-mred-700 shadow-sm ring-1 ring-peach-200"><Icon name="store" className="h-4 w-4" />Umeed Marketplace · Vendor program</span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">Become a Vendor on <span className="text-mred-600">Umeed Marketplace</span></h1>
            <p className="mt-5 max-w-xl text-lg text-gray-600">Reach customers, manage your products online and receive order updates — all from one dashboard. Every store is reviewed before it goes live.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={`${B}/apply`} className="btn-red">Become a Vendor <Icon name="arrow" className="ml-2 h-4 w-4" /></Link>
              <Link to={`${B}#how-it-works`} className="btn-red-outline">See how it works</Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-mred-700">
              {['Free to apply', 'Verified stores only', 'Clear fees before activation'].map((t) => <li key={t} className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4" />{t}</li>)}
            </ul>
            <p className="mt-4 max-w-xl text-xs text-gray-500">Sales and income are not guaranteed — results depend on your products, prices and service.</p>
          </div>
          <VendorLoginCard />
        </div>
      </section>

      {/* ===== Benefits ===== */}
      <section id="benefits" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16">
        <Reveal><p className="text-sm font-semibold text-mred-600">What you get</p><h2 className="text-3xl font-bold">Why sell on Umeed</h2></Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map(([icon, t, d], i) => (
            <Reveal key={t} delay={(i % 3) * 90}>
              <div className="h-full rounded-2xl border border-peach-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-peach-100 text-mred-600"><Icon name={icon} className="h-6 w-6" /></span>
                <h3 className="mt-4 font-sans text-lg font-bold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-gray-600">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how-it-works" className="scroll-mt-24 bg-peach-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal><p className="text-sm font-semibold text-mred-600">From application to first order</p><h2 className="text-3xl font-bold">How it works</h2></Reveal>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 4) * 80}>
                <li className="relative h-full rounded-2xl bg-white p-5 shadow-sm">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-mred-600 font-bold text-white">{i + 1}</span>
                  <h3 className="mt-3 font-sans text-base font-bold">{t}</h3><p className="mt-1 text-sm text-gray-600">{d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Application steps ===== */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold text-mred-600">Steps to become a vendor</p>
          <h2 className="text-3xl font-bold">Your application in 7 steps</h2>
          <p className="mt-3 text-gray-600">The form works on mobile and saves as you go, so you can stop and continue later. Have these ready before you start:</p>
          <ul className="mt-5 space-y-2 text-sm text-gray-700">
            {['Your ID number and ID document — front and back (PDF, JPG or PNG, up to 5 MB each)', 'Business registration, if you have one', 'Your bank or payment account details for payouts', 'Store name, description and return address'].map((t) => <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-mred-600" />{t}</li>)}
          </ul>
          <Link to={`${B}/apply`} className="btn-red mt-6">Start my application</Link>
        </Reveal>
        <ol className="space-y-3">
          {form.map(([t, d], i) => (
            <Reveal key={t} delay={i * 60}>
              <li className="flex gap-4 rounded-2xl border border-peach-200 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-peach-100 font-bold text-mred-700">{i + 1}</span>
                <div><p className="font-semibold">{t}</p><p className="text-sm text-gray-600">{d}</p></div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ===== Requirements ===== */}
      <section id="requirements" className="scroll-mt-24 bg-peach-50 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-2">
          <Reveal><div className="h-full rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">Vendor requirements</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-700">
              {['Valid contact details', 'Accurate identity and business information', 'Genuine, lawful products', 'Ability to fulfil and dispatch orders', 'Agreement to the platform policies'].map((t) => <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-mred-600" />{t}</li>)}
            </ul>
          </div></Reveal>
          <Reveal delay={100}><div className="h-full rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold">Vendor responsibilities</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-700">
              {['Accurate listings and up-to-date stock', 'Fair pricing', 'Timely dispatch', 'Good customer service', 'Cooperation on returns and refunds'].map((t) => <li key={t} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-mred-600" />{t}</li>)}
            </ul>
          </div></Reveal>
        </div>
      </section>

      {/* ===== Fees ===== */}
      <section id="fees" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-16">
        <Reveal>
          <div className="rounded-3xl border-2 border-dashed border-mred-500/40 bg-white p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-peach-100 text-mred-600"><Icon name="file" className="h-6 w-6" /></span>
            <h2 className="mt-4 text-2xl font-bold">Fees and commission</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">Applicable commission, delivery charges, payment fees, taxes and settlement rules are clearly disclosed before your store is activated. Rates are set by Umeed management, and every sale and commission is recorded in your finance statement.</p>
          </div>
        </Reveal>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faqs" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-16">
        <Reveal><h2 className="text-3xl font-bold">Frequently asked questions</h2></Reveal>
        <div className="mt-6 divide-y divide-peach-200 rounded-2xl border border-peach-200">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<Icon name="down" className="h-5 w-5 shrink-0 text-mred-600 transition group-open:rotate-180" /></summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-mred-600 to-mred-800 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-bold md:text-4xl">Ready to open your store?</h2>
          <p className="mx-auto mt-3 max-w-lg text-peach-100">Apply in a few minutes. We review every application before a store goes live.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to={`${B}/apply`} className="btn bg-white text-mred-700 hover:bg-peach-100">Become a Vendor</Link>
            <a href="#vendor-login" className="btn border border-white/60 text-white hover:bg-white/10">Vendor login</a>
          </div>
        </div>
      </section>
    </>
  )
}
