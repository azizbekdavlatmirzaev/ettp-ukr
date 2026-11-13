// Provayder kabinetining qoʻshimcha amallari (umumiy amallar.ts ga tegmasdan).
import type { DB } from '@/domain/db'
import { QoidaXatosi, audit, talabRol, uid, type Ctx } from '@/domain/amallar'

/** API kalitini yangilash — eski kalit darhol bekor qilinadi, amal auditga yoziladi. Kalit qiymati faqat bir marta koʻrsatiladi. */
export function apiKalitYangila(db: DB, ctx: Ctx) {
  talabRol(ctx, 'provayder_rahbar', 'provayder_operator')
  if (!ctx.user.providerId) throw new QoidaXatosi(403, 'Provayder aniqlanmadi.')
  const kalit = `ukr_live_${ctx.user.providerId.toLowerCase()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`
  audit(db, ctx, 'API kaliti yangilandi (eski kalit bekor qilindi)', 'Provayder', ctx.user.providerId, undefined, { kalit: kalit.slice(0, 14) + '…' })
  return kalit
}

/** LMS sinxronlash (imitatsiya): onlayn/aralash oqim tinglovchilarining dars progressi va LMS davomati olinadi. */
export function lmsSinxron(db: DB, ctx: Ctx, oqimId: string, tizim: string) {
  talabRol(ctx, 'provayder_rahbar', 'provayder_operator')
  const o = db.oqimlar.find((x) => x.id === oqimId)
  if (!o) throw new QoidaXatosi(422, 'Oqim topilmadi.')
  if (o.providerId !== ctx.user.providerId) throw new QoidaXatosi(403, 'Bu oqim boshqa provayderga tegishli.')
  const v = db.versiyalar.find((x) => x.id === o.versiyaId)!
  if (v.shakl === 'oflayn') throw new QoidaXatosi(422, 'Oflayn oqim LMS bilan sinxronlanmaydi — davomat jurnal yoki QR orqali olinadi.')
  const tinglovchilar = db.yozilishlar.filter((y) => y.oqimId === o.id && ['qabul_qilindi', 'oqimoqda'].includes(y.holat))
  let darslar = 0
  let davomat = 0
  const otgan = o.mashgulotlar.filter((m) => m.sana <= ctx.vaqt)
  for (const y of tinglovchilar) {
    const keyingi = v.darslar.filter((d) => !y.progress.includes(d.id)).slice(0, 1 + Math.floor(Math.random() * 2))
    keyingi.forEach((d) => y.progress.push(d.id))
    darslar += keyingi.length
    for (const m of otgan) {
      if (db.davomat.some((d) => d.yozilishId === y.id && d.mashgulotId === m.id)) continue
      db.davomat.push({ id: uid('D'), yozilishId: y.id, mashgulotId: m.id, usul: 'LMS', holat: 'keldi', vaqt: ctx.vaqt, kiritgan: tizim })
      davomat++
    }
    if (keyingi.length && y.holat === 'qabul_qilindi') y.holat = 'oqimoqda'
  }
  db.hodisalar.unshift({ id: `lms-sync-${uid('E')}`, turi: 'lms_natija', manbaId: o.id, vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: `${tizim}: ${darslar} ta dars progressi, ${davomat} ta davomat (sinxronlash)` })
  audit(db, ctx, `LMS sinxronlash (${tizim})`, 'Oqim', o.id, undefined, { tinglovchilar: tinglovchilar.length, darslar, davomat })
  return { tinglovchilar: tinglovchilar.length, darslar, davomat }
}
