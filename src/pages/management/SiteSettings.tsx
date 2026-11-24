import { useEffect, useState, ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { useSite } from '../../context/SiteContext'
import { useToast } from '../../components/Toast'
import { Switch } from '../../components/ui'
import Icon from '../../components/Icon'

const KEYS = ['marketplace_enabled', 'announcement_enabled', 'announcement_text', 'announcement_link', 'hero_title', 'hero_highlight', 'hero_text',
  'contact_email', 'contact_phone', 'contact_address', 'whatsapp', 'facebook', 'instagram', 'youtube', 'linkedin', 'footer_text']

function Card({ icon, title, hint, children }: { icon: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="animate-fade-in rounded-3xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={icon} /></span>
        <div><h2 className="font-sans text-base font-bold">{title}</h2>{hint && <p className="text-xs text-gray-500">{hint}</p>}</div></div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}
const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-sm font-medium">{label}<div className="mt-1">{children}</div></label>

export default function SiteSettings() {
  const { settings, refresh } = useSite()
  const toast = useToast()
  const [f, setF] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => setF({ marketplace_enabled: 'true', ...settings }), [settings])
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }))
  const bind = (k: string) => ({ value: f[k] ?? '', onChange: (e: any) => set(k, e.target.value) })

  const save = async () => {
    setBusy(true)
    const rows = KEYS.map((key) => ({ key, value: f[key] ?? '', updated_at: new Date().toISOString() }))
    const { error } = await supabase.from('site_settings').upsert(rows)
    if (error) { setBusy(false); return toast(error.message, 'err') }
    await supabase.from('audit_logs').insert({ action: 'update_site_settings', entity: 'site_settings', details: { marketplace_enabled: f.marketplace_enabled, announcement_enabled: f.announcement_enabled } })
    refresh(); setBusy(false); toast('Website settings saved — live now')
  }
  const open = f.marketplace_enabled !== 'false'

  return (
    <div className="space-y-6 pb-24">
      <Card icon="store" title="Marketplace status" hint="Turn the whole shop on or off">
        <div className={`flex items-center justify-between gap-4 rounded-2xl p-4 transition-colors ${open ? 'bg-green-50' : 'bg-red-50'}`}>
          <div><p className="font-semibold">{open ? 'Marketplace is open' : 'Marketplace is closed'}</p>
            <p className="text-xs text-gray-600">{open ? 'Customers can browse and order.' : 'Visitors see a "temporarily closed" notice and new orders are blocked. Staff and vendors can still sign in.'}</p></div>
          <Switch checked={open} onChange={(v) => set('marketplace_enabled', v ? 'true' : 'false')} label="Marketplace open" />
        </div>
      </Card>

      <Card icon="bell" title="Announcement bar" hint="A strip shown at the top of the website and marketplace">
        <div className="flex items-center justify-between"><span className="text-sm font-medium">Show the announcement</span><Switch checked={f.announcement_enabled === 'true'} onChange={(v) => set('announcement_enabled', v ? 'true' : 'false')} label="Show announcement" /></div>
        <Field label="Message"><input {...bind('announcement_text')} maxLength={140} placeholder="e.g. Eid sale starts this Friday" className="input" /></Field>
        <Field label="Link (optional)"><input {...bind('announcement_link')} placeholder="/marketplace or https://…" className="input" /></Field>
        {f.announcement_enabled === 'true' && f.announcement_text && <div className="animate-fade-in rounded-xl bg-brand-700 px-4 py-2 text-center text-sm font-medium text-white">{f.announcement_text}</div>}
      </Card>

      <Card icon="home" title="Homepage headline" hint="Leave empty to keep the default text">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Headline (first line)"><input {...bind('hero_title')} placeholder="Building Hope." className="input" /></Field>
          <Field label="Highlighted line (gold)"><input {...bind('hero_highlight')} placeholder="Creating a Better Tomorrow." className="input" /></Field>
        </div>
        <Field label="Short description"><textarea {...bind('hero_text')} rows={3} className="input" /></Field>
      </Card>

      <Card icon="mail" title="Contact details" hint="Shown on the Contact page and in the footer">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email"><input {...bind('contact_email')} type="email" className="input" /></Field>
          <Field label="Phone"><input {...bind('contact_phone')} className="input" /></Field>
          <Field label="WhatsApp number"><input {...bind('whatsapp')} placeholder="923001234567" className="input" /></Field>
          <Field label="Address"><input {...bind('contact_address')} className="input" /></Field>
        </div>
      </Card>

      <Card icon="globe" title="Social links & footer">
        <div className="grid gap-4 sm:grid-cols-2">
          {['facebook', 'instagram', 'youtube', 'linkedin'].map((k) => <Field key={k} label={k[0].toUpperCase() + k.slice(1) + ' URL'}><input {...bind(k)} placeholder="https://…" className="input" /></Field>)}
        </div>
        <Field label="Footer description"><textarea {...bind('footer_text')} rows={2} className="input" /></Field>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/90 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-2"><p className="hidden text-sm text-gray-500 sm:block">Changes go live as soon as you save.</p><button onClick={save} disabled={busy} className="btn-primary ml-auto">{busy ? 'Saving…' : 'Save changes'}</button></div>
      </div>
    </div>
  )
}
