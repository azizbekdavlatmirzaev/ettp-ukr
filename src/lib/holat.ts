// Holatlar faqat rang bilan emas, matn bilan ham koʻrsatiladi (TZ 4.1.6).
export type Ton = 'ok' | 'warn' | 'err' | 'info' | 'muted' | 'brand' | 'teal'

const H: Record<string, [string, Ton]> = {
  // akkreditatsiya
  ariza: ['Ariza berilgan', 'info'],
  korib_chiqilmoqda: ['Koʻrib chiqilmoqda', 'warn'],
  akkreditatsiyalangan: ['Akkreditatsiyalangan', 'ok'],
  shartli: ['Shartli akkreditatsiya', 'teal'],
  toxtatilgan: ['Toʻxtatilgan', 'err'],
  bekor: ['Bekor qilingan', 'err'],
  muddati_tugagan: ['Muddati tugagan', 'muted'],
  // dastur
  qoralama: ['Qoralama', 'muted'],
  korib_chiqishda: ['Koʻrib chiqishda', 'warn'],
  tasdiqlangan: ['Tasdiqlangan', 'ok'],
  rad_etilgan: ['Rad etilgan', 'err'],
  arxiv: ['Arxiv', 'muted'],
  // oqim
  elon_qilingan: ['Eʼlon qilingan', 'info'],
  davom_etmoqda: ['Davom etmoqda', 'teal'],
  yakunlangan: ['Yakunlangan', 'muted'],
  // yozilish
  yuborildi: ['Yuborildi', 'info'],
  qabul_qilindi: ['Qabul qilindi', 'ok'],
  navbatda: ['Navbatda', 'warn'],
  rad_etildi: ['Rad etildi', 'err'],
  oqimoqda: ['Oʻqimoqda', 'teal'],
  tugatdi: ['Tugatdi', 'ok'],
  otmadi: ['Oʻtmadi', 'err'],
  chiqdi: ['Chiqdi', 'muted'],
  // natija
  tasdiqlashda: ['Tasdiqlash kutilmoqda', 'warn'],
  tekshiruvda: ['Tekshiruvda', 'warn'],
  otdi: ['Oʻtdi', 'ok'],
  // qoida
  amalda: ['Amalda', 'ok'],
  // sertifikat
  tuzatilgan: ['Tuzatilgan', 'warn'],
  bekor_qilingan: ['Bekor qilingan', 'err'],
  tayyorlanmoqda: ['Tayyorlanmoqda', 'info'],
  // reja
  qaytarildi: ['Qaytarildi', 'err'],
  tasdiqlandi: ['Tasdiqlandi', 'ok'],
  bajarilmoqda: ['Bajarilmoqda', 'teal'],
  yopildi: ['Yopildi', 'muted'],
  // akk ariza
  toliqlik: ['Toʻliqlik tekshiruvi', 'info'],
  kamchilik: ['Kamchilikni toʻldirish', 'err'],
  ekspertiza: ['Ekspertiza', 'warn'],
  joyida: ['Joyida tekshiruv', 'warn'],
  komissiya: ['Komissiya', 'brand'],
  qaror: ['Qaror bosqichi', 'brand'],
  yakunlandi: ['Yakunlandi', 'ok'],
  // tan olish
  ekspert_xulosasi: ['Ekspert xulosasi', 'brand'],
  // murojaat
  malumot_soraldi: ['Maʼlumot soʻraldi', 'warn'],
  // signal
  yangi: ['Yangi', 'err'],
  asossiz: ['Asossiz', 'muted'],
  // logbook
  kutilmoqda: ['Kutilmoqda', 'warn'],
  // psv
  manba_sorovi: ['Manbaga soʻrov', 'info'],
  javob_kutilmoqda: ['Manba javobi kutilmoqda', 'warn'],
  hisobot_tayyor: ['Hisobot tayyor', 'brand'],
  yetkazildi: ['Yetkazildi', 'ok'],
  farq: ['Farq topildi', 'err'],
  tasdiqlanmadi: ['Tasdiqlanmadi', 'err'],
  tolandi: ['Toʻlandi', 'ok'],
  talab_qilinmaydi: ['Toʻlovsiz', 'muted'],
  // rezident
  akademik_tatil: ['Akademik taʼtil', 'warn'],
  chetlashtirilgan: ['Chetlashtirilgan', 'err'],
  bitirgan: ['Bitirgan', 'ok'],
  reja: ['Rejada', 'muted'],
  davom: ['Davom etmoqda', 'teal'],
  // yillik
  bajarildi: ['Talab bajarildi', 'ok'],
  yolda: ['Reja boʻyicha', 'info'],
  xavf: ['Xavf ostida', 'warn'],
  qarzdor: ['Qarzdor', 'err'],
  yetishmaydi: ['Yetishmaydi', 'err'],
  // hodisa
  qayta_ishlandi: ['Qayta ishlandi', 'ok'],
  'takror_eʼtiborsiz': ['Takror — eʼtiborsiz', 'muted'],
  xato: ['Xato', 'err'],
  ok: ['OK', 'ok'],
  faol: ['Faol', 'ok'],
  nofaol: ['Bloklangan', 'err'],
}

