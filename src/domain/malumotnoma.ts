import type { Hudud, Konikma, Mutaxassislik } from './types'

export const HUDUDLAR: Hudud[] = [
  { id: 'R01', nomi: 'Toshkent shahri' },
  { id: 'R02', nomi: 'Toshkent viloyati' },
  { id: 'R03', nomi: 'Andijon viloyati' },
  { id: 'R04', nomi: 'Buxoro viloyati' },
  { id: 'R05', nomi: 'Fargʻona viloyati' },
  { id: 'R06', nomi: 'Jizzax viloyati' },
  { id: 'R07', nomi: 'Xorazm viloyati' },
  { id: 'R08', nomi: 'Namangan viloyati' },
  { id: 'R09', nomi: 'Navoiy viloyati' },
  { id: 'R10', nomi: 'Qashqadaryo viloyati' },
  { id: 'R11', nomi: 'Qoraqalpogʻiston Respublikasi' },
  { id: 'R12', nomi: 'Samarqand viloyati' },
  { id: 'R13', nomi: 'Sirdaryo viloyati' },
  { id: 'R14', nomi: 'Surxondaryo viloyati' },
]

export const MUTAXASSISLIKLAR: Mutaxassislik[] = [
  { id: 'M01', nomi: 'Kardiologiya', daraja: 'oliy', guruh: 'Terapevtik' },
  { id: 'M02', nomi: 'Pediatriya', daraja: 'oliy', guruh: 'Pediatrik' },
  { id: 'M03', nomi: 'Terapiya', daraja: 'oliy', guruh: 'Terapevtik' },
  { id: 'M04', nomi: 'Umumiy xirurgiya', daraja: 'oliy', guruh: 'Jarrohlik' },
  { id: 'M05', nomi: 'Akusherlik va ginekologiya', daraja: 'oliy', guruh: 'Jarrohlik' },
  { id: 'M06', nomi: 'Nevrologiya', daraja: 'oliy', guruh: 'Terapevtik' },
  { id: 'M07', nomi: 'Anesteziologiya va reanimatologiya', daraja: 'oliy', guruh: 'Jarrohlik' },
  { id: 'M08', nomi: 'Shoshilinch tibbiy yordam', daraja: 'oliy', guruh: 'Shoshilinch' },
  { id: 'M09', nomi: 'Umumiy amaliyot shifokori', daraja: 'oliy', guruh: 'Birlamchi' },
  { id: 'M10', nomi: 'Radiologiya', daraja: 'oliy', guruh: 'Diagnostik' },
  { id: 'M11', nomi: 'Endokrinologiya', daraja: 'oliy', guruh: 'Terapevtik' },
  { id: 'M12', nomi: 'Stomatologiya', daraja: 'oliy', guruh: 'Stomatologik' },
  { id: 'M13', nomi: 'Farmatsiya', daraja: 'oliy', guruh: 'Farmatsevtik' },
  { id: 'M14', nomi: 'Oftalmologiya', daraja: 'oliy', guruh: 'Jarrohlik' },
  { id: 'M20', nomi: 'Hamshiralik ishi', daraja: 'orta', guruh: 'Oʻrta tibbiy' },
  { id: 'M21', nomi: 'Feldsherlik', daraja: 'orta', guruh: 'Oʻrta tibbiy' },
  { id: 'M22', nomi: 'Akusherlik (akusherka)', daraja: 'orta', guruh: 'Oʻrta tibbiy' },
  { id: 'M23', nomi: 'Laboratoriya diagnostikasi', daraja: 'orta', guruh: 'Oʻrta tibbiy' },
  { id: 'M24', nomi: 'Rentgen laborantligi', daraja: 'orta', guruh: 'Oʻrta tibbiy' },
  { id: 'M25', nomi: 'Farmatsevt (oʻrta)', daraja: 'orta', guruh: 'Farmatsevtik' },
]

