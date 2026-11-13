// Muassasa kabineti uchun umumiy hisob-kitoblar (faqat shu papka ichida ishlatiladi).
import { useMemo } from 'react'
import * as A from '@/domain/amallar'
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import { useJoriy, mutNomi } from '@/shared/hooks'

export interface XodimQator {
  id: string // mehnat munosabati ID
  m: T.MehnatMunosabati
  s: T.Shaxs
  fio: string
  mut: string
  h: T.YillikHolat
  oldingi: T.YillikHolat
  foiz: number
  majburiyFoiz: number
  qarzdor: boolean
}

export const XAVF_TARTIB: T.YillikHolat['xavf'][] = ['bajarildi', 'yolda', 'xavf', 'qarzdor']
export const XAVF_RANG = ['#3ba776', '#1170a8', '#e8a33d', '#d1495b']
export const XAVF_NOM: Record<string, string> = { bajarildi: 'Talab bajarildi', yolda: 'Reja boʻyicha', xavf: 'Xavf ostida', qarzdor: 'Qarzdor' }

/** Muassasaning hozir ishlayotgan (tasdiqlangan mehnat munosabati bor) xodimlari va ularning yillik holati. */
export function xodimQatorlari(db: DB, muassasaId: string, yil: number, bugun: string): XodimQator[] {
  const korildi = new Set<string>()
  const natija: XodimQator[] = []
  for (const m of A.muassasaXodimlari(db, muassasaId, bugun)) {
    if (korildi.has(m.personId)) continue
    korildi.add(m.personId)
    const s = A.shaxs(db, m.personId)
    if (!s) continue
    const h = A.xodimYillik(db, s.id, yil, bugun)
    const oldingi = A.xodimYillik(db, s.id, yil - 1, bugun)
    natija.push({
      id: m.id, m, s, fio: A.toliqFio(s), mut: mutNomi(s.mutaxassislikId), h, oldingi,
      foiz: h.T ? Math.min(100, Math.round((h.X / h.T) * 100)) : 100,
      majburiyFoiz: h.majburiyKerak ? Math.min(100, Math.round((h.majburiy / h.majburiyKerak) * 100)) : 100,
      // qarzdor: joriy yil yakunlangan va bajarilmagan YOKI oʻtgan yil talabi bajarilmagan (va oʻtgan yilda talab boʻlgan)
      qarzdor: h.xavf === 'qarzdor' || (oldingi.T > 0 && oldingi.natija === 'yetishmaydi'),
    })
  }
  return natija
}

export function useMuassasa() {
  const j = useJoriy()
  const mid = j.user.muassasaId ?? ''
  const muassasa = j.db.muassasalar.find((m) => m.id === mid)
  const qatorlar = useMemo(() => xodimQatorlari(j.db, mid, j.yil, j.bugun), [j.db, mid, j.yil, j.bugun])
  return { ...j, mid, muassasa, qatorlar }
}

export function statistika(q: XodimQator[]) {
  const n = q.length
  const by = (x: T.YillikHolat['xavf']) => q.filter((r) => r.h.xavf === x).length
  return {
    n,
    bajarildi: by('bajarildi'),
    yolda: by('yolda'),
    xavf: by('xavf'),
    qarzdorHolat: by('qarzdor'),
    qarzdor: q.filter((r) => r.qarzdor).length,
    ortacha: n ? Math.round(q.reduce((a, r) => a + r.foiz, 0) / n) : 0,
  }
}

/** Kesim boʻyicha holatlar taqsimoti (BarCh uchun) */
export function kesim(q: XodimQator[], kalit: (r: XodimQator) => string) {
  const map = new Map<string, Record<string, number | string>>()
  for (const r of q) {
    const k = kalit(r)
    const o = map.get(k) ?? { x: k, bajarildi: 0, yolda: 0, xavf: 0, qarzdor: 0 }
    o[r.h.xavf] = (o[r.h.xavf] as number) + 1
    map.set(k, o)
  }
  return Array.from(map.values()).sort((a, b) => String(a.x).localeCompare(String(b.x)))
}

/** Katalogdagi ochiq oqimlar va tanlangan xodimlardan qanchasiga mosligi */
export function mosOqimlar(db: DB, personIds: string[], bugun: string) {
  const shaxslar = personIds.map((p) => A.shaxs(db, p)).filter(Boolean) as T.Shaxs[]
  return db.oqimlar
    .filter((o) => A.katalogdami(db, o, bugun))
    .map((o) => {
      const v = A.versiya(db, o.versiyaId)!
      const mos = shaxslar.filter((s) => A.mosmi(db, s, v).ok).map((s) => s.id)
      return { o, v, p: A.provayder(db, o.providerId), mos, bosh: o.orinlar - A.bandOrinlar(db, o.id) }
    })
    .filter((x) => x.mos.length > 0)
    .sort((a, b) => b.mos.length - a.mos.length || a.o.boshlanish.localeCompare(b.o.boshlanish))
}
