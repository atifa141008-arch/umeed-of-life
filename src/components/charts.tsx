import { useEffect, useState } from 'react'

const useReady = () => {
  const [r, setR] = useState(false)
  useEffect(() => { const t = setTimeout(() => setR(true), 60); return () => clearTimeout(t) }, [])
  return r
}
export const fmt = (n: number) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n)))

/** Animated area/line chart with hover tooltip. */
export function AreaChart({ data, color = '#157043', money }: { data: { label: string; value: number }[]; color?: string; money?: boolean }) {
  const ready = useReady()
  const [hover, setHover] = useState<number | null>(null)
  const W = 640, H = 240, P = { l: 44, r: 12, t: 14, b: 28 }
  const max = Math.max(1, ...data.map((d) => d.value))
  const nice = Math.ceil(max / 4) * 4 || 4
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / Math.max(1, data.length - 1)
  const y = (v: number) => P.t + (1 - v / nice) * (H - P.t - P.b)
  const pts = data.map((d, i) => [x(i), y(d.value)] as const)
  const line = pts.map(([a, b], i) => {
    if (i === 0) return `M${a},${b}`
    const [pa, pb] = pts[i - 1]; const cx = (pa + a) / 2
    return `C${cx},${pb} ${cx},${b} ${a},${b}`
  }).join(' ')
  const area = `${line} L${x(data.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`
  const gid = 'g' + color.replace('#', '')
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(data.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (data.length - 1))))) }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
          <clipPath id={gid + 'c'}><rect x="0" y="0" width={W} height={H} style={{ transformBox: 'fill-box', transformOrigin: 'left', transform: `scaleX(${ready ? 1 : 0})`, transition: 'transform 1.2s cubic-bezier(.22,1,.36,1)' }} /></clipPath>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => { const v = (nice * i) / 4; return (
          <g key={i}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="#e5e7eb" strokeDasharray="3 4" /><text x={P.l - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{fmt(v)}</text></g>
        ) })}
        {data.map((d, i) => (i % 2 === 0 || data.length < 8) && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#9ca3af">{d.label}</text>)}
        <g clipPath={`url(#${gid}c)`}>
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          {pts.map(([a, b], i) => <circle key={i} cx={a} cy={b} r={hover === i ? 5 : 3} fill="#fff" stroke={color} strokeWidth="2" />)}
        </g>
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke={color} strokeOpacity=".3" />}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-xl bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg" style={{ left: `${(x(hover) / W) * 100}%`, top: 0 }}>
          <b>{money ? 'PKR ' : ''}{data[hover].value.toLocaleString()}</b><span className="ml-2 text-gray-300">{data[hover].label}</span>
        </div>
      )}
    </div>
  )
}

/** Horizontal bars that grow in. */
export function BarList({ items, money }: { items: { name: string; value: number }[]; money?: boolean }) {
  const ready = useReady()
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="space-y-4">
      {items.map((it, i) => (
        <li key={it.name}>
          <div className="flex items-baseline justify-between text-sm"><span className="truncate font-medium text-gray-800">{it.name}</span><span className="ml-3 shrink-0 text-gray-500">{money ? 'PKR ' : ''}{Number(it.value).toLocaleString()}</span></div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-gold-500" style={{ width: ready ? `${(it.value / max) * 100}%` : '0%', transition: `width 1s cubic-bezier(.22,1,.36,1) ${i * 120}ms` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Donut with animated segments + legend. */
export function Donut({ data, centre }: { data: { label: string; value: number; color: string }[]; centre?: string }) {
  const ready = useReady()
  const total = data.reduce((s, d) => s + d.value, 0)
  const R = 62, C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="#f1f3f2" strokeWidth="20" />
        {total > 0 && data.filter((d) => d.value > 0).map((d, i) => {
          const len = (d.value / total) * C; const off = -acc; acc += len
          return <circle key={d.label} cx="80" cy="80" r={R} fill="none" stroke={d.color} strokeWidth="20" strokeDasharray={`${ready ? Math.max(len - 2, 0) : 0} ${C}`} strokeDashoffset={off}
            style={{ transition: `stroke-dasharray 1s cubic-bezier(.22,1,.36,1) ${i * 150}ms` }} />
        })}
        <g className="rotate-90" style={{ transformOrigin: '80px 80px' }}>
          <text x="80" y="78" textAnchor="middle" fontSize="22" fontWeight="700" fill="#14201a">{total}</text>
          <text x="80" y="95" textAnchor="middle" fontSize="9" fill="#9ca3af">{centre ?? 'total'}</text>
        </g>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d) => <li key={d.label} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: d.color }} />{d.label}</span><b>{d.value}</b></li>)}
      </ul>
    </div>
  )
}
