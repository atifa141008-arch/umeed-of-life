import { useEffect } from 'react'
export function usePageTitle(title?: string, suffix = 'Umeed of Life') {
  useEffect(() => { document.title = title ? `${title} · ${suffix}` : suffix }, [title, suffix])
}
