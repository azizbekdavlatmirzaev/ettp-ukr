// Portfolio va yillik hisobot eksporti
import * as A from '@/domain/amallar'
import type { DB } from '@/domain/db'
import type * as T from '@/domain/types'
import { mutNomi } from '@/shared/hooks'
import { jsonYukla, umumiyPdf, yillikHisobotPdf, QR_ASOS } from '@/lib/eksport'
import { niqob, sana } from '@/lib/format'
import { MANBA, KURS_TURI, YONALISH, TOIFA } from '@/lib/holat'

function ishJoyi(db: DB, personId: string) {
  const m = db.mehnat.find((x) => x.personId === personId && x.asosiy && !x.gacha)
  return m ? `${db.muassasalar.find((u) => u.id === m.muassasaId)?.nomi ?? ''}, ${m.lavozim}` : '—'
}

export async function yillikPdf(db: DB, s: T.Shaxs, n: T.YillikHisobotNusxa) {
  const q = db.qoidalar.find((x) => x.id === n.holat.qoidaId)
  await yillikHisobotPdf({
    fio: A.toliqFio(s),
    jshshirNiqob: niqob(s.jshshir),
    mutaxassislik: mutNomi(s.mutaxassislikId),
    ishJoyi: ishJoyi(db, s.id),
    holat: n.holat,
    yozuvlar: db.jurnal.filter((j) => j.personId === s.id && j.yil === n.yil).sort((a, b) => a.seq - b.seq).map((j) => ({ sana: sana(j.sana), nomi: j.nomi, provider: j.providerNomi, miqdor: j.miqdor, tur: `${KURS_TURI[j.kursTuri]}/${YONALISH[j.yonalish]}`, manba: MANBA[j.manba] })),
    qr: n.qr,
    qoidaNomi: q?.nomi ?? '',
  })
}

function portfolioMalumot(db: DB, s: T.Shaxs) {
  const kurslar = db.yozilishlar.filter((y) => y.personId === s.id).map((y) => {
    const o = A.oqim(db, y.oqimId)!
    const v = A.versiya(db, o.versiyaId)!
    return { kurs: v.nomi, oqim: o.kod, provayder: A.provayder(db, o.providerId)?.nomi, sanalar: `${o.boshlanish} — ${o.tugash}`, holat: y.holat, kredit: v.tasdiqlanganKredit ?? null }
  })
  const sertifikatlar = db.sertifikatlar.filter((x) => x.personId === s.id).map((x) => ({ turi: x.turi, seriya: x.seriya, raqam: x.raqam, kurs: x.kurs, provayder: x.provider, sana: x.sana, kredit: x.kredit, holat: x.holat, qr: QR_ASOS() + x.qrKalit }))
  const tanOlish = db.tanOlish.filter((t) => t.personId === s.id).map((t) => ({ raqam: t.raqam, tashkilot: t.tashkilot, kurs: t.kurs, xorijiyKredit: `${t.xorijiyKredit} ${t.kreditTuri}`, holat: t.holat, milliyKredit: t.xulosa?.milliyKredit ?? null }))
  const rejalar = db.rejalar.filter((r) => r.personId === s.id).map((r) => ({ yil: r.yil, versiya: r.versiya, holat: r.holat, bandlar: r.bandlar.map((b) => `${b.nomi} (${b.kredit} kr, ${b.muddat})`) }))
  const ish = db.mehnat.filter((m) => m.personId === s.id).map((m) => ({ muassasa: db.muassasalar.find((u) => u.id === m.muassasaId)?.nomi, lavozim: m.lavozim, bolim: m.bolim, asosiy: m.asosiy, dan: m.dan, gacha: m.gacha ?? null, manba: m.manba }))
  return { kurslar, sertifikatlar, tanOlish, rejalar, ish }
}

export function portfolioJson(db: DB, s: T.Shaxs) {
  const d = portfolioMalumot(db, s)
  jsonYukla(`portfolio-${s.familiya}-${new Date().toISOString().slice(0, 10)}.json`, {
    format: 'ETTP-UKR portfolio v1',
    yaratildi: new Date().toISOString(),
    shaxs: { fio: A.toliqFio(s), jshshir: niqob(s.jshshir), mutaxassislik: mutNomi(s.mutaxassislikId), toifa: TOIFA[s.toifa], davlatRoyxati: s.davlatRoyxati.raqam },
    ...d,
  })
}

export async function portfolioPdf(db: DB, s: T.Shaxs) {
  const d = portfolioMalumot(db, s)
  await umumiyPdf(`Portfolio-${s.familiya}`, `Kasbiy portfolio: ${A.toliqFio(s)}`, [
    { t: 'Shaxs', qatorlar: [`Mutaxassislik: ${mutNomi(s.mutaxassislikId)}`, `Toifa: ${TOIFA[s.toifa]}${s.toifaMuddati ? ` (${sana(s.toifaMuddati)} gacha)` : ''}`, `Davlat roʻyxati: ${s.davlatRoyxati.raqam}, ${s.davlatRoyxati.holat}`] },
    { t: 'Ish tarixi', qatorlar: d.ish.map((m) => `${m.muassasa} — ${m.lavozim} (${m.bolim}), ${sana(m.dan)} – ${m.gacha ? sana(m.gacha) : 'hozirgacha'}${m.asosiy ? ', asosiy' : ''}`) },
    { t: 'Sertifikatlar', qatorlar: d.sertifikatlar.length ? d.sertifikatlar.map((x) => `${x.seriya} ${x.raqam} — ${x.kurs} (${x.provayder}), ${sana(x.sana)}, ${x.kredit} kredit, ${x.holat}`) : ['—'] },
    { t: 'Kurslar', qatorlar: d.kurslar.map((k) => `${k.kurs} [${k.oqim}] — ${k.holat}`) },
    { t: 'Xorijiy kreditni tan olish', qatorlar: d.tanOlish.length ? d.tanOlish.map((t) => `${t.raqam}: ${t.kurs} (${t.tashkilot}), ${t.xorijiyKredit} → ${t.milliyKredit ?? '—'} milliy kredit, ${t.holat}`) : ['—'] },
    { t: 'Rivojlanish rejalari', qatorlar: d.rejalar.length ? d.rejalar.map((r) => `${r.yil} (v${r.versiya}, ${r.holat}): ${r.bandlar.join('; ')}`) : ['—'] },
  ], QR_ASOS())
}
