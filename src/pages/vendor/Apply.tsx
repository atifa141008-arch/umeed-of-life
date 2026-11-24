import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Row } from '../../lib/format'
import { ErrorNote, Spinner } from '../../components/ui'
import Icon from '../../components/Icon'

const L = ({ t, children }: { t: string; children: ReactNode }) => <label className="block text-sm font-medium">{t}<div className="mt-1">{children}</div></label>

const STEPS = ['Account', 'About you', 'Business', 'Documents', 'Store', 'Settlement', 'Review']
const TYPES = ['Individual', 'Sole proprietor', 'Registered business', 'Partnership', 'Company']
const EXPERIENCE = ['Just starting', 'Less than 1 year', '1–3 years', 'More than 3 years']
const PRODUCT_COUNTS = ['1–10', '11–50', '51–200', 'More than 200']
const DOCS: [string, string, boolean][] = [
  ['id_front', 'Identity document — front', true], ['id_back', 'Identity document — back', true],
  ['business', 'Business registration (if you have one)', false], ['address_proof', 'Proof of address, e.g. a utility bill (optional)', false],
]
const REQUIRED = ['applicant_type', 'legal_name', 'id_number', 'phone', 'address', 'city', 'business_name', 'business_type', 'category', 'description', 'business_address', 'experience', 'product_count',
  'store_display_name', 'store_description', 'return_address', 'support_contact']

