export type ModuleDef = { key: string; label: string; group: string; icon: string; path: string; desc: string }

// Every dashboard area. `group` decides where it sits in the sidebar.
export const MODULES: ModuleDef[] = [
  { key: 'overview', label: 'Overview', group: '', icon: 'chart', path: '', desc: 'Live numbers and what needs your attention.' },
  { key: 'messages', label: 'Messages', group: 'Website', icon: 'mail', path: 'messages', desc: 'Contact messages sent from the website.' },
  { key: 'content', label: 'Site settings', group: 'Website', icon: 'settings', path: 'settings', desc: 'Announcement bar, homepage text, contact details and the marketplace on/off switch.' },
  { key: 'departments', label: 'Departments', group: 'Website', icon: 'apps', path: 'departments', desc: 'Open, pause or hide departments on the website.' },
  { key: 'news', label: 'News', group: 'Website', icon: 'file', path: 'news', desc: 'Write and publish news posts.' },
  { key: 'impact', label: 'Impact figures', group: 'Website', icon: 'trend', path: 'impact', desc: 'The numbers shown in the Our Impact section.' },
  { key: 'banners', label: 'Banners', group: 'Marketplace', icon: 'image', path: 'banners', desc: 'Promotional banners on the Marketplace home page.' },
  { key: 'mp_applications', label: 'Vendor applications', group: 'Marketplace', icon: 'users', path: 'applications', desc: 'Review, approve or reject vendor applications.' },
  { key: 'mp_vendors', label: 'Vendors', group: 'Marketplace', icon: 'store', path: 'vendors', desc: 'Approved stores — suspend or reactivate.' },
  { key: 'mp_products', label: 'Products', group: 'Marketplace', icon: 'package', path: 'products', desc: 'Moderate products before they go live.' },
  { key: 'mp_orders', label: 'Orders', group: 'Marketplace', icon: 'truck', path: 'orders', desc: 'Follow shipments and confirm deliveries.' },
  { key: 'mp_categories', label: 'Categories', group: 'Marketplace', icon: 'tag', path: 'categories', desc: 'Product categories shown in the marketplace.' },
  { key: 'finance', label: 'Finance', group: 'Finance', icon: 'wallet', path: 'finance', desc: 'Vendor balances, settlements, commission and fees.' },
  { key: 'hr', label: 'Employees', group: 'People', icon: 'briefcase', path: 'hr', desc: 'Employee records.' },
  { key: 'users', label: 'Users & roles', group: 'People', icon: 'users', path: 'users', desc: 'See accounts and assign roles.' },
  { key: 'access', label: 'Access control', group: 'System', icon: 'lock', path: 'access', desc: 'Choose what each role can open and change. CEO / Co-CEO only.' },
  { key: 'audit', label: 'Audit log', group: 'System', icon: 'list', path: 'audit', desc: 'A record of sensitive actions.' },
]
export const GROUPS = ['Website', 'Marketplace', 'Finance', 'People', 'System']
export const moduleByKey = (k: string) => MODULES.find((m) => m.key === k)

// Columns of the access matrix (CEO and Co-CEO always have everything).
export const MATRIX_ROLES = ['central_admin', 'finance_manager', 'hr_manager', 'it_manager', 'marketplace_head', 'marketplace_staff']

// Used until supabase/dashboard.sql has been run. Matches the defaults that file seeds.
export const DEFAULT_PERMS: Record<string, string[]> = {
  central_admin: ['overview', 'messages', 'impact', 'news', 'content', 'departments', 'banners'],
  finance_manager: ['overview', 'finance'],
  hr_manager: ['overview', 'hr'],
  it_manager: ['overview', 'users', 'audit'],
  marketplace_head: ['mp_applications', 'mp_vendors', 'mp_products', 'mp_orders', 'mp_categories', 'banners'],
  marketplace_staff: ['mp_applications', 'mp_products', 'mp_orders'],
}
