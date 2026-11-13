import type { DB } from '@/domain/db'
import * as A from '@/domain/amallar'
import { HUDUDLAR, MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { OY_QISQA } from '@/lib/format'

export interface Guruh { nomi: string; n: number; bajardi: number; kredit: number }

/** Ochiq statistika — faqat yigʻma sonlar. Shaxs darajasidagi maʼlumot chiqmaydi. */
export function ochiqStat(db: DB, yil: number, bugun: string) {
  const faol = new Set(db.mehnat.filter((m) => !m.gacha || m.gacha >= bugun).map((m) => m.personId))
  const odamlar = db.shaxslar.filter((s) => faol.has(s.id)).map((s) => {
    const h = A.xodimYillik(db, s.id, yil, bugun)
    return { s, ok: h.natija === 'bajarildi', K: h.K }
  })
  const guruhla = (kalit: (x: (typeof odamlar)[number]) => string) => {
    const m = new Map<string, Guruh>()
    for (const x of odamlar) {
      const k = kalit(x)
      const g = m.get(k) ?? { nomi: k, n: 0, bajardi: 0, kredit: 0 }
      g.n++
      if (x.ok) g.bajardi++
      g.kredit += x.K
      m.set(k, g)
    }
    return Array.from(m.values()).sort((a, b) => b.n - a.n)
  }
  const hudud = guruhla((x) => HUDUDLAR.find((h) => h.id === x.s.hududId)?.nomi ?? '—')
  const mutGuruh = guruhla((x) => MUTAXASSISLIKLAR.find((m) => m.id === x.s.mutaxassislikId)?.guruh ?? '—')
  const daraja = guruhla((x) => (x.s.daraja === 'oliy' ? 'Oliy maʼlumotli' : 'Oʻrta maʼlumotli'))

  const sertYil = db.sertifikatlar.filter((s) => s.sana.startsWith(String(yil)) && s.holat !== 'tayyorlanmoqda')
  const oyGacha = bugun.startsWith(String(yil)) ? Number(bugun.slice(5, 7)) : 12
  const oylar = Array.from({ length: oyGacha }, (_, i) => {
    const k = `${yil}-${String(i + 1).padStart(2, '0')}`
    const sert = sertYil.filter((s) => s.sana.startsWith(k)).length
    const kredit = db.jurnal.filter((j) => j.yil === yil && j.sana.startsWith(k) && j.miqdor > 0 && j.manba !== 'otkazish').reduce((a, j) => a + j.miqdor, 0)
    return { x: OY_QISQA[i], sert, kredit }
  })
  const tanKredit = db.jurnal.filter((j) => j.manba === 'tan_olish' && j.yil === yil).reduce((a, j) => a + j.miqdor, 0)
  const tanSoni = db.tanOlish.filter((t) => t.holat === 'tasdiqlandi').length

  return {
    xodimlar: odamlar.length,
    reestrJami: db.shaxslar.length,
    bajardi: odamlar.filter((x) => x.ok).length,
    provayder: db.provayderlar.filter((p) => A.akkFaolmi(p)).length,
    dastur: db.versiyalar.filter((v) => v.holat === 'tasdiqlangan').length,
    sert: sertYil.length,
    tanKredit, tanSoni,
    hudud, mutGuruh, daraja, oylar,
  }
}
