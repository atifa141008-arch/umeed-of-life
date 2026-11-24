export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/departments', label: 'Departments' },
  { to: '/impact', label: 'Our Impact' },
  { to: '/careers', label: 'Careers' },
  { to: '/news', label: 'News' },
  { to: '/contact', label: 'Contact' },
]

export type Department = {
  slug: string
  name: string
  short: string
  description: string
  status: string
  icon: string
  badge: string     // status pill
  dot: string       // icon circle
  gradient: string  // soft hero gradient
  planned: string[]
}

// Marketplace is always first. Edit this list to add / rename departments.
export const departments: Department[] = [
  {
    slug: 'marketplace', name: 'Umeed Marketplace', icon: 'store', status: 'Now open',
    short: 'A trusted multi-vendor marketplace where businesses and customers connect, discover and grow together.',
    description: 'A multi-vendor platform where approved sellers list products and customers shop from them in one place.',
    badge: 'bg-green-100 text-green-800', dot: 'bg-orange-100 text-red-600', gradient: 'from-orange-50 to-red-50',
    planned: ['Browse products from approved vendors', 'Secure checkout and order tracking', 'Vendor dashboard for products, orders and statements'],
  },
  {
    slug: 'essentials', name: 'Umeed Essentials', icon: 'package', status: 'Coming Soon',
    short: 'Quality products created and supplied through Umeed of Life for customers and entrepreneurs.',
    description: 'Umeed-owned products with direct selling, inventory and supplier operations.',
    badge: 'bg-pink-100 text-pink-800', dot: 'bg-pink-100 text-pink-600', gradient: 'from-pink-50 to-rose-50',
    planned: ['Umeed-owned product range', 'Supplier and inventory management', 'Direct selling to customers'],
  },
  {
    slug: 'care', name: 'Umeed Care', icon: 'heart', status: 'Coming Soon',
    short: 'Creating hope through welfare, assistance, donations and meaningful community support.',
    description: 'Verified community assistance and transparent donation projects.',
    badge: 'bg-green-100 text-green-800', dot: 'bg-green-100 text-green-700', gradient: 'from-green-50 to-emerald-50',
    planned: ['Verified assistance requests', 'Transparent donation projects', 'Volunteer coordination'],
  },
  {
    slug: 'workhub', name: 'Umeed WorkHub', icon: 'briefcase', status: 'Coming Soon',
    short: 'Connecting talented people with internships, careers, companies and opportunities.',
    description: 'Jobs, internships and opportunity listings from verified employers.',
    badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-100 text-blue-600', gradient: 'from-blue-50 to-sky-50',
    planned: ['Job and internship listings', 'Employer verification', 'Simple applications for candidates'],
  },
  {
    slug: 'global', name: 'Umeed Global', icon: 'globe', status: 'Coming Soon',
    short: 'Connecting Pakistan with the world through digital services, products and cargo solutions.',
    description: 'International sourcing, cross-border products, digital services and cargo coordination.',
    badge: 'bg-teal-100 text-teal-800', dot: 'bg-teal-100 text-teal-700', gradient: 'from-teal-50 to-cyan-50',
    planned: ['International sourcing', 'Cross-border products', 'Digital and cargo services'],
  },
]

export const values = [
  { title: 'Trust', icon: 'shield', text: 'Building reliable relationships with people and businesses.' },
  { title: 'Opportunity', icon: 'spark', text: 'Creating pathways for people to learn, work and grow.' },
  { title: 'Transparency', icon: 'eye', text: 'Keeping our operations accountable and clear.' },
  { title: 'Growth', icon: 'trend', text: 'Building a platform designed to evolve with its community.' },
]
