// Vazirlik monitoringi uchun yigʻma hisob-kitoblar (faqat oʻqish). Shaxs darajasidagi maʼlumot sahifalarga chiqarilmaydi.
import { useMemo } from 'react'
import * as A from '@/domain/amallar'
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import { MUTAXASSISLIKLAR } from '@/domain/malumotnoma'

export interface Filtr { hudud: string; mut: string; daraja: string; turi: string; yil: number }
export const BOSH_FILTR = (yil: number): Filtr => ({ hudud: '', mut: '', daraja: '', turi: '', yil })

export interface ShaxsQator {
  s: T.Shaxs
  mu?: T.Muassasa
  hudud: string
  turi: string
  h: T.YillikHolat
  oldingi: T.YillikHolat
  ukr: boolean // UKR hisobi bor (kredit yozuvi yoki kursga yozilish)
  qarzdor: boolean
}

/** Reestrdagi xodimlar: faol mehnat munosabati bor shaxslar (maxraj). */
export function shaxsQatorlari(db: DB, yil: number, bugun: string): ShaxsQator[] {
  const ukr = new Set<string>([...db.jurnal.map((j) => j.personId), ...db.yozilishlar.map((y) => y.personId)])
  const out: ShaxsQator[] = []
  for (const s of db.shaxslar) {
    const ms = db.mehnat.filter((m) => m.personId === s.id && (!m.gacha || m.gacha >= bugun))
    if (!ms.length) continue
    const asosiy = ms.find((m) => m.asosiy) ?? ms[0]
    const mu = db.muassasalar.find((m) => m.id === asosiy.muassasaId)
    const h = A.xodimYillik(db, s.id, yil, bugun)
    const oldingi = A.xodimYillik(db, s.id, yil - 1, bugun)
    out.push({ s, mu, hudud: mu?.hududId ?? s.hududId, turi: mu?.turi ?? '—', h, oldingi, ukr: ukr.has(s.id), qarzdor: h.xavf === 'qarzdor' || (oldingi.T > 0 && oldingi.natija === 'yetishmaydi') })
  }
  return out
}

export function useShaxslar(db: DB, yil: number, bugun: string) {
  return useMemo(() => shaxsQatorlari(db, yil, bugun), [db, yil, bugun])
}

export function filtrla(q: ShaxsQator[], f: Filtr) {
  return q.filter((r) => (!f.hudud || r.hudud === f.hudud) && (!f.mut || r.s.mutaxassislikId === f.mut) && (!f.daraja || r.s.daraja === f.daraja) && (!f.turi || r.turi === f.turi))
}

export function yigma(q: ShaxsQator[]) {
  const n = q.length
  const by = (x: string) => q.filter((r) => r.h.xavf === x).length
  return {
    n,
    ukr: q.filter((r) => r.ukr).length,
    bajarildi: by('bajarildi'),
    yolda: by('yolda'),
    xavf: by('xavf'),
    qarzdorHolat: by('qarzdor'),
    qarzdor: q.filter((r) => r.qarzdor).length,
    kredit: Math.round(q.reduce((a, r) => a + r.h.X, 0)),
  }
}

export const ulush = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0)

/** Kesim boʻyicha yigʻma (hudud, mutaxassislik, muassasa) */
export function guruhla(q: ShaxsQator[], kalit: (r: ShaxsQator) => string) {
  const m = new Map<string, ShaxsQator[]>()
  q.forEach((r) => m.set(kalit(r), [...(m.get(kalit(r)) ?? []), r]))
  return m
}

/** Oqim sanasi yil ichida va filtrga mos (hudud) */
export function yilOqimlari(db: DB, f: Filtr) {
  return db.oqimlar.filter((o) => o.boshlanish.slice(0, 4) === String(f.yil) && (!f.hudud || o.hududId === f.hudud) && o.holat !== 'qoralama' && o.holat !== 'bekor')
}

export const TINGLOVCHI_HOLAT: T.YozilishHolat[] = ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi']

export function mutNomlari() {
  return MUTAXASSISLIKLAR.map((m) => ({ v: m.id, l: m.nomi }))
}

export function oxirgiYangilanish(db: DB) {
  return db.shaxslar.map((s) => s.reestrYangilangan).sort().pop() ?? new Date().toISOString()
}

export const OY = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
