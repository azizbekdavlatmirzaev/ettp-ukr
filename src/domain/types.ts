// ETTP–UKR maʼlumotlar modeli (TZ 4.3.2, 13-jadval asosida).
// Barcha identifikatorlar — satr (ishlab chiqarishda UUID). Sanalar — ISO 8601.

export type ID = string

// ───────────────────────── Rollar ─────────────────────────
export type Rol =
  | 'xodim'
  | 'provayder_operator'
  | 'provayder_rahbar'
  | 'muassasa'
  | 'markaz_mutaxassis'
  | 'markaz_rahbar'
  | 'ekspert'
  | 'klinik_rahbar'
  | 'rezident'
  | 'vazirlik'
  | 'admin'

export interface Foydalanuvchi {
  id: ID
  login: string
  parol: string
  rol: Rol
  fio: string
  personId?: ID // xodim, rezident, ekspert, klinik rahbar — Platformadagi yagona shaxs
  providerId?: ID // provayder operatori/rahbari
  muassasaId?: ID // muassasa operatori
  lavozim?: string
  faol: boolean
}

// ───────────────────────── Maʼlumotnomalar ─────────────────────────
export interface Hudud { id: ID; nomi: string }
export interface Mutaxassislik { id: ID; nomi: string; daraja: MalakaDarajasi; guruh: string }
export type MalakaDarajasi = 'oliy' | 'orta'
export type Toifa = 'oliy' | 'birinchi' | 'ikkinchi' | 'yoq'

export interface Muassasa {
  id: ID
  nomi: string
  turi: string
  hududId: ID
  manzil: string
  bolimlar: string[]
}

// ───────────────────────── Shaxs (Reestrdan, faqat oʻqiladi) ─────────────────────────
export interface Shaxs {
  id: ID
  jshshir: string
  familiya: string
  ism: string
  otasi: string
  jins: 'E' | 'A'
  tugilgan: string
  telefon: string
  email: string
  daraja: MalakaDarajasi
  mutaxassislikId: ID
  toifa: Toifa
  toifaMuddati?: string
  davlatRoyxati: { raqam: string; sana: string; holat: 'amalda' | 'toxtatilgan' }
  hududId: ID
  istisno?: { turi: 'dekret' | 'kasallik' | 'harbiy' | 'boshqa'; dan: string; gacha: string; hujjat: string }
  reestrYangilangan: string
}

export interface MehnatMunosabati {
  id: ID
  personId: ID
  muassasaId: ID
  lavozim: string
  bolim: string
  asosiy: boolean
  dan: string
  gacha?: string // ishdan boʻshagan sana
  manba: 'HRM' | 'Muassasa kabineti'
}

// ───────────────────────── Provayder va akkreditatsiya ─────────────────────────
export type AkkHolat =
  | 'ariza'
  | 'korib_chiqilmoqda'
  | 'akkreditatsiyalangan'
  | 'shartli'
  | 'toxtatilgan'
  | 'bekor'
  | 'muddati_tugagan'

export interface HolatTarixi { holat: string; sana: string; kim: string; izoh?: string; qaror?: string }

export interface Provayder {
  id: ID
  stir: string // xorijiyda — tashkilot ID
  nomi: string
  qisqa: string
  turi: 'davlat' | 'nodavlat' | 'xorijiy'
  mamlakat: string
  hududId?: ID
  manzil: string
  sayt?: string
  litsenziya?: { raqam: string; sana: string; muddat: string }
  xorijiyAkk?: { tashkilot: string; id: string; havola: string }
  filiallar: string[]
  masullar: { fio: string; lavozim: string; telefon: string }[]
  holat: AkkHolat
  qaror?: { raqam: string; sana: string; muddat: string }
  tarix: HolatTarixi[]
  reyting?: number // tinglovchilar soʻrovnomasi oʻrtachasi (1–5)
  yaratilgan: string
}

export type KursTuri = 'majburiy' | 'tanlov'
export type Yonalish = 'nazariy' | 'amaliy'
export type Shakl = 'onlayn' | 'oflayn' | 'aralash'
export type TadbirTuri = 'kurs' | 'konferensiya' | 'mustaqil' | 'simulyatsiya' | 'stajirovka'
export type DasturHolat = 'qoralama' | 'korib_chiqishda' | 'tasdiqlangan' | 'rad_etilgan' | 'arxiv'

export interface Dars { id: ID; nomi: string; turi: 'video' | 'pdf' | 'vebinar' | 'topshiriq' | 'test'; davomiylik: number }

