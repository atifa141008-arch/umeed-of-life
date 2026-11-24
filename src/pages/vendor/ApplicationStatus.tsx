import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Row, dt } from '../../lib/format'
import { ErrorNote, Spinner, StatusBadge, useRows } from '../../components/ui'
import Icon from '../../components/Icon'

const MEANING: Record<string, string> = {
  draft: 'You started an application but have not submitted it yet.',
  under_review: 'Your application is with the Umeed team. They will verify your details and documents, then approve or decline it. This page updates by itself.',
  more_information: 'The team needs more details before they can decide. Please update your application and submit it again.',
  approved: 'Congratulations — your store is approved and activated.',
  rejected: 'Your application was declined. You can correct the points below and apply again.',
  suspended: 'Your vendor account is restricted. Please contact support.',
}
const ACTION: Record<string, string> = { approved: 'Approved', rejected: 'Declined', more_information: 'More information requested', reapply: 'Applied again' }

function Track({ status }: { status: string }) {
  const decided = ['approved', 'rejected'].includes(status)
  const steps = [
    { label: 'Submitted', state: 'done' },
    { label: 'Under review', state: decided ? 'done' : 'now' },
    { label: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Declined' : 'Decision', state: decided ? (status === 'approved' ? 'ok' : 'bad') : 'wait' },
  ]
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex-1 text-center">
          {i > 0 && <span className={`absolute left-[-50%] right-[50%] top-4 h-0.5 transition-colors duration-700 ${steps[i - 1].state !== 'wait' && s.state !== 'wait' ? 'bg-mred-600' : 'bg-gray-200'}`} />}
          <span className={`relative mx-auto grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white transition-colors ${s.state === 'done' || s.state === 'ok' ? 'bg-green-600' : s.state === 'bad' ? 'bg-red-600' : s.state === 'now' ? 'bg-mred-600' : 'bg-gray-300'}`}>
            {s.state === 'now' && <span className="absolute inset-0 animate-ping rounded-full bg-mred-600/40" />}
            <span className="relative">{s.state === 'bad' ? '✕' : s.state === 'wait' ? i + 1 : s.state === 'now' ? i + 1 : '✓'}</span>
          </span>
          <p className={`mt-2 text-xs font-medium ${s.state === 'wait' ? 'text-gray-400' : 'text-gray-800'}`}>{s.label}</p>
        </li>
      ))}
    </ol>
  )
}

export default function ApplicationStatus() {
  const { session, role, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [err, setErr] = useState('')
  const { data, loading, reload } = useRows(() => supabase.from('vendor_applications').select('*').eq('user_id', session?.user.id ?? '').limit(1), [session?.user.id])
  const a: Row | undefined = data[0]
  const ev = useRows(() => (a ? supabase.from('verification_events').select('*').eq('application_id', a.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null })), [a?.id, a?.status])

  // keep the page fresh while the team is reviewing; pick up the vendor role as soon as it is approved
  useEffect(() => {
    if (!a || !['under_review', 'more_information'].includes(a.status)) return
    const t = setInterval(reload, 15000)
    return () => clearInterval(t)
  }, [a?.status])
  useEffect(() => { if (a?.status === 'approved' && role !== 'vendor') refreshProfile() }, [a?.status, role])

  if (role === 'vendor') return <Navigate to="/marketplace/vendor/dashboard" replace />
  if (loading) return <Spinner />

  const reapply = async () => {
    const { error } = await supabase.rpc('reapply_application')
    if (error) return setErr(error.message)
    navigate('/marketplace/vendor/apply')
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-14">
      <h1 className="text-3xl font-bold">Application status</h1>
      {!a ? <p className="mt-4 text-gray-600">No application found. <Link to="/marketplace/vendor/apply" className="font-semibold text-mred-600">Start one</Link></p> : (
        <div className="mt-6 space-y-5">
          <div className="card animate-fade-in space-y-5">
            <div className="flex items-center justify-between"><p className="font-bold">{a.business_name || 'Your application'}</p><StatusBadge s={a.status} /></div>
            {['under_review', 'approved', 'rejected', 'more_information'].includes(a.status) && <Track status={a.status === 'more_information' ? 'under_review' : a.status} />}
            <p className="text-sm text-gray-600">{MEANING[a.status]}</p>
            {a.submitted_at && <p className="text-xs text-gray-500">Submitted {dt(a.submitted_at)}</p>}
            {a.decision_note && ['rejected', 'more_information', 'approved'].includes(a.status) && <p className="rounded-xl bg-peach-50 p-3 text-sm"><b>Note from the team:</b> {a.decision_note}</p>}
            {err && <ErrorNote>{err}</ErrorNote>}
            {['draft', 'more_information'].includes(a.status) && <Link to="/marketplace/vendor/apply" className="btn-red">{a.status === 'draft' ? 'Continue application' : 'Update information'}</Link>}
            {a.status === 'rejected' && <button onClick={reapply} className="btn-red"><Icon name="edit" className="mr-2 h-4 w-4" />Correct and apply again</button>}
            {a.status === 'approved' && <Link to="/marketplace/vendor/dashboard" className="btn-red">Go to your dashboard</Link>}
          </div>

          {ev.data.length > 0 && (
            <div className="card">
              <h2 className="font-sans text-base font-bold">History</h2>
              <ul className="mt-3 space-y-3">{ev.data.map((e: Row) => (
                <li key={e.id} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-mred-600" />
                  <div><p className="font-medium">{ACTION[e.action] ?? e.action}</p>{e.note && <p className="text-gray-600">{e.note}</p>}<p className="text-xs text-gray-400">{dt(e.created_at)}</p></div></li>
              ))}</ul>
            </div>
          )}
        </div>
      )}
      <button onClick={() => signOut()} className="mt-6 text-sm text-gray-500 underline">Sign out</button>
    </div>
  )
}
