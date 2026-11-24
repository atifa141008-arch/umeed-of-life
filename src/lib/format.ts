export type Row = Record<string, any>
export const pkr = (n: number | string | null | undefined) =>
  'PKR ' + Number(n ?? 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })
export const dt = (d?: string | null) => (d ? new Date(d).toLocaleString() : '')
export const slugify = (t: string) =>
  t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

export const CENTRAL_ROLES = ['ceo', 'co_ceo', 'central_admin', 'finance_manager', 'hr_manager', 'it_manager']
export const MARKET_STAFF_ROLES = ['marketplace_head', 'marketplace_staff']
export const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO', co_ceo: 'Co-CEO', central_admin: 'Central Admin', finance_manager: 'Finance Manager',
  hr_manager: 'HR Manager', it_manager: 'IT Manager', marketplace_head: 'Marketplace Head',
  marketplace_staff: 'Marketplace Staff', vendor: 'Vendor', applicant: 'Vendor applicant', customer: 'Customer',
}
