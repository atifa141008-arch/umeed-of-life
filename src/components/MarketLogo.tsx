import { useState } from 'react'
import { Link } from 'react-router-dom'

/** Put your marketplace logo at public/images/umeed-marketplace-logo.png — a text logo shows until then. */
export default function MarketLogo({ to = '/marketplace', className = 'h-12' }: { to?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <Link to={to} aria-label="Umeed Marketplace">
      {failed ? (
        <span className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mred-600 font-display text-xl font-bold text-white">U</span>
          <span className="font-display text-xl font-bold leading-none text-ink">Umeed <span className="text-mred-600">Marketplace</span></span>
        </span>
      ) : (
        <img src="/images/umeed-marketplace-logo.png" alt="Umeed Marketplace" className={`${className} w-auto`} onError={() => setFailed(true)} />
      )}
    </Link>
  )
}
