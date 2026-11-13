// Xodim kabinetiga xos qoʻshimcha amallar (umumiy amallar.ts ga tegmasdan).
// Imzo: (db, ctx, ...args). Qoida buzilsa QoidaXatosi; har bir amal auditga yoziladi.
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import type { Ctx } from '@/domain/amallar'
import { QoidaXatosi, audit, xabar, xodimYillik, fauxHash, uid, talabRol, bugunSana } from '@/domain/amallar'

/** Yillik hisobot nusxasini tizimda saqlash (PDF yuklab olinganda). */
export function yillikHisobotSaqla(db: DB, ctx: Ctx, yil: number): T.YillikHisobotNusxa {
  talabRol(ctx, 'xodim')
  const pid = ctx.user.personId
  if (!pid) throw new QoidaXatosi(403, 'Shaxs aniqlanmadi.')
  const holat = xodimYillik(db, pid, yil, bugunSana(ctx))
  const n: T.YillikHisobotNusxa = { id: uid('YH'), personId: pid, yil, sana: ctx.vaqt, holat, qr: fauxHash(pid + yil + ctx.vaqt).slice(0, 16) }
  db.yillikHisobotlar.push(n)
  audit(db, ctx, `Yillik UKR hisoboti (${yil}) yuklab olindi`, 'YillikHisobot', n.id, undefined, { X: holat.X, T: holat.T })
  return n
}

/** PSV roziligini bekor qilish — shundan keyin maʼlumot uchinchi shaxsga uzatilmaydi. */
export function rozilikBekor(db: DB, ctx: Ctx, psvId: T.ID) {
  talabRol(ctx, 'xodim')
  const p = db.psv.find((x) => x.id === psvId)
  if (!p || p.personId !== ctx.user.personId) throw new QoidaXatosi(403, 'Bu rozilik sizga tegishli emas.')
  if (p.rozilik.bekor) throw new QoidaXatosi(422, 'Rozilik allaqachon bekor qilingan.')
  if (p.holat === 'yetkazildi') throw new QoidaXatosi(422, 'Hisobot allaqachon yetkazilgan — bu rozilik boʻyicha uzatish yakunlangan. Eʼtirozingiz boʻlsa, murojaat yuboring.')
  const oldin = { ...p.rozilik }
  p.rozilik.bekor = true
  db.foydalanuvchilar.filter((u) => u.rol === 'markaz_mutaxassis').forEach((u) => xabar(db, u.id, `${p.raqam}: shaxs PSV roziligini bekor qildi — maʼlumot uzatilmaydi`, 'warn', '/markaz/psv', ctx.vaqt))
  xabar(db, ctx.user.id, `${p.raqam}: roziligingiz bekor qilindi. Maʼlumot ${p.qabulQiluvchi} ga uzatilmaydi.`, 'ok', '/xodim/profil', ctx.vaqt)
  audit(db, ctx, 'PSV roziligi bekor qilindi', 'PSV', p.id, oldin, p.rozilik)
}
