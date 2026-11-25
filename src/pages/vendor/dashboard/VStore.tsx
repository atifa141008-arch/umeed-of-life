import { FormEvent, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { useMyVendor } from '../../../lib/useMyVendor'
import { PageLoading, Field, Notice, PageHeader, Panel, initials } from './parts'

export default function VStore() {
  const { session } = useAuth()
  const { vendor, loading, reload } = useMyVendor()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  if (loading || !vendor) return <PageLoading />

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true); setMsg(null)
    let logo_url = vendor.logo_url
    const file = f.get('logo') as File
    if (file && file.size) {
      if (file.size > 2 * 1024 * 1024) { setBusy(false); return setMsg({ ok: false, text: 'Logo must be 2 MB or smaller' }) }
      const path = `${session!.user.id}/logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const up = await supabase.storage.from('product-images').upload(path, file)
      if (up.error) { setBusy(false); return setMsg({ ok: false, text: up.error.message }) }
      logo_url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }
    const { error } = await supabase.from('vendors').update({ description: String(f.get('description')), support_contact: String(f.get('support_contact')), logo_url }).eq('id', vendor.id)
    setBusy(false)
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Store profile saved.' }); reload()
  }
  const shown = preview ?? vendor.logo_url

  return (
    <div>
      <PageHeader title="Store profile" subtitle="How customers see your store on the marketplace." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Store details" className="lg:col-span-2">
          <form onSubmit={save} className="space-y-5">
            <div className="flex items-center gap-4">
              {shown ? <img src={shown} alt="Store logo" className="h-20 w-20 rounded-2xl object-cover ring-1 ring-gray-200" />
                : <span className="grid h-20 w-20 place-items-center rounded-2xl bg-mred-600 font-sans text-2xl font-bold text-white">{initials(vendor.store_name)}</span>}
              <Field label="Logo" hint="JPG, PNG or WebP, up to 2 MB" className="flex-1">
                <input name="logo" type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : null) }}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-peach-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-mred-700 hover:file:bg-peach-200" />
              </Field>
            </div>
            <Field label="Description" hint="A short introduction to your store and what you sell."><textarea name="description" rows={5} defaultValue={vendor.description ?? ''} className="input" /></Field>
            <Field label="Support contact" hint="Phone, WhatsApp or email customers can reach you on."><input name="support_contact" defaultValue={vendor.support_contact ?? ''} className="input" /></Field>
            {msg && <Notice tone={msg.ok ? 'green' : 'red'}>{msg.text}</Notice>}
            <div className="flex justify-end border-t border-gray-100 pt-4"><button disabled={busy} className="btn-red">{busy ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </Panel>
        <Panel title="Account">
          <dl className="space-y-4 text-sm">
            <div><dt className="text-xs text-gray-400">Store name</dt><dd className="mt-0.5 font-semibold text-ink">{vendor.store_name}</dd><dd className="mt-0.5 text-xs text-gray-400">Contact the marketplace team to change it.</dd></div>
            <div><dt className="text-xs text-gray-400">Commission rate</dt><dd className="mt-0.5 font-semibold text-ink">{vendor.commission_rate}%</dd></div>
            <div><dt className="text-xs text-gray-400">Login email</dt><dd className="mt-0.5 break-all font-semibold text-ink">{session?.user.email}</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  )
}
