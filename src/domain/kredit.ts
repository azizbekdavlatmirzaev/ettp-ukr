// Kredit xizmati — yillik holatni hisoblash (TZ 4.3.1, 12-jadval).
// Sof funksiyalar: bir xil maʼlumot + bir xil qoida versiyasi => har doim bir xil natija.
import type { KreditQoidasi, KreditYozuvi, MehnatMunosabati, Shaxs, YillikHolat } from './types'

const KUN = 86_400_000

export function yilChegaralari(yil: number, q: KreditQoidasi) {
  const boshi = new Date(`${yil}-${q.params.yilBoshi}T00:00:00+05:00`)
  const oxiri = new Date(`${yil}-${q.params.yilOxiri}T23:59:59+05:00`)
  return { boshi, oxiri }
}

/** Sana uchun amaldagi qoida versiyasi: kuchga kirgan, tugamagan, holati «amalda» yoki «tasdiqlangan». */
export function amaldagiQoida(qoidalar: KreditQoidasi[], sana: string): KreditQoidasi | undefined {
  const t = new Date(sana).getTime()
  return qoidalar
    .filter((q) => (q.holat === 'amalda' || q.holat === 'arxiv' || q.holat === 'tasdiqlangan'))
    .filter((q) => new Date(q.kuchgaKirish).getTime() <= t && (!q.tugash || new Date(q.tugash).getTime() >= t))
    .sort((a, b) => b.kuchgaKirish.localeCompare(a.kuchgaKirish))[0]
}

function kesishmaKunlar(a1: Date, a2: Date, b1: Date, b2: Date) {
  const s = Math.max(a1.getTime(), b1.getTime())
  const e = Math.min(a2.getTime(), b2.getTime())
  return e > s ? Math.round((e - s) / KUN) : 0
}

/** Talab (T): maʼlumot darajasi bo'yicha; yil davomida ishga kirgan yoki istisno holatidagi xodimga kamaytiriladi. */
export function talab(shaxs: Shaxs, yil: number, q: KreditQoidasi, mehnat: MehnatMunosabati[] = []) {
  const Tasl = shaxs.daraja === 'oliy' ? q.params.talabOliy : q.params.talabOrta
  const { boshi, oxiri } = yilChegaralari(yil, q)
  const yilKun = Math.round((oxiri.getTime() - boshi.getTime()) / KUN)
  let faolKun = yilKun
  // yil davomida ishga kirgan
  if (q.params.yangiXodimProporsional && mehnat.length) {
    const birinchi = mehnat.map((m) => new Date(m.dan)).sort((a, b) => a.getTime() - b.getTime())[0]
    if (birinchi > boshi && birinchi < oxiri) faolKun = Math.round((oxiri.getTime() - birinchi.getTime()) / KUN)
  }
  // istisno (dekret, uzoq kasallik ...)
  if (shaxs.istisno) {
    const k = kesishmaKunlar(boshi, oxiri, new Date(shaxs.istisno.dan), new Date(shaxs.istisno.gacha))
    if (q.params.istisnoKamaytirish === 'toliq' && k > 0) faolKun = 0
    else faolKun = Math.max(0, faolKun - k)
  }
  const T = Math.round((Tasl * faolKun) / yilKun)
  return { T, Tasl }
}

export interface HisobKirish {
  shaxs: Shaxs
  yil: number
  yozuvlar: KreditYozuvi[] // butun jurnal yoki shu shaxsniki
  qoida: KreditQoidasi
  mehnat?: MehnatMunosabati[]
  tekshiruvda?: number // tasdiqlangan, lekin tekshiruvga oʻtgan natijalar krediti
  bugun?: string
}

