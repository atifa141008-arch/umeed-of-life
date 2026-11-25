import AdminDashShell, { AdminNavItem } from '../../components/AdminDashShell'
import { usePermissions } from '../../context/PermissionsContext'

const B = '/marketplace/admin'
const ALL: (AdminNavItem & { perm: string })[] = [
  { to: B, label: 'Applications', icon: 'users', end: true, perm: 'mp_applications', badge: 'applications', desc: 'Review, approve or reject vendor applications.' },
  { to: `${B}/vendors`, label: 'Vendors', icon: 'store', perm: 'mp_vendors', desc: 'Approved stores — suspend or reactivate.' },
  { to: `${B}/products`, label: 'Products', icon: 'package', perm: 'mp_products', badge: 'products', desc: 'Moderate products before they go live.' },
  { to: `${B}/orders`, label: 'Orders', icon: 'truck', perm: 'mp_orders', badge: 'orders', desc: 'Follow shipments and confirm deliveries.' },
  { to: `${B}/categories`, label: 'Categories', icon: 'tag', perm: 'mp_categories', desc: 'Product categories shown in the marketplace.' },
  { to: `${B}/banners`, label: 'Banners', icon: 'image', perm: 'banners', desc: 'Promotional banners on the Marketplace home page.' },
]
export default function AdminLayout() {
  const { can } = usePermissions()
  return <AdminDashShell nav={ALL.filter((n) => can(n.perm))} />
}
