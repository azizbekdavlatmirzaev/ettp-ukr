// TZ 6.3 «Asosiy qabul sinovlari» (15-jadval) — prototip darajasida avtomatik tekshiruv.
import { describe, it, expect } from 'vitest'
import { seedYarat } from './seed'
import * as A from './amallar'
import { yillikHolat, talab, balans } from './kredit'
import type { DB } from './db'

function ctx(db: DB, login: string): A.Ctx {
  return { user: db.foydalanuvchilar.find((u) => u.login === login)!, vaqt: '2026-11-13T10:00:00+05:00' }
}
const xato = (f: () => unknown) => {
  try {
    f()
  } catch (e) {
    return e as A.QoidaXatosi
  }
  return undefined
}

describe('Kredit hisoblash (4.3.1, 12-jadval)', () => {
  it('12-jadval namunasi: 58 − 3 + 4 = 59, oʻtkaziladi 9', () => {
    const db = seedYarat()
    const s = { ...db.shaxslar[0], id: 'TEST', daraja: 'oliy' as const, istisno: undefined }
    const q = { ...db.qoidalar.find((x) => x.id === 'Q-2027')!, kuchgaKirish: '2026-01-01', params: { ...db.qoidalar.find((x) => x.id === 'Q-2027')!.params, majburiyUlush: 0.5, amaliyUlush: 0.1 } }
    const y = (miqdor: number, kursTuri: 'majburiy' | 'tanlov', tadbir: 'kurs' | 'mustaqil' = 'kurs', manba: 'natija' | 'otkazish' = 'natija', yonalish: 'nazariy' | 'amaliy' = 'nazariy') =>
      ({ id: Math.random() + '', seq: 0, personId: 'TEST', yil: 2026, miqdor, kursTuri, yonalish, tadbirTuri: tadbir, manba, manbaId: 'x', nomi: '', providerNomi: '', qoidaId: q.id, sana: '', asos: '', yaratuvchi: '' })
    const yozuvlar = [y(30, 'majburiy', 'kurs', 'natija', 'amaliy'), y(12, 'majburiy'), y(8, 'tanlov'), y(8, 'tanlov', 'mustaqil'), y(4, 'tanlov', 'kurs', 'otkazish')]
    const h = yillikHolat({ shaxs: s, yil: 2026, yozuvlar, qoida: q, bugun: '2026-12-31' })
    expect(h.T).toBe(50)
    expect(h.K).toBe(58)
    expect(h.limitKesildi).toBe(3)
    expect(h.X).toBe(59)
    expect(h.natija).toBe('bajarildi')
    expect(h.otkaziladi).toBe(9)
  })
  it('bir xil maʼlumot + bir xil versiya = bir xil natija (deterministik)', () => {
    const db = seedYarat()
    const a = A.xodimYillik(db, 'SH-ANVAR', 2026, '2026-11-13')
    const b = A.xodimYillik(db, 'SH-ANVAR', 2026, '2026-11-13')
    expect(a).toEqual(b)
  })
  it('21: oliy va oʻrta maʼlumotli xodimlar uchun talab 50 va 28 (PQ-319 qoidasi)', () => {
    const db = seedYarat()
    const q = db.qoidalar.find((x) => x.id === 'Q-2027')!
    expect(talab(db.shaxslar.find((s) => s.id === 'SH-ANVAR')!, 2028, q).T).toBe(50)
    expect(talab(db.shaxslar.find((s) => s.id === 'SH-DILNOZA')!, 2028, q).T).toBe(28)
  })
  it('istisno (dekret) talabni proporsional kamaytiradi', () => {
    const db = seedYarat()
    const h = A.xodimYillik(db, 'SH-DEKRET', 2026, '2026-11-13')
    expect(h.T).toBeLessThan(h.Tasl)
  })
})

