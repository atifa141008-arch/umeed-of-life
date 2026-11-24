import { FormEvent, useState } from 'react'
import { PageHero } from '../components/Section'
import Icon from '../components/Icon'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { usePageTitle } from '../lib/usePageTitle'
import { useSite } from '../context/SiteContext'

const reasons = [
  ['Partnerships', 'Work with one of our departments.', 'users'],
  ['Business opportunities', 'Bring a proposal or a product.', 'briefcase'],
  ['Investment discussions', 'Talk to the central team.', 'trend'],
  ['General inquiries', 'Any other question about Umeed.', 'mail'],
]

export default function Contact() {
  usePageTitle('Contact')
  const { setting } = useSite()
  const info = [['mail', 'Email', setting('contact_email')], ['briefcase', 'Phone', setting('contact_phone')], ['globe', 'Address', setting('contact_address')]].filter(([, , v]) => v)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    if (f.get('website')) return // honeypot: bots fill this hidden field
    if (!isSupabaseConfigured) { setError('The contact form is not connected yet. Please try again later.'); setState('error'); return }
    setState('sending')
    const { error: err } = await supabase.from('contact_messages').insert({
      name: String(f.get('name')).trim(), email: String(f.get('email')).trim(),
      phone: String(f.get('phone') || '').trim() || null, subject: String(f.get('subject') || '').trim() || null,
      message: String(f.get('message')).trim(),
    })
    if (err) { setError('Your message could not be sent. Check your details and try again.'); setState('error') }
    else { form.reset(); setState('sent') }
  }

  return (
    <>
      <PageHero title="Let's build something meaningful together.">
        For partnerships, business opportunities, investment discussions or general inquiries, connect with the Umeed team.
      </PageHero>
      <section className="container-x grid gap-10 py-16 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-2xl font-bold text-brand-900">How can we help?</h2>
          {reasons.map(([t, d, icon]) => (
            <div key={t} className="flex items-start gap-4 rounded-2xl bg-brand-50 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm"><Icon name={icon} /></span>
              <div><p className="font-semibold text-brand-900">{t}</p><p className="text-sm text-gray-600">{d}</p></div>
            </div>
          ))}
          {info.length > 0 && <div className="rounded-2xl border border-gray-200 p-4 text-sm">{info.map(([icon, l, v]) => <p key={l} className="flex items-center gap-2 py-1"><Icon name={icon} className="h-4 w-4 text-brand-700" /><b>{l}:</b> {v}</p>)}</div>}
        </div>

        <div className="lg:col-span-3">
          {state === 'sent' ? (
            <div className="rounded-3xl bg-brand-50 p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white"><Icon name="check" className="h-7 w-7" /></span>
              <h2 className="mt-4 text-2xl font-bold text-brand-900">Message sent</h2>
              <p className="mt-2 text-gray-600">Thank you. The Umeed team will get back to you.</p>
              <button className="btn-outline mt-5" onClick={() => setState('idle')}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 rounded-3xl border border-gray-200 p-6 shadow-sm md:p-8">
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Full name<input name="name" required minLength={2} className="input mt-1" /></label>
                <label className="block text-sm font-medium">Email<input name="email" type="email" required className="input mt-1" /></label>
                <label className="block text-sm font-medium">Phone (optional)<input name="phone" type="tel" className="input mt-1" /></label>
                <label className="block text-sm font-medium">Subject<input name="subject" className="input mt-1" /></label>
              </div>
              <label className="block text-sm font-medium">Message<textarea name="message" required minLength={5} rows={6} className="input mt-1" /></label>
              {state === 'error' && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button className="btn-primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send message'}</button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