export const MAMLAKATLAR = ['Oʻzbekiston', 'Turkiya', 'Germaniya', 'Rossiya', 'Janubiy Koreya', 'AQSh', 'Buyuk Britaniya', 'Hindiston', 'Qozogʻiston', 'Isroil']

export const KONIKMALAR: Record<string, Konikma[]> = {
  M01: [
    { kod: 'KRD-01', nomi: 'EKG yozish va talqin qilish', minimal: 50, majburiy: true },
    { kod: 'KRD-02', nomi: 'ExoKG (transtorakal) bajarish', minimal: 40, majburiy: true },
    { kod: 'KRD-03', nomi: 'Sutkalik Holter monitoringini tahlil qilish', minimal: 20, majburiy: true },
    { kod: 'KRD-04', nomi: 'Veloergometriya / tredmil-test', minimal: 15, majburiy: true },
    { kod: 'KRD-05', nomi: 'Elektr kardioversiya va defibrillyatsiya', minimal: 5, majburiy: true },
    { kod: 'KRD-06', nomi: 'Perikard punksiyasida ishtirok', minimal: 2, majburiy: false },
    { kod: 'KRD-07', nomi: 'Koronarografiyada ishtirok', minimal: 10, majburiy: false },
    { kod: 'KRD-08', nomi: 'Yurak-oʻpka reanimatsiyasi (ALS)', minimal: 5, majburiy: true },
  ],
}

export const BAHOLASH_MEZONLARI = [
  { kod: 'mazmun', nomi: 'Dastur mazmuni va dolzarbligi' },
  { kod: 'natijalar', nomi: 'Oʻquv natijalari aniqligi' },
  { kod: 'baza', nomi: 'Klinik baza va jihozlar' },
  { kod: 'oqituvchi', nomi: 'Oʻqituvchilar malakasi' },
  { kod: 'baholash', nomi: 'Baholash vositalari' },
  { kod: 'kredit', nomi: 'Soʻralgan kredit asosi' },
]

export const AKK_HUJJATLAR: Record<string, { kod: string; nomi: string; majburiy: boolean }[]> = {
  provayder: [
    { kod: 'nizom', nomi: 'Tashkilot ustavi / nizomi', majburiy: true },
    { kod: 'litsenziya', nomi: 'Taʼlim faoliyati litsenziyasi', majburiy: true },
    { kod: 'kadrlar', nomi: 'Professor-oʻqituvchilar tarkibi', majburiy: true },
    { kod: 'baza', nomi: 'Klinik baza bilan shartnoma', majburiy: true },
    { kod: 'sifat', nomi: 'Ichki sifat nazorati tizimi tavsifi', majburiy: false },
  ],
  dastur: [
    { kod: 'pasport', nomi: 'Dastur pasporti (imzolangan)', majburiy: true },
    { kod: 'oquv_reja', nomi: 'Oʻquv-tematik reja', majburiy: true },
    { kod: 'baholash', nomi: 'Baholash materiallari (test banki, rubrika)', majburiy: true },
    { kod: 'oqituvchilar', nomi: 'Oʻqituvchilar CV va sertifikatlari', majburiy: true },
    { kod: 'baza', nomi: 'Amaliy mashgʻulot bazasi shartnomasi', majburiy: false },
  ],
}
AKK_HUJJATLAR.qayta = AKK_HUJJATLAR.dastur

export const ROL_NOMI: Record<string, string> = {
  xodim: 'Tibbiyot xodimi',
  provayder_operator: 'Provayder operatori',
  provayder_rahbar: 'Provayder rahbari',
  muassasa: 'Muassasa operatori (ish beruvchi)',
  markaz_mutaxassis: 'UKR markazi mutaxassisi',
  markaz_rahbar: 'UKR markazi — qaror qabul qiluvchi',
  ekspert: 'Ekspert',
  klinik_rahbar: 'Klinik rahbar',
  rezident: 'Rezident',
  vazirlik: 'Vazirlik tahlilchisi',
  admin: 'Administrator (UZINFOCOM)',
}
