import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Row } from '../../lib/format'
import Icon from '../../components/Icon'

/**
 * Hidden registration form for the central team — reachable only by typing /management/registration.
 * Nothing on the site links here. Submitting creates a normal CUSTOMER account; management then reviews the
 * details and assigns a role from Users & roles.
 */

const STEPS = ['Account', 'Personal', 'Contact', 'Work', 'Background', 'Review']
const PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Jammu & Kashmir']
const DEPARTMENTS = ['Central', 'Marketplace', 'Essentials', 'Care', 'WorkHub', 'Global']
const EMPLOYMENT = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Volunteer']
const QUALIFICATIONS = ['Matric', 'Intermediate', 'Diploma / Certificate', "Bachelor's degree", "Master's degree", 'MPhil / PhD', 'Other']
const EXPERIENCE = ['Fresher', 'Less than 1 year', '1–3 years', '3–5 years', '5–10 years', 'More than 10 years']
const REQUIRED_NOTE = <span className="text-mred-600"> *</span>

const L = ({ t, req, hint, children, className = '' }: { t: string; req?: boolean; hint?: string; children: ReactNode; className?: string }) => (
  <label className={`block ${className}`}><span className="mb-1.5 block text-[13px] font-semibold text-gray-700">{t}{req && REQUIRED_NOTE}</span>{children}{hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}</label>
)