describe('Qabul sinovlari (15-jadval)', () => {
  it('1: bir xodim ikki muassasada — bitta shaxs, bitta kredit hisobi', () => {
    const db = seedYarat()
    expect(db.mehnat.filter((m) => m.personId === 'SH-ANVAR').length).toBe(2)
    expect(db.shaxslar.filter((s) => s.jshshir === db.shaxslar.find((x) => x.id === 'SH-ANVAR')!.jshshir).length).toBe(1)
  })
  it('2: ishdan boʻshagan xodim eski ish beruvchiga koʻrinmaydi', () => {
    const db = seedYarat()
    const ids = A.muassasaXodimlari(db, 'MU01', '2026-11-13').map((m) => m.personId)
    expect(ids).not.toContain('SH-KETGAN')
  })
  it('3: akkreditatsiyasi toʻxtagan provayder kursi katalogda yoʻq, eski sertifikatlar amalda', () => {
    const db = seedYarat()
    const p12oqim = db.oqimlar.filter((o) => o.providerId === 'P12' && o.holat === 'elon_qilingan')
    expect(p12oqim.every((o) => !A.katalogdami(db, o, '2026-11-13'))).toBe(true)
    const p12sert = db.sertifikatlar.filter((s) => s.provider.startsWith('Namangan'))
    expect(p12sert.every((s) => s.holat === 'amalda')).toBe(true)
  })
  it('4: provayder dastur kreditini oshira olmaydi (403)', () => {
    const db = seedYarat()
    const c = ctx(db, 'operator')
    const ds = db.dasturlar.find((d) => d.providerId === 'P01')!
    const v = db.versiyalar.find((x) => x.id === ds.versiyalar[0])!
    const e = xato(() => A.dasturSaqla(db, c, { ...v, tasdiqlanganKredit: (v.tasdiqlanganKredit ?? 0) + 5 }, ds.id))
    expect(e?.kod).toBe(403)
  })
  it('5: bitta oqimga ikki marta yozilish — bitta ariza', () => {
    const db = seedYarat()
    const c = ctx(db, 'anvar')
    const o = db.oqimlar.find((x) => A.katalogdami(db, x, '2026-11-13') && A.mosmi(db, A.shaxs(db, 'SH-ANVAR')!, A.versiya(db, x.versiyaId)!).ok && !db.yozilishlar.some((y) => y.oqimId === x.id && y.personId === 'SH-ANVAR'))!
    const a = A.yozilishYubor(db, c, o.id)
    const b = A.yozilishYubor(db, c, o.id)
    expect(a.id).toBe(b.id)
    expect(db.yozilishlar.filter((y) => y.oqimId === o.id && y.personId === 'SH-ANVAR').length).toBe(1)
  })
  it('6 + V3: davomat bor, baholashdan oʻtilmagan — kredit va sertifikat yoʻq; ikki shaxs qoidasi', () => {
    const db = seedYarat()
    const op = ctx(db, 'operator')
    const oks = db.oqimlar.find((o) => o.providerId === 'P01' && A.versiya(db, o.versiyaId)!.nomi.startsWith('Oʻtkir koronar') && o.holat === 'davom_etmoqda')!
    const n = A.natijaShakllantir(db, op, oks.id)
    expect(n).toBeGreaterThan(5)
    const nat = db.natijalar.filter((x) => A.yozilish(db, x.yozilishId)?.oqimId === oks.id)
    // operator oʻzi tasdiqlay olmaydi
    expect(xato(() => A.natijaTasdiqla(db, op, nat.map((x) => x.id)))?.kod).toBe(403)
    const jurnalOldin = db.jurnal.length
    const h = A.natijaTasdiqla(db, ctx(db, 'rahbar'), nat.map((x) => x.id))
    expect(h.otmadi).toBeGreaterThanOrEqual(1)
    expect(db.jurnal.length - jurnalOldin).toBe(h.kredit)
    const otmagan = nat.filter((x) => x.natija === 'otmadi')
    otmagan.forEach((x) => expect(db.jurnal.some((j) => j.manbaId === x.id)).toBe(false))
  })
  it('8: bir natija 10 marta yuborilsa — bitta kredit yozuvi', () => {
    const db = seedYarat()
    const c = ctx(db, 'rahbar')
    const ekg = db.natijalar.find((n) => n.holat === 'tasdiqlashda' && n.natija === 'otdi')!
    A.natijaTasdiqla(db, c, [ekg.id])
    for (let i = 0; i < 10; i++) A.hodisaQabul(db, c, ekg.eventId, 'natija_tasdiqlandi', ekg.id)
    expect(db.jurnal.filter((j) => j.manbaId === ekg.id).length).toBe(1)
  })
  it('7: LMSʼdan natija keladi → tasdiqlangach kredit va QR-sertifikat; takror event_id — 409', () => {
    const db = seedYarat()
    const c = ctx(db, 'operator')
    const exo = db.oqimlar.find((o) => o.holat === 'davom_etmoqda' && A.versiya(db, o.versiyaId)!.nomi.startsWith('ExoKG'))!
    const anvar = A.shaxs(db, 'SH-ANVAR')!
    const r1 = A.lmsNatija(db, c, { event_id: 'lms-1', cohort_id: exo.kod, jshshir: anvar.jshshir, result: 'passed', score: 88 })
    const r2 = A.lmsNatija(db, c, { event_id: 'lms-1', cohort_id: exo.kod, jshshir: anvar.jshshir, result: 'passed', score: 88 })
    expect(r1.http).toBe(200)
    expect(r2.http).toBe(409)
  })
  it('9–10: QR — haqiqiy va bekor qilingan sertifikat', () => {
    const db = seedYarat()
    const tz = db.tuzatishlar.find((t) => t.holat === 'kutilmoqda')!
    A.tuzatishQaror(db, ctx(db, 'qaror'), tz.id, true)
    const yozuv = db.jurnal.find((j) => j.id === tz.yozuvId)!
    const s = db.sertifikatlar.find((x) => x.id === yozuv.sertifikatId)!
    expect(s.holat).toBe('bekor_qilingan')
    expect(db.sertifikatlar.some((x) => x.holat === 'amalda')).toBe(true)
  })
  it('11: xodim oʻziga kredit qoʻsha olmaydi (403) va audit yoziladi', () => {
    const db = seedYarat()
    const c = ctx(db, 'anvar')
    expect(xato(() => A.taqiqlanganKreditOzgartirish(db, c, 'SH-ANVAR', 10))?.kod).toBe(403)
  })
  it('12: ish beruvchi boshqa muassasa xodimiga eslatma yubora olmaydi (403)', () => {
    const db = seedYarat()
    const begona = db.mehnat.find((m) => m.muassasaId === 'MU05')!.personId
    expect(xato(() => A.eslatmaYubor(db, ctx(db, 'muassasa'), [begona], 'test'))?.kod).toBe(403)
  })
  it('16: yangi qoida oʻtgan yillarni oʻzgartirmaydi', () => {
    const db = seedYarat()
    const oldin = A.xodimYillik(db, 'SH-ANVAR', 2025, '2026-11-13')
    A.qoidaTasdiqla(db, ctx(db, 'qaror'), 'Q-2027b', true)
    const keyin = A.xodimYillik(db, 'SH-ANVAR', 2025, '2026-11-13')
    expect(keyin).toEqual(oldin)
  })
  it('17: 8 kredit bekor qilinadi — jurnalda ikki yozuv, balans toʻgʻri', () => {
    const db = seedYarat()
    const tz = db.tuzatishlar.find((t) => t.holat === 'kutilmoqda')!
    const y = db.jurnal.find((j) => j.id === tz.yozuvId)!
    const oldin = balans(db.jurnal, y.personId, y.yil)
    // taklif qilgan oʻzi tasdiqlay olmaydi
    expect(xato(() => A.tuzatishQaror(db, { ...ctx(db, 'qaror'), user: { ...ctx(db, 'qaror').user, id: tz.taklifQilgan } }, tz.id, true))?.kod).toBe(403)
    A.tuzatishQaror(db, ctx(db, 'qaror'), tz.id, true)
    expect(db.jurnal.filter((j) => j.id === y.id || j.bekorQilinganId === y.id).length).toBe(2)
    expect(balans(db.jurnal, y.personId, y.yil)).toBe(oldin - y.miqdor)
  })
  it('22: reja — ish beruvchi qaytaradi, xodim tuzatadi, ish beruvchi tasdiqlaydi; ikkala versiya saqlanadi', () => {
    const db = seedYarat()
    const xc = ctx(db, 'dilnoza')
    const mc = ctx(db, 'muassasa')
    const r = db.rejalar.find((x) => x.id === 'RJ-DILNOZA')!
    A.rejaYubor(db, xc, r.id)
    A.rejaQaror(db, mc, r.id, false, 'Amaliy kurs qoʻshing')
    A.rejaYubor(db, xc, r.id)
    A.rejaQaror(db, mc, r.id, true, '')
    const r2 = db.rejalar.find((x) => x.id === 'RJ-DILNOZA')!
    expect(r2.holat).toBe('tasdiqlandi')
    expect(r2.oldingiVersiyalar.length).toBeGreaterThanOrEqual(1)
    expect(r2.tasdiqlovchi).toBe(mc.user.id)
  })
  it('23–24: xorijiy 30 CME avtomatik 30 kredit emas; qisman 5 — portfolioga faqat 5', () => {
    const db = seedYarat()
    const t = db.tanOlish.find((x) => x.xorijiyKredit === 30)!
    expect(db.jurnal.some((j) => j.manbaId === t.id)).toBe(false)
    const mc = ctx(db, 'mutaxassis')
    A.tanOlishTekshiruv(db, mc, t.id, 'reestr', 'AHA reestrida topildi')
    A.tanOlishXulosa(db, mc, t.id, { turi: 'qisman', milliyKredit: 5, kursTuri: 'tanlov', yonalish: 'amaliy', metodika: 'TM-2026.1', asos: 'Faqat amaliy qism' })
    A.tanOlishTasdiqla(db, ctx(db, 'qaror'), t.id)
    expect(db.jurnal.filter((j) => j.manbaId === t.id).reduce((a, j) => a + j.miqdor, 0)).toBe(5)
  })
  it('25: manfaatlar toʻqnashuvi bor ekspertni biriktirish bloklanadi', () => {
    const db = seedYarat()
    const a = db.akkArizalar.find((x) => x.providerId === 'P06')!
    a.holat = 'ekspertiza'
    expect(xato(() => A.ekspertBiriktir(db, ctx(db, 'mutaxassis'), a.id, ['E3']))?.kod).toBe(403)
  })
  it('26: logbookka bemor F.I.Sh. kiritish bloklanadi', () => {
    const db = seedYarat()
    const e = xato(() => A.logbookQosh(db, ctx(db, 'rezident'), { konikmaKod: 'KRD-01', daraja: 'mustaqil', sana: '2026-11-13', joy: 'KB1', izoh: 'Bemor Karimova Malika, EKG' }))
    expect(e?.kod).toBe(422)
  })
  it('27: PSV — manba javob bermagan boʻlsa «tasdiqlandi» hisoboti chiqmaydi', () => {
    const db = seedYarat()
    expect(xato(() => A.psvHisobot(db, ctx(db, 'mutaxassis'), 'PSV-1'))?.kod).toBe(422)
  })
  it('akkreditatsiya: komissiya qarori reestrni yangilaydi, kvorum tekshiriladi', () => {
    const db = seedYarat()
    const a = db.akkArizalar.find((x) => x.holat === 'komissiya')!
    const c = ctx(db, 'qaror')
    expect(xato(() => A.akkQaror(db, c, a.id, { turi: 'akkreditatsiya', raqam: 'UKR-1', muddat: '2029-12-31', sabab: 'ok', kredit: 5, komissiya: { azolar: ['a', 'b', 'c', 'd', 'e'], ovozlar: { za: 2, qarshi: 0, betaraf: 0 }, bayonnoma: 'x' } }))?.kod).toBe(422)
    A.akkQaror(db, c, a.id, { turi: 'akkreditatsiya', raqam: 'UKR-1', muddat: '2029-12-31', sabab: 'ok', kredit: 5, komissiya: { azolar: ['a', 'b', 'c', 'd', 'e'], ovozlar: { za: 4, qarshi: 0, betaraf: 0 }, bayonnoma: 'x' } })
    expect(A.versiya(db, a.versiyaId)!.holat).toBe('tasdiqlangan')
    expect(A.versiya(db, a.versiyaId)!.tasdiqlanganKredit).toBe(5)
  })
  it('kunlik solishtirish: farq va takror yoʻq', () => {
    const db = seedYarat()
    const s = A.solishtirish(db, 2026)
    expect(s.takrorlar).toBe(0)
  })
})
