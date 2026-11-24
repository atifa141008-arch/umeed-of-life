import DashShell from '../../components/DashShell'
import { usePermissions } from '../../context/PermissionsContext'

const ALL = [
  { to: '/marketplace/admin', label: 'Applications', end: true, perm: 'mp_applications' },
  { to: '/marketplace/admin/vendors', label: 'Vendors', perm: 'mp_vendors' },
  { to: '/marketplace/admin/products', label: 'Products', perm: 'mp_products' },
  { to: '/marketplace/admin/orders', label: 'Orders', perm: 'mp_orders' },
  { to: '/marketplace/admin/categories', label: 'Categories', perm: 'mp_categories' },
  { to: '/marketplace/admin/banners', label: 'Banners', perm: 'banners' },
]
export default function AdminLayout() {
  const { can } = usePermissions()
  return <DashShell title="Marketplace Management" nav={ALL.filter((n) => can(n.perm))} red />
}
