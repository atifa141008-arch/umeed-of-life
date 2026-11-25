import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Row, dt } from '../../lib/format'
import { useToast } from '../../components/Toast'
import Icon from '../../components/Icon'
import { StatusBadge, useRows } from '../../components/ui'
import { EmptyState, Notice, PageLoading, Panel } from '../vendor/dashboard/parts'
import { Avatar, Card, Chips, SearchInput } from './bits'

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
    const holderOk = bank && String(bank.account_holder).trim().toLowerCase() === String(sel.legal_name).trim().toLowerCase()
    return (
      <div className="animate-fade-in space-y-5">
        <button onClick={() => setSel(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-mred-600"><Icon name="left" className="h-4 w-4" />Back to applications</button>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Avatar name={sel.business_name} size="h-14 w-14" />
          <div className="min-w-0 flex-1"><h2 className="truncate font-sans text-xl font-bold text-ink">{sel.business_name}</h2><p className="text-sm text-gray-500">{sel.legal_name} • {sel.email} • {sel.city}</p><p className="text-xs text-gray-400">Submitted {dt(sel.submitted_at)}</p></div>
          <StatusBadge s={sel.status} />
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {GROUPS.map(([title, fields]) => (
              <Panel key={title} title={title}>
                <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">{fields.map(([k, l]) => <div key={k}><dt className="text-xs text-gray-400">{l}</dt><dd className="mt-0.5 break-words text-ink">{sel[k] || '—'}</dd></div>)}</dl>
              </Panel>
            ))}
            <Panel title="Documents">
              {need.length > 0 && <div className="mb-3"><Notice tone="amber">Missing: {need.map((n) => DOC_LABEL[n]).join(', ')}</Notice></div>}
              {!docs.length ? <p className="text-sm text-gray-500">None uploaded.</p> : (
                <ul className="space-y-2">{docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 text-sm">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-gray-500 ring-1 ring-gray-200"><Icon name="file" className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><b className="block text-ink">{DOC_LABEL[d.doc_type] ?? d.doc_type}</b><span className="block truncate text-xs text-gray-500">{String(d.file_path).split('/').pop()}</span></span>
                    <button onClick={() => view(d.file_path)} className="btn-red-outline btn-sm">Open</button></li>))}</ul>)}
            </Panel>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24">
            <Panel title="Payout account">
              {bank ? (
                <dl className="space-y-3 text-sm"><div><dt className="text-xs text-gray-400">Account holder</dt><dd className="text-ink">{bank.account_holder}</dd></div><div><dt className="text-xs text-gray-400">Bank</dt><dd className="text-ink">{bank.bank_name}</dd></div><div><dt className="text-xs text-gray-400">Account</dt><dd className="text-ink">•••• {bank.account_last4}</dd></div>
                  <Notice tone={holderOk ? 'green' : 'amber'}>{holderOk ? 'Account holder matches the legal name.' : 'Account holder differs from the legal name — check.'}</Notice></dl>
              ) : <p className="text-sm text-gray-500">Not provided yet.</p>}
              <p className="mt-3 text-[11px] text-gray-400">Full account numbers are visible to Finance only.</p>
            </Panel>

            {hist.length > 0 && (
              <Panel title="History">
                <ul className="space-y-4 border-l-2 border-gray-100 pl-4">{hist.map((e) => (
                  <li key={e.id} className="relative text-sm"><span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full acc-bar ring-4 ring-white" />
                    <b className="text-ink">{ACTION[e.action] ?? e.action}</b>{e.note && <span className="block text-gray-600">{e.note}</span>}<span className="text-xs text-gray-400">{dt(e.created_at)}</span></li>))}</ul>
              </Panel>)}

            {sel.status === 'under_review' ? (
              <Panel title="Your decision">
                <div className="space-y-3">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Decision note (required) — the applicant will see it" className="input" />
                  <div className="flex flex-wrap gap-1.5">{[...TEMPLATES.approve, ...TEMPLATES.reject, ...TEMPLATES.info].map((t) => <button key={t} type="button" onClick={() => setNote(t)} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-200">{t}</button>)}</div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button disabled={!note.trim() || busy} onClick={() => decide('approved')} className="btn-red">Approve &amp; activate account</button>
                    <button disabled={!note.trim() || busy} onClick={() => decide('more_information')} className="btn-red-outline">Request more information</button>
                    <button disabled={!note.trim() || busy} onClick={() => decide('rejected')} className="btn-peach">Decline</button>
                  </div>
                </div>
              </Panel>
            ) : <Panel title="Decision note"><p className="text-sm text-gray-700">{sel.decision_note || '—'}</p></Panel>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Chips value={tab} onChange={setTab} items={TABS.map(([k, l]) => [k, l, count(k)])} />
        <SearchInput value={q} onChange={setQ} placeholder="Business, name, email, city" />
      </div>
      {loading ? <PageLoading /> : error ? <Notice tone="red">{error}</Notice> : !rows.length ? <EmptyState icon="users" title="No applications in this view" text={tab === 'under_review' ? 'You are all caught up.' : 'Try another tab or search.'} /> : (
        <Card>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="th pl-5">Business</th><th className="th">Type</th><th className="th">City</th><th className="th">Submitted</th><th className="th">Status</th><th className="th pr-5" /></tr></thead>
            <tbody>{rows.map((a: Row) => (
              <tr key={a.id} className="transition hover:bg-gray-50/60">
                <td className="td pl-5"><div className="flex items-center gap-3"><Avatar name={a.business_name} /><div className="min-w-0"><p className="font-semibold text-ink">{a.business_name}</p><p className="truncate text-xs text-gray-500">{a.legal_name} • {a.email}</p></div></div></td>
                <td className="td capitalize">{a.applicant_type}</td><td className="td">{a.city}</td>
                <td className="td whitespace-nowrap text-gray-500">{dt(a.submitted_at)}</td><td className="td"><StatusBadge s={a.status} /></td>
                <td className="td whitespace-nowrap pr-5 text-right"><button onClick={() => open(a)} className={a.status === 'under_review' ? 'btn-red btn-sm' : 'btn-red-outline btn-sm'}>{a.status === 'under_review' ? 'Review' : 'View'}</button></td></tr>))}</tbody></table></div>
        </Card>
      )}
    </div>
  )
}