export function holat(h: string): [string, Ton] {
  return H[h] ?? [h.replace(/_/g, ' '), 'muted']
}

export const MOLIYA: Record<string, string> = { byudjet: 'Byudjet', ish_beruvchi: 'Ish beruvchi', shaxsiy: 'Shaxsiy mablagʻ', grant: 'Grant' }
export const SHAKL: Record<string, string> = { onlayn: 'Onlayn', oflayn: 'Oflayn', aralash: 'Aralash' }
export const TADBIR: Record<string, string> = { kurs: 'Kurs', konferensiya: 'Konferensiya', mustaqil: 'Mustaqil taʼlim', simulyatsiya: 'Simulyatsion trening', stajirovka: 'Stajirovka' }
export const KURS_TURI: Record<string, string> = { majburiy: 'Majburiy', tanlov: 'Tanlov' }
export const YONALISH: Record<string, string> = { nazariy: 'Nazariy', amaliy: 'Amaliy' }
export const MANBA: Record<string, string> = { natija: 'Kurs natijasi', tan_olish: 'Xorijiy tan olish', tuzatish: 'Tuzatish', otkazish: 'Oʻtkazilgan', kochirilgan: 'Koʻchirilgan (my.tipme.uz)' }
export const SIGNAL: Record<string, string> = { kop_sertifikat: 'Qisqa vaqtda koʻp sertifikat', bir_xil_ball: 'Bir xil ball va 100% davomat', mutaxassislik_mos_emas: 'Mutaxassislikka mos emas', akk_muddati_tugagan: 'Akkreditatsiyasiz natija', takroriy_natija: 'Takroriy natija', ikki_joyda: 'Bir vaqtda ikki joyda' }
export const PROV_TURI: Record<string, string> = { davlat: 'Davlat', nodavlat: 'Nodavlat', xorijiy: 'Xorijiy' }
export const DARAJA: Record<string, string> = { kuzatdi: 'Kuzatdi', yordam_berdi: 'Yordam berdi', nazorat_ostida: 'Nazorat ostida bajardi', mustaqil: 'Mustaqil bajardi' }
export const TOIFA: Record<string, string> = { oliy: 'Oliy toifa', birinchi: 'Birinchi toifa', ikkinchi: 'Ikkinchi toifa', yoq: 'Toifasiz' }
export const MUROJAAT_TURI: Record<string, string> = { kredit: 'Kredit', sertifikat: 'Sertifikat', baho: 'Kurs bahosi', akkreditatsiya: 'Akkreditatsiya', tan_olish: 'Tan olish', rezidentura: 'Rezidentura', psv: 'PSV', boshqa: 'Boshqa' }
export const PSV_HUJJAT: Record<string, string> = { diplom: 'Diplom', mutaxassislik: 'Mutaxassislik', toifa: 'Malaka toifasi', staj: 'Ish staji', ukr: 'UKR kreditlari', davlat_royxati: 'Davlat roʻyxati' }