export default function Apply() {
  const { session, role, loading, signUp, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Row>({})
  const [bank, setBank] = useState<Row>({})
  const [docs, setDocs] = useState<Row[]>([])
  const [appId, setAppId] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [agree, setAgree] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const uid = session?.user.id

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(''); setInfo('')
    try { await fn() } catch (e: any) { setError(e.message ?? 'Something went wrong') }
    setBusy(false)
  }

  // load the saved draft (save-and-continue)
  useEffect(() => {
    if (!uid || role !== 'applicant') return
    let on = true
    setDraftLoading(true)
    ;(async () => {
      let r = await supabase.from('vendor_applications').select('*').eq('user_id', uid).maybeSingle()
      if (!r.data) { await supabase.rpc('start_vendor_application'); r = await supabase.from('vendor_applications').select('*').eq('user_id', uid).maybeSingle() }
      const a = r.data
      if (!on) return
      if (!a) { setDraftLoading(false); return }
      setForm(a); setAppId(a.id)
      const [b, d] = await Promise.all([
        supabase.from('vendor_bank_details').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('application_documents').select('*').eq('user_id', uid)])
      if (!on) return
      if (b.data) setBank(b.data)
      setDocs(d.data ?? [])
      setStep((s) => (s === 0 ? 1 : s))
      setDraftLoading(false)
    })()
    return () => { on = false }
  }, [uid, role])

  if (loading || draftLoading) return <Spinner />
  if (role === 'vendor') return <Navigate to="/marketplace/vendor/dashboard" replace />
  if (session && role && role !== 'applicant')
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">Use a separate vendor account</h1>
        <p className="mt-3 text-sm text-gray-600">You are signed in with a different type of account.</p>
        <div className="mt-6 flex flex-col gap-2">
          {role === 'customer' && <button disabled={busy} onClick={() => run(async () => { const { error } = await supabase.rpc('start_vendor_application'); if (error) throw new Error(error.message); refreshProfile() })} className="btn-red">Use this account for my store</button>}
          <button onClick={() => signOut()} className="btn-red-outline">Sign out and use another email</button>
        </div>
        {role === 'customer' && <p className="mt-3 text-xs text-gray-500">Using this account turns it into a vendor account — it will no longer be a buyer account.</p>}
        {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      </div>
    )
  if (form.status && !['draft', 'more_information'].includes(form.status)) return <Navigate to="/marketplace/vendor/application-status" replace />

  const field = (name: string) => ({ name, value: form[name] ?? '', onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [name]: e.target.value }) })
  const save = async (patch: Row) => {
    const { error } = await supabase.from('vendor_applications').update(patch).eq('user_id', uid!)
    if (error) throw new Error(error.message)
  }
  const docOf = (t: string) => docs.filter((d) => d.doc_type === t)
  const clean = (v: any) => (v === '' || v === undefined ? null : v)

  const createAccount = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    run(async () => {
      const r = await signUp(String(f.get('email')).trim(), String(f.get('password')), String(f.get('name')).trim(), { intent: 'vendor' }, '/marketplace/vendor/apply')
      if (r.error) throw new Error(r.error)
      if (!r.hasSession) { setInfo('Account created. If your project still asks for email confirmation, turn off "Confirm email" in Supabase → Authentication → Providers → Email, then sign in at the vendor login.'); return }
      const { error } = await supabase.rpc('start_vendor_application')
      if (error) throw new Error(error.message)
      refreshProfile(); setStep(1)
    })
  }
  const saveStep = (keys: string[], next = step + 1) => (e: FormEvent) => { e.preventDefault(); run(async () => { await save(Object.fromEntries(keys.map((k) => [k, clean(form[k])]))); setStep(next) }) }
  const saveBank = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      const { error } = await supabase.from('vendor_bank_details').upsert({ user_id: uid, account_holder: bank.account_holder, bank_name: bank.bank_name, account_number: bank.account_number, updated_at: new Date().toISOString() })
      if (error) throw new Error(error.message)
      setStep(6)
    })
  }
  const upload = (type: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    run(async () => {
      if (file.size > 5 * 1024 * 1024) throw new Error('File must be 5 MB or smaller')
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) throw new Error('Only PDF, JPG or PNG files are accepted')
      const path = `${uid}/${type}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const up = await supabase.storage.from('vendor-documents').upload(path, file)
      if (up.error) throw new Error(up.error.message)
      const { data, error } = await supabase.from('application_documents').insert({ application_id: appId, user_id: uid, doc_type: type, file_path: path }).select().single()
      if (error) throw new Error(error.message)
      setDocs((d) => [...d, data as Row])
    })
  }
  const removeDoc = (d: Row) => run(async () => {
    const { error } = await supabase.from('application_documents').delete().eq('id', d.id)
    if (error) throw new Error(error.message)
    setDocs((x) => x.filter((y) => y.id !== d.id))
  })

  const missing = [...REQUIRED.filter((k) => !form[k]), ...(docOf('id_front').length && docOf('id_back').length ? [] : ['identity documents']), ...(bank.account_holder && bank.bank_name && bank.account_number ? [] : ['payout details'])]
  const submit = () => run(async () => {
    await save({ status: 'under_review', policies_accepted_at: new Date().toISOString(), policy_version: 'v1' })
    navigate('/marketplace/vendor/application-status', { replace: true })
  })

  const Back = () => <button type="button" onClick={() => setStep(step - 1)} className="btn-red-outline">Back</button>
  const Next = ({ label = 'Save & continue' }: { label?: string }) => <button className="btn-red" disabled={busy}>{busy ? 'Saving…' : label}</button>
  const sections: [string, number, [string, any][]][] = [
    ['About you', 1, [['Type', form.applicant_type], ['Legal name', form.legal_name], ['ID number', form.id_number], ['Phone', form.phone], ['Address', [form.address, form.city].filter(Boolean).join(', ')]]],
    ['Business', 2, [['Name', form.business_name], ['Type', form.business_type], ['Category', form.category], ['Business address', form.business_address], ['Experience', form.experience], ['Products', form.product_count]]],
    ['Documents', 3, DOCS.map(([t, l]) => [l.split(' (')[0], docOf(t).length ? 'Uploaded ✓' : '—'] as [string, any])],
    ['Store', 4, [['Display name', form.store_display_name], ['Return address', form.return_address], ['Support contact', form.support_contact]]],
    ['Payout', 5, [['Account holder', bank.account_holder], ['Bank', bank.bank_name], ['Account', bank.account_number ? `•••• ${String(bank.account_number).slice(-4)}` : '']]],
  ]

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold">Vendor application</h1>
      <ol className="mt-5 flex gap-1.5" aria-label="Progress">
        {STEPS.map((s, i) => <li key={s} className="flex-1"><div className={`h-2 rounded-full transition-colors duration-500 ${i <= step ? 'bg-mred-600' : 'bg-peach-200'}`} /><span className={`mt-1 hidden text-[10px] sm:block ${i === step ? 'font-semibold text-mred-700' : 'text-gray-400'}`}>{s}</span></li>)}
      </ol>
      <p className="mt-2 text-sm text-gray-500">Step {step + 1} of {STEPS.length}: {STEPS[step]}. Your progress is saved at every step.</p>
      {form.status === 'more_information' && <p className="mt-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-800"><b>The team asked for more information:</b> {form.decision_note}</p>}

      <div key={step} className="mt-6 animate-fade-in space-y-4">
        {error && <ErrorNote>{error}</ErrorNote>}
        {info && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{info}</p>}

        {step === 0 && (
          <form onSubmit={createAccount} className="space-y-4">
            <p className="text-sm text-gray-600">Create your vendor account. Use an email that is not used for shopping. Already started? <Link to="/marketplace/vendor/login" className="font-semibold text-mred-600">Sign in</Link></p>
            <L t="Full name"><input name="name" required className="input" /></L>
            <L t="Email"><input name="email" type="email" required className="input" /></L>
            <L t="Password (8+ characters)"><input name="password" type="password" minLength={8} required className="input" /></L>
            <p className="text-xs text-gray-500">Submitting an application does not activate your store. The Umeed team reviews every application and will approve or decline it.</p>
            <Next label="Create account" />
          </form>
        )}

        {step === 1 && (
          <form onSubmit={saveStep(['applicant_type', 'legal_name', 'id_number', 'phone', 'address', 'city'])} className="space-y-4">
            <L t="Applicant type"><select {...field('applicant_type')} required className="input"><option value="">Select</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></L>
            <L t="Legal name (as on your ID)"><input {...field('legal_name')} required className="input" /></L>
            <L t="ID number (e.g. CNIC)"><input {...field('id_number')} required minLength={6} placeholder="35202-1234567-1" className="input" /></L>
            <L t="Contact number"><input {...field('phone')} required type="tel" className="input" /></L>
            <L t="Residential address"><input {...field('address')} required className="input" /></L>
            <L t="City"><input {...field('city')} required className="input" /></L>
            <Next />
          </form>
        )}

        {step === 2 && (
          <form onSubmit={saveStep(['business_name', 'business_type', 'category', 'description', 'business_address', 'registration_no', 'tax_no', 'experience', 'product_count', 'website', 'social_links'])} className="space-y-4">
            <L t="Business / store name"><input {...field('business_name')} required className="input" /></L>
            <div className="grid gap-4 sm:grid-cols-2">
              <L t="Business type"><input {...field('business_type')} required placeholder="e.g. clothing retailer" className="input" /></L>
              <L t="Main product category"><input {...field('category')} required className="input" /></L>
            </div>
            <L t="What do you sell?"><textarea {...field('description')} required rows={3} className="input" /></L>
            <L t="Business / shop address"><input {...field('business_address')} required className="input" /></L>
            <div className="grid gap-4 sm:grid-cols-2">
              <L t="Business registration no. (optional)"><input {...field('registration_no')} className="input" /></L>
              <L t="NTN / tax number (optional)"><input {...field('tax_no')} className="input" /></L>
              <L t="Selling experience"><select {...field('experience')} required className="input"><option value="">Select</option>{EXPERIENCE.map((t) => <option key={t}>{t}</option>)}</select></L>
              <L t="Number of products you plan to list"><select {...field('product_count')} required className="input"><option value="">Select</option>{PRODUCT_COUNTS.map((t) => <option key={t}>{t}</option>)}</select></L>
            </div>
            <L t="Website (optional)"><input {...field('website')} className="input" /></L>
            <L t="Social media page (optional)"><input {...field('social_links')} className="input" /></L>
            <div className="flex gap-3"><Back /><Next /></div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="rounded-xl bg-peach-50 p-3 text-sm text-gray-700">We ask for documents only to verify your identity and business. They are stored privately and can be opened only by authorised Umeed verification staff. PDF, JPG or PNG, up to 5 MB each.</p>
            {DOCS.map(([t, label, req]) => (
              <div key={t} className="card">
                <p className="text-sm font-medium">{label}{req && <span className="text-mred-600"> *</span>}</p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={upload(t)} disabled={busy} className="mt-2 text-sm" />
                {docOf(t).map((d) => <p key={d.id} className="mt-2 flex items-center justify-between text-xs text-green-700"><span>✓ {String(d.file_path).split('/').pop()}</span><button type="button" onClick={() => removeDoc(d)} className="text-gray-500 underline">Remove</button></p>)}
              </div>
            ))}
            <div className="flex gap-3"><Back /><button className="btn-red" disabled={!docOf('id_front').length || !docOf('id_back').length} onClick={() => setStep(4)}>Continue</button></div>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={saveStep(['store_display_name', 'store_description', 'return_address', 'support_contact'])} className="space-y-4">
            <L t="Store display name"><input {...field('store_display_name')} required className="input" /></L>
            <L t="Store description"><textarea {...field('store_description')} required rows={3} className="input" /></L>
            <L t="Return address"><input {...field('return_address')} required className="input" /></L>
            <L t="Support contact (phone or email)"><input {...field('support_contact')} required className="input" /></L>
            <p className="text-xs text-gray-500">You can add a logo from your dashboard after approval.</p>
            <div className="flex gap-3"><Back /><Next /></div>
          </form>
        )}

        {step === 5 && (
          <form onSubmit={saveBank} className="space-y-4">
            <p className="rounded-xl bg-peach-50 p-3 text-sm text-gray-700">Payout details are restricted financial data. Reviewers only see the account holder, bank and last 4 digits; the full number is visible to you and authorised finance staff only.</p>
            {[['account_holder', 'Account holder name'], ['bank_name', 'Bank / payment provider'], ['account_number', 'Account number / IBAN']].map(([k, label]) => (
              <L key={k} t={label}><input required value={bank[k] ?? ''} onChange={(e) => setBank({ ...bank, [k]: e.target.value })} className="input" /></L>
            ))}
            <div className="flex gap-3"><Back /><Next /></div>
          </form>
        )}

        {step === 6 && (
          <div className="space-y-4">
            {sections.map(([title, n, rows]) => (
              <div key={title} className="card">
                <div className="flex items-center justify-between"><h3 className="font-sans text-base font-bold">{title}</h3><button type="button" onClick={() => setStep(n)} className="flex items-center gap-1 text-xs font-semibold text-mred-600"><Icon name="edit" className="h-3.5 w-3.5" />Edit</button></div>
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">{rows.map(([k, v]) => <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className={v ? '' : 'text-red-600'}>{v || 'Missing'}</dd></div>)}</dl>
              </div>
            ))}
            {missing.length > 0 && <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-800">Please complete: {missing.map((m) => m.replace(/_/g, ' ')).join(', ')}.</p>}
            <label className="flex gap-3 text-sm"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
              <span>I confirm the information is accurate and I accept the vendor agreement, commission and settlement terms, shipping and returns rules, prohibited products list and privacy terms (v1). Final fees are disclosed before activation.</span></label>
            <div className="flex gap-3"><Back /><button disabled={!agree || busy || missing.length > 0} onClick={submit} className="btn-red">{busy ? 'Submitting…' : 'Submit for verification'}</button></div>
          </div>
        )}
      </div>
    </div>
  )
}
