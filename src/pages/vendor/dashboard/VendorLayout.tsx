import VendorDashShell from '../../../components/VendorDashShell'
import { useMyVendor } from '../../../lib/useMyVendor'
import { Spinner, ErrorNote } from '../../../components/ui'

export default function VendorLayout() {
  const { vendor, loading } = useMyVendor()
  if (loading) return <Spinner />
  if (!vendor) return <div className="mx-auto max-w-xl px-5 py-16"><ErrorNote>Your store record was not found. Please contact marketplace support.</ErrorNote></div>
  if (vendor.status === 'suspended') return <div className="mx-auto max-w-xl px-5 py-16"><ErrorNote>Your store is currently suspended. Please contact marketplace support.</ErrorNote></div>
  return <VendorDashShell vendor={vendor} />
}