export interface DasturVersiya {
  id: ID
  dasturId: ID
  versiya: number
  nomi: string
  mutaxassisliklar: ID[]
  maqsad: string
  natijalar: string[]
  tinglovchi: MalakaDarajasi | 'barchasi'
  soatNazariy: number
  soatAmaliy: number
  shakl: Shakl
  tadbirTuri: TadbirTuri
  kursTuri: KursTuri
  yonalish: Yonalish
  baholash: string[]
  oqituvchilar: string[]
  klinikBaza?: string
  til: string
  soralganKredit: number
  tasdiqlanganKredit?: number // akkreditatsiyada tasdiqlanadi; provayder oʻzgartira olmaydi
  holat: DasturHolat
  amalMuddati?: string
  darslar: Dars[]
  yaratilgan: string
}

export interface Dastur { id: ID; providerId: ID; kod: string; versiyalar: ID[] }

export type Moliya = 'byudjet' | 'ish_beruvchi' | 'shaxsiy' | 'grant'
export type OqimHolat = 'qoralama' | 'elon_qilingan' | 'davom_etmoqda' | 'yakunlangan' | 'bekor'

export interface Mashgulot { id: ID; sana: string; mavzu: string; qrKod: string }

export interface Oqim {
  id: ID
  kod: string
  providerId: ID
  versiyaId: ID
  boshlanish: string
  tugash: string
  qabulTugash: string
  joy: string
  havola?: string
  hududId: ID
  orinlar: number
  oqituvchi: string
  moliya: Moliya
  narx: number
  holat: OqimHolat
  story: boolean
  mashgulotlar: Mashgulot[]
  yaratilgan: string
}

// ───────────────────────── Oʻquv jarayoni ─────────────────────────
export type YozilishHolat =
  | 'yuborildi'
  | 'qabul_qilindi'
  | 'navbatda'
  | 'rad_etildi'
  | 'oqimoqda'
  | 'tugatdi'
  | 'otmadi'
  | 'chiqdi'

export interface Yozilish {
  id: ID
  personId: ID
  oqimId: ID
  holat: YozilishHolat
  yuborilgan: string
  sabab?: string
  tarix: HolatTarixi[]
  progress: ID[] // koʻrilgan darslar
  sorovnoma?: { baho: number; izoh: string; sana: string }
}

export interface Davomat {
  id: ID
  yozilishId: ID
  mashgulotId: ID
  usul: 'QR' | 'jurnal' | 'LMS'
  holat: 'keldi' | 'kelmadi' | 'uzrli'
  vaqt: string
  dalil?: string
  kiritgan: string
}

export type BaholashTuri = 'test' | 'amaliy' | 'vaziyatli' | 'OSKE' | 'suhbat'

export interface Baholash {
  id: ID
  yozilishId: ID
  turi: BaholashTuri
  ball: number
  otishBali: number
  otdi: boolean
  baholovchi: string
  sana: string
  manba: 'Test quyi tizimi' | 'Rubrika' | 'LMS' | 'Excel'
}

export type NatijaHolat = 'qoralama' | 'tasdiqlashda' | 'tasdiqlangan' | 'tekshiruvda'

export interface YakuniyNatija {
  id: ID
  yozilishId: ID
  eventId: string // takror yuborishdan himoya
  natija: 'otdi' | 'otmadi'
  ball: number
  holat: NatijaHolat
  kiritgan: ID
  kiritilgan: string
  tasdiqlovchi?: ID
  tasdiqlangan?: string
  tekshiruvSababi?: string[]
}

// ───────────────────────── Kredit ─────────────────────────
export interface KreditParametrlar {
  talabOliy: number
  talabOrta: number
  majburiyUlush: number // 0..1
  amaliyUlush: number // 0..1
  otkazishUlush: number // T ning qismi
  mustaqilLimit: number
  konferensiyaLimit: number
  yilBoshi: string // 'MM-DD'
  yilOxiri: string // 'MM-DD'
  istisnoKamaytirish: 'proporsional' | 'toliq'
  yangiXodimProporsional: boolean
}

export type QoidaHolat = 'qoralama' | 'korib_chiqishda' | 'tasdiqlangan' | 'amalda' | 'arxiv' | 'rad_etilgan'

export interface KreditQoidasi {
  id: ID
  versiya: string
  nomi: string
  hujjat: { nomi: string; raqam: string; sana: string }
  kuchgaKirish: string
  tugash?: string
  params: KreditParametrlar
  holat: QoidaHolat
  muallif: ID
  tasdiqlovchi?: ID
  izoh?: string
  yaratilgan: string
}

export type KreditManba = 'natija' | 'tan_olish' | 'tuzatish' | 'otkazish' | 'kochirilgan'

