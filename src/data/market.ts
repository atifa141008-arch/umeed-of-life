export const defaultCategories = [
  { slug: 'fashion', name: 'Fashion', description: 'Clothing and accessories' },
  { slug: 'electronics', name: 'Electronics', description: 'Mobiles and gadgets' },
  { slug: 'home-living', name: 'Home & Living', description: 'Furniture and home decor' },
  { slug: 'beauty-health', name: 'Beauty & Health', description: 'Beauty and personal care' },
  { slug: 'bags-luggage', name: 'Bags & Luggage', description: 'Bags, wallets and travel' },
  { slug: 'sports-outdoors', name: 'Sports & Outdoors', description: 'Fitness and outdoor gear' },
  { slug: 'baby-kids', name: 'Baby & Kids', description: 'Products for little ones' },
  { slug: 'books-stationery', name: 'Books & Stationery', description: 'Books and learning' },
]

const EMOJI: Record<string, string> = {
  fashion: '👗', electronics: '📱', 'home-living': '🛋️', 'beauty-health': '💄',
  'bags-luggage': '🎒', 'sports-outdoors': '⚽', 'baby-kids': '🧸', 'books-stationery': '📚',
}
export const catEmoji = (slug: string) => EMOJI[slug] ?? '🛍️'