export function yillikHolat(k: HisobKirish): YillikHolat {
  const { shaxs, yil, qoida: q } = k
  const p = q.params
  const ys = k.yozuvlar.filter((y) => y.personId === shaxs.id && y.yil === yil)
  const { T, Tasl } = talab(shaxs, yil, q, k.mehnat)

  const asosiy = ys.filter((y) => y.manba !== 'otkazish')
  const K = sum(asosiy.map((y) => y.miqdor))

  // limitlar
  const mustaqil = sum(asosiy.filter((y) => y.tadbirTuri === 'mustaqil').map((y) => y.miqdor))
  const konf = sum(asosiy.filter((y) => y.tadbirTuri === 'konferensiya').map((y) => y.miqdor))
  const limitKesildi = Math.max(0, mustaqil - p.mustaqilLimit) + Math.max(0, konf - p.konferensiyaLimit)

  const O = sum(ys.filter((y) => y.manba === 'otkazish').map((y) => y.miqdor))
  const X = K - limitKesildi + O

  const majburiy = sum(ys.filter((y) => y.kursTuri === 'majburiy').map((y) => y.miqdor))
  const amaliy = sum(ys.filter((y) => y.yonalish === 'amaliy').map((y) => y.miqdor))
  const majburiyKerak = Math.ceil(T * p.majburiyUlush)
  const amaliyKerak = Math.ceil(T * p.amaliyUlush)

  const yetmaganUlushlar: string[] = []
  if (majburiy < majburiyKerak) yetmaganUlushlar.push(`majburiy: ${majburiy}/${majburiyKerak}`)
  if (amaliy < amaliyKerak) yetmaganUlushlar.push(`amaliy: ${amaliy}/${amaliyKerak}`)

  const bajarildi = X >= T && yetmaganUlushlar.length === 0
  const otkaziladi = bajarildi ? Math.min(X - T, Math.floor(T * p.otkazishUlush)) : 0

  const { boshi, oxiri } = yilChegaralari(yil, q)
  const bugun = new Date(k.bugun ?? new Date().toISOString())
  const qolganKun = Math.max(0, Math.ceil((oxiri.getTime() - bugun.getTime()) / KUN))
  const otgan = Math.min(1, Math.max(0, (bugun.getTime() - boshi.getTime()) / (oxiri.getTime() - boshi.getTime())))

  let xavf: YillikHolat['xavf']
  if (bajarildi) xavf = 'bajarildi'
  else if (qolganKun === 0) xavf = 'qarzdor'
  else if (T === 0 || X / T >= otgan * 0.75) xavf = 'yolda'
  else xavf = 'xavf'

  return {
    yil,
    qoidaId: q.id,
    qoidaVersiya: q.versiya,
    T,
    Tasl,
    K,
    limitKesildi,
    O,
    X,
    majburiy,
    amaliy,
    majburiyKerak,
    amaliyKerak,
    tekshiruvda: k.tekshiruvda ?? 0,
    natija: bajarildi ? 'bajarildi' : 'yetishmaydi',
    yetishmaydi: Math.max(0, T - X),
    yetmaganUlushlar,
    otkaziladi,
    qolganKun,
    xavf,
  }
}

/** Jurnaldan balans (kunlik solishtirish uchun): yozuvlar yigʻindisi. */
export function balans(yozuvlar: KreditYozuvi[], personId: string, yil: number) {
  return sum(yozuvlar.filter((y) => y.personId === personId && y.yil === yil).map((y) => y.miqdor))
}

/** Bekor qilingan (unga qarshi bekor qiluvchi yozuv bor) yozuvlar toʻplami. */
export function bekorQilinganlar(yozuvlar: KreditYozuvi[]) {
  return new Set(yozuvlar.filter((y) => y.bekorQilinganId).map((y) => y.bekorQilinganId!))
}

function sum(a: number[]) {
  return Math.round(a.reduce((s, x) => s + x, 0) * 100) / 100
}

export const XAVF_MATN: Record<YillikHolat['xavf'], string> = {
  bajarildi: 'Talab bajarildi',
  yolda: 'Reja boʻyicha',
  xavf: 'Xavf ostida',
  qarzdor: 'Qarzdor',
}
