import { ReactElement } from 'react'
import Overview from './Overview'
import Messages from './Messages'
import Impact from './Impact'
import News from './News'
import Finance from './Finance'
import HR from './HR'
import Staff from './Staff'
import Audit from './Audit'
import { CENTRAL_ROLES } from '../../lib/format'

const TOP = ['ceo', 'co_ceo', 'central_admin']
export type MPage = { path: string; label: string; roles: string[]; element: ReactElement }

// Each role only sees (and can only open) the pages listed for it.
export const managementPages: MPage[] = [
  { path: '', label: 'Overview', roles: CENTRAL_ROLES, element: <Overview /> },
  { path: 'messages', label: 'Messages', roles: TOP, element: <Messages /> },
  { path: 'impact', label: 'Impact figures', roles: TOP, element: <Impact /> },
  { path: 'news', label: 'News', roles: TOP, element: <News /> },
  { path: 'finance', label: 'Finance', roles: ['ceo', 'co_ceo', 'finance_manager'], element: <Finance /> },
  { path: 'hr', label: 'HR', roles: ['ceo', 'co_ceo', 'hr_manager'], element: <HR /> },
  { path: 'users', label: 'Users & roles', roles: ['ceo', 'co_ceo', 'it_manager'], element: <Staff /> },
  { path: 'audit', label: 'Audit log', roles: ['ceo', 'co_ceo', 'it_manager'], element: <Audit /> },
]
