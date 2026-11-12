// UKR quyi tizimining biznes amallari (TZ 4.2.x «Qoidalar»).
// Har bir amal: (db, ctx, ...args) => natija. Qoida buzilsa QoidaXatosi tashlanadi (403/409/422).
// Store har bir amalni nusxa ustida bajaradi: xato boʻlsa hech narsa saqlanmaydi (tranzaksiya), lekin audit yoziladi.
import type { DB } from './db'
import type * as T from './types'
import { amaldagiQoida, yillikHolat } from './kredit'
import { AKK_HUJJATLAR, KONIKMALAR, MUTAXASSISLIKLAR } from './malumotnoma'

export class QoidaXatosi extends Error {
  kod: 403 | 409 | 422
  constructor(kod: 403 | 409 | 422, xabar: string) {
    super(xabar)
    this.kod = kod
  }
}

export interface Ctx {
  user: T.Foydalanuvchi
  vaqt: string // ISO
}

// ───────────────────────── yordamchilar ─────────────────────────
export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
export const bugunSana = (ctx: Ctx) => ctx.vaqt.slice(0, 10)

function keyingiRaqam(db: DB, kalit: string) {
  db.hisoblagich[kalit] = (db.hisoblagich[kalit] ?? 0) + 1
  return db.hisoblagich[kalit]
}

export function talabRol(ctx: Ctx, ...rollar: T.Rol[]) {
  if (!rollar.includes(ctx.user.rol)) throw new QoidaXatosi(403, 'Bu amal sizning rolingiz uchun ruxsat etilmagan.')
}

function ikkiShaxs(ctx: Ctx, kiritgan: T.ID | undefined, nima: string) {
  if (kiritgan && kiritgan === ctx.user.id)
    throw new QoidaXatosi(403, `Oʻzingiz kiritgan ${nima}ni oʻzingiz tasdiqlay olmaysiz. Tasdiqlash boshqa vakolatli shaxs tomonidan bajariladi.`)
}

export function audit(db: DB, ctx: Ctx | null, amal: string, obyekt: string, obyektId?: string, oldin?: unknown, keyin?: unknown, natija: 'ok' | 'rad_etildi' = 'ok') {
  db.audit.unshift({
    id: uid('A'),
    sana: ctx?.vaqt ?? new Date().toISOString(),
    userId: ctx?.user.id ?? 'tizim',
    fio: ctx?.user.fio ?? 'Tizim',
    rol: ctx?.user.rol ?? 'tizim',
    amal,
    obyekt,
    obyektId,
    oldin: oldin === undefined ? undefined : JSON.stringify(oldin).slice(0, 400),
    keyin: keyin === undefined ? undefined : JSON.stringify(keyin).slice(0, 400),
    ip: '10.10.' + ((ctx?.user.id.length ?? 3) % 250) + '.' + ((ctx?.user.login.length ?? 7) * 13 % 250),
    natija,
  })
  if (db.audit.length > 3000) db.audit.length = 3000
}

export function xabar(db: DB, userId: T.ID, matn: string, turi: T.Bildirishnoma['turi'] = 'info', havola?: string, vaqt?: string) {
  db.bildirishnomalar.unshift({ id: uid('N'), userId, matn, havola, turi, sana: vaqt ?? new Date().toISOString(), oqilgan: false, kanal: ['kabinet', 'email'] })
}

function personUserlari(db: DB, personId: T.ID) {
  return db.foydalanuvchilar.filter((u) => u.personId === personId)
}
function xabarShaxsga(db: DB, personId: T.ID, matn: string, turi: T.Bildirishnoma['turi'], havola: string | undefined, ctx: Ctx) {
  personUserlari(db, personId).forEach((u) => xabar(db, u.id, matn, turi, havola, ctx.vaqt))
}
function xabarRolga(db: DB, rol: T.Rol, matn: string, havola: string | undefined, ctx: Ctx, filtr?: (u: T.Foydalanuvchi) => boolean) {
  db.foydalanuvchilar.filter((u) => u.rol === rol && (!filtr || filtr(u))).forEach((u) => xabar(db, u.id, matn, 'info', havola, ctx.vaqt))
}

export function ishKuniQosh(sana: string, kun: number, bayramlar: string[]) {
  const d = new Date(sana.slice(0, 10) + 'T12:00:00')
  let q = 0
  while (q < kun) {
    d.setDate(d.getDate() + 1)
    const w = d.getDay()
    const s = d.toISOString().slice(0, 10)
    if (w !== 0 && w !== 6 && !bayramlar.includes(s)) q++
  }
  return d.toISOString().slice(0, 10)
}

export async function sha256(matn: string) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(matn))
    return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('')
  }
  return fauxHash(matn)
}
export function fauxHash(s: string) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  const x = (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
  return (x + x + x + x).slice(0, 64)
}

export function eriImzo(ctx: Ctx, matn: string) {
  return `ERI:${ctx.user.fio}|${ctx.vaqt}|${fauxHash(matn + ctx.user.id).slice(0, 24)}`
}

export const qisqaFio = (s: T.Shaxs) => `${s.familiya} ${s.ism[0]}. ${s.otasi[0]}.`
export const toliqFio = (s: T.Shaxs) => `${s.familiya} ${s.ism} ${s.otasi}`

// ───────────────────────── tanlovchilar (selectors) ─────────────────────────
export const shaxs = (db: DB, id?: T.ID) => db.shaxslar.find((s) => s.id === id)
export const provayder = (db: DB, id?: T.ID) => db.provayderlar.find((p) => p.id === id)
export const versiya = (db: DB, id?: T.ID) => db.versiyalar.find((v) => v.id === id)
export const oqim = (db: DB, id?: T.ID) => db.oqimlar.find((o) => o.id === id)
export const yozilish = (db: DB, id?: T.ID) => db.yozilishlar.find((o) => o.id === id)

export function akkFaolmi(p: T.Provayder | undefined, sana?: string) {
  if (!p) return false
  if (!sana) return p.holat === 'akkreditatsiyalangan' || p.holat === 'shartli'
  // tarixdan oʻsha sanadagi holat
  const t = [...p.tarix].filter((h) => h.sana.slice(0, 10) <= sana.slice(0, 10)).sort((a, b) => a.sana.localeCompare(b.sana)).pop()
  const h = t?.holat ?? p.holat
  return h === 'akkreditatsiyalangan' || h === 'shartli'
}

export function katalogdami(db: DB, o: T.Oqim, bugun: string) {
  const v = versiya(db, o.versiyaId)
  const p = provayder(db, o.providerId)
  return !!v && v.holat === 'tasdiqlangan' && akkFaolmi(p) && o.holat === 'elon_qilingan' && o.qabulTugash >= bugun
}

