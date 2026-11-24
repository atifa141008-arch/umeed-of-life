import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/usePageTitle'

export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <div className="container-x py-28 text-center">
      <p className="font-display text-8xl font-bold text-gold-500">404</p>
      <h1 className="mt-2 text-3xl font-bold text-brand-900">Page not found</h1>
      <p className="mt-3 text-gray-600">The page you are looking for does not exist or has moved.</p>
      <div className="mt-6 flex justify-center gap-3"><Link to="/" className="btn-primary">Back to Home</Link><Link to="/marketplace" className="btn-outline">Marketplace</Link></div>
    </div>
  )
}
