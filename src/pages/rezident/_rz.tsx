// Rezident kabineti — umumiy hook va yordamchilar
import { useMemo } from 'react'
import * as A from '@/domain/amallar'
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import { useJoriy } from '@/shared/hooks'
import { Card, Empty } from '@/ui'

export function logbookFoizi(h: ReturnType<typeof A.logbookHolati>) {
  const min = h.reduce((a, k) => a + k.minimal, 0)
  const bor = h.reduce((a, k) => a + Math.min(k.tasdiqlangan, k.minimal), 0)
  return min ? Math.round((bor / min) * 100) : 0
}

export function bazaNomi(db: DB, id: string) {
  return db.klinikBazalar.find((b) => b.id === id)?.nomi ?? id
}

/** Rejadagi baholash bosqichlari: rotatsiya yakunida joriy, har yarim yilda oraliq, oxirida yakuniy */
export function baholashBosqichlari(r: T.Rezident, rot: T.Rotatsiya[], baholar: T.RezidentBaho[]) {
  const b: { sana: string; turi: T.RezidentBaho['turi']; nomi: string; bajarildi: boolean }[] = []
  rot.forEach((x) => b.push({ sana: x.gacha, turi: 'joriy', nomi: `Joriy baholash: ${x.bolim}`, bajarildi: x.holat === 'yakunlangan' }))
  const bosh = new Date(r.boshlangan + 'T12:00:00')
  const tug = new Date(r.tugash + 'T12:00:00')
  for (let d = new Date(bosh); d < tug; d.setMonth(d.getMonth() + 6)) {
    const s = new Date(d)
    s.setMonth(s.getMonth() + 6)
    if (s >= tug) break
    const sana = s.toISOString().slice(0, 10)
    b.push({ sana, turi: 'oraliq', nomi: 'Oraliq attestatsiya (yarim yil)', bajarildi: baholar.some((x) => x.turi === 'oraliq' && Math.abs(new Date(x.sana).getTime() - s.getTime()) < 100 * 86400000) || sana < new Date().toISOString().slice(0, 10) })
  }
  b.push({ sana: r.tugash, turi: 'yakuniy', nomi: 'Yakuniy davlat attestatsiyasi', bajarildi: baholar.some((x) => x.turi === 'yakuniy') })
  return b.sort((a, c) => a.sana.localeCompare(c.sana))
}

export function useRezident() {
  const j = useJoriy()
  const { db, user } = j
  const r = db.rezidentlar.find((x) => x.personId === user.personId)
  return useMemo(() => {
    if (!r) return { ...j, r: undefined }
    const s = A.shaxs(db, r.personId)!
    const rot = db.rotatsiyalar.filter((x) => x.rezidentId === r.id).sort((a, b) => a.dan.localeCompare(b.dan))
    const baholar = db.rezidentBaholar.filter((x) => x.rezidentId === r.id).sort((a, b) => a.sana.localeCompare(b.sana))
    const lh = A.logbookHolati(db, r.id)
    const att = A.attestatsiyagaRuxsat(db, r.id)
    const yozuvlar = db.logbook.filter((l) => l.rezidentId === r.id)
    const rahbar = db.foydalanuvchilar.find((u) => u.id === r.rahbarId)
    return { ...j, r, s, rot, baholar, lh, att, yozuvlar, rahbar, joriyRot: rot.find((x) => x.holat === 'davom'), lFoiz: logbookFoizi(lh) }
  }, [j, db, r])
}

export function RezidentYoq() {
  return <Card><Empty title="Rezident profili topilmadi">Rezidentura buyrugʻi Reestrga tushgach profil avtomatik ochiladi. Muammo boʻlsa, UKR markaziga murojaat qiling.</Empty></Card>
}
