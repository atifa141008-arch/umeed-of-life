import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoginForm from '../../components/LoginForm'
import MarketLogo from '../../components/MarketLogo'

// Vendors and vendor applicants only.
export default function VendorLogin() {
  const navigate = useNavigate()
  const { role } = useAuth()
  useEffect(() => { if (role === 'vendor') navigate('/marketplace/vendor/dashboard', { replace: true }); else if (role === 'applicant') navigate('/marketplace/vendor/application-status', { replace: true }) }, [role, navigate])
  return (
    <LoginForm
      red
      allowed={['vendor', 'applicant']}
      onSuccess={(role) => navigate(role === 'vendor' ? '/marketplace/vendor/dashboard' : '/marketplace/vendor/application-status', { replace: true })}
      title="Vendor sign in"
      subtitle="For approved vendors and vendor applicants."
      logo={<MarketLogo to="/marketplace/vendor" className="h-14" />}
      footer={<>New here? <Link to="/marketplace/vendor/apply" className="font-semibold text-mred-600">Apply to become a vendor</Link></>}
    />
  )
}
