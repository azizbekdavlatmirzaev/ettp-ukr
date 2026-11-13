// Administrator sahifalari uchun qoʻshimcha amallar (umumiy amallar.ts ga tegmasdan).
import type { DB } from '@/domain/db'
import type { Ctx } from '@/domain/amallar'
import { audit, solishtirish, talabRol, QoidaXatosi } from '@/domain/amallar'

/** Kunlik solishtirish: balans jurnaldan qayta hisoblanadi, natija hodisalar navbatiga va auditga yoziladi. */
export function solishtirishIshga(db: DB, ctx: Ctx, yil: number) {
  talabRol(ctx, 'admin')
  const r = solishtirish(db, yil)
  db.hodisalar.unshift({ id: `sverka-${ctx.vaqt}`, turi: 'reestrga_uzatildi', manbaId: 'solishtirish', vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: `Kunlik solishtirish (${yil}): ${r.xodimlar} xodim, ${r.yozuvlar} yozuv, farq ${r.farq}, takror ${r.takrorlar}` })
  audit(db, ctx, 'Kunlik solishtirish ishga tushirildi', 'Kredit jurnali', String(yil), undefined, r)
  return r
}

/** Zaxiradan tiklash sinovi (imitatsiya): nusxa tekshiriladi, kredit jurnali yigʻindisi solishtiriladi. */
export function tiklashSinovi(db: DB, ctx: Ctx, nusxa: string) {
  talabRol(ctx, 'admin')
  const yil = Number(ctx.vaqt.slice(0, 4))
  const r = solishtirish(db, yil)
  const natija = { nusxa, jurnalYozuvlari: db.jurnal.length, auditYozuvlari: db.audit.length, balansFarqi: r.farq, davomiylik: '00:42:18', rto: '4 soat', rpo: '15 daqiqa' }
  audit(db, ctx, 'Zaxiradan tiklash sinovi oʻtkazildi', 'Zaxira', nusxa, undefined, natija)
  return natija
}

/** Klassifikatorni cs.egov.uz dan sinxronlash (imitatsiya) — audit yoziladi. */
export function klassifikatorSinxron(db: DB, ctx: Ctx, nomi: string, soni: number) {
  talabRol(ctx, 'admin')
  audit(db, ctx, `Klassifikator sinxronlandi: ${nomi}`, 'Klassifikator', nomi, undefined, { manba: 'cs.egov.uz', yozuvlar: soni })
}

/** Integratsiya holatini tekshirish (ping imitatsiyasi). */
export function integratsiyaTekshir(db: DB, ctx: Ctx, nomi: string, ms: number) {
  talabRol(ctx, 'admin')
  audit(db, ctx, `Integratsiya tekshirildi: ${nomi}`, 'Integratsiya', nomi, undefined, { javobMs: ms })
}

/** Navbatdagi (yoki xato) hodisani qayta ishlash — tashqi tizimga qayta yuborish. */
export function hodisaQaytaYubor(db: DB, ctx: Ctx, id: string) {
  talabRol(ctx, 'admin')
  const h = db.hodisalar.find((x) => x.id === id)
  if (!h) throw new QoidaXatosi(422, 'Hodisa topilmadi.')
  if (h.holat !== 'navbatda' && h.holat !== 'xato') throw new QoidaXatosi(409, 'Hodisa allaqachon qayta ishlangan — takror yuborilmaydi.')
  const eski = h.holat
  h.holat = 'qayta_ishlandi'
  h.izoh = `${h.izoh ?? ''} · qayta yuborildi (${ctx.user.fio})`.trim()
  audit(db, ctx, 'Hodisa qayta yuborildi', 'Hodisa', h.id, eski, h.holat)
}
