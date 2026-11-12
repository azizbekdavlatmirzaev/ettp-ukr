import type * as T from './types'

/** Prototipning butun «maʼlumotlar bazasi» — brauzerda (localStorage) saqlanadi. Ishlab chiqarishda — PostgreSQL «ukr» sxemasi. */
export interface DB {
  versiya: number
  seq: number // kredit jurnali tartib raqami
  hisoblagich: Record<string, number> // raqamlar (sertifikat, ariza ...)
  foydalanuvchilar: T.Foydalanuvchi[]
  muassasalar: T.Muassasa[]
  shaxslar: T.Shaxs[]
  mehnat: T.MehnatMunosabati[]
  provayderlar: T.Provayder[]
  dasturlar: T.Dastur[]
  versiyalar: T.DasturVersiya[]
  oqimlar: T.Oqim[]
  yozilishlar: T.Yozilish[]
  davomat: T.Davomat[]
  baholashlar: T.Baholash[]
  natijalar: T.YakuniyNatija[]
  qoidalar: T.KreditQoidasi[]
  jurnal: T.KreditYozuvi[]
  tuzatishlar: T.TuzatishSorovi[]
  sertifikatlar: T.Sertifikat[]
  rejalar: T.Reja[]
  akkArizalar: T.AkkAriza[]
  ekspertlar: T.Ekspert[]
  tanOlish: T.TanOlishAriza[]
  murojaatlar: T.Murojaat[]
  signallar: T.Signal[]
  klinikBazalar: T.KlinikBaza[]
  kvotalar: T.Kvota[]
  rezidentlar: T.Rezident[]
  rotatsiyalar: T.Rotatsiya[]
  logbook: T.LogbookYozuv[]
  rezidentBaholar: T.RezidentBaho[]
  psv: T.PsvIsh[]
  bildirishnomalar: T.Bildirishnoma[]
  audit: T.AuditYozuv[]
  hodisalar: T.Hodisa[]
  taqvim: T.TaqvimHodisa[]
  yillikHisobotlar: T.YillikHisobotNusxa[]
  sozlamalar: T.Sozlamalar
}
