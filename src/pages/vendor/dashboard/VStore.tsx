import { FormEvent, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import { useMyVendor } from '../../../lib/useMyVendor'
import { Spinner } from '../../../components/ui'

export default function VStore() {
  const { session } = useAuth()
  const { vendor, loading, reload } = useMyVendor()
  const [msg, setMsg] = useState('')
  if (loading || !vendor) return <Spinner />

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    let logo_url = vendor.logo_url
    const file = f.get('logo') as File
    if (file && file.size) {
      if (file.size > 2 * 1024 * 1024) return setMsg('Logo must be 2 MB or smaller')
      const path = `${session!.user.id}/logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const up = await supabase.storage.from('product-images').upload(path, file)
      if (up.error) return setMsg(up.error.message)
      logo_url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }
    const { error } = await supabase.from('vendors').update({ description: String(f.get('description')), support_contact: String(f.get('support_contact')), logo_url }).eq('id', vendor.id)
    setMsg(error ? error.message : 'Saved'); reload()
  }
  return (
    <form onSubmit={save} className="max-w-xl space-y-4">
      <p className="text-sm text-gray-600">Store name: <b>{vendor.store_name}</b> (contact the marketplace team to change it) • Commission: <b>{vendor.commission_rate}%</b></p>
      {vendor.logo_url && <img src={vendor.logo_url} alt="" className="h-20 w-20 rounded-full object-cover" />}
      <label className="block text-sm font-medium">Logo<input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" /></label>
      <label className="block text-sm font-medium">Description<textarea name="description" rows={4} defaultValue={vendor.description ?? ''} className="input mt-1" /></label>
      <label className="block text-sm font-medium">Support contact<input name="support_contact" defaultValue={vendor.support_contact ?? ''} className="input mt-1" /></label>
      <button className="btn-red">Save</button>{msg && <p className="text-sm text-gray-600">{msg}</p>}
    </form>
  )
}