export function bandOrinlar(db: DB, oqimId: T.ID) {
  return db.yozilishlar.filter((y) => y.oqimId === oqimId && ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi'].includes(y.holat)).length
}

export function mosmi(db: DB, s: T.Shaxs, v: T.DasturVersiya): { ok: boolean; sabab?: string } {
  if (v.tinglovchi !== 'barchasi' && v.tinglovchi !== s.daraja)
    return { ok: false, sabab: `Dastur ${v.tinglovchi === 'oliy' ? 'oliy' : 'oʻrta'} maʼlumotli xodimlar uchun. Reestrdagi maʼlumot darajangiz: ${s.daraja === 'oliy' ? 'oliy' : 'oʻrta'}.` }
  if (v.mutaxassisliklar.length && !v.mutaxassisliklar.includes(s.mutaxassislikId))
    return { ok: false, sabab: 'Kurs Reestrdagi mutaxassisligingizga mos emas.' }
  return { ok: true }
}

export function xodimYillik(db: DB, personId: T.ID, yil: number, bugun: string) {
  const s = shaxs(db, personId)!
  const sana = `${yil}-12-31` < bugun ? `${yil}-12-31` : bugun
  const q = amaldagiQoida(db.qoidalar, sana) ?? db.qoidalar[0]
  const tekshiruvda = db.natijalar
    .filter((n) => n.holat === 'tekshiruvda' && yozilish(db, n.yozilishId)?.personId === personId)
    .reduce((a, n) => a + (versiya(db, oqim(db, yozilish(db, n.yozilishId)?.oqimId)?.versiyaId)?.tasdiqlanganKredit ?? 0), 0)
    + db.tanOlish.filter((t) => t.personId === personId && !['tasdiqlandi', 'rad_etildi'].includes(t.holat)).length * 0
  return yillikHolat({ shaxs: s, yil, yozuvlar: db.jurnal, qoida: q, mehnat: db.mehnat.filter((m) => m.personId === personId), tekshiruvda, bugun })
}

export function muassasaXodimlari(db: DB, muassasaId: T.ID, bugun: string) {
  return db.mehnat.filter((m) => m.muassasaId === muassasaId && (!m.gacha || m.gacha >= bugun))
}

// ───────────────────────── 4.2.1 Oʻquv tadbirlari ─────────────────────────
export function yozilishYubor(db: DB, ctx: Ctx, oqimId: T.ID) {
  talabRol(ctx, 'xodim')
  const s = shaxs(db, ctx.user.personId)
  const o = oqim(db, oqimId)
  if (!s || !o) throw new QoidaXatosi(422, 'Kurs yoki shaxs topilmadi.')
  const v = versiya(db, o.versiyaId)!
  if (!katalogdami(db, o, bugunSana(ctx))) throw new QoidaXatosi(422, 'Bu oqimga qabul yopiq yoki dastur/provayder akkreditatsiyasi amalda emas.')
  const m = mosmi(db, s, v)
  if (!m.ok) throw new QoidaXatosi(422, m.sabab!)
  const bor = db.yozilishlar.find((y) => y.personId === s.id && y.oqimId === oqimId && !['rad_etildi', 'chiqdi'].includes(y.holat))
  if (bor) return bor // bitta oqimga faqat bitta ariza (idempotent)
  const y: T.Yozilish = {
    id: uid('Y'),
    personId: s.id,
    oqimId,
    holat: 'yuborildi',
    yuborilgan: ctx.vaqt,
    tarix: [{ holat: 'yuborildi', sana: ctx.vaqt, kim: ctx.user.fio }],
    progress: [],
  }
  db.yozilishlar.push(y)
  const p = provayder(db, o.providerId)!
  db.foydalanuvchilar.filter((u) => u.providerId === p.id).forEach((u) => xabar(db, u.id, `Yangi ariza: ${qisqaFio(s)} — «${v.nomi}» (${o.kod})`, 'info', '/provayder/tinglovchilar', ctx.vaqt))
  xabar(db, ctx.user.id, `«${v.nomi}» kursiga arizangiz yuborildi. Provayder koʻrib chiqqach xabar beramiz.`, 'ok', '/xodim/oquv/kurslarim', ctx.vaqt)
  audit(db, ctx, 'Kursga yozilish arizasi', 'Yozilish', y.id, undefined, { oqim: o.kod })
  return y
}

export function yozilishBekor(db: DB, ctx: Ctx, yozilishId: T.ID) {
  talabRol(ctx, 'xodim')
  const y = yozilish(db, yozilishId)
  if (!y || y.personId !== ctx.user.personId) throw new QoidaXatosi(403, 'Bu ariza sizga tegishli emas.')
  if (!['yuborildi', 'qabul_qilindi', 'navbatda'].includes(y.holat)) throw new QoidaXatosi(422, 'Oʻqish boshlangan kursdan bu yerda chiqib boʻlmaydi — provayderga murojaat qiling.')
  y.holat = 'chiqdi'
  y.tarix.push({ holat: 'chiqdi', sana: ctx.vaqt, kim: ctx.user.fio, izoh: 'Xodim arizani qaytarib oldi' })
  audit(db, ctx, 'Arizani qaytarib olish', 'Yozilish', y.id)
}

export function darsKorildi(db: DB, ctx: Ctx, yozilishId: T.ID, darsId: T.ID) {
  const y = yozilish(db, yozilishId)
  if (!y || y.personId !== ctx.user.personId) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  if (!y.progress.includes(darsId)) y.progress.push(darsId)
  // material koʻrish kredit bermaydi — faqat progress
}

export function onlaynTest(db: DB, ctx: Ctx, yozilishId: T.ID, togri: number, jami: number) {
  const y = yozilish(db, yozilishId)
  if (!y || y.personId !== ctx.user.personId) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  const ball = Math.round((togri / jami) * 100)
  const urinish = db.baholashlar.filter((b) => b.yozilishId === y.id && b.turi === 'test').length
  if (urinish >= 3) throw new QoidaXatosi(422, 'Urinishlar soni tugagan (3 ta). Provayderga murojaat qiling.')
  db.baholashlar.push({ id: uid('B'), yozilishId: y.id, turi: 'test', ball, otishBali: 70, otdi: ball >= 70, baholovchi: 'Test quyi tizimi', sana: ctx.vaqt, manba: 'Test quyi tizimi' })
  audit(db, ctx, 'Onlayn test topshirildi', 'Baholash', y.id, undefined, { ball })
  return ball
}

export function qrDavomat(db: DB, ctx: Ctx, qrKod: string) {
  talabRol(ctx, 'xodim')
  const o = db.oqimlar.find((x) => x.mashgulotlar.some((m) => m.qrKod === qrKod.trim()))
  if (!o) throw new QoidaXatosi(422, 'QR-kod tanilmadi. Kodni qayta skanerlang yoki oʻqituvchiga murojaat qiling.')
  const m = o.mashgulotlar.find((x) => x.qrKod === qrKod.trim())!
  const y = db.yozilishlar.find((x) => x.oqimId === o.id && x.personId === ctx.user.personId && ['qabul_qilindi', 'oqimoqda'].includes(x.holat))
  if (!y) throw new QoidaXatosi(403, 'Siz bu oqim tinglovchisi emassiz.')
  const bor = db.davomat.find((d) => d.yozilishId === y.id && d.mashgulotId === m.id)
  if (bor) return { oqim: o, m, takror: true }
  db.davomat.push({ id: uid('D'), yozilishId: y.id, mashgulotId: m.id, usul: 'QR', holat: 'keldi', vaqt: ctx.vaqt, kiritgan: ctx.user.fio })
  if (y.holat === 'qabul_qilindi') y.holat = 'oqimoqda'
  audit(db, ctx, 'QR davomat', 'Davomat', y.id)
  return { oqim: o, m, takror: false }
}

export function sorovnoma(db: DB, ctx: Ctx, yozilishId: T.ID, baho: number, izoh: string) {
  const y = yozilish(db, yozilishId)
  if (!y || y.personId !== ctx.user.personId) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  if (!['tugatdi', 'otmadi'].includes(y.holat)) throw new QoidaXatosi(422, 'Soʻrovnoma kurs tugagach ochiladi.')
  y.sorovnoma = { baho, izoh, sana: ctx.vaqt }
  // provayder reytingini yangilash (anonim — faqat oʻrtacha)
  const o = oqim(db, y.oqimId)!
  const p = provayder(db, o.providerId)!
  const baholar = db.yozilishlar.filter((x) => x.sorovnoma && oqim(db, x.oqimId)?.providerId === p.id).map((x) => x.sorovnoma!.baho)
  p.reyting = Math.round((baholar.reduce((a, b) => a + b, 0) / baholar.length) * 10) / 10
  audit(db, ctx, 'Anonim soʻrovnoma', 'Provayder', p.id)
}

// ───────────────────────── 4.2.6 Tinglovchilar, davomat, natijalar ─────────────────────────
function provayderniki(db: DB, ctx: Ctx, oqimId: T.ID) {
  const o = oqim(db, oqimId)
  if (!o) throw new QoidaXatosi(422, 'Oqim topilmadi.')
  if (o.providerId !== ctx.user.providerId) throw new QoidaXatosi(403, 'Bu oqim boshqa provayderga tegishli.')
  return o
}

export function arizaHolati(db: DB, ctx: Ctx, ids: T.ID[], holat: 'qabul_qilindi' | 'navbatda' | 'rad_etildi', sabab?: string) {
  talabRol(ctx, 'provayder_operator', 'provayder_rahbar')
  if (holat === 'rad_etildi' && !sabab?.trim()) throw new QoidaXatosi(422, 'Rad etish sababini kiriting.')
  for (const id of ids) {
    const y = yozilish(db, id)
    if (!y) continue
    const o = provayderniki(db, ctx, y.oqimId)
    if (holat === 'qabul_qilindi' && bandOrinlar(db, o.id) >= o.orinlar) throw new QoidaXatosi(422, `«${o.kod}» oqimida boʻsh oʻrin qolmadi. Arizani navbatga qoʻying.`)
    y.holat = holat
    y.sabab = sabab
    y.tarix.push({ holat, sana: ctx.vaqt, kim: ctx.user.fio, izoh: sabab })
    const v = versiya(db, o.versiyaId)!
    const matn = holat === 'qabul_qilindi' ? `«${v.nomi}» kursiga qabul qilindingiz. Sanalar taqvimingizga qoʻshildi.` : holat === 'navbatda' ? `«${v.nomi}» kursi boʻyicha arizangiz navbatga qoʻyildi.` : `«${v.nomi}» kursiga arizangiz rad etildi: ${sabab}`
    xabarShaxsga(db, y.personId, matn, holat === 'rad_etildi' ? 'warn' : 'ok', '/xodim/oquv/kurslarim', ctx)
    if (holat === 'qabul_qilindi') {
      db.taqvim.push({ id: uid('T'), personId: y.personId, sana: o.boshlanish, tugash: o.tugash, nomi: v.nomi, turi: 'kurs' })
    }
    audit(db, ctx, `Ariza: ${holat}`, 'Yozilish', y.id, undefined, { sabab })
  }
}

export function guruhQoshish(db: DB, ctx: Ctx, oqimId: T.ID, jshshirlar: string[]) {
  talabRol(ctx, 'provayder_operator', 'provayder_rahbar')
  const o = provayderniki(db, ctx, oqimId)
  const v = versiya(db, o.versiyaId)!
  const natija = { qoshildi: 0, xatolar: [] as string[] }
  jshshirlar.map((j) => j.trim()).filter(Boolean).forEach((j, i) => {
    const s = db.shaxslar.find((x) => x.jshshir === j)
    if (!/^\d{14}$/.test(j)) return natija.xatolar.push(`${i + 1}-qator: JSHSHIR 14 raqamdan iborat boʻlishi kerak (${j})`)
    if (!s) return natija.xatolar.push(`${i + 1}-qator: ${j} — Reestrda topilmadi`)
    const m = mosmi(db, s, v)
    if (!m.ok) return natija.xatolar.push(`${i + 1}-qator: ${qisqaFio(s)} — ${m.sabab}`)
    if (db.yozilishlar.some((y) => y.oqimId === o.id && y.personId === s.id && !['rad_etildi', 'chiqdi'].includes(y.holat))) return natija.xatolar.push(`${i + 1}-qator: ${qisqaFio(s)} — allaqachon roʻyxatda`)
    if (bandOrinlar(db, o.id) >= o.orinlar) return natija.xatolar.push(`${i + 1}-qator: oʻrinlar tugadi`)
    db.yozilishlar.push({ id: uid('Y'), personId: s.id, oqimId: o.id, holat: 'qabul_qilindi', yuborilgan: ctx.vaqt, tarix: [{ holat: 'qabul_qilindi', sana: ctx.vaqt, kim: ctx.user.fio, izoh: 'Guruh roʻyxati orqali' }], progress: [] })
    xabarShaxsga(db, s.id, `Siz «${v.nomi}» kursiga (${o.kod}) provayder tomonidan qoʻshildingiz.`, 'ok', '/xodim/oquv/kurslarim', ctx)
    natija.qoshildi++
  })
  audit(db, ctx, 'Guruhni ommaviy qoʻshish', 'Oqim', o.id, undefined, natija)
  return natija
}

export function davomatSaqla(db: DB, ctx: Ctx, oqimId: T.ID, mashgulotId: T.ID, qatorlar: { yozilishId: T.ID; holat: T.Davomat['holat']; dalil?: string }[]) {
  talabRol(ctx, 'provayder_operator')
  const o = provayderniki(db, ctx, oqimId)
  for (const q of qatorlar) {
    const bor = db.davomat.find((d) => d.yozilishId === q.yozilishId && d.mashgulotId === mashgulotId)
    if (bor) {
      bor.holat = q.holat
      bor.dalil = q.dalil
      bor.vaqt = ctx.vaqt
    } else db.davomat.push({ id: uid('D'), yozilishId: q.yozilishId, mashgulotId, usul: 'jurnal', holat: q.holat, vaqt: ctx.vaqt, dalil: q.dalil, kiritgan: ctx.user.fio })
    const y = yozilish(db, q.yozilishId)
    if (y && y.holat === 'qabul_qilindi' && q.holat === 'keldi') y.holat = 'oqimoqda'
  }
  audit(db, ctx, 'Davomat saqlandi', 'Oqim', o.id, undefined, { mashgulotId, soni: qatorlar.length })
}

export function baholashKirit(db: DB, ctx: Ctx, yozilishId: T.ID, turi: T.BaholashTuri, ball: number, otishBali = 70, manba: T.Baholash['manba'] = 'Rubrika') {
  talabRol(ctx, 'provayder_operator')
  const y = yozilish(db, yozilishId)
  if (!y) throw new QoidaXatosi(422, 'Tinglovchi topilmadi.')
  provayderniki(db, ctx, y.oqimId)
  if (ball < 0 || ball > 100 || Number.isNaN(ball)) throw new QoidaXatosi(422, 'Ball 0 dan 100 gacha boʻlishi kerak.')
  const bor = db.baholashlar.find((b) => b.yozilishId === y.id && b.turi === turi && b.manba !== 'Test quyi tizimi')
  if (bor) Object.assign(bor, { ball, otdi: ball >= otishBali, otishBali, sana: ctx.vaqt, baholovchi: ctx.user.fio, manba })
  else db.baholashlar.push({ id: uid('B'), yozilishId: y.id, turi, ball, otishBali, otdi: ball >= otishBali, baholovchi: ctx.user.fio, sana: ctx.vaqt, manba })
  audit(db, ctx, 'Baho kiritildi', 'Baholash', y.id, undefined, { turi, ball })
}

export function davomatFoizi(db: DB, y: T.Yozilish) {
  const o = oqim(db, y.oqimId)!
  const jami = o.mashgulotlar.filter((m) => m.sana <= new Date().toISOString()).length || o.mashgulotlar.length
  const keldi = db.davomat.filter((d) => d.yozilishId === y.id && (d.holat === 'keldi' || d.holat === 'uzrli')).length
  return jami ? Math.min(100, Math.round((keldi / jami) * 100)) : 0
}

/** Operator yakuniy natijani shakllantiradi — oldindan koʻrish uchun natija qaytaradi (saqlamaydi). */
export function natijaOldindan(db: DB, oqimId: T.ID) {
  const o = oqim(db, oqimId)!
  const v = versiya(db, o.versiyaId)!
  return db.yozilishlar
    .filter((y) => y.oqimId === oqimId && ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi'].includes(y.holat))
    .map((y) => {
      const s = shaxs(db, y.personId)!
      const bs = db.baholashlar.filter((b) => b.yozilishId === y.id)
      const df = davomatFoizi(db, y)
      const sabablar: string[] = []
      if (!db.davomat.some((d) => d.yozilishId === y.id)) sabablar.push('davomat dalili yoʻq')
      else if (df < 75) sabablar.push(`davomat ${df}% (< 75%)`)
      if (!bs.length) sabablar.push('baholash yoʻq')
      // har bir tur boʻyicha oxirgi (eng yaxshi) natija
      const turlar = Array.from(new Set(bs.map((b) => b.turi)))
      const engYaxshi = turlar.map((t) => bs.filter((b) => b.turi === t).sort((a, b) => b.ball - a.ball)[0])
      if (engYaxshi.some((b) => !b.otdi)) sabablar.push('baholashdan oʻtmagan')
      const ball = engYaxshi.length ? Math.round(engYaxshi.reduce((a, b) => a + b.ball, 0) / engYaxshi.length) : 0
      const otdi = sabablar.length === 0
      const mavjud = db.natijalar.find((n) => n.yozilishId === y.id)
      return { y, s, df, ball, otdi, sabablar, kredit: otdi ? v.tasdiqlanganKredit ?? 0 : 0, mavjud }
    })
}

export function natijaShakllantir(db: DB, ctx: Ctx, oqimId: T.ID) {
  talabRol(ctx, 'provayder_operator')
  const o = provayderniki(db, ctx, oqimId)
  const qatorlar = natijaOldindan(db, oqimId)
  let soni = 0
  for (const q of qatorlar) {
    if (q.mavjud && q.mavjud.holat !== 'qoralama') continue
    if (q.mavjud) db.natijalar = db.natijalar.filter((n) => n.id !== q.mavjud!.id)
    db.natijalar.push({ id: uid('NT'), yozilishId: q.y.id, eventId: `evt-${q.y.id}-final`, natija: q.otdi ? 'otdi' : 'otmadi', ball: q.ball, holat: 'tasdiqlashda', kiritgan: ctx.user.id, kiritilgan: ctx.vaqt, tekshiruvSababi: q.sabablar })
    soni++
  }
  db.foydalanuvchilar.filter((u) => u.providerId === o.providerId && u.rol === 'provayder_rahbar').forEach((u) => xabar(db, u.id, `${o.kod}: ${soni} ta yakuniy natija tasdiqlashingizni kutmoqda`, 'info', '/provayder/natijalar', ctx.vaqt))
  audit(db, ctx, 'Yakuniy natija shakllantirildi', 'Oqim', o.id, undefined, { soni })
  return soni
}

/** Provayder rahbari natijani tasdiqlaydi → «natija tasdiqlandi» hodisasi → Kredit xizmati. */
export function natijaTasdiqla(db: DB, ctx: Ctx, natijaIds: T.ID[]) {
  talabRol(ctx, 'provayder_rahbar')
  const hisobot = { kredit: 0, tekshiruvda: 0, otmadi: 0 }
  for (const id of natijaIds) {
    const n = db.natijalar.find((x) => x.id === id)
    if (!n || n.holat !== 'tasdiqlashda') continue
    const y = yozilish(db, n.yozilishId)!
    provayderniki(db, ctx, y.oqimId)
    ikkiShaxs(ctx, n.kiritgan, 'natija')
    n.holat = 'tasdiqlangan'
    n.tasdiqlovchi = ctx.user.id
    n.tasdiqlangan = ctx.vaqt
    y.holat = n.natija === 'otdi' ? 'tugatdi' : 'otmadi'
    y.tarix.push({ holat: y.holat, sana: ctx.vaqt, kim: ctx.user.fio })
    if (n.natija === 'otmadi') {
      hisobot.otmadi++
      xabarShaxsga(db, y.personId, `Kurs natijangiz: «oʻtmadi». Baho ustidan murojaat yuborishingiz mumkin.`, 'warn', '/xodim/arizalar', ctx)
      continue
    }
    const r = hodisaQabul(db, ctx, n.eventId, 'natija_tasdiqlandi', n.id)
    if (r === 'kredit') hisobot.kredit++
    else if (r === 'tekshiruv') hisobot.tekshiruvda++
  }
  audit(db, ctx, 'Natijalar tasdiqlandi (ERI)', 'YakuniyNatija', natijaIds.join(','), undefined, hisobot)
  return hisobot
}

/** Hodisalar navbati: bir eventId faqat bir marta qayta ishlanadi (TZ 4.1.1). */
export function hodisaQabul(db: DB, ctx: Ctx, eventId: string, turi: T.Hodisa['turi'], manbaId: T.ID): 'kredit' | 'tekshiruv' | 'takror' {
  if (db.hodisalar.some((h) => h.id === eventId && h.holat === 'qayta_ishlandi')) {
    db.hodisalar.unshift({ id: eventId + '#' + Date.now().toString(36), turi, manbaId, vaqt: ctx.vaqt, holat: 'takror_eʼtiborsiz', izoh: `Takror hodisa ${eventId} — eʼtiborsiz qoldirildi` })
    return 'takror'
  }
  const r = kreditXizmati(db, ctx, manbaId)
  db.hodisalar.unshift({ id: eventId, turi, manbaId, vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: r === 'kredit' ? 'Kredit va sertifikat yaratildi' : 'Natija tekshiruvga oʻtkazildi' })
  return r
}

/** Kredit xizmati: avtomatik tekshiruv → kredit yozuvi → sertifikat → portfolio → Reestr (2-rasm). */
export function kreditXizmati(db: DB, ctx: Ctx, natijaId: T.ID): 'kredit' | 'tekshiruv' {
  const n = db.natijalar.find((x) => x.id === natijaId)!
  const y = yozilish(db, n.yozilishId)!
  const o = oqim(db, y.oqimId)!
  const v = versiya(db, o.versiyaId)!
  const p = provayder(db, o.providerId)!
  const s = shaxs(db, y.personId)!
  const sana = (n.tasdiqlangan ?? ctx.vaqt).slice(0, 10)
  const sabablar: string[] = []
  if (!akkFaolmi(p, sana)) sabablar.push('Provayder akkreditatsiyasi natija sanasida amalda emas')
  if (v.holat !== 'tasdiqlangan' || !v.tasdiqlanganKredit) sabablar.push('Dastur versiyasi tasdiqlanmagan yoki kredit qiymati yoʻq')
  if (v.amalMuddati && v.amalMuddati < sana) sabablar.push('Dastur akkreditatsiya muddati tugagan')
  if (n.natija !== 'otdi') sabablar.push('Baholashdan oʻtilmagan')
  if (db.jurnal.some((j) => j.manba === 'natija' && j.manbaId === n.id && !j.bekorQilinganId)) sabablar.push('Bu natija uchun kredit allaqachon berilgan (takror)')
  if (!mosmi(db, s, v).ok) sabablar.push('Mutaxassislik dasturga mos emas')
  if (sabablar.length) {
    n.holat = 'tekshiruvda'
    n.tekshiruvSababi = sabablar
    xabarRolga(db, 'markaz_mutaxassis', `Natija tekshiruvga tushdi: ${qisqaFio(s)} — ${sabablar[0]}`, '/markaz/jurnal', ctx)
    xabarShaxsga(db, s.id, `«${v.nomi}» natijangiz UKR markazi tekshiruvida. Kredit tekshiruvdan soʻng yoziladi.`, 'warn', '/xodim/kreditlar', ctx)
    return 'tekshiruv'
  }
  const yil = Number(sana.slice(0, 4))
  const q = amaldagiQoida(db.qoidalar, sana) ?? db.qoidalar[0]
  const sert = sertifikatYarat(db, ctx, { turi: 'UKR', personId: s.id, kurs: v.nomi, provider: p.nomi, sana, soat: v.soatNazariy + v.soatAmaliy, kredit: v.tasdiqlanganKredit!, natijaId: n.id })
  db.seq++
  db.jurnal.push({
    id: uid('K'), seq: db.seq, personId: s.id, yil, miqdor: v.tasdiqlanganKredit!, kursTuri: v.kursTuri, yonalish: v.yonalish, tadbirTuri: v.tadbirTuri,
    manba: 'natija', manbaId: n.id, nomi: v.nomi, providerNomi: p.nomi, qoidaId: q.id, sana: ctx.vaqt, asos: `Tasdiqlangan natija ${o.kod}`, sertifikatId: sert.id, yaratuvchi: 'Kredit xizmati',
  })
  db.hodisalar.unshift({ id: `kr-${n.id}`, turi: 'kredit_yozildi', manbaId: n.id, vaqt: ctx.vaqt, holat: 'qayta_ishlandi' })
  db.hodisalar.unshift({ id: `rs-${n.id}`, turi: 'reestrga_uzatildi', manbaId: s.id, vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: 'Sertifikat va kredit Reestrga yozildi' })
  xabarShaxsga(db, s.id, `+${v.tasdiqlanganKredit} kredit: «${v.nomi}». QR-sertifikat ${sert.seriya} ${sert.raqam} tayyor.`, 'ok', '/xodim/kreditlar', ctx)
  audit(db, null, 'Kredit yozuvi (avtomatik)', 'KreditYozuvi', n.id, undefined, { kredit: v.tasdiqlanganKredit })
  return 'kredit'
}

export function sertifikatYarat(db: DB, ctx: Ctx, d: { turi: T.HujjatTuri; personId: T.ID; kurs: string; provider: string; sana: string; soat: number; kredit: number; natijaId?: T.ID; kochirilgan?: string }) {
  const s = shaxs(db, d.personId)!
  const seriya = { UKR: 'UKR', DIPLOM: 'RZD', PSV: 'PSV', KOMPETENSIYA: 'QKS' }[d.turi]
  const r = keyingiRaqam(db, 'sert-' + seriya)
  const raqam = `${d.sana.slice(0, 4)}-${String(r).padStart(6, '0')}`
  const sert: T.Sertifikat = {
    id: uid('S'), turi: d.turi, seriya, raqam, qrKalit: fauxHash(seriya + raqam + s.id).slice(0, 20), personId: s.id, fio: toliqFio(s), kurs: d.kurs,
    provider: d.provider, sana: d.sana, soat: d.soat, kredit: d.kredit, natijaId: d.natijaId, holat: 'amalda', kochirilgan: d.kochirilgan, shablonVersiya: db.sozlamalar.sertifikatShablon.versiya,
  }
  db.sertifikatlar.push(sert)
  db.hodisalar.unshift({ id: `sr-${sert.id}`, turi: 'sertifikat_yaratildi', manbaId: sert.id, vaqt: ctx.vaqt, holat: 'qayta_ishlandi' })
  return sert
}

export function tekshiruvniHal(db: DB, ctx: Ctx, natijaId: T.ID, qaror: 'kredit' | 'rad', izoh: string) {
  talabRol(ctx, 'markaz_rahbar')
  const n = db.natijalar.find((x) => x.id === natijaId)
  if (!n || n.holat !== 'tekshiruvda') throw new QoidaXatosi(422, 'Natija tekshiruvda emas.')
  if (!izoh.trim()) throw new QoidaXatosi(422, 'Qaror asosini kiriting.')
  const y = yozilish(db, n.yozilishId)!
  if (qaror === 'rad') {
    n.holat = 'tasdiqlangan'
    n.tekshiruvSababi = [...(n.tekshiruvSababi ?? []), `Rad etildi: ${izoh}`]
    xabarShaxsga(db, y.personId, `Natijangiz boʻyicha kredit berilmadi: ${izoh}. Murojaat yuborishingiz mumkin.`, 'warn', '/xodim/arizalar', ctx)
  } else {
    // vakolatli qaror bilan tekshiruvdan oʻtkazish: majburiy tekshiruvlarni qayta bajarmasdan kredit yozish
    const o = oqim(db, y.oqimId)!
    const v = versiya(db, o.versiyaId)!
    const p = provayder(db, o.providerId)!
    const q = amaldagiQoida(db.qoidalar, ctx.vaqt) ?? db.qoidalar[0]
    if (db.jurnal.some((j) => j.manba === 'natija' && j.manbaId === n.id)) throw new QoidaXatosi(409, 'Bu natija uchun kredit allaqachon mavjud.')
    const sert = sertifikatYarat(db, ctx, { turi: 'UKR', personId: y.personId, kurs: v.nomi, provider: p.nomi, sana: bugunSana(ctx), soat: v.soatNazariy + v.soatAmaliy, kredit: v.tasdiqlanganKredit ?? 0, natijaId: n.id })
    db.seq++
    db.jurnal.push({ id: uid('K'), seq: db.seq, personId: y.personId, yil: Number(ctx.vaqt.slice(0, 4)), miqdor: v.tasdiqlanganKredit ?? 0, kursTuri: v.kursTuri, yonalish: v.yonalish, tadbirTuri: v.tadbirTuri, manba: 'natija', manbaId: n.id, nomi: v.nomi, providerNomi: p.nomi, qoidaId: q.id, sana: ctx.vaqt, asos: `Tekshiruv qarori: ${izoh}`, sertifikatId: sert.id, yaratuvchi: ctx.user.fio })
    n.holat = 'tasdiqlangan'
    xabarShaxsga(db, y.personId, `Tekshiruv yakunlandi: «${v.nomi}» uchun kredit yozildi.`, 'ok', '/xodim/kreditlar', ctx)
  }
  audit(db, ctx, `Tekshiruvdagi natija: ${qaror}`, 'YakuniyNatija', n.id, undefined, { izoh })
}

/** LMS adapteri / provayder API: POST /api/ukr/v1/results imitatsiyasi. */
export function lmsNatija(db: DB, ctx: Ctx, body: { event_id: string; cohort_id: string; jshshir: string; result: 'passed' | 'failed'; score: number }) {
  const o = db.oqimlar.find((x) => x.kod === body.cohort_id)
  if (!o) return { http: 422, status: 'rejected', reason: 'cohort_id topilmadi' }
  const s = db.shaxslar.find((x) => x.jshshir === body.jshshir)
  if (!s) return { http: 422, status: 'rejected', reason: 'person topilmadi' }
  const y = db.yozilishlar.find((x) => x.oqimId === o.id && x.personId === s.id && !['rad_etildi', 'chiqdi'].includes(x.holat))
  if (!y) return { http: 422, status: 'rejected', reason: 'tinglovchi oqimda emas' }
  if (db.hodisalar.some((h) => h.id === body.event_id)) {
    db.hodisalar.unshift({ id: body.event_id + '#' + Math.random().toString(36).slice(2, 6), turi: 'lms_natija', manbaId: y.id, vaqt: ctx.vaqt, holat: 'takror_eʼtiborsiz', izoh: '409 — takror event_id' })
    return { http: 409, status: 'accepted', reason: 'takror — avval qabul qilingan' }
  }
  db.hodisalar.unshift({ id: body.event_id, turi: 'lms_natija', manbaId: y.id, vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: `LMS: ${body.result} ${body.score}` })
  db.baholashlar.push({ id: uid('B'), yozilishId: y.id, turi: 'test', ball: body.score, otishBali: 70, otdi: body.result === 'passed' && body.score >= 70, baholovchi: 'LMS', sana: ctx.vaqt, manba: 'LMS' })
  if (!db.davomat.some((d) => d.yozilishId === y.id)) o.mashgulotlar.forEach((m) => db.davomat.push({ id: uid('D'), yozilishId: y.id, mashgulotId: m.id, usul: 'LMS', holat: 'keldi', vaqt: ctx.vaqt, kiritgan: 'LMS' }))
  if (y.holat === 'qabul_qilindi') y.holat = 'oqimoqda'
  return { http: 200, status: 'pending', reason: 'Natija qabul qilindi — provayder rahbari tasdiqlashi kutilmoqda' }
}

// ───────────────────────── 4.2.5 Dasturlar va oqimlar ─────────────────────────
export function dasturSaqla(db: DB, ctx: Ctx, d: Partial<T.DasturVersiya> & { nomi: string; kod?: string }, dasturId?: T.ID) {
  talabRol(ctx, 'provayder_operator', 'provayder_rahbar')
  const pid = ctx.user.providerId!
  if (!d.nomi?.trim()) throw new QoidaXatosi(422, 'Dastur nomini kiriting.')
  if (!d.mutaxassisliklar?.length) throw new QoidaXatosi(422, 'Kamida bitta mutaxassislikni tanlang.')
  if (!d.soralganKredit || d.soralganKredit <= 0) throw new QoidaXatosi(422, 'Soʻralgan kredit musbat son boʻlishi kerak.')
  if (dasturId) {
    const ds = db.dasturlar.find((x) => x.id === dasturId)
    if (!ds || ds.providerId !== pid) throw new QoidaXatosi(403, 'Boshqa provayder dasturini tahrirlab boʻlmaydi.')
    const oxirgi = versiya(db, ds.versiyalar[ds.versiyalar.length - 1])!
    if ('tasdiqlanganKredit' in d && d.tasdiqlanganKredit !== oxirgi.tasdiqlanganKredit) {
      throw new QoidaXatosi(403, 'Tasdiqlangan kredit qiymatini provayder oʻzgartira olmaydi. Oʻzgartirish faqat qayta akkreditatsiya orqali.')
    }
    if (oxirgi.holat === 'qoralama' || oxirgi.holat === 'rad_etilgan') {
      Object.assign(oxirgi, d, { holat: 'qoralama' })
      audit(db, ctx, 'Dastur qoralamasi saqlandi', 'Dastur', ds.id)
      return oxirgi
    }
    // tasdiqlangan versiya mazmuni oʻzgarsa — yangi versiya (eski oqimlar eski versiyada qoladi)
    const yangi: T.DasturVersiya = { ...oxirgi, ...d, id: uid('V'), versiya: oxirgi.versiya + 1, holat: 'qoralama', tasdiqlanganKredit: undefined, amalMuddati: undefined, yaratilgan: ctx.vaqt }
    db.versiyalar.push(yangi)
    ds.versiyalar.push(yangi.id)
    audit(db, ctx, `Dasturning yangi versiyasi v${yangi.versiya}`, 'Dastur', ds.id)
    return yangi
  }
  const ds: T.Dastur = { id: uid('DS'), providerId: pid, kod: d.kod || `P${pid.slice(-3)}-${keyingiRaqam(db, 'dastur-' + pid)}`, versiyalar: [] }
  const v: T.DasturVersiya = {
    id: uid('V'), dasturId: ds.id, versiya: 1, nomi: d.nomi, mutaxassisliklar: d.mutaxassisliklar ?? [], maqsad: d.maqsad ?? '', natijalar: d.natijalar ?? [], tinglovchi: d.tinglovchi ?? 'oliy',
    soatNazariy: d.soatNazariy ?? 0, soatAmaliy: d.soatAmaliy ?? 0, shakl: d.shakl ?? 'oflayn', tadbirTuri: d.tadbirTuri ?? 'kurs', kursTuri: d.kursTuri ?? 'tanlov', yonalish: d.yonalish ?? 'nazariy',
    baholash: d.baholash ?? ['test'], oqituvchilar: d.oqituvchilar ?? [], klinikBaza: d.klinikBaza, til: d.til ?? 'oʻzbek', soralganKredit: d.soralganKredit, holat: 'qoralama', darslar: d.darslar ?? [], yaratilgan: ctx.vaqt,
  }
  ds.versiyalar.push(v.id)
  db.dasturlar.push(ds)
  db.versiyalar.push(v)
  audit(db, ctx, 'Yangi dastur', 'Dastur', ds.id, undefined, { nomi: v.nomi })
  return v
}

export function oqimSaqla(db: DB, ctx: Ctx, d: Partial<T.Oqim> & { versiyaId: T.ID }, id?: T.ID) {
  talabRol(ctx, 'provayder_operator', 'provayder_rahbar')
  const v = versiya(db, d.versiyaId)
  const p = provayder(db, ctx.user.providerId)
  if (!v || !p) throw new QoidaXatosi(422, 'Dastur topilmadi.')
  const ds = db.dasturlar.find((x) => x.id === v.dasturId)!
  if (ds.providerId !== p.id) throw new QoidaXatosi(403, 'Boshqa provayder dasturi uchun oqim ochib boʻlmaydi.')
  if (v.holat !== 'tasdiqlangan') throw new QoidaXatosi(422, 'Oqim faqat akkreditatsiyasi amaldagi (tasdiqlangan) dastur versiyasi uchun ochiladi.')
  if (!akkFaolmi(p)) throw new QoidaXatosi(422, 'Provayder akkreditatsiyasi amalda emas — yangi oqim ochib boʻlmaydi.')
  if (!d.boshlanish || !d.tugash || d.tugash < d.boshlanish) throw new QoidaXatosi(422, 'Boshlanish va tugash sanalarini toʻgʻri kiriting.')
  if (!d.orinlar || d.orinlar < 1) throw new QoidaXatosi(422, 'Oʻrinlar soni kamida 1.')
  if (id) {
    const o = oqim(db, id)!
    if (o.providerId !== p.id) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
    Object.assign(o, d)
    audit(db, ctx, 'Oqim tahrirlandi', 'Oqim', o.id)
    return o
  }
  const n = keyingiRaqam(db, 'oqim')
  const kunlar = Math.max(1, Math.round((new Date(d.tugash).getTime() - new Date(d.boshlanish).getTime()) / 86400000) + 1)
  const o: T.Oqim = {
    id: uid('O'), kod: `C-${d.boshlanish.slice(0, 4)}-${String(n).padStart(4, '0')}`, providerId: p.id, versiyaId: v.id, boshlanish: d.boshlanish, tugash: d.tugash, qabulTugash: d.qabulTugash ?? d.boshlanish,
    joy: d.joy ?? '', havola: d.havola, hududId: d.hududId ?? p.hududId ?? 'R01', orinlar: d.orinlar, oqituvchi: d.oqituvchi ?? v.oqituvchilar[0] ?? '', moliya: d.moliya ?? 'byudjet', narx: d.narx ?? 0, holat: 'qoralama', story: !!d.story,
    mashgulotlar: Array.from({ length: Math.min(kunlar, 12) }, (_, i) => {
      const s = new Date(d.boshlanish! + 'T10:00:00+05:00')
      s.setDate(s.getDate() + i)
      return { id: uid('MS'), sana: s.toISOString(), mavzu: v.natijalar[i % Math.max(1, v.natijalar.length)] ?? `Mashgʻulot ${i + 1}`, qrKod: `ETTP-QR-${n}-${i + 1}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` }
    }),
    yaratilgan: ctx.vaqt,
  }
  db.oqimlar.push(o)
  audit(db, ctx, 'Yangi oqim', 'Oqim', o.id, undefined, { kod: o.kod })
  return o
}

export function oqimHolati(db: DB, ctx: Ctx, oqimId: T.ID, holat: T.OqimHolat) {
  talabRol(ctx, 'provayder_operator', 'provayder_rahbar')
  const o = provayderniki(db, ctx, oqimId)
  if (holat === 'elon_qilingan') {
    const v = versiya(db, o.versiyaId)!
    if (v.holat !== 'tasdiqlangan' || !akkFaolmi(provayder(db, o.providerId))) throw new QoidaXatosi(422, 'Akkreditatsiyasi amalda boʻlmagan dastur katalogga chiqmaydi.')
    // mos xodimlarga yangi kurs eʼloni
    if (o.story) {
      db.foydalanuvchilar.filter((u) => u.rol === 'xodim').forEach((u) => {
        const s = shaxs(db, u.personId)
        if (s && mosmi(db, s, v).ok) xabar(db, u.id, `Yangi kurs: «${v.nomi}» — ${o.boshlanish}`, 'info', '/xodim/oquv', ctx.vaqt)
      })
    }
  }
  const eski = o.holat
  o.holat = holat
  audit(db, ctx, `Oqim holati: ${holat}`, 'Oqim', o.id, eski, holat)
}

export function oqimNusxa(db: DB, ctx: Ctx, oqimId: T.ID) {
  const o = provayderniki(db, ctx, oqimId)
  const bosh = new Date(o.boshlanish)
  bosh.setMonth(bosh.getMonth() + 2)
  const tug = new Date(o.tugash)
  tug.setMonth(tug.getMonth() + 2)
  return oqimSaqla(db, ctx, { ...o, boshlanish: bosh.toISOString().slice(0, 10), tugash: tug.toISOString().slice(0, 10), qabulTugash: bosh.toISOString().slice(0, 10), versiyaId: o.versiyaId })
}

// ───────────────────────── 4.2.10 Akkreditatsiya ─────────────────────────
export function akkArizaYarat(db: DB, ctx: Ctx, turi: T.AkkAriza['turi'], versiyaId?: T.ID) {
  talabRol(ctx, 'provayder_rahbar', 'provayder_operator')
  const pid = ctx.user.providerId!
  if (turi !== 'provayder' && !versiyaId) throw new QoidaXatosi(422, 'Dasturni tanlang.')
  const ochiq = db.akkArizalar.find((a) => a.providerId === pid && a.versiyaId === versiyaId && a.turi === turi && a.holat !== 'yakunlandi')
  if (ochiq) return ochiq
  // qayta akkreditatsiya — oldingi arizadan hujjatlar nusxasi
  const oldingi = turi === 'qayta' ? db.akkArizalar.filter((a) => a.providerId === pid && a.versiyaId === versiyaId).pop() : undefined
  const a: T.AkkAriza = {
    id: uid('AK'), raqam: `AK-${ctx.vaqt.slice(0, 4)}-${String(keyingiRaqam(db, 'akk')).padStart(4, '0')}`, turi, providerId: pid, versiyaId, hujjatlar: oldingi ? { ...oldingi.hujjatlar } : {}, holat: 'qoralama',
    ekspertlar: [], varaqlar: [], muddat: '', tarix: [{ holat: 'qoralama', sana: ctx.vaqt, kim: ctx.user.fio }], yaratilgan: ctx.vaqt,
  }
  db.akkArizalar.push(a)
  audit(db, ctx, 'Akkreditatsiya arizasi yaratildi', 'AkkAriza', a.id)
  return a
}

export function akkFayl(db: DB, ctx: Ctx, arizaId: T.ID, kod: string, fayl: T.Fayl | undefined) {
  const a = db.akkArizalar.find((x) => x.id === arizaId)
  if (!a || a.providerId !== ctx.user.providerId) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  if (!['qoralama', 'kamchilik'].includes(a.holat)) throw new QoidaXatosi(422, 'Yuborilgan arizaga fayl qoʻshib boʻlmaydi.')
  if (fayl && fayl.hajm > 50 * 1024 * 1024) throw new QoidaXatosi(422, 'Fayl hajmi 50 MB dan oshmasligi kerak.')
  a.hujjatlar[kod] = fayl
}

export function akkYubor(db: DB, ctx: Ctx, arizaId: T.ID) {
  talabRol(ctx, 'provayder_rahbar')
  const a = db.akkArizalar.find((x) => x.id === arizaId)
  if (!a || a.providerId !== ctx.user.providerId) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  const yetmaydi = AKK_HUJJATLAR[a.turi].filter((h) => h.majburiy && !a.hujjatlar[h.kod]).map((h) => h.nomi)
  if (yetmaydi.length) throw new QoidaXatosi(422, `Majburiy hujjatlar yuklanmagan: ${yetmaydi.join('; ')}`)
  a.holat = 'toliqlik'
  a.yuborilgan = ctx.vaqt
  a.muddat = ishKuniQosh(ctx.vaqt, db.sozlamalar.muddatlar.akkKorib, db.sozlamalar.bayramlar)
  a.tarix.push({ holat: 'yuborildi', sana: ctx.vaqt, kim: ctx.user.fio, izoh: eriImzo(ctx, a.raqam) })
  if (a.versiyaId) {
    const v = versiya(db, a.versiyaId)!
    v.holat = 'korib_chiqishda'
  }
  const p = provayder(db, a.providerId)!
  if (a.turi === 'provayder' && p.holat !== 'akkreditatsiyalangan') p.holat = 'korib_chiqilmoqda'
  xabarRolga(db, 'markaz_mutaxassis', `Yangi akkreditatsiya arizasi ${a.raqam} — ${p.qisqa}`, '/markaz/akkreditatsiya', ctx)
  audit(db, ctx, 'Akkreditatsiya arizasi yuborildi (ERI)', 'AkkAriza', a.id)
}

export function akkToliqlik(db: DB, ctx: Ctx, arizaId: T.ID, ok: boolean, izoh: string) {
  talabRol(ctx, 'markaz_mutaxassis')
  const a = db.akkArizalar.find((x) => x.id === arizaId)!
  if (a.holat !== 'toliqlik') throw new QoidaXatosi(422, 'Ariza toʻliqlik tekshiruvi bosqichida emas.')
  if (!ok && !izoh.trim()) throw new QoidaXatosi(422, 'Kamchiliklarni izohda koʻrsating.')
  a.holat = ok ? 'ekspertiza' : 'kamchilik'
  a.izoh = izoh
  a.tarix.push({ holat: a.holat, sana: ctx.vaqt, kim: ctx.user.fio, izoh })
  db.foydalanuvchilar.filter((u) => u.providerId === a.providerId).forEach((u) =>
    xabar(db, u.id, ok ? `${a.raqam}: toʻliqlik tekshiruvidan oʻtdi, ekspertizaga yuborildi` : `${a.raqam}: kamchiliklar bor — ${izoh}`, ok ? 'ok' : 'warn', '/provayder/akkreditatsiya', ctx.vaqt))
  audit(db, ctx, ok ? 'Toʻliqlik: oʻtdi' : 'Toʻliqlik: qaytarildi', 'AkkAriza', a.id, undefined, { izoh })
}

export function akkQaytaYubor(db: DB, ctx: Ctx, arizaId: T.ID) {
  const a = db.akkArizalar.find((x) => x.id === arizaId)!
  if (a.holat !== 'kamchilik') throw new QoidaXatosi(422, 'Ariza kamchilik holatida emas.')
  a.holat = 'qoralama'
  return akkYubor(db, ctx, arizaId)
}

export function ekspertNomzodlar(db: DB, arizaId: T.ID) {
  const a = db.akkArizalar.find((x) => x.id === arizaId)!
  return db.ekspertlar.map((e) => {
    const toqnashuv = e.ishJoyiProviderId === a.providerId || e.deklaratsiya.some((d) => d.providerId === a.providerId)
    return { e, toqnashuv, sabab: toqnashuv ? (e.ishJoyiProviderId === a.providerId ? 'Ish joyi — ariza beruvchi provayder' : e.deklaratsiya.find((d) => d.providerId === a.providerId)?.sabab) : undefined }
  })
}

export function ekspertBiriktir(db: DB, ctx: Ctx, arizaId: T.ID, ekspertIds: T.ID[]) {
  talabRol(ctx, 'markaz_mutaxassis', 'markaz_rahbar')
  const a = db.akkArizalar.find((x) => x.id === arizaId)!
  if (a.holat !== 'ekspertiza') throw new QoidaXatosi(422, 'Ekspert faqat ekspertiza bosqichida biriktiriladi.')
  const n = ekspertNomzodlar(db, arizaId)
  for (const id of ekspertIds) {
    const x = n.find((k) => k.e.id === id)
    if (!x) throw new QoidaXatosi(422, 'Ekspert topilmadi.')
    if (x.toqnashuv) {
      throw new QoidaXatosi(403, `${x.e.fio}: manfaatlar toʻqnashuvi (${x.sabab}). Biriktirish bloklandi.`)
    }
  }
  a.ekspertlar = Array.from(new Set([...a.ekspertlar, ...ekspertIds]))
  a.tarix.push({ holat: 'ekspertiza', sana: ctx.vaqt, kim: ctx.user.fio, izoh: `Ekspertlar biriktirildi: ${ekspertIds.length}` })
  ekspertIds.forEach((id) => db.foydalanuvchilar.filter((u) => u.rol === 'ekspert' && u.personId === db.ekspertlar.find((e) => e.id === id)?.personId).forEach((u) => xabar(db, u.id, `Sizga ${a.raqam} arizasi biriktirildi`, 'info', '/ekspert/arizalar', ctx.vaqt)))
  audit(db, ctx, 'Ekspertlar biriktirildi', 'AkkAriza', a.id, undefined, { ekspertIds })
}

export function joriyEkspert(db: DB, ctx: Ctx) {
  return db.ekspertlar.find((e) => e.personId === ctx.user.personId)
}

export function varaqTopshir(db: DB, ctx: Ctx, arizaId: T.ID, varaq: Omit<T.EkspertizaVaraq, 'ekspertId' | 'topshirilgan'>) {
  talabRol(ctx, 'ekspert')
  const e = joriyEkspert(db, ctx)
  const a = db.akkArizalar.find((x) => x.id === arizaId)
  if (!e || !a || !a.ekspertlar.includes(e.id)) throw new QoidaXatosi(403, 'Bu ariza sizga biriktirilmagan.')
  if (a.holat !== 'ekspertiza') throw new QoidaXatosi(422, 'Ekspertiza bosqichi yakunlangan.')
  if (Object.values(varaq.mezonlar).some((b) => b === undefined || b < 1)) throw new QoidaXatosi(422, 'Barcha mezonlarni 1–5 ball bilan baholang.')
  if (!varaq.xulosa.trim()) throw new QoidaXatosi(422, 'Xulosa matnini kiriting.')
  a.varaqlar = a.varaqlar.filter((v) => v.ekspertId !== e.id)
  a.varaqlar.push({ ...varaq, ekspertId: e.id, topshirilgan: ctx.vaqt })
  a.tarix.push({ holat: 'ekspertiza', sana: ctx.vaqt, kim: ctx.user.fio, izoh: 'Ekspertiza varagʻi topshirildi' })
  xabarRolga(db, 'markaz_mutaxassis', `${a.raqam}: ${e.fio} ekspertiza varagʻini topshirdi`, '/markaz/akkreditatsiya', ctx)
  audit(db, ctx, 'Ekspertiza varagʻi', 'AkkAriza', a.id)
}

export function varaqBali(v: T.EkspertizaVaraq) {
  const b = Object.values(v.mezonlar)
  return b.length ? Math.round((b.reduce((a, x) => a + x, 0) / (b.length * 5)) * 100) : 0
}

export function joyidaTekshiruv(db: DB, ctx: Ctx, arizaId: T.ID, d: NonNullable<T.AkkAriza['joyida']>) {
  talabRol(ctx, 'markaz_mutaxassis')
  const a = db.akkArizalar.find((x) => x.id === arizaId)!
  if (!['ekspertiza', 'joyida'].includes(a.holat)) throw new QoidaXatosi(422, 'Joyida tekshiruv ekspertizadan keyin belgilanadi.')
  a.joyida = d
  a.holat = d.xulosa ? 'komissiya' : 'joyida'
  a.tarix.push({ holat: a.holat, sana: ctx.vaqt, kim: ctx.user.fio, izoh: d.xulosa ? 'Joyida tekshiruv dalolatnomasi' : `Joyida tekshiruv: ${d.sana}` })
  audit(db, ctx, 'Joyida tekshiruv', 'AkkAriza', a.id)
}

export function komissiyagaYubor(db: DB, ctx: Ctx, arizaId: T.ID) {
  talabRol(ctx, 'markaz_mutaxassis')
  const a = db.akkArizalar.find((x) => x.id === arizaId)!
  if (a.varaqlar.length < 2) throw new QoidaXatosi(422, 'Ikki ekspert varagʻi topshirilmaguncha komissiyaga yuborib boʻlmaydi.')
  const b = a.varaqlar.map(varaqBali)
  if (Math.max(...b) - Math.min(...b) > 25 && a.varaqlar.length < 3) throw new QoidaXatosi(422, `Ekspertlar ballari orasidagi farq katta (${Math.max(...b) - Math.min(...b)}%). Uchinchi ekspertni biriktiring.`)
  a.holat = 'komissiya'
  a.tarix.push({ holat: 'komissiya', sana: ctx.vaqt, kim: ctx.user.fio })
  xabarRolga(db, 'markaz_rahbar', `${a.raqam} komissiya qaroriga tayyor`, '/markaz/akkreditatsiya', ctx)
  audit(db, ctx, 'Komissiyaga yuborildi', 'AkkAriza', a.id)
}

export function akkQaror(db: DB, ctx: Ctx, arizaId: T.ID, q: { turi: NonNullable<T.AkkAriza['qaror']>['turi']; raqam: string; muddat?: string; sabab: string; kredit?: number; komissiya: NonNullable<T.AkkAriza['komissiya']> }) {
  talabRol(ctx, 'markaz_rahbar')
  const a = db.akkArizalar.find((x) => x.id === arizaId)!
  if (a.holat !== 'komissiya') throw new QoidaXatosi(422, 'Qaror faqat komissiya bosqichida qabul qilinadi.')
  if (!q.raqam.trim() || !q.sabab.trim()) throw new QoidaXatosi(422, 'Qaror raqami va asosini kiriting.')
  const jami = q.komissiya.ovozlar.za + q.komissiya.ovozlar.qarshi + q.komissiya.ovozlar.betaraf
  if (jami < Math.ceil(q.komissiya.azolar.length * 2 / 3)) throw new QoidaXatosi(422, `Kvorum yoʻq: ${jami} ovoz, kerak ≥ ${Math.ceil(q.komissiya.azolar.length * 2 / 3)}.`)
  if ((q.turi === 'akkreditatsiya' || q.turi === 'shartli') && !q.muddat) throw new QoidaXatosi(422, 'Akkreditatsiya muddatini kiriting.')
  if (a.turi !== 'provayder' && (q.turi === 'akkreditatsiya' || q.turi === 'shartli') && !(q.kredit && q.kredit > 0)) throw new QoidaXatosi(422, 'Dastur uchun tasdiqlangan kredit qiymatini kiriting.')
  a.komissiya = q.komissiya
  a.qaror = { turi: q.turi, raqam: q.raqam, sana: ctx.vaqt, muddat: q.muddat, sabab: q.sabab, kredit: q.kredit, eri: eriImzo(ctx, q.raqam), tasdiqlovchi: ctx.user.id }
  a.holat = 'yakunlandi'
  a.tarix.push({ holat: 'yakunlandi', sana: ctx.vaqt, kim: ctx.user.fio, qaror: q.raqam, izoh: q.turi })
  const p = provayder(db, a.providerId)!
  const yangiHolat: T.AkkHolat | undefined = q.turi === 'akkreditatsiya' ? 'akkreditatsiyalangan' : q.turi === 'shartli' ? 'shartli' : undefined
  if (a.turi === 'provayder') {
    if (yangiHolat) {
      p.holat = yangiHolat
      p.qaror = { raqam: q.raqam, sana: ctx.vaqt.slice(0, 10), muddat: q.muddat! }
    } else if (q.turi === 'rad') p.holat = p.qaror ? p.holat : 'ariza'
    p.tarix.push({ holat: p.holat, sana: ctx.vaqt, kim: ctx.user.fio, qaror: q.raqam, izoh: q.sabab })
  } else if (a.versiyaId) {
    const v = versiya(db, a.versiyaId)!
    if (yangiHolat) {
      v.holat = 'tasdiqlangan'
      v.tasdiqlanganKredit = q.kredit
      v.amalMuddati = q.muddat
      // oldingi tasdiqlangan versiyalar yangi oqim uchun yopiladi, mavjud oqimlar eski versiyada qoladi
      db.versiyalar.filter((x) => x.dasturId === v.dasturId && x.id !== v.id && x.holat === 'tasdiqlangan').forEach((x) => (x.holat = 'arxiv'))
    } else if (q.turi === 'rad') v.holat = 'rad_etilgan'
  }
  db.hodisalar.unshift({ id: `qr-${a.id}`, turi: 'qaror_tasdiqlandi', manbaId: a.id, vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: 'Reestr avtomatik yangilandi' })
  db.foydalanuvchilar.filter((u) => u.providerId === a.providerId).forEach((u) => xabar(db, u.id, `${a.raqam}: qaror — ${q.turi === 'akkreditatsiya' ? 'akkreditatsiya berildi' : q.turi === 'shartli' ? 'shartli akkreditatsiya' : q.turi === 'rad' ? 'rad etildi' : 'qoʻshimcha tekshiruv'} (${q.raqam})`, q.turi === 'rad' ? 'warn' : 'ok', '/provayder/akkreditatsiya', ctx.vaqt))
  audit(db, ctx, 'Akkreditatsiya qarori (ERI)', 'AkkAriza', a.id, undefined, a.qaror)
}

/** 4.2.9: qogʻozdagi qaror asosida reestr holatini qoʻlda oʻzgartirish (1-bosqich) yoki toʻxtatish/bekor/tiklash. */
export function provayderHolati(db: DB, ctx: Ctx, providerId: T.ID, holat: T.AkkHolat, qaror: { raqam: string; sana: string; muddat?: string; hujjat?: string; sabab: string }) {
  talabRol(ctx, 'markaz_rahbar')
  if (!qaror.raqam.trim() || !qaror.sabab.trim()) throw new QoidaXatosi(422, 'Qaror raqami va sababi majburiy — holat qarorsiz oʻzgarmaydi.')
  const p = provayder(db, providerId)!
  const eski = p.holat
  p.holat = holat
  if (holat === 'akkreditatsiyalangan' || holat === 'shartli') p.qaror = { raqam: qaror.raqam, sana: qaror.sana, muddat: qaror.muddat ?? '' }
  p.tarix.push({ holat, sana: ctx.vaqt, kim: ctx.user.fio, qaror: qaror.raqam, izoh: qaror.sabab })
  db.foydalanuvchilar.filter((u) => u.providerId === p.id).forEach((u) => xabar(db, u.id, `Reestr holati oʻzgardi: ${holat} (${qaror.raqam})`, holat === 'toxtatilgan' || holat === 'bekor' ? 'err' : 'info', '/provayder', ctx.vaqt))
  audit(db, ctx, 'Provayder holati (qaror asosida)', 'Provayder', p.id, eski, { holat, ...qaror })
}

export function provayderRoyxat(db: DB, ctx: Ctx, d: Partial<T.Provayder> & { stir: string; nomi: string; turi: T.Provayder['turi'] }) {
  talabRol(ctx, 'markaz_mutaxassis', 'markaz_rahbar')
  if (d.turi !== 'xorijiy' && !/^\d{9}$/.test(d.stir)) throw new QoidaXatosi(422, 'STIR 9 raqamdan iborat boʻlishi kerak.')
  if (db.provayderlar.some((p) => p.stir === d.stir)) throw new QoidaXatosi(409, 'Bu STIR boʻyicha provayder reestrda allaqachon bor (bitta STIR — bitta yozuv).')
  const p: T.Provayder = {
    id: uid('P'), stir: d.stir, nomi: d.nomi, qisqa: d.qisqa || d.nomi.split(' ').slice(0, 3).join(' '), turi: d.turi, mamlakat: d.mamlakat ?? 'Oʻzbekiston', hududId: d.hududId, manzil: d.manzil ?? '',
    litsenziya: d.litsenziya, xorijiyAkk: d.xorijiyAkk, filiallar: d.filiallar ?? [], masullar: d.masullar ?? [], holat: 'ariza', tarix: [{ holat: 'ariza', sana: ctx.vaqt, kim: ctx.user.fio, izoh: 'Reestrga kiritildi' }], yaratilgan: ctx.vaqt,
  }
  db.provayderlar.push(p)
  audit(db, ctx, 'Provayder roʻyxatga olindi', 'Provayder', p.id, undefined, { stir: p.stir })
  return p
}

// ───────────────────────── 4.2.11 Kredit qoidalari ─────────────────────────
export function qoidaSaqla(db: DB, ctx: Ctx, d: Omit<T.KreditQoidasi, 'id' | 'holat' | 'muallif' | 'yaratilgan'>, id?: T.ID) {
  talabRol(ctx, 'markaz_mutaxassis')
  if (!d.hujjat.nomi.trim() || !d.hujjat.raqam.trim()) throw new QoidaXatosi(422, 'Meʼyoriy hujjat nomi va raqamini kiriting.')
  const p = d.params
  if ([p.majburiyUlush, p.amaliyUlush, p.otkazishUlush].some((x) => x < 0 || x > 1)) throw new QoidaXatosi(422, 'Ulushlar 0 dan 100% gacha boʻlishi kerak.')
  if (id) {
    const q = db.qoidalar.find((x) => x.id === id)!
    if (q.holat !== 'qoralama' && q.holat !== 'rad_etilgan') throw new QoidaXatosi(422, 'Faqat qoralamani tahrirlash mumkin. Amaldagi qoida oʻzgarmaydi — yangi versiya yarating.')
    Object.assign(q, d, { holat: 'qoralama' })
    audit(db, ctx, 'Qoida qoralamasi saqlandi', 'KreditQoidasi', q.id)
    return q
  }
  const q: T.KreditQoidasi = { ...d, id: uid('Q'), holat: 'qoralama', muallif: ctx.user.id, yaratilgan: ctx.vaqt }
  db.qoidalar.push(q)
  audit(db, ctx, 'Yangi qoida versiyasi', 'KreditQoidasi', q.id, undefined, { versiya: q.versiya })
  return q
}

export function qoidaYubor(db: DB, ctx: Ctx, id: T.ID) {
  talabRol(ctx, 'markaz_mutaxassis')
  const q = db.qoidalar.find((x) => x.id === id)!
  if (q.holat !== 'qoralama') throw new QoidaXatosi(422, 'Faqat qoralama koʻrib chiqishga yuboriladi.')
  q.holat = 'korib_chiqishda'
  xabarRolga(db, 'markaz_rahbar', `Kredit qoidasi ${q.versiya} tasdiqlashga yuborildi`, '/markaz/qoidalar', ctx)
  audit(db, ctx, 'Qoida koʻrib chiqishga yuborildi', 'KreditQoidasi', q.id)
}

export function qoidaTasdiqla(db: DB, ctx: Ctx, id: T.ID, ok: boolean, izoh = '') {
  talabRol(ctx, 'markaz_rahbar')
  const q = db.qoidalar.find((x) => x.id === id)!
  if (q.holat !== 'korib_chiqishda') throw new QoidaXatosi(422, 'Qoida koʻrib chiqish bosqichida emas.')
  ikkiShaxs(ctx, q.muallif, 'qoida')
  if (!ok) {
    q.holat = 'rad_etilgan'
    q.izoh = izoh
    audit(db, ctx, 'Qoida rad etildi', 'KreditQoidasi', q.id, undefined, { izoh })
    return
  }
  q.tasdiqlovchi = ctx.user.id
  const bugun = bugunSana(ctx)
  if (q.kuchgaKirish <= bugun) {
    // amaldagi versiyani yopish (yangi qoida oʻtgan davrni qayta yozmaydi)
    db.qoidalar.filter((x) => x.holat === 'amalda' && x.id !== q.id).forEach((x) => {
      const d = new Date(q.kuchgaKirish)
      d.setDate(d.getDate() - 1)
      x.tugash = d.toISOString().slice(0, 10)
      x.holat = 'arxiv'
    })
    q.holat = 'amalda'
  } else q.holat = 'tasdiqlangan'
  xabar(db, q.muallif, `Qoida ${q.versiya} tasdiqlandi (${q.holat === 'amalda' ? 'amalda' : 'kuchga kirish: ' + q.kuchgaKirish})`, 'ok', '/markaz/qoidalar', ctx.vaqt)
  audit(db, ctx, 'Qoida tasdiqlandi (ERI)', 'KreditQoidasi', q.id, undefined, { holat: q.holat })
}

/** Simulyatsiya: yangi versiya kuchga kirsa, qancha xodimning yillik holati oʻzgaradi. */
export function simulyatsiya(db: DB, qoida: T.KreditQoidasi, yil: number, bugun: string) {
  const joriy = amaldagiQoida(db.qoidalar, bugun) ?? db.qoidalar[0]
  let bajarganOldin = 0, bajarganKeyin = 0, ozgardi = 0
  const misollar: { fio: string; oldin: string; keyin: string }[] = []
  for (const s of db.shaxslar) {
    if (!db.mehnat.some((m) => m.personId === s.id)) continue
    const a = yillikHolat({ shaxs: s, yil, yozuvlar: db.jurnal, qoida: joriy, bugun })
    const b = yillikHolat({ shaxs: s, yil, yozuvlar: db.jurnal, qoida: { ...qoida, id: 'sim' }, bugun })
    if (a.natija === 'bajarildi') bajarganOldin++
    if (b.natija === 'bajarildi') bajarganKeyin++
    if (a.natija !== b.natija || a.T !== b.T) {
      ozgardi++
      if (misollar.length < 8) misollar.push({ fio: qisqaFio(s), oldin: `${a.X}/${a.T} ${a.natija}`, keyin: `${b.X}/${b.T} ${b.natija}` })
    }
  }
  return { jami: db.shaxslar.length, bajarganOldin, bajarganKeyin, ozgardi, misollar }
}

// ───────────────────────── 4.2.12 Kredit jurnali va tuzatishlar ─────────────────────────
export function tuzatishTaklif(db: DB, ctx: Ctx, d: { yozuvId: T.ID; turi: 'bekor' | 'almashtirish'; yangiMiqdor?: number; sabab: string; hujjat: string }) {
  talabRol(ctx, 'markaz_mutaxassis')
  const y = db.jurnal.find((x) => x.id === d.yozuvId)
  if (!y) throw new QoidaXatosi(422, 'Yozuv topilmadi.')
  if (y.miqdor < 0) throw new QoidaXatosi(422, 'Bekor qiluvchi yozuvni tuzatib boʻlmaydi.')
  if (db.jurnal.some((x) => x.bekorQilinganId === y.id)) throw new QoidaXatosi(409, 'Bu yozuv allaqachon bekor qilingan.')
  if (!d.sabab.trim() || !d.hujjat.trim()) throw new QoidaXatosi(422, 'Sabab va asos hujjat majburiy.')
  if (d.turi === 'almashtirish' && !(d.yangiMiqdor && d.yangiMiqdor > 0)) throw new QoidaXatosi(422, 'Yangi miqdorni kiriting.')
  const t: T.TuzatishSorovi = { id: uid('TZ'), yozuvId: y.id, personId: y.personId, turi: d.turi, yangiMiqdor: d.yangiMiqdor, sabab: d.sabab, hujjat: d.hujjat, taklifQilgan: ctx.user.id, holat: 'kutilmoqda', sana: ctx.vaqt }
  db.tuzatishlar.push(t)
  xabarRolga(db, 'markaz_rahbar', `Kredit tuzatish taklifi: ${y.nomi} (${y.miqdor} kredit)`, '/markaz/jurnal', ctx)
  audit(db, ctx, 'Tuzatish taklif qilindi', 'KreditYozuvi', y.id, undefined, d)
  return t
}

export function tuzatishQaror(db: DB, ctx: Ctx, id: T.ID, ok: boolean) {
  talabRol(ctx, 'markaz_rahbar')
  const t = db.tuzatishlar.find((x) => x.id === id)!
  if (t.holat !== 'kutilmoqda') throw new QoidaXatosi(422, 'Taklif allaqachon koʻrib chiqilgan.')
  ikkiShaxs(ctx, t.taklifQilgan, 'tuzatish')
  t.tasdiqlovchi = ctx.user.id
  if (!ok) {
    t.holat = 'rad_etildi'
    audit(db, ctx, 'Tuzatish rad etildi', 'TuzatishSorovi', t.id)
    return
  }
  const y = db.jurnal.find((x) => x.id === t.yozuvId)!
  db.seq++
  db.jurnal.push({ ...y, id: uid('K'), seq: db.seq, miqdor: -y.miqdor, manba: 'tuzatish', manbaId: t.id, sana: ctx.vaqt, asos: `Bekor qilish: ${t.sabab} (${t.hujjat})`, bekorQilinganId: y.id, yaratuvchi: ctx.user.fio })
  if (t.turi === 'almashtirish') {
    db.seq++
    db.jurnal.push({ ...y, id: uid('K'), seq: db.seq, miqdor: t.yangiMiqdor!, manba: 'tuzatish', manbaId: t.id, sana: ctx.vaqt, asos: `Tuzatilgan yozuv: ${t.sabab} (${t.hujjat})`, yaratuvchi: ctx.user.fio })
  }
  const sert = db.sertifikatlar.find((s) => s.id === y.sertifikatId)
  if (sert) {
    sert.holat = t.turi === 'bekor' ? 'bekor_qilingan' : 'tuzatilgan'
    sert.sabab = `${t.sabab} (${t.hujjat})`
    if (t.turi === 'almashtirish') sert.kredit = t.yangiMiqdor!
  }
  t.holat = 'tasdiqlandi'
  db.hodisalar.unshift({ id: `tz-${t.id}`, turi: 'reestrga_uzatildi', manbaId: t.personId, vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: 'Tuzatish Reestr va ish beruvchiga uzatildi' })
  xabarShaxsga(db, t.personId, `Kredit yozuvingiz tuzatildi: «${y.nomi}» — ${t.turi === 'bekor' ? 'bekor qilindi' : `${y.miqdor} → ${t.yangiMiqdor}`}. Sabab: ${t.sabab}`, 'warn', '/xodim/kreditlar', ctx)
  audit(db, ctx, 'Tuzatish tasdiqlandi (ERI)', 'KreditYozuvi', y.id, { miqdor: y.miqdor }, { turi: t.turi, yangi: t.yangiMiqdor })
}

/** Kunlik solishtirish: balans jurnaldan qayta hisoblanadi. */
export function solishtirish(db: DB, yil: number) {
  const map = new Map<string, number>()
  db.jurnal.filter((j) => j.yil === yil).forEach((j) => map.set(j.personId, (map.get(j.personId) ?? 0) + j.miqdor))
  const takrorlar = new Map<string, number>()
  db.jurnal.filter((j) => j.manba === 'natija' && j.miqdor > 0).forEach((j) => takrorlar.set(j.manbaId, (takrorlar.get(j.manbaId) ?? 0) + 1))
  const ikki = Array.from(takrorlar.entries()).filter(([, n]) => n > 1)
  return { xodimlar: map.size, yozuvlar: db.jurnal.filter((j) => j.yil === yil).length, farq: 0, takrorlar: ikki.length, jami: Array.from(map.values()).reduce((a, b) => a + b, 0) }
}

// ───────────────────────── V9 Yil yakuni ─────────────────────────
export function yilYakunlash(db: DB, ctx: Ctx, yil: number) {
  talabRol(ctx, 'markaz_rahbar', 'admin')
  if (db.hodisalar.some((h) => h.id === `yil-${yil}`)) throw new QoidaXatosi(409, `${yil}-yil allaqachon yakunlangan.`)
  const q = amaldagiQoida(db.qoidalar, `${yil}-12-31`) ?? db.qoidalar[0]
  let bajardi = 0, yetmaydi = 0, otkazildi = 0
  for (const s of db.shaxslar) {
    if (!db.mehnat.some((m) => m.personId === s.id)) continue
    const h = yillikHolat({ shaxs: s, yil, yozuvlar: db.jurnal, qoida: q, mehnat: db.mehnat.filter((m) => m.personId === s.id), bugun: `${yil}-12-31T23:59:00+05:00` })
    if (h.natija === 'bajarildi') bajardi++
    else yetmaydi++
    if (h.otkaziladi > 0) {
      db.seq++
      db.jurnal.push({ id: uid('K'), seq: db.seq, personId: s.id, yil: yil + 1, miqdor: h.otkaziladi, kursTuri: 'tanlov', yonalish: 'nazariy', tadbirTuri: 'kurs', manba: 'otkazish', manbaId: `yil-${yil}`, nomi: `${yil}-yildan oʻtkazilgan kredit`, providerNomi: '—', qoidaId: q.id, sana: ctx.vaqt, asos: `Qoida ${q.versiya}: ortiqcha kreditning ${Math.round(q.params.otkazishUlush * 100)}% igacha`, yaratuvchi: 'Kredit xizmati' })
      otkazildi++
    }
    db.yillikHisobotlar.push({ id: uid('YH'), personId: s.id, yil, sana: ctx.vaqt, holat: h, qr: fauxHash(s.id + yil).slice(0, 16) })
    if (h.natija !== 'bajarildi') xabarShaxsga(db, s.id, `${yil}-yil yakuni: talab bajarilmadi — ${h.yetishmaydi} kredit yetishmaydi.`, 'err', '/xodim/kreditlar', ctx)
  }
  db.hodisalar.unshift({ id: `yil-${yil}`, turi: 'reestrga_uzatildi', manbaId: String(yil), vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: `Yil yakuni: ${bajardi} bajardi, ${yetmaydi} yetishmaydi; Reestr va ish beruvchilarga uzatildi` })
  audit(db, ctx, `Yil yakuni ${yil}`, 'Kredit xizmati', String(yil), undefined, { bajardi, yetmaydi, otkazildi })
  return { bajardi, yetmaydi, otkazildi }
}

// ───────────────────────── 4.2.13 Xorijiy kreditni tan olish ─────────────────────────
export function tanOlishYubor(db: DB, ctx: Ctx, d: Omit<T.TanOlishAriza, 'id' | 'raqam' | 'personId' | 'holat' | 'tekshiruvlar' | 'muddat' | 'yuborilgan' | 'tarix'>) {
  talabRol(ctx, 'xodim')
  if (!d.sertifikatRaqam.trim() || !d.kurs.trim() || !d.tashkilot.trim()) throw new QoidaXatosi(422, 'Tashkilot, kurs va sertifikat raqamini kiriting.')
  if (!d.fayllar.length) throw new QoidaXatosi(422, 'Kamida sertifikat nusxasini yuklang.')
  const takror = db.tanOlish.find((t) => t.sertifikatRaqam.trim().toLowerCase() === d.sertifikatRaqam.trim().toLowerCase() && t.tashkilot.trim().toLowerCase() === d.tashkilot.trim().toLowerCase())
  if (takror) throw new QoidaXatosi(409, `Bu sertifikat boʻyicha ariza allaqachon bor (${takror.raqam}, holati: ${takror.holat}). Ikkinchi ariza bloklandi.`)
  const t: T.TanOlishAriza = {
    ...d, id: uid('TO'), raqam: `TO-${ctx.vaqt.slice(0, 4)}-${String(keyingiRaqam(db, 'tanolish')).padStart(4, '0')}`, personId: ctx.user.personId!, holat: 'yuborildi', tekshiruvlar: [],
    muddat: ishKuniQosh(ctx.vaqt, db.sozlamalar.muddatlar.tanOlishKorib, db.sozlamalar.bayramlar), yuborilgan: ctx.vaqt, tarix: [{ holat: 'yuborildi', sana: ctx.vaqt, kim: ctx.user.fio }],
  }
  db.tanOlish.push(t)
  xabarRolga(db, 'markaz_mutaxassis', `Xorijiy kreditni tan olish arizasi ${t.raqam}`, '/markaz/tanolish', ctx)
  audit(db, ctx, 'Tan olish arizasi', 'TanOlish', t.id)
  return t
}

export function tanOlishTekshiruv(db: DB, ctx: Ctx, id: T.ID, usul: 'QR' | 'reestr' | 'rasmiy_sorov', natija: string) {
  talabRol(ctx, 'markaz_mutaxassis')
  const t = db.tanOlish.find((x) => x.id === id)!
  t.tekshiruvlar.push({ usul, natija, sana: ctx.vaqt })
  if (t.holat === 'yuborildi') t.holat = 'tekshiruvda'
  t.tarix.push({ holat: t.holat, sana: ctx.vaqt, kim: ctx.user.fio, izoh: `${usul}: ${natija}` })
  audit(db, ctx, 'Tan olish: tekshiruv', 'TanOlish', t.id, undefined, { usul, natija })
}

export function tanOlishKamchilik(db: DB, ctx: Ctx, id: T.ID, izoh: string) {
  talabRol(ctx, 'markaz_mutaxassis')
  const t = db.tanOlish.find((x) => x.id === id)!
  if (!izoh.trim()) throw new QoidaXatosi(422, 'Kamchilikni izohlang.')
  t.holat = 'kamchilik'
  t.toxtatilgan = true
  t.tarix.push({ holat: 'kamchilik', sana: ctx.vaqt, kim: ctx.user.fio, izoh: `${izoh} (muddat toʻxtatildi, toʻldirish: ${db.sozlamalar.muddatlar.tanOlishToldirish} ish kuni)` })
  xabarShaxsga(db, t.personId, `${t.raqam}: hujjatlarni toʻldiring — ${izoh}`, 'warn', '/xodim/arizalar', ctx)
}

export function tanOlishToldir(db: DB, ctx: Ctx, id: T.ID, fayl: T.Fayl) {
  const t = db.tanOlish.find((x) => x.id === id)!
  if (t.personId !== ctx.user.personId) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  t.fayllar.push(fayl)
  t.holat = 'tekshiruvda'
  t.toxtatilgan = false
  t.tarix.push({ holat: 'tekshiruvda', sana: ctx.vaqt, kim: ctx.user.fio, izoh: 'Hujjat toʻldirildi, muddat davom etmoqda' })
  xabarRolga(db, 'markaz_mutaxassis', `${t.raqam}: xodim hujjatni toʻldirdi`, '/markaz/tanolish', ctx)
}

export function tanOlishXulosa(db: DB, ctx: Ctx, id: T.ID, x: Omit<NonNullable<T.TanOlishAriza['xulosa']>, 'tayyorlagan'>) {
  talabRol(ctx, 'markaz_mutaxassis')
  const t = db.tanOlish.find((a) => a.id === id)!
  if (!t.tekshiruvlar.length) throw new QoidaXatosi(422, 'Avval sertifikatni tekshiring (QR, xorijiy reestr yoki rasmiy soʻrov).')
  if (!x.asos.trim()) throw new QoidaXatosi(422, 'Asos majburiy.')
  if (x.turi !== 'rad' && !(x.milliyKredit > 0)) throw new QoidaXatosi(422, 'Milliy kredit miqdorini kiriting.')
  if (x.turi === 'rad') x.milliyKredit = 0
  t.xulosa = { ...x, tayyorlagan: ctx.user.id }
  t.holat = 'qaror'
  t.tarix.push({ holat: 'qaror', sana: ctx.vaqt, kim: ctx.user.fio, izoh: `Ekspert xulosasi: ${x.turi}, ${x.milliyKredit} kredit` })
  xabarRolga(db, 'markaz_rahbar', `${t.raqam}: tan olish qarori tasdiqlashingizni kutmoqda`, '/markaz/tanolish', ctx)
  audit(db, ctx, 'Tan olish xulosasi', 'TanOlish', t.id, undefined, x)
}

export function tanOlishTasdiqla(db: DB, ctx: Ctx, id: T.ID) {
  talabRol(ctx, 'markaz_rahbar')
  const t = db.tanOlish.find((a) => a.id === id)!
  if (t.holat !== 'qaror' || !t.xulosa) throw new QoidaXatosi(422, 'Xulosa tayyor emas.')
  ikkiShaxs(ctx, t.xulosa.tayyorlagan, 'xulosa')
  t.tasdiqlovchi = ctx.user.id
  if (t.xulosa.turi === 'rad') {
    t.holat = 'rad_etildi'
    xabarShaxsga(db, t.personId, `${t.raqam}: tan olish rad etildi. Sabab: ${t.xulosa.asos}. Murojaat yuborish huquqingiz bor.`, 'err', '/xodim/arizalar', ctx)
  } else {
    t.holat = 'tasdiqlandi'
    const q = amaldagiQoida(db.qoidalar, ctx.vaqt) ?? db.qoidalar[0]
    db.seq++
    db.jurnal.push({ id: uid('K'), seq: db.seq, personId: t.personId, yil: Number(ctx.vaqt.slice(0, 4)), miqdor: t.xulosa.milliyKredit, kursTuri: t.xulosa.kursTuri, yonalish: t.xulosa.yonalish, tadbirTuri: 'kurs', manba: 'tan_olish', manbaId: t.id, nomi: `${t.kurs} (xorijiy, ${t.davlat})`, providerNomi: t.tashkilot, qoidaId: q.id, sana: ctx.vaqt, asos: `Tan olish qarori ${t.raqam} — ${t.xulosa.turi === 'toliq' ? 'toʻliq' : 'qisman'}; metodika ${t.xulosa.metodika}`, yaratuvchi: 'Kredit xizmati' })
    xabarShaxsga(db, t.personId, `${t.raqam}: +${t.xulosa.milliyKredit} milliy kredit (${t.xorijiyKredit} ${t.kreditTuri} oʻrniga)`, 'ok', '/xodim/kreditlar', ctx)
  }
  t.tarix.push({ holat: t.holat, sana: ctx.vaqt, kim: ctx.user.fio, izoh: eriImzo(ctx, t.raqam) })
  audit(db, ctx, 'Tan olish qarori tasdiqlandi (ERI)', 'TanOlish', t.id, undefined, t.xulosa)
}

// ───────────────────────── 4.2.14 Murojaat va apellyatsiya ─────────────────────────
export function murojaatYubor(db: DB, ctx: Ctx, d: { turi: T.Murojaat['turi']; obyekt?: T.Murojaat['obyekt']; matn: string; fayllar?: T.Fayl[]; birinchiQarorChiqargan?: T.ID }) {
  if (d.matn.trim().length < 10) throw new QoidaXatosi(422, 'Murojaat matnini batafsilroq yozing (kamida 10 belgi).')
  const m: T.Murojaat = {
    id: uid('MR'), raqam: `MR-${ctx.vaqt.slice(0, 4)}-${String(keyingiRaqam(db, 'murojaat')).padStart(5, '0')}`, turi: d.turi, obyekt: d.obyekt, arizachiId: ctx.user.id, matn: d.matn, fayllar: d.fayllar ?? [],
    holat: 'yuborildi', masulRol: 'markaz_mutaxassis', birinchiQarorChiqargan: d.birinchiQarorChiqargan, muddat: ishKuniQosh(ctx.vaqt, db.sozlamalar.muddatlar.murojaatKorib, db.sozlamalar.bayramlar),
    yozishmalar: [], yuborilgan: ctx.vaqt, tarix: [{ holat: 'yuborildi', sana: ctx.vaqt, kim: ctx.user.fio }],
  }
  db.murojaatlar.push(m)
  xabarRolga(db, 'markaz_mutaxassis', `Yangi murojaat ${m.raqam}: ${d.obyekt?.nomi ?? d.turi}`, '/markaz/murojaatlar', ctx)
  xabar(db, ctx.user.id, `Murojaatingiz ${m.raqam} qabul qilindi. Koʻrib chiqish muddati: ${m.muddat}`, 'ok', undefined, ctx.vaqt)
  audit(db, ctx, 'Murojaat yuborildi', 'Murojaat', m.id)
  return m
}

export function murojaatHolati(db: DB, ctx: Ctx, id: T.ID, holat: T.MurojaatHolat, matn?: string) {
  talabRol(ctx, 'markaz_mutaxassis', 'markaz_rahbar')
  const m = db.murojaatlar.find((x) => x.id === id)!
  if (holat === 'malumot_soraldi' && !matn?.trim()) throw new QoidaXatosi(422, 'Qanday maʼlumot kerakligini yozing.')
  m.holat = holat
  if (holat === 'qabul_qilindi' || holat === 'korib_chiqilmoqda') m.masulId = ctx.user.id
  if (matn) m.yozishmalar.push({ kim: ctx.user.fio, matn, sana: ctx.vaqt })
  m.tarix.push({ holat, sana: ctx.vaqt, kim: ctx.user.fio, izoh: matn })
  xabar(db, m.arizachiId, `${m.raqam}: holat — ${holat.replace('_', ' ')}${matn ? ': ' + matn : ''}`, holat === 'malumot_soraldi' ? 'warn' : 'info', undefined, ctx.vaqt)
  audit(db, ctx, `Murojaat: ${holat}`, 'Murojaat', m.id)
}

export function murojaatJavob(db: DB, ctx: Ctx, id: T.ID, matn: string) {
  const m = db.murojaatlar.find((x) => x.id === id)!
  if (m.arizachiId !== ctx.user.id) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  m.yozishmalar.push({ kim: ctx.user.fio, matn, sana: ctx.vaqt })
  m.holat = 'korib_chiqilmoqda'
  m.tarix.push({ holat: 'korib_chiqilmoqda', sana: ctx.vaqt, kim: ctx.user.fio, izoh: 'Qoʻshimcha maʼlumot berildi' })
  if (m.masulId) xabar(db, m.masulId, `${m.raqam}: arizachi javob berdi`, 'info', '/markaz/murojaatlar', ctx.vaqt)
}

export function murojaatQaror(db: DB, ctx: Ctx, id: T.ID, natija: NonNullable<T.Murojaat['qaror']>['natija'], matn: string) {
  talabRol(ctx, 'markaz_rahbar', 'markaz_mutaxassis')
  const m = db.murojaatlar.find((x) => x.id === id)!
  if (m.birinchiQarorChiqargan === ctx.user.id) throw new QoidaXatosi(403, 'Birinchi qarorni chiqargan shaxs apellyatsiyani hal qila olmaydi.')
  if (!matn.trim()) throw new QoidaXatosi(422, 'Qaror matnini kiriting.')
  m.qaror = { natija, matn, kim: ctx.user.id, sana: ctx.vaqt }
  m.holat = 'qaror'
  m.tarix.push({ holat: 'qaror', sana: ctx.vaqt, kim: ctx.user.fio, izoh: `${natija}: ${matn}` })
  xabar(db, m.arizachiId, `${m.raqam}: qaror — ${natija}. ${matn}`, natija === 'rad_etildi' ? 'warn' : 'ok', undefined, ctx.vaqt)
  audit(db, ctx, 'Murojaat qarori', 'Murojaat', m.id, undefined, m.qaror)
}

// ───────────────────────── 4.2.15 Sifat nazorati ─────────────────────────
export function signallarniHisobla(db: DB, ctx: Ctx) {
  const yangi: T.Signal[] = []
  const chek = db.sozlamalar.signalChegaralari
  const bor = (turi: T.SignalTuri, kalit: string) => db.signallar.some((s) => s.turi === turi && s.qiymat === kalit)
  // 1) qisqa vaqtda koʻp sertifikat
  const kunlik = new Map<string, number>()
  db.sertifikatlar.forEach((s) => {
    const k = s.provider + '|' + s.sana
    kunlik.set(k, (kunlik.get(k) ?? 0) + 1)
  })
  kunlik.forEach((n, k) => {
    const [prov, sana] = k.split('|')
    const p = db.provayderlar.find((x) => x.nomi === prov)
    if (p && n >= chek.kopSertifikatKunda && !bor('kop_sertifikat', k)) yangi.push({ id: uid('SG'), turi: 'kop_sertifikat', providerId: p.id, tavsif: `${sana} kuni ${n} ta sertifikat (chegara: ${chek.kopSertifikatKunda})`, qiymat: k, aniqlangan: ctx.vaqt, holat: 'yangi' })
  })
  // 2) hamma tinglovchida 100% davomat va bir xil ball
  db.oqimlar.forEach((o) => {
    const ys = db.yozilishlar.filter((y) => y.oqimId === o.id && ['tugatdi', 'oqimoqda'].includes(y.holat))
    if (ys.length < 5) return
    const balllar = ys.map((y) => db.baholashlar.filter((b) => b.yozilishId === y.id).map((b) => b.ball).join(','))
    const bir = balllar.filter((b) => b === balllar[0]).length / ys.length
    if (bir * 100 >= chek.birXilBallFoiz && balllar[0] && !bor('bir_xil_ball', o.id)) yangi.push({ id: uid('SG'), turi: 'bir_xil_ball', providerId: o.providerId, oqimId: o.id, tavsif: `${o.kod}: ${Math.round(bir * 100)}% tinglovchida bir xil ball (${balllar[0]}) va 100% davomat`, qiymat: o.id, aniqlangan: ctx.vaqt, holat: 'yangi' })
  })
  // 3) akkreditatsiya muddati tugagan kurs boʻyicha natija
  db.natijalar.filter((n) => n.holat === 'tekshiruvda').forEach((n) => {
    const y = yozilish(db, n.yozilishId)!
    const o = oqim(db, y.oqimId)!
    if (n.tekshiruvSababi?.some((s) => s.includes('akkreditatsiya')) && !bor('akk_muddati_tugagan', n.id)) yangi.push({ id: uid('SG'), turi: 'akk_muddati_tugagan', providerId: o.providerId, oqimId: o.id, tavsif: `${o.kod}: akkreditatsiyasi amalda boʻlmagan sanada natija yuborilgan`, qiymat: n.id, aniqlangan: ctx.vaqt, holat: 'yangi' })
  })
  // 4) bir tinglovchi bir vaqtda ikki joyda (QR davomat)
  const qrlar = db.davomat.filter((d) => d.usul === 'QR')
  qrlar.forEach((a, i) => {
    qrlar.slice(i + 1).forEach((b) => {
      const ya = yozilish(db, a.yozilishId), yb = yozilish(db, b.yozilishId)
      if (!ya || !yb || ya.personId !== yb.personId || ya.oqimId === yb.oqimId) return
      if (Math.abs(new Date(a.vaqt).getTime() - new Date(b.vaqt).getTime()) < 30 * 60000) {
        const k = a.id + b.id
        const o = oqim(db, yb.oqimId)!
        if (!bor('ikki_joyda', k)) yangi.push({ id: uid('SG'), turi: 'ikki_joyda', providerId: o.providerId, oqimId: o.id, tavsif: `${qisqaFio(shaxs(db, ya.personId)!)}: 30 daqiqa ichida ikki xil oqimda QR davomat`, qiymat: k, aniqlangan: ctx.vaqt, holat: 'yangi' })
      }
    })
  })
  db.signallar.unshift(...yangi)
  db.hodisalar.unshift({ id: `sig-${ctx.vaqt}`, turi: 'reestrga_uzatildi', manbaId: 'signallar', vaqt: ctx.vaqt, holat: 'qayta_ishlandi', izoh: `Signallar hisoblandi: ${yangi.length} yangi` })
  audit(db, ctx, 'Sifat signallari hisoblandi', 'Signal', undefined, undefined, { yangi: yangi.length })
  return yangi.length
}

export function signalIsh(db: DB, ctx: Ctx, id: T.ID, d: Partial<NonNullable<T.Signal['ish']>> & { holat?: T.Signal['holat'] }) {
  talabRol(ctx, 'markaz_mutaxassis', 'markaz_rahbar')
  const s = db.signallar.find((x) => x.id === id)!
  s.ish = { masul: s.ish?.masul ?? ctx.user.id, dalillar: s.ish?.dalillar ?? [], ...s.ish, ...d }
  if (d.holat) s.holat = d.holat
  else if (s.holat === 'yangi') s.holat = 'tekshiruvda'
  audit(db, ctx, 'Signal boʻyicha tekshiruv ishi', 'Signal', s.id, undefined, d)
  // signal provayder holatini avtomatik oʻzgartirmaydi
}

// ───────────────────────── 4.2.3 Rivojlanish rejasi ─────────────────────────
export function rejaYarat(db: DB, ctx: Ctx, yil: number) {
  talabRol(ctx, 'xodim')
  const s = shaxs(db, ctx.user.personId)!
  const bor = db.rejalar.find((r) => r.personId === s.id && r.yil === yil)
  if (bor) return bor
  const asosiy = db.mehnat.find((m) => m.personId === s.id && m.asosiy && !m.gacha)
  if (!asosiy) throw new QoidaXatosi(422, 'Asosiy ish joyingiz Reestrda topilmadi — reja ish beruvchisiz tuzilmaydi.')
  // majburiy modullar oldindan qoʻyiladi
  const majburiy = db.versiyalar.filter((v) => v.holat === 'tasdiqlangan' && v.kursTuri === 'majburiy' && mosmi(db, s, v).ok).slice(0, 3)
  const r: T.Reja = {
    id: uid('RJ'), personId: s.id, muassasaId: asosiy.muassasaId, yil, versiya: 1, holat: 'qoralama', tashabbuskor: ctx.user.id, yangilangan: ctx.vaqt, oldingiVersiyalar: [],
    bandlar: majburiy.map((v, i) => ({ id: uid('RB'), nomi: v.nomi, versiyaId: v.id, kredit: v.tasdiqlanganKredit ?? v.soralganKredit, kursTuri: v.kursTuri, yonalish: v.yonalish, muddat: `${i + 1}-chorak`, majburiyModul: true, bajarildi: false })),
  }
  db.rejalar.push(r)
  audit(db, ctx, 'Rivojlanish rejasi yaratildi', 'Reja', r.id)
  return r
}

export function rejaBandlar(db: DB, ctx: Ctx, id: T.ID, bandlar: T.RejaBandi[]) {
  const r = db.rejalar.find((x) => x.id === id)!
  if (r.personId !== ctx.user.personId) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  if (!['qoralama', 'qaytarildi'].includes(r.holat)) {
    // tasdiqlangan rejani oʻzgartirish — yangi versiya
    r.oldingiVersiyalar.push({ versiya: r.versiya, holat: r.holat, bandlar: r.bandlar, izoh: r.izoh, sana: r.yangilangan, kim: r.tasdiqlovchi ?? '' })
    r.versiya++
    r.holat = 'qoralama'
    r.tasdiqlovchi = undefined
  }
  if (bandlar.some((b) => b.majburiyModul) === false && r.bandlar.some((b) => b.majburiyModul)) throw new QoidaXatosi(422, 'Majburiy modullarni rejadan olib tashlab boʻlmaydi.')
  r.bandlar = bandlar
  r.yangilangan = ctx.vaqt
}

export function rejaYubor(db: DB, ctx: Ctx, id: T.ID) {
  const r = db.rejalar.find((x) => x.id === id)!
  if (r.personId !== ctx.user.personId) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  if (!['qoralama', 'qaytarildi'].includes(r.holat)) throw new QoidaXatosi(422, 'Reja allaqachon yuborilgan.')
  if (!r.bandlar.length) throw new QoidaXatosi(422, 'Rejaga kamida bitta band qoʻshing.')
  if (r.holat === 'qaytarildi') {
    r.oldingiVersiyalar.push({ versiya: r.versiya, holat: 'qaytarildi', bandlar: r.bandlar, izoh: r.izoh, sana: r.yangilangan, kim: ctx.user.fio })
    r.versiya++
  }
  r.holat = 'yuborildi'
  r.yangilangan = ctx.vaqt
  db.foydalanuvchilar.filter((u) => u.muassasaId === r.muassasaId).forEach((u) => xabar(db, u.id, `Rivojlanish rejasi tasdiqlashga yuborildi: ${qisqaFio(shaxs(db, r.personId)!)} (${r.yil})`, 'info', '/muassasa/rejalar', ctx.vaqt))
  audit(db, ctx, 'Reja yuborildi', 'Reja', r.id)
}

export function rejaQaror(db: DB, ctx: Ctx, id: T.ID, ok: boolean, izoh: string) {
  talabRol(ctx, 'muassasa')
  const r = db.rejalar.find((x) => x.id === id)!
  if (r.muassasaId !== ctx.user.muassasaId) throw new QoidaXatosi(403, 'Boshqa muassasa xodimining rejasini koʻrib boʻlmaydi.')
  const asosiy = db.mehnat.find((m) => m.personId === r.personId && m.asosiy && !m.gacha)
  if (asosiy?.muassasaId !== ctx.user.muassasaId) throw new QoidaXatosi(403, 'Rejani faqat asosiy ish beruvchi tasdiqlaydi.')
  if (r.holat !== 'yuborildi') throw new QoidaXatosi(422, 'Reja tasdiqlash bosqichida emas.')
  if (!ok && !izoh.trim()) throw new QoidaXatosi(422, 'Qaytarish sababini yozing.')
  r.holat = ok ? 'tasdiqlandi' : 'qaytarildi'
  r.izoh = izoh
  r.tasdiqlovchi = ok ? ctx.user.id : undefined
  r.yangilangan = ctx.vaqt
  xabarShaxsga(db, r.personId, ok ? `${r.yil}-yil rivojlanish rejangiz tasdiqlandi` : `Rejangiz qaytarildi: ${izoh}`, ok ? 'ok' : 'warn', '/xodim/oquv/reja', ctx)
  audit(db, ctx, ok ? 'Reja tasdiqlandi' : 'Reja qaytarildi', 'Reja', r.id, undefined, { izoh })
}

// ───────────────────────── 4.2.8 Muassasa ─────────────────────────
export function eslatmaYubor(db: DB, ctx: Ctx, personIds: T.ID[], matn: string, oqimId?: T.ID) {
  talabRol(ctx, 'muassasa')
  const xodimlar = new Set(muassasaXodimlari(db, ctx.user.muassasaId!, bugunSana(ctx)).map((m) => m.personId))
  for (const p of personIds) {
    if (!xodimlar.has(p)) throw new QoidaXatosi(403, 'Boshqa muassasa xodimiga eslatma yuborib boʻlmaydi.')
    xabarShaxsga(db, p, `Ish beruvchidan: ${matn}`, 'info', oqimId ? '/xodim/oquv' : '/xodim/kreditlar', ctx)
  }
  audit(db, ctx, oqimId ? 'Kurs tavsiyasi yuborildi' : 'Eslatma yuborildi', 'Xodim', personIds.join(','), undefined, { soni: personIds.length })
}

// ───────────────────────── 4.2.17 Rezidentura ─────────────────────────
const SHAXS_REGEX = [
  { r: /\b\d{14}\b/, s: 'JSHSHIR (14 raqam)' },
  { r: /(\+?998[\s-]?)?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/, s: 'telefon raqami' },
  { r: /(kasallik tarixi|k\/t|i\/b|история болезни)\s*№?\s*\d+/i, s: 'kasallik tarixi raqami' },
  { r: /\b[A-ZʻʼO‘G‘][a-zʻʼ‘’]+(ov|ova|ev|eva|yev|yeva|in|ina)\s+[A-ZʻʼO‘G‘][a-zʻʼ‘’]+/, s: 'bemorning F.I.Sh.' },
  { r: /bemor\s*:?\s*[A-ZʻʼO‘G‘][a-z]+/i, s: 'bemor ismi' },
]
export function shaxsiyMalumotBormi(matn: string) {
  return SHAXS_REGEX.filter((x) => x.r.test(matn)).map((x) => x.s)
}

export function logbookQosh(db: DB, ctx: Ctx, d: Omit<T.LogbookYozuv, 'id' | 'rezidentId' | 'holat'>) {
  talabRol(ctx, 'rezident')
  const r = db.rezidentlar.find((x) => x.personId === ctx.user.personId)!
  const topildi = shaxsiyMalumotBormi(d.izoh + ' ' + d.joy)
  if (topildi.length) {
    audit(db, ctx, 'Logbook: bemor maʼlumoti bloklandi', 'Logbook', r.id, undefined, { topildi }, 'rad_etildi')
    throw new QoidaXatosi(422, `Logbookka bemorni aniqlaydigan maʼlumot kiritib boʻlmaydi: ${topildi.join(', ')}. Matnni anonimlashtiring (masalan, «58 yoshli erkak»).`)
  }
  const y: T.LogbookYozuv = { ...d, id: uid('LB'), rezidentId: r.id, holat: 'kutilmoqda' }
  db.logbook.unshift(y)
  xabar(db, r.rahbarId, `Logbook: yangi yozuv tasdiqlashni kutmoqda (${d.konikmaKod})`, 'info', '/klinik/logbook', ctx.vaqt)
  audit(db, ctx, 'Logbook yozuvi', 'Logbook', y.id)
  return y
}

export function logbookQaror(db: DB, ctx: Ctx, ids: T.ID[], ok: boolean, izoh = '') {
  talabRol(ctx, 'klinik_rahbar')
  for (const id of ids) {
    const y = db.logbook.find((x) => x.id === id)!
    const r = db.rezidentlar.find((x) => x.id === y.rezidentId)!
    if (r.rahbarId !== ctx.user.id) throw new QoidaXatosi(403, 'Faqat oʻz rezidentlaringiz yozuvlarini tasdiqlay olasiz.')
    if (!ok && !izoh.trim()) throw new QoidaXatosi(422, 'Rad etish sababini yozing.')
    y.holat = ok ? 'tasdiqlangan' : 'rad_etildi'
    y.rahbarIzohi = izoh || undefined
    xabarShaxsga(db, r.personId, `Logbook ${y.konikmaKod}: ${ok ? 'tasdiqlandi' : 'rad etildi — ' + izoh}`, ok ? 'ok' : 'warn', '/rezident/logbook', ctx)
  }
  audit(db, ctx, ok ? 'Logbook tasdiqlandi' : 'Logbook rad etildi', 'Logbook', ids.join(','))
}

export function logbookHolati(db: DB, rezidentId: T.ID) {
  const r = db.rezidentlar.find((x) => x.id === rezidentId)!
  const konikmalar = KONIKMALAR[r.mutaxassislikId] ?? KONIKMALAR.M01
  return konikmalar.map((k) => {
    const yozuvlar = db.logbook.filter((l) => l.rezidentId === r.id && l.konikmaKod === k.kod)
    const tasdiqlangan = yozuvlar.filter((l) => l.holat === 'tasdiqlangan').length
    return { ...k, tasdiqlangan, kutilmoqda: yozuvlar.filter((l) => l.holat === 'kutilmoqda').length, foiz: Math.min(100, Math.round((tasdiqlangan / k.minimal) * 100)) }
  })
}

export function attestatsiyagaRuxsat(db: DB, rezidentId: T.ID) {
  const h = logbookHolati(db, rezidentId)
  const yetmaydi = h.filter((k) => k.majburiy && k.tasdiqlangan < k.minimal)
  return { ruxsat: yetmaydi.length === 0, yetmaydi }
}

export function rezidentBaholash(db: DB, ctx: Ctx, d: Omit<T.RezidentBaho, 'id'>) {
  talabRol(ctx, 'klinik_rahbar')
  const r = db.rezidentlar.find((x) => x.id === d.rezidentId)!
  if (r.rahbarId !== ctx.user.id) throw new QoidaXatosi(403, 'Faqat oʻz rezidentlaringizni baholay olasiz.')
  if (d.turi === 'yakuniy') {
    const a = attestatsiyagaRuxsat(db, r.id)
    if (!a.ruxsat) throw new QoidaXatosi(422, `Yakuniy attestatsiyaga ruxsat yoʻq: majburiy koʻnikmalar yetishmaydi (${a.yetmaydi.map((k) => k.kod).join(', ')}).`)
  }
  const b: T.RezidentBaho = { ...d, id: uid('RB') }
  db.rezidentBaholar.push(b)
  if (d.turi === 'yakuniy' && d.natija === 'otdi') {
    r.holat = 'bitirgan'
    const s = shaxs(db, r.personId)!
    const sert = sertifikatYarat(db, ctx, { turi: 'DIPLOM', personId: s.id, kurs: `Rezidentura: ${MUTAXASSISLIKLAR.find((m) => m.id === r.mutaxassislikId)?.nomi ?? ''}`, provider: r.tashkilot, sana: bugunSana(ctx), soat: 0, kredit: 0 })
    xabarShaxsga(db, r.personId, `Tabriklaymiz! Rezidentura diplomi ${sert.seriya} ${sert.raqam} yaratildi va Reestrga uzatildi.`, 'ok', '/rezident', ctx)
  }
  xabarShaxsga(db, r.personId, `Yangi baho: ${d.turi} — ${d.ball} ball (${d.natija === 'otdi' ? 'oʻtdi' : 'oʻtmadi'})`, 'info', '/rezident/baholar', ctx)
  audit(db, ctx, `Rezident bahosi: ${d.turi}`, 'Rezident', r.id, undefined, { ball: d.ball })
}

export function rotatsiyaXulosa(db: DB, ctx: Ctx, id: T.ID, xulosa: string) {
  talabRol(ctx, 'klinik_rahbar')
  const rt = db.rotatsiyalar.find((x) => x.id === id)!
  const r = db.rezidentlar.find((x) => x.id === rt.rezidentId)!
  if (r.rahbarId !== ctx.user.id) throw new QoidaXatosi(403, 'Ruxsat yoʻq.')
  rt.xulosa = xulosa
  rt.holat = 'yakunlangan'
  audit(db, ctx, 'Rotatsiya xulosasi', 'Rotatsiya', rt.id)
}

// ───────────────────────── 4.2.18 PSV ─────────────────────────
export function psvYarat(db: DB, ctx: Ctx, d: { qabulQiluvchi: string; maqsad: string; hujjatlar: T.PsvIsh['hujjatlar'][number]['turi'][]; rozilikMuddat: string }) {
  talabRol(ctx, 'xodim')
  if (!d.hujjatlar.length) throw new QoidaXatosi(422, 'Tekshiriladigan hujjatlarni tanlang.')
  if (!d.qabulQiluvchi.trim()) throw new QoidaXatosi(422, 'Qabul qiluvchi tashkilotni kiriting.')
  const manba: Record<string, string> = { diplom: 'HEMIS', mutaxassislik: 'Platforma Reestri', toifa: 'Platforma Reestri', staj: 'Yagona milliy mehnat tizimi', ukr: 'UKR quyi tizimi', davlat_royxati: 'Platforma Reestri' }
  const p: T.PsvIsh = {
    id: uid('PSV'), raqam: `PSV-${ctx.vaqt.slice(0, 4)}-${String(keyingiRaqam(db, 'psv')).padStart(4, '0')}`, soruvchi: 'shaxs', personId: ctx.user.personId!, qabulQiluvchi: d.qabulQiluvchi, maqsad: d.maqsad,
    hujjatlar: d.hujjatlar.map((t) => ({ turi: t, manba: manba[t], holat: 'kutilmoqda' })), rozilik: { hajm: d.hujjatlar.join(', '), muddat: d.rozilikMuddat, berilgan: ctx.vaqt },
    tolov: { tarif: 150000, holat: 'kutilmoqda', hisob: `INV-${Date.now().toString().slice(-8)}` }, holat: 'yangi', yaratilgan: ctx.vaqt,
  }
  db.psv.push(p)
  xabarRolga(db, 'markaz_mutaxassis', `Yangi PSV soʻrovi ${p.raqam}`, '/markaz/psv', ctx)
  audit(db, ctx, 'PSV soʻrovi (rozilik bilan)', 'PSV', p.id)
  return p
}

/** Toʻlov faqat billing javobi bilan (qoʻlda «toʻlandi» qilib boʻlmaydi) — bu funksiya billing callback imitatsiyasi. */
export function psvBillingCallback(db: DB, ctx: Ctx, id: T.ID) {
  const p = db.psv.find((x) => x.id === id)!
  p.tolov.holat = 'tolandi'
  audit(db, { ...ctx, user: { ...ctx.user, fio: 'Yagona billing', rol: 'admin' } }, 'Billing: toʻlov tasdiqlandi', 'PSV', p.id)
}

export function psvManbaSorov(db: DB, ctx: Ctx, id: T.ID) {
  talabRol(ctx, 'markaz_mutaxassis')
  const p = db.psv.find((x) => x.id === id)!
  if (p.tolov.holat === 'kutilmoqda') throw new QoidaXatosi(422, 'Toʻlov tizimidan tasdiq kelmagan.')
  const s = shaxs(db, p.personId)!
  p.hujjatlar.forEach((h) => {
    if (h.manba === 'Platforma Reestri' || h.manba === 'UKR quyi tizimi') {
      h.holat = 'tasdiqlandi'
      h.sana = ctx.vaqt
      h.javob = h.turi === 'ukr' ? `UKR: ${xodimYillik(db, s.id, Number(ctx.vaqt.slice(0, 4)), bugunSana(ctx)).X} kredit (${ctx.vaqt.slice(0, 4)})` : h.turi === 'davlat_royxati' ? `Davlat roʻyxati ${s.davlatRoyxati.raqam}, ${s.davlatRoyxati.holat}` : `Reestr maʼlumoti mos`
    }
  })
  p.holat = p.hujjatlar.every((h) => h.holat !== 'kutilmoqda') ? 'hisobot_tayyor' : 'javob_kutilmoqda'
  audit(db, ctx, 'PSV: manbalarga soʻrov', 'PSV', p.id)
}

export function psvJavob(db: DB, ctx: Ctx, id: T.ID, turi: string, holat: 'tasdiqlandi' | 'farq' | 'tasdiqlanmadi', javob: string) {
  talabRol(ctx, 'markaz_mutaxassis')
  const p = db.psv.find((x) => x.id === id)!
  const h = p.hujjatlar.find((x) => x.turi === turi)!
  if (!javob.trim()) throw new QoidaXatosi(422, 'Manba javobini (xat raqami, sana) kiriting — dalil sifatida saqlanadi.')
  h.holat = holat
  h.javob = javob
  h.sana = ctx.vaqt
  if (p.hujjatlar.every((x) => x.holat !== 'kutilmoqda')) p.holat = 'hisobot_tayyor'
  audit(db, ctx, 'PSV: manba javobi qayd etildi', 'PSV', p.id, undefined, { turi, holat })
}

export function psvHisobot(db: DB, ctx: Ctx, id: T.ID) {
  talabRol(ctx, 'markaz_mutaxassis', 'markaz_rahbar')
  const p = db.psv.find((x) => x.id === id)!
  if (p.hujjatlar.some((h) => h.holat === 'kutilmoqda')) throw new QoidaXatosi(422, 'Manba javobi kutilmoqda — «tasdiqlandi» hisoboti chiqarilmaydi.')
  if (p.rozilik.bekor) throw new QoidaXatosi(403, 'Shaxs roziligini bekor qilgan — maʼlumot uzatilmaydi.')
  const s = shaxs(db, p.personId)!
  const sert = sertifikatYarat(db, ctx, { turi: 'PSV', personId: s.id, kurs: `PSV hisoboti: ${p.hujjatlar.map((h) => h.turi).join(', ')}`, provider: 'UKR markazi', sana: bugunSana(ctx), soat: 0, kredit: 0 })
  p.hisobotId = sert.id
  audit(db, ctx, 'PSV hisoboti (ERI)', 'PSV', p.id, undefined, { sert: sert.raqam })
  return sert
}

export function psvYetkaz(db: DB, ctx: Ctx, id: T.ID, usul: 'API' | 'pochta' | 'arizachi') {
  const p = db.psv.find((x) => x.id === id)!
  if (!p.hisobotId) throw new QoidaXatosi(422, 'Avval hisobotni yarating.')
  p.yetkazish = { usul, sana: ctx.vaqt }
  p.holat = 'yetkazildi'
  xabarShaxsga(db, p.personId, `${p.raqam}: PSV hisoboti ${p.qabulQiluvchi} ga yetkazildi (${usul})`, 'ok', '/xodim/arizalar', ctx)
  audit(db, ctx, 'PSV hisoboti yetkazildi', 'PSV', p.id, undefined, { usul })
}

// ───────────────────────── Admin ─────────────────────────
export function foydalanuvchiOzgartir(db: DB, ctx: Ctx, id: T.ID, d: Partial<Pick<T.Foydalanuvchi, 'faol' | 'rol'>>) {
  talabRol(ctx, 'admin')
  const u = db.foydalanuvchilar.find((x) => x.id === id)!
  const eski = { faol: u.faol, rol: u.rol }
  Object.assign(u, d)
  audit(db, ctx, 'Foydalanuvchi oʻzgartirildi', 'Foydalanuvchi', u.id, eski, d)
}

export function sozlamaSaqla(db: DB, ctx: Ctx, d: Partial<T.Sozlamalar>) {
  talabRol(ctx, 'admin', 'markaz_rahbar')
  const eski = structuredClone(db.sozlamalar)
  db.sozlamalar = { ...db.sozlamalar, ...d }
  audit(db, ctx, 'Sozlamalar oʻzgartirildi', 'Sozlamalar', undefined, eski, d)
}

/** Har qanday bevosita balans/kredit oʻzgartirishga urinish (masalan, xodim API orqali) — rad etiladi va auditga yoziladi. */
export function taqiqlanganKreditOzgartirish(db: DB, ctx: Ctx, personId: T.ID, miqdor: number) {
  audit(db, ctx, `Kredit qoʻshishga urinish (+${miqdor})`, 'KreditYozuvi', personId, undefined, { miqdor }, 'rad_etildi')
  throw new QoidaXatosi(403, '403 Forbidden: kredit jurnaliga faqat Kredit xizmati yozadi. Hech kim, jumladan administrator ham, balansni bevosita oʻzgartira olmaydi.')
}

export function eksportQayd(db: DB, ctx: Ctx, nomi: string, qatorlar: number) {
  audit(db, ctx, `Eksport: ${nomi}`, 'Eksport', undefined, undefined, { qatorlar })
}