export interface KreditYozuvi {
  id: ID
  seq: number
  personId: ID
  yil: number
  miqdor: number // bekor qiluvchi yozuvda manfiy
  kursTuri: KursTuri
  yonalish: Yonalish
  tadbirTuri: TadbirTuri
  manba: KreditManba
  manbaId: ID
  nomi: string
  providerNomi: string
  qoidaId: ID
  sana: string
  asos: string
  bekorQilinganId?: ID // bekor qiluvchi yozuv — asl yozuvga havola
  sertifikatId?: ID
  yaratuvchi: string
}

export interface TuzatishSorovi {
  id: ID
  yozuvId: ID
  personId: ID
  turi: 'bekor' | 'almashtirish'
  yangiMiqdor?: number
  sabab: string
  hujjat: string
  taklifQilgan: ID
  holat: 'kutilmoqda' | 'tasdiqlandi' | 'rad_etildi'
  tasdiqlovchi?: ID
  sana: string
}

// ───────────────────────── Sertifikat ─────────────────────────
export type HujjatTuri = 'UKR' | 'DIPLOM' | 'PSV' | 'KOMPETENSIYA'

export interface Sertifikat {
  id: ID
  turi: HujjatTuri
  seriya: string
  raqam: string
  qrKalit: string
  personId: ID
  fio: string
  kurs: string
  provider: string
  sana: string
  soat: number
  kredit: number
  natijaId?: ID
  holat: 'amalda' | 'tuzatilgan' | 'bekor_qilingan' | 'tayyorlanmoqda'
  sabab?: string
  kochirilgan?: string // «koʻchirilgan, manba: …»
  shablonVersiya: string
}

// ───────────────────────── Rivojlanish rejasi ─────────────────────────
export type RejaHolat = 'qoralama' | 'yuborildi' | 'qaytarildi' | 'tasdiqlandi' | 'bajarilmoqda' | 'yopildi'

export interface RejaBandi {
  id: ID
  nomi: string
  versiyaId?: ID
  kredit: number
  kursTuri: KursTuri
  yonalish: Yonalish
  muddat: string // chorak yoki oy
  majburiyModul: boolean
  bajarildi: boolean
}

export interface Reja {
  id: ID
  personId: ID
  muassasaId: ID
  yil: number
  versiya: number
  bandlar: RejaBandi[]
  holat: RejaHolat
  izoh?: string
  tashabbuskor: ID
  tasdiqlovchi?: ID
  yangilangan: string
  oldingiVersiyalar: { versiya: number; holat: RejaHolat; bandlar: RejaBandi[]; izoh?: string; sana: string; kim: string }[]
}

// ───────────────────────── Akkreditatsiya arizasi ─────────────────────────
export type AkkArizaHolat =
  | 'qoralama'
  | 'yuborildi'
  | 'toliqlik'
  | 'kamchilik'
  | 'ekspertiza'
  | 'joyida'
  | 'komissiya'
  | 'qaror'
  | 'yakunlandi'

export interface Fayl { id: ID; nomi: string; turi: string; hajm: number; hash: string; yuklangan: string }

export interface EkspertizaVaraq {
  ekspertId: ID
  mezonlar: Record<string, number> // 0..5
  xulosa: string
  tavsiya: 'akkreditatsiya' | 'shartli' | 'rad' | 'qoshimcha'
  topshirilgan?: string
}

export interface AkkAriza {
  id: ID
  raqam: string
  turi: 'provayder' | 'dastur' | 'qayta'
  providerId: ID
  versiyaId?: ID
  hujjatlar: Record<string, Fayl | undefined>
  holat: AkkArizaHolat
  ekspertlar: ID[]
  varaqlar: EkspertizaVaraq[]
  joyida?: { sana: string; manzil: string; tekshiruvchilar: string[]; dalolatnoma?: string; xulosa?: string }
  komissiya?: { azolar: string[]; ovozlar: { za: number; qarshi: number; betaraf: number }; bayonnoma: string }
  qaror?: { turi: 'akkreditatsiya' | 'shartli' | 'rad' | 'qoshimcha'; raqam: string; sana: string; muddat?: string; sabab: string; kredit?: number; eri: string; tasdiqlovchi: ID }
  izoh?: string
  muddat: string // koʻrib chiqish muddati (ish kunlarida hisoblangan)
  yuborilgan?: string
  tarix: HolatTarixi[]
  yaratilgan: string
}

