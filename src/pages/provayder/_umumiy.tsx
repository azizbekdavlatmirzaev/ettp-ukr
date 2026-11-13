// Provayder kabineti uchun umumiy yordamchilar (faqat shu papka ichida ishlatiladi).
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useJoriy } from '@/shared/hooks'
import * as A from '@/domain/amallar'
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import { sanaVaqt } from '@/lib/format'

/** Joriy provayder va uning maʼlumotlari (faqat oʻz tashkiloti — user.providerId). */
export function useProv() {
  const j = useJoriy()
  const { db, user } = j
  const p = A.provayder(db, user.providerId)!
  const d = useMemo(() => {
    const dasturlar = db.dasturlar.filter((x) => x.providerId === user.providerId)
    const oqimlar = db.oqimlar.filter((o) => o.providerId === user.providerId)
    const oqimIds = new Set(oqimlar.map((o) => o.id))
    const yozilishlar = db.yozilishlar.filter((y) => oqimIds.has(y.oqimId))
    const yIds = new Set(yozilishlar.map((y) => y.id))
    const natijalar = db.natijalar.filter((n) => yIds.has(n.yozilishId))
    const versiyalar = db.versiyalar.filter((v) => dasturlar.some((ds) => ds.id === v.dasturId))
    return { dasturlar, oqimlar, yozilishlar, natijalar, versiyalar }
  }, [db, user.providerId])
  return { ...j, p, ...d, operator: user.rol === 'provayder_operator', rahbar: user.rol === 'provayder_rahbar' }
}

export const oxirgiVersiya = (db: DB, ds: T.Dastur) => A.versiya(db, ds.versiyalar[ds.versiyalar.length - 1])!

/** «Manba: … · yangilangan: …» satri */
export const manba = (m = 'ETTP–UKR maʼlumotlar bazasi') => `Manba: ${m} · yangilangan: ${sanaVaqt(new Date().toISOString())}`

export const BAHO_TURLARI: { v: T.BaholashTuri; l: string }[] = [
  { v: 'test', l: 'Test' },
  { v: 'amaliy', l: 'Amaliy koʻnikma' },
  { v: 'vaziyatli', l: 'Vaziyatli masala' },
  { v: 'OSKE', l: 'OSKE' },
  { v: 'suhbat', l: 'Suhbat' },
]

/** Rol sababli yopiq tugma yonidagi izoh */
export function Yopiq({ children }: { children: ReactNode }) {
  return (
    <span className="xs muted row gap-4" style={{ display: 'inline-flex' }}>
      <Lock size={12} /> {children}
    </span>
  )
}

export const uuid = () => {
  try {
    return crypto.randomUUID()
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}

export const STEP_AKK = ['Qoralama', 'Yuborildi', 'Toʻliqlik', 'Kamchilik', 'Ekspertiza', 'Joyida', 'Komissiya', 'Qaror', 'Yakunlandi']
export const AKK_IDX: Record<T.AkkArizaHolat, number> = { qoralama: 0, yuborildi: 1, toliqlik: 2, kamchilik: 3, ekspertiza: 4, joyida: 5, komissiya: 6, qaror: 7, yakunlandi: 8 }
export const AKK_TURI: Record<string, string> = { provayder: 'Provayder akkreditatsiyasi', dastur: 'Dastur akkreditatsiyasi', qayta: 'Qayta akkreditatsiya' }
export const QAROR_TURI: Record<string, string> = { akkreditatsiya: 'Akkreditatsiya berildi', shartli: 'Shartli akkreditatsiya', rad: 'Rad etildi', qoshimcha: 'Qoʻshimcha tekshiruv' }
