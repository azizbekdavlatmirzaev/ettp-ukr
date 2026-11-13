// UKR markazi tayyor hisobotlari — sof funksiyalar (DB → jadval + grafik).
import type { DB } from '@/domain/db'
import * as A from '@/domain/amallar'
import { HUDUDLAR, MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { PROV_TURI, TADBIR, holat as holatMatn } from '@/lib/holat'
import { ishKunlari } from './_parts'

export type Qator = { id: string } & Record<string, string | number>
export interface Hisobot {
  id: string
  nomi: string
  desc: string
  ustunlar: { k: string; l: string; son?: boolean }[]
  rows: Qator[]
  grafik: { data: Record<string, string | number>[]; keys: string[]; names: Record<string, string> }
}

const guruh = <T,>(a: T[], k: (x: T) => string) => {
  const m = new Map<string, T[]>()
  a.forEach((x) => m.set(k(x), [...(m.get(k(x)) ?? []), x]))
  return m
}

export function hisobotlar(db: DB, yil: number, bugun: string): Hisobot[] {
  const jYil = db.jurnal.filter((j) => j.yil === yil)
  const shaxsi = (pid: string) => db.shaxslar.find((s) => s.id === pid)
  const kreditBoyicha = (kalit: (pid: string) => string, nom: (k: string) => string): Qator[] =>
    Array.from(guruh(jYil, (j) => kalit(j.personId)).entries()).map(([k, ys]) => ({ id: k, nomi: nom(k), xodimlar: new Set(ys.map((y) => y.personId)).size, yozuvlar: ys.length, kredit: Math.round(ys.reduce((s, y) => s + y.miqdor, 0) * 10) / 10 })).sort((a, b) => Number(b.kredit) - Number(a.kredit))

  const provRows: Qator[] = db.provayderlar.map((p) => ({ id: p.id, nomi: p.nomi, turi: PROV_TURI[p.turi], holat: holatMatn(p.holat)[0], qaror: p.qaror?.raqam ?? '—', muddat: p.qaror?.muddat ?? '—' }))
  const dastRows: Qator[] = db.versiyalar.filter((v) => v.holat === 'tasdiqlangan').map((v) => {
    const d = db.dasturlar.find((x) => x.id === v.dasturId)
    return { id: v.id, provayder: A.provayder(db, d?.providerId)?.qisqa ?? '—', nomi: v.nomi, tadbir: TADBIR[v.tadbirTuri], kredit: v.tasdiqlanganKredit ?? 0, muddat: v.amalMuddati ?? '—' }
  })
  const hudud = kreditBoyicha((pid) => shaxsi(pid)?.hududId ?? '—', (k) => HUDUDLAR.find((h) => h.id === k)?.nomi ?? k)
  const mut = kreditBoyicha((pid) => shaxsi(pid)?.mutaxassislikId ?? '—', (k) => MUTAXASSISLIKLAR.find((m) => m.id === k)?.nomi ?? k)
  const tanRows: Qator[] = db.tanOlish.map((t) => ({ id: t.id, raqam: t.raqam, davlat: t.davlat, tashkilot: t.tashkilot, xorijiy: `${t.xorijiyKredit} ${t.kreditTuri}`, milliy: t.xulosa?.milliyKredit ?? 0, holat: holatMatn(t.holat)[0] }))
  const murRows: Qator[] = db.murojaatlar.map((m) => {
    const ochiq = !['qaror', 'yopildi'].includes(m.holat)
    const qolgan = ishKunlari(bugun, m.muddat, db.sozlamalar.bayramlar) ?? 0
    const vaqtida = ochiq ? (qolgan < 0 ? 'Kechikmoqda' : 'Jarayonda') : (m.qaror?.sana ?? m.tarix[m.tarix.length - 1].sana).slice(0, 10) <= m.muddat ? 'Muddatida' : 'Kechikib'
    return { id: m.id, raqam: m.raqam, turi: m.turi, yuborilgan: m.yuborilgan.slice(0, 10), muddat: m.muddat, qolgan: ochiq ? qolgan : '—', holat: holatMatn(m.holat)[0], natija: vaqtida }
  })
  const sana = (rows: Qator[], k: string) => Array.from(guruh(rows, (r) => String(r[k])).entries()).map(([x, a]) => ({ x, soni: a.length }))

  return [
    { id: 'prov', nomi: 'Provayderlar holati', desc: 'Reestrdagi barcha provayderlar va amaldagi qarorlar', ustunlar: [{ k: 'nomi', l: 'Provayder' }, { k: 'turi', l: 'Turi' }, { k: 'holat', l: 'Holat' }, { k: 'qaror', l: 'Qaror' }, { k: 'muddat', l: 'Muddat' }], rows: provRows, grafik: { data: sana(provRows, 'holat'), keys: ['soni'], names: { soni: 'Provayderlar' } } },
    { id: 'dast', nomi: 'Tasdiqlangan dasturlar', desc: 'Akkreditatsiyasi amaldagi dastur versiyalari', ustunlar: [{ k: 'provayder', l: 'Provayder' }, { k: 'nomi', l: 'Dastur' }, { k: 'tadbir', l: 'Tadbir' }, { k: 'kredit', l: 'Kredit', son: true }, { k: 'muddat', l: 'Amal muddati' }], rows: dastRows, grafik: { data: sana(dastRows, 'tadbir'), keys: ['soni'], names: { soni: 'Dasturlar' } } },
    { id: 'hudud', nomi: `Kreditlar hududlar boʻyicha (${yil})`, desc: 'Kredit jurnali yigʻindisi, xodimning Reestrdagi hududi boʻyicha', ustunlar: [{ k: 'nomi', l: 'Hudud' }, { k: 'xodimlar', l: 'Xodimlar', son: true }, { k: 'yozuvlar', l: 'Yozuvlar', son: true }, { k: 'kredit', l: 'Kredit', son: true }], rows: hudud, grafik: { data: hudud.slice(0, 10).map((r) => ({ x: String(r.nomi).replace(' viloyati', ''), kredit: r.kredit })), keys: ['kredit'], names: { kredit: 'Kredit' } } },
    { id: 'mut', nomi: `Kreditlar mutaxassislik boʻyicha (${yil})`, desc: 'Kredit jurnali yigʻindisi, Reestrdagi mutaxassislik boʻyicha', ustunlar: [{ k: 'nomi', l: 'Mutaxassislik' }, { k: 'xodimlar', l: 'Xodimlar', son: true }, { k: 'yozuvlar', l: 'Yozuvlar', son: true }, { k: 'kredit', l: 'Kredit', son: true }], rows: mut, grafik: { data: mut.slice(0, 10).map((r) => ({ x: String(r.nomi), kredit: r.kredit })), keys: ['kredit'], names: { kredit: 'Kredit' } } },
    { id: 'tan', nomi: 'Tan olish statistikasi', desc: 'Xorijiy kreditlar va tan olingan milliy kreditlar', ustunlar: [{ k: 'raqam', l: 'Raqam' }, { k: 'davlat', l: 'Davlat' }, { k: 'tashkilot', l: 'Tashkilot' }, { k: 'xorijiy', l: 'Xorijiy kredit' }, { k: 'milliy', l: 'Milliy kredit', son: true }, { k: 'holat', l: 'Holat' }], rows: tanRows, grafik: { data: sana(tanRows, 'holat'), keys: ['soni'], names: { soni: 'Arizalar' } } },
    { id: 'mur', nomi: 'Murojaatlar muddatlari', desc: 'Koʻrib chiqish muddatiga rioya (ish kunlarida)', ustunlar: [{ k: 'raqam', l: 'Raqam' }, { k: 'turi', l: 'Turi' }, { k: 'yuborilgan', l: 'Yuborilgan' }, { k: 'muddat', l: 'Muddat' }, { k: 'qolgan', l: 'Qolgan ish kuni' }, { k: 'holat', l: 'Holat' }, { k: 'natija', l: 'Muddatga rioya' }], rows: murRows, grafik: { data: sana(murRows, 'natija'), keys: ['soni'], names: { soni: 'Murojaatlar' } } },
  ]
}
