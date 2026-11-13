// UKR markazi kabineti — umumiy yordamchilar (faqat markaz sahifalari uchun)
import './markaz.css'
import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useJoriy } from '@/shared/hooks'
import { QoidaXatosi, qisqaFio, type Ctx } from '@/domain/amallar'
import type { DB } from '@/domain/db'
import { Badge, Button } from '@/ui'

/** Joriy foydalanuvchi + rollar + xatoni qaytaradigan ijro. */
export function useMarkaz() {
  const j = useJoriy()
  const rahbar = j.user.rol === 'markaz_rahbar'
  const mutaxassis = j.user.rol === 'markaz_mutaxassis'
  /** amalX ustida: natija yoki xato matnini qaytaradi; xatoda toast chiqaradi. */
  function ijro<A extends unknown[], R>(fn: (db: DB, ctx: Ctx, ...args: A) => R, ...args: A): { ok: boolean; r?: R; xato?: string } {
    try {
      return { ok: true, r: j.amalX(fn, ...args) }
    } catch (e) {
      if (e instanceof QoidaXatosi) {
        j.toast({ turi: 'err', sarlavha: e.kod === 403 ? 'Ruxsat yoʻq (403)' : e.kod === 409 ? 'Takror (409)' : 'Tekshiruvdan oʻtmadi', matn: e.message })
        return { ok: false, xato: `${e.kod}: ${e.message}` }
      }
      return { ok: false, xato: String((e as Error).message ?? e) }
    }
  }
  const ok = (matn: string, sarlavha?: string) => j.toast({ turi: 'ok', matn, sarlavha })
  return { ...j, rahbar, mutaxassis, ijro, ok }
}

export const MUT_SABAB = 'Bu amal UKR markazi mutaxassisi vakolatida (tayyorlaydi va taklif qiladi).'
export const RAH_SABAB = 'Bu amal faqat qaror qabul qiluvchi (markaz rahbari) vakolatida.'

/** Ish kunlarida qolgan muddat (manfiy — kechikkan). */
export function ishKunlari(bugun: string, muddat: string | undefined, bayramlar: string[]) {
  if (!muddat) return undefined
  const a = new Date(bugun.slice(0, 10) + 'T12:00:00')
  const b = new Date(muddat.slice(0, 10) + 'T12:00:00')
  const ishora = b >= a ? 1 : -1
  const d = new Date(a)
  let n = 0
  let xavfsiz = 0
  while ((ishora > 0 ? d < b : d > b) && xavfsiz++ < 2000) {
    d.setDate(d.getDate() + ishora)
    const w = d.getDay()
    const s = d.toISOString().slice(0, 10)
    if (w !== 0 && w !== 6 && !bayramlar.includes(s)) n++
  }
  return n * ishora
}

export function MuddatBadge({ muddat, toxtatilgan, yopiq }: { muddat?: string; toxtatilgan?: boolean; yopiq?: boolean }) {
  const { db, bugun } = useJoriy()
  if (!muddat) return <span className="muted">—</span>
  if (yopiq) return <Badge ton="muted">{muddat.slice(0, 10).split('-').reverse().join('.')}</Badge>
  if (toxtatilgan) return <Badge ton="muted">⏸ Muddat toʻxtatilgan</Badge>
  const n = ishKunlari(bugun, muddat, db.sozlamalar.bayramlar)!
  if (n < 0) return <Badge ton="err">Kechikkan: {-n} ish kuni</Badge>
  if (n === 0) return <Badge ton="err">Bugun tugaydi</Badge>
  if (n <= 2) return <Badge ton="warn">{n} ish kuni qoldi</Badge>
  return <Badge ton="info">{n} ish kuni</Badge>
}

/** Rol yoki ikki shaxs qoidasi boʻyicha bloklanadigan tugma: disabled + sabab. */
export function RolTugma({ ruxsat, sabab, children, ...p }: Parameters<typeof Button>[0] & { ruxsat: boolean; sabab: string }) {
  if (ruxsat) return <Button {...p}>{children}</Button>
  return (
    <span title={sabab} style={{ display: 'inline-flex' }}>
      <Button {...p} disabled icon={<Lock />} onClick={undefined}>
        {children}
      </Button>
    </span>
  )
}

export function Qulf({ children }: { children: ReactNode }) {
  return (
    <div className="mk-lock">
      <Lock />
      <span>{children}</span>
    </div>
  )
}

export const userFio = (db: DB, id?: string) => db.foydalanuvchilar.find((u) => u.id === id)?.fio ?? (id ? id : '—')
export const userQisqa = (db: DB, id?: string) => {
  const f = userFio(db, id)
  const q = f.split(' ')
  return q.length >= 2 && !f.includes('administratori') ? `${q[0]} ${q[1][0]}.` : f
}
export const shaxsQisqa = (db: DB, pid?: string) => {
  const s = db.shaxslar.find((x) => x.id === pid)
  return s ? qisqaFio(s) : '—'
}
export const provQisqa = (db: DB, pid?: string) => db.provayderlar.find((p) => p.id === pid)?.qisqa ?? '—'

export function manba(nomi: string) {
  const d = new Date()
  return `Manba: ${nomi} · yangilangan: ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function Sec({ icon, title, right, children }: { icon?: ReactNode; title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="mk-sec">
      <h3>
        {icon}
        <span className="grow">{title}</span>
        {right}
      </h3>
      {children}
    </div>
  )
}