export interface Ekspert {
  id: ID
  personId?: ID
  fio: string
  mutaxassislik: string
  ishJoyi: string
  ishJoyiProviderId?: ID
  vakolatMuddati: string
  deklaratsiya: { providerId: ID; sabab: string }[] // manfaatlar toʻqnashuvi
  faol: boolean
}

// ───────────────────────── Xorijiy tan olish ─────────────────────────
export type TanOlishHolat = 'yuborildi' | 'tekshiruvda' | 'kamchilik' | 'ekspert_xulosasi' | 'qaror' | 'tasdiqlandi' | 'rad_etildi'

export interface TanOlishAriza {
  id: ID
  raqam: string
  personId: ID
  tashkilot: string
  davlat: string
  kurs: string
  sana: string
  soat: number
  shakl: Shakl
  sertifikatRaqam: string
  xorijiyKredit: number
  kreditTuri: 'CME' | 'ECTS' | 'CPD' | 'boshqa'
  mutaxassislikId: ID
  fayllar: Fayl[]
  holat: TanOlishHolat
  tekshiruvlar: { usul: 'QR' | 'reestr' | 'rasmiy_sorov'; natija: string; sana: string }[]
  ekspertId?: ID
  xulosa?: { turi: 'toliq' | 'qisman' | 'rad'; milliyKredit: number; kursTuri: KursTuri; yonalish: Yonalish; metodika: string; asos: string; tayyorlagan: ID }
  tasdiqlovchi?: ID
  muddat: string
  toxtatilgan?: boolean
  yuborilgan: string
  tarix: HolatTarixi[]
}

// ───────────────────────── Murojaat va apellyatsiya ─────────────────────────
export type MurojaatHolat = 'yuborildi' | 'qabul_qilindi' | 'korib_chiqilmoqda' | 'malumot_soraldi' | 'qaror' | 'yopildi'

export interface Murojaat {
  id: ID
  raqam: string
  turi: 'kredit' | 'sertifikat' | 'baho' | 'akkreditatsiya' | 'tan_olish' | 'rezidentura' | 'psv' | 'boshqa'
  obyekt?: { turi: string; id: ID; nomi: string }
  arizachiId: ID // foydalanuvchi
  matn: string
  fayllar: Fayl[]
  holat: MurojaatHolat
  masulRol: Rol
  masulId?: ID
  birinchiQarorChiqargan?: ID // apellyatsiyani hal qila olmaydi
  muddat: string
  qaror?: { natija: 'qanoatlantirildi' | 'qisman' | 'rad_etildi' | 'qayta_baholash'; matn: string; kim: ID; sana: string }
  yozishmalar: { kim: string; matn: string; sana: string }[]
  yuborilgan: string
  tarix: HolatTarixi[]
}

// ───────────────────────── Sifat nazorati ─────────────────────────
export type SignalTuri =
  | 'kop_sertifikat'
  | 'bir_xil_ball'
  | 'mutaxassislik_mos_emas'
  | 'akk_muddati_tugagan'
  | 'takroriy_natija'
  | 'ikki_joyda'

export interface Signal {
  id: ID
  turi: SignalTuri
  providerId: ID
  oqimId?: ID
  tavsif: string
  qiymat: string
  aniqlangan: string
  holat: 'yangi' | 'tekshiruvda' | 'yopildi' | 'asossiz'
  ish?: {
    masul: ID
    dalillar: string[]
    xulosa?: string
    chora?: { matn: string; muddat: string }
    ijro?: 'bajarildi' | 'bajarilmadi' | 'kutilmoqda'
  }
}

// ───────────────────────── Rezidentura (3-bosqich) ─────────────────────────
export interface KlinikBaza { id: ID; nomi: string; hududId: ID; mutaxassisliklar: ID[]; sigim: number; shartnomaMuddati: string }
export interface Kvota { id: ID; mutaxassislikId: ID; tashkilot: string; yil: number; turi: 'davlat' | 'maqsadli' | 'kontrakt'; soni: number; versiya: number }

export interface Rezident {
  id: ID
  personId: ID
  mutaxassislikId: ID
  tashkilot: string
  kurs: number
  boshlangan: string
  tugash: string
  rahbarId: ID // klinik rahbar foydalanuvchi ID
  moliya: 'davlat' | 'maqsadli' | 'kontrakt'
  holat: 'oqimoqda' | 'akademik_tatil' | 'chetlashtirilgan' | 'bitirgan'
}

export interface Rotatsiya { id: ID; rezidentId: ID; bazaId: ID; bolim: string; dan: string; gacha: string; maqsad: string; holat: 'reja' | 'davom' | 'yakunlangan'; xulosa?: string }

export interface Konikma { kod: string; nomi: string; minimal: number; majburiy: boolean }

