import type { DasturVersiya } from '@/domain/types'
import { MUTAXASSISLIKLAR } from '@/domain/malumotnoma'

export const IMG = (n: string) => `${import.meta.env.BASE_URL}img/${n}.jpg`

/** ETTP logotipi: ochiq kitob + tibbiy xoch + yurak urishi chizigʻi */
export function Logo({ size = 40, mono }: { size?: number; mono?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="ETTP logotipi">
      <defs>
        <linearGradient id="lg-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1170a8" />
          <stop offset="1" stopColor="#0fa3a3" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="13" fill={mono ? 'rgba(255,255,255,.12)' : 'url(#lg-a)'} />
      <path d="M10 15.5c4.6-1.6 9.2-1.2 14 1.4v19c-4.8-2.6-9.4-3-14-1.4z" fill="#fff" opacity=".95" />
      <path d="M38 15.5c-4.6-1.6-9.2-1.2-14 1.4v19c4.8-2.6 9.4-3 14-1.4z" fill="#fff" opacity=".78" />
      <path d="M21.4 9.5h5.2v4h4v5.2h-4v4h-5.2v-4h-4v-5.2h4z" fill="#ffd27a" stroke="#0a3a5c" strokeWidth=".6" transform="translate(0 -3) scale(1)" />
      <path d="M8 31h7l2-4 3 8 3-11 2.6 7H40" fill="none" stroke="#0a3a5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
    </svg>
  )
}

export function EKG({ className, color = '#fff', width = 1200, height = 60 }: { className?: string; color?: string; width?: number; height?: number }) {
  const d = `M0 ${height / 2} H${width * 0.18} l12 -6 l10 6 h${width * 0.04} l8 -${height * 0.42} l9 ${height * 0.78} l8 -${height * 0.5} l6 ${height * 0.14} H${width * 0.55} l10 -8 l12 8 h${width * 0.05} l7 -${height * 0.35} l8 ${height * 0.62} l7 -${height * 0.38} l5 ${height * 0.11} H${width}`
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** Molekula/hujayra naqshi — fon uchun */
export function Molekula({ className, opacity = 0.18 }: { className?: string; opacity?: number }) {
  const n = [
    [40, 40], [110, 20], [170, 70], [120, 110], [60, 120], [200, 140], [250, 60], [290, 120], [230, 190], [150, 180],
  ]
  const e = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 6], [6, 7], [7, 5], [5, 3], [5, 8], [8, 9], [9, 3]]
  return (
    <svg className={className} viewBox="0 0 320 220" style={{ opacity }}>
      {e.map(([a, b], i) => (
        <line key={i} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} stroke="currentColor" strokeWidth="1.4" />
      ))}
      {n.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 7 : 4.5} fill="currentColor" />
      ))}
    </svg>
  )
}

const GURUH_RASM: Record<string, string[]> = {
  Terapevtik: ['kardio', 'stetoskop', 'shifokor', 'portret'],
  Pediatrik: ['pediatriya', 'birlamchi'],
  Jarrohlik: ['jarrohlik', 'jamoa'],
  Shoshilinch: ['shoshilinch', 'jamoa'],
  Birlamchi: ['birlamchi', 'pediatriya', 'stetoskop'],
  Diagnostik: ['diagnostika', 'lab2'],
  Stomatologik: ['stomatologiya'],
  Farmatsevtik: ['farmatsiya', 'lab2'],
  'Oʻrta tibbiy': ['hamshira', 'laboratoriya', 'mobil'],
}

const xesh = (s: string) => Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

export function kursRasmi(v: Pick<DasturVersiya, 'mutaxassisliklar' | 'shakl' | 'tadbirTuri' | 'nomi' | 'tinglovchi'>) {
  const n = v.nomi.toLowerCase()
  if (n.includes('insult') || n.includes('nevro')) return IMG('nevrologiya')
  if (n.includes('laborator')) return IMG('laboratoriya')
  if (n.includes('kt ') || n.includes('rentgen') || n.includes('ultratovush') || n.includes('ultrasound') || n.includes('exokg')) return IMG('diagnostika')
  if (v.tadbirTuri === 'konferensiya') return IMG('hero')
  if (v.tadbirTuri === 'mustaqil') return IMG('mobil')
  if (v.tadbirTuri === 'simulyatsiya') return IMG(n.includes('pals') || n.includes('chaqaloq') ? 'pediatriya' : n.includes('laparo') ? 'jarrohlik' : 'shoshilinch')
  if (v.shakl === 'onlayn') return IMG(xesh(n) % 2 ? 'onlayn' : 'mobil')
  const m = MUTAXASSISLIKLAR.find((x) => x.id === v.mutaxassisliklar[0])
  if (!m) return IMG(v.tinglovchi === 'orta' ? 'hamshira' : 'onlayn')
  const pool = GURUH_RASM[m.guruh] ?? ['stetoskop']
  return IMG(pool[xesh(n) % pool.length])
}
