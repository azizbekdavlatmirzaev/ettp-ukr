// UKR markazi kabineti uchun qoʻshimcha amallar (domain/amallar.ts da yoʻq boʻlganlari).
// Imzo: (db, ctx, ...args). Qoidalar buzilsa QoidaXatosi; har bir amal auditga yoziladi.
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import { QoidaXatosi, audit, uid, talabRol, fauxHash, solishtirish, simulyatsiya, type Ctx } from '@/domain/amallar'
import { HUDUDLAR } from '@/domain/malumotnoma'

const MARKAZ: T.Rol[] = ['markaz_mutaxassis', 'markaz_rahbar']

export function ekspertQosh(db: DB, ctx: Ctx, d: { fio: string; mutaxassislik: string; ishJoyi: string; ishJoyiProviderId?: string; vakolatMuddati: string }) {
  talabRol(ctx, ...MARKAZ)
  if (d.fio.trim().split(/\s+/).length < 2) throw new QoidaXatosi(422, 'Ekspertning F.I.Sh.ini toʻliq kiriting.')
  if (!d.mutaxassislik || !d.ishJoyi.trim()) throw new QoidaXatosi(422, 'Mutaxassislik va ish joyini kiriting.')
  if (!d.vakolatMuddati || d.vakolatMuddati < ctx.vaqt.slice(0, 10)) throw new QoidaXatosi(422, 'Vakolat muddati kelajakdagi sana boʻlishi kerak.')
  if (db.ekspertlar.some((e) => e.fio.trim().toLowerCase() === d.fio.trim().toLowerCase())) throw new QoidaXatosi(409, 'Bu F.I.Sh. bilan ekspert reestrda allaqachon bor.')
  const e: T.Ekspert = { id: uid('E'), fio: d.fio.trim(), mutaxassislik: d.mutaxassislik, ishJoyi: d.ishJoyi.trim(), ishJoyiProviderId: d.ishJoyiProviderId || undefined, vakolatMuddati: d.vakolatMuddati, deklaratsiya: [], faol: true }
  db.ekspertlar.push(e)
  audit(db, ctx, 'Ekspert reestrga qoʻshildi', 'Ekspert', e.id, undefined, { fio: e.fio })
  return e
}

export function deklaratsiyaQosh(db: DB, ctx: Ctx, ekspertId: T.ID, providerId: T.ID, sabab: string) {
  talabRol(ctx, ...MARKAZ)
  const e = db.ekspertlar.find((x) => x.id === ekspertId)
  if (!e) throw new QoidaXatosi(422, 'Ekspert topilmadi.')
  if (!providerId || !sabab.trim()) throw new QoidaXatosi(422, 'Provayder va toʻqnashuv sababini kiriting.')
  if (e.deklaratsiya.some((d) => d.providerId === providerId)) throw new QoidaXatosi(409, 'Bu provayder boʻyicha deklaratsiya allaqachon bor.')
  e.deklaratsiya.push({ providerId, sabab: sabab.trim() })
  audit(db, ctx, 'Manfaatlar toʻqnashuvi deklaratsiyasi', 'Ekspert', e.id, undefined, { providerId, sabab })
}

export function ekspertFaollik(db: DB, ctx: Ctx, ekspertId: T.ID, faol: boolean) {
  talabRol(ctx, 'markaz_rahbar')
  const e = db.ekspertlar.find((x) => x.id === ekspertId)!
  e.faol = faol
  audit(db, ctx, faol ? 'Ekspert vakolati tiklandi' : 'Ekspert vakolati toʻxtatildi', 'Ekspert', e.id)
}

/** Soliq tizimidan STIR boʻyicha rekvizitlar (imitatsiya) — soʻrov auditga yoziladi. */
export function soliqSorov(db: DB, ctx: Ctx, stir: string) {
  talabRol(ctx, ...MARKAZ)
  if (!/^\d{9}$/.test(stir)) throw new QoidaXatosi(422, 'STIR 9 raqamdan iborat boʻlishi kerak.')
  const h = parseInt(fauxHash(stir).slice(0, 6), 16)
  const nomlar = ['Malaka Plus oʻquv markazi MChJ', 'Hayot Med Taʼlim MChJ', 'Shifokor Akademiyasi MChJ', 'Sogʻlom Avlod oʻquv markazi', 'MedProf Taʼlim MChJ', 'Nur Klinik Simulyatsiya MChJ']
  const hudud = HUDUDLAR[h % HUDUDLAR.length]
  const r = { nomi: nomlar[h % nomlar.length], manzil: `${hudud.nomi}, ${['Navoiy', 'Mustaqillik', 'Bogʻishamol', 'Amir Temur'][h % 4]} koʻchasi, ${(h % 120) + 1}-uy`, hududId: hudud.id, rahbar: ['Karimov Jamshid', 'Yusupova Nodira', 'Saidov Bobur'][h % 3] }
  audit(db, ctx, 'Soliq tizimiga soʻrov (STIR)', 'Integratsiya', stir, undefined, { natija: r.nomi })
  return r
}

/** Litsenziyalash tizimidan litsenziya (imitatsiya). */
export function litsenziyaSorov(db: DB, ctx: Ctx, stir: string) {
  talabRol(ctx, ...MARKAZ)
  if (!/^\d{9}$/.test(stir)) throw new QoidaXatosi(422, 'Avval toʻgʻri STIR kiriting.')
  const h = parseInt(fauxHash('L' + stir).slice(0, 6), 16)
  if (h % 7 === 0) throw new QoidaXatosi(422, 'Litsenziyalash tizimida bu STIR boʻyicha amaldagi taʼlim litsenziyasi topilmadi.')
  const r = { raqam: `L-${10000 + (h % 89999)}`, sana: '2024-0' + ((h % 9) + 1) + '-15', muddat: '2029-0' + ((h % 9) + 1) + '-15' }
  audit(db, ctx, 'Litsenziyalash tizimiga soʻrov', 'Integratsiya', stir, undefined, r)
  return r
}

/** Kunlik solishtirishni qoʻlda qayta ishga tushirish (natija + audit + hodisa). */
export function solishtirishQayd(db: DB, ctx: Ctx, yil: number) {
  talabRol(ctx, ...MARKAZ)
  const r = solishtirish(db, yil)
  db.hodisalar.unshift({ id: `sol-${yil}-${ctx.vaqt}`, turi: 'reestrga_uzatildi', manbaId: String(yil), vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: `Solishtirish ${yil}: ${r.yozuvlar} yozuv, farq ${r.farq}, takror ${r.takrorlar}` })
  audit(db, ctx, `Kunlik solishtirish ${yil}`, 'Kredit jurnali', String(yil), undefined, r)
  return { ...r, vaqt: ctx.vaqt }
}

/** Qoida simulyatsiyasi (auditga yoziladi; ishlab chiqarishda — fon vazifa). */
export function simulyatsiyaQayd(db: DB, ctx: Ctx, qoida: T.KreditQoidasi, yil: number) {
  talabRol(ctx, ...MARKAZ)
  const r = simulyatsiya(db, qoida, yil, ctx.vaqt.slice(0, 10))
  audit(db, ctx, `Qoida simulyatsiyasi ${qoida.versiya} (${yil})`, 'KreditQoidasi', qoida.id, undefined, { ozgardi: r.ozgardi })
  return r
}
