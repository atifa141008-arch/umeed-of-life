import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, dt } from '../../lib/format'
import { useToast } from '../../components/Toast'
import Icon from '../../components/Icon'
import { Empty, ErrorNote, Spinner, StatusBadge, useRows } from '../../components/ui'

const GROUPS: [string, [string, string][]][] = [
  ['Applicant', [['applicant_type', 'Type'], ['legal_name', 'Legal name'], ['id_number', 'ID number'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address'], ['city', 'City']]],
  ['Business', [['business_name', 'Business'], ['business_type', 'Business type'], ['category', 'Category'], ['description', 'Description'], ['business_address', 'Business address'], ['registration_no', 'Registration no.'], ['tax_no', 'NTN / tax no.'], ['experience', 'Experience'], ['product_count', 'Planned products'], ['website', 'Website'], ['social_links', 'Social page']]],
  ['Store', [['store_display_name', 'Store name'], ['store_description', 'Store description'], ['return_address', 'Return address'], ['support_contact', 'Support contact']]],
]
const DOC_LABEL: Record<string, string> = { id_front: 'ID — front', id_back: 'ID — back', identity: 'Identity document', business: 'Business registration', address_proof: 'Proof of address' }
const ACTION: Record<string, string> = { approved: 'Approved', rejected: 'Declined', more_information: 'More information requested', reapply: 'Applied again' }
const TEMPLATES = { approve: ['Identity and documents verified.', 'Business details verified.'], reject: ['ID document is unclear or does not match.', 'Business details could not be verified.', 'Product category is not allowed.'], info: ['Please upload a clearer copy of your ID.', 'Please add your business address and registration details.'] }
const TABS: [string, string][] = [['under_review', 'To review'], ['more_information', 'Waiting for applicant'], ['approved', 'Approved'], ['rejected', 'Declined'], ['all', 'All']]

export default function Applications() {
  const toast = useToast()
  const { data, loading, error, reload } = useRows(() => supabase.from('vendor_applications').select('*').neq('status', 'draft').order('submitted_at', { ascending: false }).limit(500))
  const [tab, setTab] = useState('under_review')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Row | null>(null)
  const [docs, setDocs] = useState<Row[]>([])
  const [bank, setBank] = useState<Row | null>(null)
  const [hist, setHist] = useState<Row[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const open = async (a: Row) => {
    setSel(a); setNote(''); setBank(null)
    const [d, h, b] = await Promise.all([
      supabase.from('application_documents').select('*').eq('application_id', a.id),
      supabase.from('verification_events').select('*').eq('application_id', a.id).order('created_at', { ascending: false }),
      supabase.rpc('application_bank_preview', { p_app: a.id })])
    setDocs(d.data ?? []); setHist(h.data ?? []); setBank((b.data as Row) ?? null)
  }
  const view = async (path: string) => {
    const { data, error } = await supabase.storage.from('vendor-documents').createSignedUrl(path, 300)
    if (error) return toast(error.message, 'err')
    window.open(data.signedUrl, '_blank', 'noopener')
  }
  const decide = async (decision: 'approved' | 'rejected' | 'more_information') => {
    const label = decision === 'approved' ? 'approve and activate this vendor' : decision === 'rejected' ? 'decline this application' : 'ask for more information'
    if (!confirm(`Are you sure you want to ${label}?`)) return
    setBusy(true)
    const { error } = await supabase.rpc('decide_application', { p_id: sel!.id, p_decision: decision, p_note: note })
    setBusy(false)
    if (error) return toast(error.message, 'err')
    toast(decision === 'approved' ? 'Vendor approved — account activated' : decision === 'rejected' ? 'Application declined' : 'Requested more information')
    setSel(null); reload()
  }

  const count = (s: string) => (s === 'all' ? data.length : data.filter((a: Row) => a.status === s).length)
  const rows = data.filter((a: Row) => (tab === 'all' || a.status === tab) && `${a.business_name} ${a.legal_name} ${a.email} ${a.city}`.toLowerCase().includes(q.toLowerCase()))

  if (sel) {
    const need = ['id_front', 'id_back'].filter((t) => !docs.some((d) => d.doc_type === t || (t === 'id_front' && d.doc_type === 'identity')))
    return (
      <div className="animate-fade-in space-y-5">
        <button onClick={() => setSel(null)} className="flex items-center gap-1 text-sm font-semibold text-mred-600"><Icon name="left" className="h-4 w-4" />Back to applications</button>
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-2xl font-bold">{sel.business_name}</h2><StatusBadge s={sel.status} /></div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {GROUPS.map(([title, fields]) => (
              <section key={title} className="card"><h3 className="font-sans text-base font-bold">{title}</h3>
                <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{fields.map(([k, l]) => <div key={k}><dt className="text-xs text-gray-500">{l}</dt><dd className="break-words">{sel[k] || '—'}</dd></div>)}</dl></section>
            ))}
            <section className="card"><h3 className="font-sans text-base font-bold">Documents</h3>
              {need.length > 0 && <p className="mt-2 rounded-lg bg-orange-50 p-2 text-xs text-orange-800">Missing: {need.map((n) => DOC_LABEL[n]).join(', ')}</p>}
              {!docs.length ? <p className="mt-2 text-sm text-gray-500">None uploaded.</p> : docs.map((d) => (
                <div key={d.id} className="mt-2 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"><span><b>{DOC_LABEL[d.doc_type] ?? d.doc_type}</b> <span className="text-xs text-gray-500">{String(d.file_path).split('/').pop()}</span></span>
                  <button onClick={() => view(d.file_path)} className="btn-red-outline btn-sm">Open</button></div>
              ))}
            </section>
          </div>

          <div className="space-y-5">
            <section className="card"><h3 className="font-sans text-base font-bold">Payout account</h3>
              {bank ? <dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-gray-500">Account holder</dt><dd>{bank.account_holder}</dd></div><div><dt className="text-xs text-gray-500">Bank</dt><dd>{bank.bank_name}</dd></div><div><dt className="text-xs text-gray-500">Account</dt><dd>•••• {bank.account_last4}</dd></div>
                <p className={`rounded-lg p-2 text-xs ${String(bank.account_holder).trim().toLowerCase() === String(sel.legal_name).trim().toLowerCase() ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>{String(bank.account_holder).trim().toLowerCase() === String(sel.legal_name).trim().toLowerCase() ? 'Account holder matches the legal name.' : 'Account holder differs from the legal name — check.'}</p></dl>
                : <p className="mt-2 text-sm text-gray-500">Not provided yet.</p>}
              <p className="mt-3 text-[11px] text-gray-400">Full account numbers are visible to Finance only.</p></section>

            {hist.length > 0 && <section className="card"><h3 className="font-sans text-base font-bold">History</h3>
              <ul className="mt-3 space-y-3">{hist.map((e) => <li key={e.id} className="text-sm"><b>{ACTION[e.action] ?? e.action}</b>{e.note && <span className="block text-gray-600">{e.note}</span>}<span className="text-xs text-gray-400">{dt(e.created_at)}</span></li>)}</ul></section>}

            {sel.status === 'under_review' ? (
              <section className="card space-y-3"><h3 className="font-sans text-base font-bold">Your decision</h3>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Decision note (required) — the applicant will see it" className="input" />
                <div className="flex flex-wrap gap-1.5">{[...TEMPLATES.approve, ...TEMPLATES.reject, ...TEMPLATES.info].map((t) => <button key={t} type="button" onClick={() => setNote(t)} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] hover:bg-gray-200">{t}</button>)}</div>
                <div className="flex flex-col gap-2">
                  <button disabled={!note.trim() || busy} onClick={() => decide('approved')} className="btn-red">Approve & activate account</button>
                  <button disabled={!note.trim() || busy} onClick={() => decide('more_information')} className="btn-red-outline">Request more information</button>
                  <button disabled={!note.trim() || busy} onClick={() => decide('rejected')} className="btn-peach">Decline</button>
                </div>
              </section>
            ) : <section className="card text-sm"><b>Decision note:</b> {sel.decision_note || '—'}</section>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-full bg-gray-100 p-1 text-xs font-semibold">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 transition ${tab === k ? 'bg-white shadow' : 'text-gray-500'}`}>{l} <span className={`ml-1 rounded-full px-1.5 ${k === 'under_review' && count(k) > 0 ? 'bg-gold-400 text-brand-900' : 'text-gray-400'}`}>{count(k)}</span></button>)}
      </div>
      <div className="relative max-w-sm"><Icon name="search" className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business, name, email, city" className="input !pl-10" /></div>
      {loading ? <Spinner /> : error ? <ErrorNote>{error}</ErrorNote> : !rows.length ? <Empty>No applications in this view.</Empty> : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white"><table className="w-full text-sm">
          <thead><tr><th className="th">Business</th><th className="th">Type</th><th className="th">City</th><th className="th">Submitted</th><th className="th">Status</th><th className="th"></th></tr></thead>
          <tbody>{rows.map((a: Row) => (
            <tr key={a.id} className="transition hover:bg-gray-50"><td className="td"><b>{a.business_name}</b><br /><span className="text-xs text-gray-500">{a.legal_name} • {a.email}</span></td><td className="td">{a.applicant_type}</td><td className="td">{a.city}</td>
              <td className="td">{dt(a.submitted_at)}</td><td className="td"><StatusBadge s={a.status} /></td><td className="td"><button onClick={() => open(a)} className="btn-red btn-sm">{a.status === 'under_review' ? 'Review' : 'View'}</button></td></tr>
          ))}</tbody></table></div>
      )}
    </div>
  )
}
