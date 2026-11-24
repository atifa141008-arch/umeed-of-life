import { ComponentType, lazy, ReactNode } from 'react'
import { usePermissions } from '../../context/PermissionsContext'
import { PageSkeleton } from '../../components/ui'
import Icon from '../../components/Icon'

// Dashboard pages are loaded on demand so the public website stays light.
export const PAGES: Record<string, ComponentType> = {
  overview: lazy(() => import('./Overview')),
  messages: lazy(() => import('./Messages')),
  content: lazy(() => import('./SiteSettings')),
  departments: lazy(() => import('./DepartmentsAdmin')),
  news: lazy(() => import('./News')),
  impact: lazy(() => import('./Impact')),
  banners: lazy(() => import('./BannersAdmin')),
  mp_applications: lazy(() => import('../admin/Applications')),
  mp_vendors: lazy(() => import('../admin/AVendors')),
  mp_products: lazy(() => import('../admin/AProducts')),
  mp_orders: lazy(() => import('../admin/AOrders')),
  mp_categories: lazy(() => import('../admin/ACategories')),
  finance: lazy(() => import('./Finance')),
  hr: lazy(() => import('./HR')),
  users: lazy(() => import('./Staff')),
  access: lazy(() => import('./AccessControl')),
  audit: lazy(() => import('./Audit')),
}

export function ModuleGuard({ module, children }: { module: string; children: ReactNode }) {
  const { can, loading } = usePermissions()
  if (loading) return <PageSkeleton />
  if (!can(module))
    return (
      <div className="mx-auto max-w-md animate-fade-in rounded-3xl border border-gray-200 bg-white p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-gray-500"><Icon name="lock" className="h-7 w-7" /></span>
        <h2 className="mt-4 text-xl font-bold">You don't have access to this area</h2>
        <p className="mt-2 text-sm text-gray-600">Ask the CEO to grant your role access in Access control.</p>
      </div>
    )
  return <>{children}</>
}
