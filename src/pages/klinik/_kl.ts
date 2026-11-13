import * as A from '@/domain/amallar'
import type { DB } from '@/domain/db'
import { logbookFoizi } from '../rezident/_rz'

/** Klinik rahbarga biriktirilgan rezidentlar (faqat oʻziniki) */
export function rezidentlarim(db: DB, userId: string) {
  return db.rezidentlar.filter((r) => r.rahbarId === userId).map((r) => {
    const s = A.shaxs(db, r.personId)!
    const lh = A.logbookHolati(db, r.id)
    const rot = db.rotatsiyalar.filter((x) => x.rezidentId === r.id).sort((a, b) => a.dan.localeCompare(b.dan))
    return {
      r, s, lh, rot,
      fio: A.toliqFio(s),
      qisqa: A.qisqaFio(s),
      foiz: logbookFoizi(lh),
      kutil: db.logbook.filter((l) => l.rezidentId === r.id && l.holat === 'kutilmoqda').length,
      joriy: rot.find((x) => x.holat === 'davom'),
      att: A.attestatsiyagaRuxsat(db, r.id),
    }
  })
}
export type RezInfo = ReturnType<typeof rezidentlarim>[number]
