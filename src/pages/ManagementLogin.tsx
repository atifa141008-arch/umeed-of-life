import { useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import Logo from '../components/Logo'
import { CENTRAL_ROLES } from '../lib/format'

export default function ManagementLogin() {
  const navigate = useNavigate()
  return (
    <LoginForm
      allowed={CENTRAL_ROLES}
      onSuccess={() => navigate('/management', { replace: true })}
      title="Central Management Login"
      subtitle="For authorized Umeed of Life central staff only."
      logo={<Logo className="h-24" />}
    />
  )
}
