const OYLAR = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']
export const OY_QISQA = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

export function sana(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s.length === 10 ? s + 'T12:00:00' : s)
  if (Number.isNaN(d.getTime())) return s
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}
export function sanaVaqt(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return `${sana(s)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
export function sanaUzun(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s.length === 10 ? s + 'T12:00:00' : s)
  return `${d.getDate()}-${OYLAR[d.getMonth()]} ${d.getFullYear()}`
}
export function nisbiy(s: string) {
  const d = (Date.now() - new Date(s).getTime()) / 1000
  if (d < 60) return 'hozirgina'
  if (d < 3600) return `${Math.floor(d / 60)} daqiqa oldin`
  if (d < 86400) return `${Math.floor(d / 3600)} soat oldin`
  if (d < 86400 * 2) return 'kecha'
  if (d < 86400 * 30) return `${Math.floor(d / 86400)} kun oldin`
  return sana(s)
}
export function son(n: number | undefined | null, kasr = 0) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  return n.toLocaleString('ru-RU', { minimumFractionDigits: kasr, maximumFractionDigits: kasr }).replace(/,/g, '.')
}
export function pul(n: number) {
  return n ? `${son(n)} soʻm` : 'Bepul'
}
export function foiz(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0
}
export function kunFarq(a: string, b: string = new Date().toISOString()) {
  return Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000)
}
export function bugun() {
  return new Date().toISOString().slice(0, 10)
}
export function yilHozir() {
  return new Date().getFullYear()
}
export function bosh(s: string) {
  return s.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()
}
export function hajm(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}
/** Ochiq sahifalar uchun JSHSHIR niqoblash */
export function niqob(j: string) {
  return j.slice(0, 2) + '•'.repeat(8) + j.slice(-4)
}