export default function StaffRegistration() {
  const { signUp, signOut } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Row>({ nationality: 'Pakistani' })
  const [same, setSame] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<null | { confirm: boolean }>(null)

  // keep this page out of search engines and the browser tab title neutral
  useEffect(() => {
    document.title = 'Team registration · Umeed of Life'
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m)
    return () => { document.head.removeChild(m) }
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [step])

  const f = (name: string) => ({ name, value: form[name] ?? '', onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [name]: e.target.value }) })
  const next = (e: FormEvent) => { e.preventDefault(); setError(''); setStep((s) => s + 1) }
  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 0)) }
  const maxDob = new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().slice(0, 10)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setStep(0); return setError('The two passwords do not match.') }
    if (!agree) return setError('Please confirm that the information is correct.')
    setBusy(true); setError('')
    const { password, confirm, email, ...rest } = form
    const reg = { ...rest, permanent_address: same ? form.address : form.permanent_address }
    const r = await signUp(String(email).trim(), String(password), String(form.full_name).trim(),
      { intent: 'staff', phone: String(form.phone ?? ''), city: String(form.city ?? ''), address: String(form.address ?? ''), reg: JSON.stringify(reg) }, '/marketplace/login')
    setBusy(false)
    if (r.error) return setError(r.error)
    if (r.hasSession) await signOut()   // they are a customer for now — no dashboard access until management assigns a role
    setDone({ confirm: !r.hasSession })
  }

  const Nav = ({ last }: { last?: boolean }) => (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
      {step > 0 ? <button type="button" onClick={back} className="btn-outline btn-sm !py-2.5"><Icon name="left" className="mr-1 h-4 w-4" />Back</button> : <span />}
      <button disabled={busy} className="btn-primary">{last ? (busy ? 'Submitting…' : 'Submit registration') : 'Continue'}{!last && <Icon name="right" className="ml-1.5 h-4 w-4" />}</button>
    </div>
  )

  const review: [string, [string, string][]][] = [
    ['Account', [['Name', form.full_name], ['Email', form.email]]],
    ['Personal', [['Father / guardian', form.father_name], ['CNIC', form.cnic], ['Date of birth', form.dob], ['Gender', form.gender], ['Marital status', form.marital_status]]],
    ['Contact', [['Phone', form.phone], ['WhatsApp', form.whatsapp], ['Address', form.address], ['City', `${form.city ?? ''}${form.province ? `, ${form.province}` : ''}`], ['Emergency contact', `${form.emergency_name ?? ''} (${form.emergency_relation ?? ''}) ${form.emergency_phone ?? ''}`]]],
    ['Work', [['Department', form.department], ['Position', form.position], ['Type', form.employment_type], ['Available from', form.joining_date]]],
    ['Background', [['Education', `${form.qualification ?? ''}${form.institute ? `, ${form.institute}` : ''}`], ['Experience', form.experience_years], ['Skills', form.skills]]],
  ]

  return (
    <div className="theme-central min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
          <img src="/images/umeed-logo.jpg" alt="Umeed of Life" className="h-12 w-auto mix-blend-multiply" />
          <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">Team registration</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        {done ? (
          <div className="animate-fade-in rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700"><Icon name="check" className="h-8 w-8" /></span>
            <h1 className="mt-5 text-2xl font-bold text-ink md:text-3xl">Registration received</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">Thank you, {form.full_name}. Your details have been sent to the Umeed of Life management team. They will review them and assign your role — you will be contacted on <b>{form.phone}</b>.</p>
            {done.confirm && <p className="mx-auto mt-4 max-w-md rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Please confirm your email address using the link we sent to <b>{form.email}</b>.</p>}
            <p className="mt-5 text-xs text-gray-400">Your account is a regular customer account until the team assigns your role.</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-brand-900">Join the Umeed of Life team</h1>
            <p className="mt-2 text-sm text-gray-600">Fill in your details so management can set up your role. Takes about five minutes.</p>

            <ol className="mt-6 flex gap-1.5" aria-label="Progress">
              {STEPS.map((s, i) => <li key={s} className="flex-1"><div className={`h-2 rounded-full transition-colors duration-500 ${i <= step ? 'bg-brand-700' : 'bg-gray-200'}`} /><span className={`mt-1 hidden text-[10px] sm:block ${i === step ? 'font-semibold text-brand-800' : 'text-gray-400'}`}>{s}</span></li>)}
            </ol>
            <p className="mt-2 text-sm text-gray-500">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <div key={step} className="mt-5 animate-fade-in rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              {step === 0 && (
                <form onSubmit={next} className="space-y-4">
                  <L t="Full name" req><input {...f('full_name')} required autoComplete="name" className="input" /></L>
                  <L t="Email" req hint="Use an email you check regularly."><input {...f('email')} type="email" required autoComplete="email" className="input" /></L>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <L t="Password" req hint="At least 8 characters"><input {...f('password')} type="password" minLength={8} required autoComplete="new-password" className="input" /></L>
                    <L t="Confirm password" req><input {...f('confirm')} type="password" minLength={8} required autoComplete="new-password" className="input" /></L>
                  </div>
                  <Nav />
                </form>)}

              {step === 1 && (
                <form onSubmit={next} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <L t="Father / guardian name" req><input {...f('father_name')} required className="input" /></L>
                    <L t="CNIC number" req hint="13 digits, e.g. 35202-1234567-1"><input {...f('cnic')} required inputMode="numeric" pattern="\d{5}-?\d{7}-?\d" title="13-digit CNIC, e.g. 35202-1234567-1" className="input" /></L>
                    <L t="Date of birth" req><input {...f('dob')} type="date" required max={maxDob} className="input" /></L>
                    <L t="Gender" req><select {...f('gender')} required className="input"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></L>
                    <L t="Marital status"><select {...f('marital_status')} className="input"><option value="">Select</option><option>Single</option><option>Married</option><option>Other</option></select></L>
                    <L t="Nationality"><input {...f('nationality')} className="input" /></L>
                    <L t="Blood group" hint="Optional"><select {...f('blood_group')} className="input"><option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b}>{b}</option>)}</select></L>
                  </div>
                  <Nav />
                </form>)}

              {step === 2 && (
                <form onSubmit={next} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <L t="Mobile number" req><input {...f('phone')} type="tel" required pattern="[0-9+\-\s()]{10,20}" title="A valid phone number" placeholder="03xx xxxxxxx" className="input" /></L>
                    <L t="WhatsApp number" hint="If different"><input {...f('whatsapp')} type="tel" className="input" /></L>
                  </div>
                  <L t="Current address" req><textarea {...f('address')} required rows={2} className="input" /></L>
                  <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} className="h-4 w-4 accent-brand-700" />Permanent address is the same</label>
                  {!same && <L t="Permanent address"><textarea {...f('permanent_address')} rows={2} className="input" /></L>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <L t="City" req><input {...f('city')} required className="input" /></L>
                    <L t="Province" req><select {...f('province')} required className="input"><option value="">Select</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></L>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="mb-3 text-sm font-bold text-ink">Emergency contact</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <L t="Name" req><input {...f('emergency_name')} required className="input" /></L>
                      <L t="Relation" req><input {...f('emergency_relation')} required placeholder="e.g. Brother" className="input" /></L>
                      <L t="Phone" req><input {...f('emergency_phone')} type="tel" required className="input" /></L>
                    </div>
                  </div>
                  <Nav />
                </form>)}

              {step === 3 && (
                <form onSubmit={next} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <L t="Department" req><select {...f('department')} required className="input"><option value="">Select</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></L>
                    <L t="Position you are applying for" req hint="Management will confirm your final role"><input {...f('position')} required placeholder="e.g. Accountant" className="input" /></L>
                    <L t="Employment type" req><select {...f('employment_type')} required className="input"><option value="">Select</option>{EMPLOYMENT.map((d) => <option key={d}>{d}</option>)}</select></L>
                    <L t="Available to join from"><input {...f('joining_date')} type="date" className="input" /></L>
                    <L t="Expected salary (PKR / month)" hint="Optional"><input {...f('expected_salary')} inputMode="numeric" className="input" /></L>
                  </div>
                  <Nav />
                </form>)}

              {step === 4 && (
                <form onSubmit={next} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <L t="Highest qualification" req><select {...f('qualification')} required className="input"><option value="">Select</option>{QUALIFICATIONS.map((d) => <option key={d}>{d}</option>)}</select></L>
                    <L t="Institute / university" req><input {...f('institute')} required className="input" /></L>
                    <L t="Field of study"><input {...f('field_of_study')} className="input" /></L>
                    <L t="Total experience" req><select {...f('experience_years')} required className="input"><option value="">Select</option>{EXPERIENCE.map((d) => <option key={d}>{d}</option>)}</select></L>
                    <L t="Last employer"><input {...f('prev_employer')} className="input" /></L>
                    <L t="Last position"><input {...f('prev_role')} className="input" /></L>
                  </div>
                  <L t="Skills" req hint="Separate with commas"><textarea {...f('skills')} required rows={2} placeholder="e.g. Accounting, Excel, customer support" className="input" /></L>
                  <L t="Languages"><input {...f('languages')} placeholder="e.g. Urdu, English, Punjabi" className="input" /></L>
                  <L t="About you" req hint="Why do you want to join Umeed of Life?"><textarea {...f('about')} required rows={4} maxLength={3000} className="input" /></L>
                  <Nav />
                </form>)}

              {step === 5 && (
                <form onSubmit={submit} className="space-y-5">
                  <p className="text-sm text-gray-600">Please check your details. Use Back to change anything.</p>
                  <div className="space-y-4">{review.map(([title, rows]) => (
                    <section key={title} className="rounded-2xl bg-gray-50 p-4"><h2 className="font-sans text-sm font-bold text-ink">{title}</h2>
                      <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">{rows.filter(([, v]) => v && String(v).trim()).map(([k, v]) => <div key={k}><dt className="text-xs text-gray-400">{k}</dt><dd className="break-words text-gray-800">{v}</dd></div>)}</dl></section>))}</div>
                  <label className="flex items-start gap-2 text-sm text-gray-700"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-700" />I confirm that the information above is true and I agree to be contacted by the Umeed of Life team.</label>
                  <p className="rounded-xl bg-brand-50 p-3 text-xs text-brand-900">Submitting creates your account as a regular customer. The management team will review your details and assign your role (employee, head, etc.).</p>
                  <Nav last />
                </form>)}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
