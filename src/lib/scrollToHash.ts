/** Scrolls to #id safely. Supabase email links arrive as '#access_token=…', which is NOT a valid CSS selector. */
export function scrollToHash(hash: string): boolean {
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  if (!/^[A-Za-z][\w-]*$/.test(id)) return false
  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior: 'smooth' })
  return true
}
