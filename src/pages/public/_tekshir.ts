import type { DB } from '@/domain/db'
import type { Sertifikat, YillikHisobotNusxa } from '@/domain/types'
import * as A from '@/domain/amallar'

export type Natija =
  | { tur: 'sert'; s: Sertifikat; ozgarish?: string }
  | { tur: 'hisobot'; h: YillikHisobotNusxa; fio: string }
  | { tur: 'yoq'; kalit: string }

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** QR havola, QR kalit, «UKR 2026-000123» yoki «hisobot-…» boʻyicha qidirish */
export function kalitAjrat(kirish: string) {
  let k = kirish.trim()
  const i = k.indexOf('/tekshirish/')
  if (i >= 0) k = k.slice(i + '/tekshirish/'.length)
  try { k = decodeURIComponent(k) } catch { /* */ }
  return k.trim()
}

export function izla(db: DB, kirish: string): Natija {
  const k = kalitAjrat(kirish)
  if (k.toLowerCase().startsWith('hisobot-')) {
    const qr = k.slice(8).toLowerCase()
    const h = db.yillikHisobotlar.find((x) => x.qr.toLowerCase() === qr)
    const sh = h && A.shaxs(db, h.personId)
    if (h && sh) return { tur: 'hisobot', h, fio: A.qisqaFio(sh) }
    return { tur: 'yoq', kalit: k }
  }
  const n = norm(k)
  const s = db.sertifikatlar.find((x) => x.qrKalit.toLowerCase() === k.toLowerCase() || norm(`${x.seriya}${x.raqam}`) === n)
  if (!s || s.holat === 'tayyorlanmoqda') return { tur: 'yoq', kalit: k }
  // bekor qilish/tuzatish sanasi — kredit jurnalidagi tuzatuvchi yozuvdan (tarix saqlanadi)
  const t = db.jurnal.filter((j) => j.sertifikatId === s.id && j.manba === 'tuzatish').sort((a, b) => b.sana.localeCompare(a.sana))[0]
  return { tur: 'sert', s, ozgarish: t?.sana }
}

export function demoKalitlar(db: DB) {
  const haqiqiy = db.sertifikatlar.find((s) => s.holat === 'amalda' && s.personId === 'SH-ANVAR' && s.sana.startsWith('2026')) ?? db.sertifikatlar.find((s) => s.holat === 'amalda')
  const bekor = db.sertifikatlar.find((s) => s.holat === 'bekor_qilingan') ?? db.sertifikatlar.find((s) => s.holat === 'tuzatilgan')
  return { haqiqiy, bekor }
}

export const HUJJAT_NOMI: Record<string, string> = {
  UKR: 'UKR sertifikati', DIPLOM: 'Rezidentura diplomi', PSV: 'PSV hisoboti', KOMPETENSIYA: 'Kompetensiya sertifikati',
}
