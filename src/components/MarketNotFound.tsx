import { Link } from 'react-router-dom'

export default function MarketNotFound({ home = '/marketplace', label = 'Back to Marketplace' }: { home?: string; label?: string }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="font-display text-8xl font-bold text-mred-600">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-gray-600">The page you are looking for does not exist or has moved.</p>
      <div className="mt-6 flex justify-center gap-3"><Link to={home} className="btn-red">{label}</Link><Link to="/" className="btn-red-outline">Umeed of Life</Link></div>
    </div>
  )
}