export type IshtirokDarajasi = 'kuzatdi' | 'yordam_berdi' | 'nazorat_ostida' | 'mustaqil'

export interface LogbookYozuv {
  id: ID
  rezidentId: ID
  konikmaKod: string
  daraja: IshtirokDarajasi
  sana: string
  joy: string
  izoh: string // bemorni aniqlaydigan maʼlumotsiz
  holat: 'kutilmoqda' | 'tasdiqlangan' | 'rad_etildi'
  rahbarIzohi?: string
}

export interface RezidentBaho { id: ID; rezidentId: ID; turi: 'joriy' | 'oraliq' | 'yakuniy'; sana: string; ball: number; natija: 'otdi' | 'otmadi'; komissiya: string; izoh: string }

// ───────────────────────── PSV (3-bosqich) ─────────────────────────
export interface PsvIsh {
  id: ID
  raqam: string
  soruvchi: 'shaxs' | 'vakil' | 'xorijiy_tashkilot'
  personId: ID
  qabulQiluvchi: string
  maqsad: string
  hujjatlar: { turi: 'diplom' | 'mutaxassislik' | 'toifa' | 'staj' | 'ukr' | 'davlat_royxati'; manba: string; holat: 'kutilmoqda' | 'tasdiqlandi' | 'farq' | 'tasdiqlanmadi'; javob?: string; sana?: string }[]
  rozilik: { hajm: string; muddat: string; berilgan: string; bekor?: boolean }
  tolov: { tarif: number; holat: 'kutilmoqda' | 'tolandi' | 'talab_qilinmaydi'; hisob?: string }
  holat: 'yangi' | 'manba_sorovi' | 'javob_kutilmoqda' | 'hisobot_tayyor' | 'yetkazildi' | 'rad_etildi'
  hisobotId?: ID
  yetkazish?: { usul: 'API' | 'pochta' | 'arizachi'; sana: string }
  yaratilgan: string
}

// ───────────────────────── Tizim ─────────────────────────
export interface Bildirishnoma { id: ID; userId: ID; matn: string; havola?: string; turi: 'info' | 'ok' | 'warn' | 'err'; sana: string; oqilgan: boolean; kanal: ('kabinet' | 'sms' | 'email')[] }

export interface AuditYozuv {
  id: ID
  sana: string
  userId: ID
  fio: string
  rol: Rol | 'tizim' | 'mehmon'
  amal: string
  obyekt: string
  obyektId?: ID
  oldin?: string
  keyin?: string
  ip: string
  natija: 'ok' | 'rad_etildi'
}

export interface Hodisa {
  id: string // eventId — yagona
  turi: 'natija_tasdiqlandi' | 'kredit_yozildi' | 'sertifikat_yaratildi' | 'reestrga_uzatildi' | 'qaror_tasdiqlandi' | 'lms_natija'
  manbaId: ID
  vaqt: string
  holat: 'navbatda' | 'qayta_ishlandi' | 'takror_eʼtiborsiz' | 'xato'
  izoh?: string
}

export interface TaqvimHodisa { id: ID; userId?: ID; personId?: ID; sana: string; tugash?: string; nomi: string; turi: 'kurs' | 'muddat' | 'dars' | 'test' | 'eslatma' }

export interface Sozlamalar {
  bayramlar: string[]
  signalChegaralari: { kopSertifikatKunda: number; birXilBallFoiz: number }
  muddatlar: { akkKorib: number; akkToldirish: number; tanOlishKorib: number; tanOlishToldirish: number; tanOlishUzaytirish: number; murojaatKorib: number; rejaYangiXodim: number; rejaYillik: string }
  sertifikatShablon: { versiya: string; sarlavha: string; imzolovchi: string; matn: string }
  rezidentLimit: number
  faylOmboriFoiz: number
  ochiqStatistikaMinGuruh: number
}

export interface YillikHisobotNusxa { id: ID; personId: ID; yil: number; sana: string; holat: YillikHolat; qr: string }

export interface YillikHolat {
  yil: number
  qoidaId: ID
  qoidaVersiya: string
  T: number
  Tasl: number
  K: number
  limitKesildi: number
  O: number
  X: number
  majburiy: number
  amaliy: number
  majburiyKerak: number
  amaliyKerak: number
  tekshiruvda: number
  natija: 'bajarildi' | 'yetishmaydi'
  yetishmaydi: number
  yetmaganUlushlar: string[]
  otkaziladi: number
  qolganKun: number
  xavf: 'bajarildi' | 'yolda' | 'xavf' | 'qarzdor'
}
