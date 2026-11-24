import DashShell from '../../../components/DashShell'
import { useMyVendor } from '../../../lib/useMyVendor'
import { Spinner, ErrorNote } from '../../../components/ui'

const nav = [
  { to: '/marketplace/vendor/dashboard', label: 'Overview', end: true },
  { to: '/marketplace/vendor/dashboard/products', label: 'Products' },
  { to: '/marketplace/vendor/dashboard/orders', label: 'Orders' },
  { to: '/marketplace/vendor/dashboard/finance', label: 'Finance' },
  { to: '/marketplace/vendor/dashboard/store', label: 'Store profile' },
]

export default function VendorLayout() {
  const { vendor, loading } = useMyVendor()
  if (loading) return <Spinner />
  if (!vendor) return <div className="mx-auto max-w-xl px-5 py-16"><ErrorNote>Your store record was not found. Please contact marketplace support.</ErrorNote></div>
  if (vendor.status === 'suspended') return <div className="mx-auto max-w-xl px-5 py-16"><ErrorNote>Your store is currently suspended. Please contact marketplace support.</ErrorNote></div>
  return <DashShell title={vendor.store_name} nav={nav} red />
}
