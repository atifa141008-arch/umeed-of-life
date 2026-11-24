import { Link } from 'react-router-dom'

export default function Logo({ className = 'h-14' }: { className?: string }) {
  return (
    <Link to="/" aria-label="Umeed of Life — Home">
      {/* mix-blend-multiply hides the logo's light-grey background on white */}
      <img
        src="/images/umeed-logo.jpg"
        alt="Umeed of Life — Official Logo"
        className={`${className} w-auto mix-blend-multiply`}
      />
    </Link>
  )
}
