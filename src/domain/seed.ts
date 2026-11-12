// Sintetik demo maʼlumotlar. Real shaxslar YOʻQ: ismlar, JSHSHIR va tashkilotlar tasodifiy (deterministik) yaratiladi.
// Har bir rol kirganda ishlashi uchun jarayonlar turli bosqichlarda qoldirilgan.
import type { DB } from './db'
import type * as T from './types'
import { HUDUDLAR, MUTAXASSISLIKLAR, KONIKMALAR, BAHOLASH_MEZONLARI } from './malumotnoma'
import { fauxHash } from './amallar'

export const DB_VERSIYA = 3
export const DEMO_BUGUN = '2026-11-13'

function rngYarat(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ERKAK_ISM = ['Anvar', 'Bobur', 'Sardor', 'Jasur', 'Akmal', 'Otabek', 'Sherzod', 'Rustam', 'Doniyor', 'Jamshid', 'Ulugʻbek', 'Farrux', 'Aziz', 'Behruz', 'Shoxrux', 'Islom', 'Temur', 'Nodir', 'Botir', 'Elyor', 'Javlon', 'Murod', 'Sanjar', 'Komil']
const AYOL_ISM = ['Dilnoza', 'Malika', 'Nodira', 'Gulnoza', 'Feruza', 'Madina', 'Shahlo', 'Zarina', 'Nilufar', 'Sevara', 'Kamola', 'Dildora', 'Mohira', 'Barno', 'Lola', 'Yulduz', 'Saodat', 'Munisa', 'Gulbahor', 'Nargiza', 'Diyora', 'Maftuna']
const FAMILIYA = ['Karimov', 'Yusupov', 'Rahimov', 'Tursunov', 'Abdullayev', 'Saidov', 'Xolmatov', 'Nazarov', 'Ergashev', 'Qodirov', 'Mirzayev', 'Hasanov', 'Rustamov', 'Sobirov', 'Aliyev', 'Jurayev', 'Ismoilov', 'Normatov', 'Toshpoʻlatov', 'Usmonov', 'Bakirov', 'Islomov', 'Fayziyev', 'Gʻaniyev', 'Haydarov', 'Latipov', 'Mamatov', 'Oripov', 'Qosimov', 'Sharipov', 'Valiyev', 'Zokirov']
const OTA = ['Baxtiyor', 'Rustam', 'Shuhrat', 'Akrom', 'Ilhom', 'Farhod', 'Abdulla', 'Komil', 'Murod', 'Erkin', 'Anvar', 'Jamol', 'Hamid', 'Toʻlqin', 'Zafar']

const MUASSASALAR: T.Muassasa[] = [
  { id: 'MU01', nomi: 'Toshkent shahar 3-son klinik shifoxonasi', turi: 'Koʻp tarmoqli shifoxona', hududId: 'R01', manzil: 'Toshkent sh., Chilonzor tumani', bolimlar: ['Kardiologiya', 'Terapiya', 'Reanimatsiya', 'Xirurgiya', 'Qabul boʻlimi', 'Laboratoriya'] },
  { id: 'MU02', nomi: 'Toshkent shahar 12-son oilaviy poliklinikasi', turi: 'Oilaviy poliklinika', hududId: 'R01', manzil: 'Toshkent sh., Yunusobod tumani', bolimlar: ['Umumiy amaliyot', 'Pediatriya', 'Hamshiralik', 'Laboratoriya'] },
  { id: 'MU03', nomi: 'Samarqand viloyat koʻp tarmoqli tibbiyot markazi', turi: 'Viloyat markazi', hududId: 'R12', manzil: 'Samarqand sh.', bolimlar: ['Kardiologiya', 'Nevrologiya', 'Xirurgiya', 'Akusherlik', 'Radiologiya'] },
  { id: 'MU04', nomi: 'Andijon viloyat bolalar koʻp tarmoqli tibbiyot markazi', turi: 'Bolalar markazi', hududId: 'R03', manzil: 'Andijon sh.', bolimlar: ['Pediatriya', 'Reanimatsiya', 'Hamshiralik'] },
  { id: 'MU05', nomi: 'Buxoro viloyat perinatal markazi', turi: 'Perinatal markaz', hududId: 'R04', manzil: 'Buxoro sh.', bolimlar: ['Akusherlik', 'Neonatologiya', 'Hamshiralik'] },
  { id: 'MU06', nomi: 'Fargʻona viloyat shoshilinch tibbiy yordam filiali', turi: 'Shoshilinch yordam', hududId: 'R05', manzil: 'Fargʻona sh.', bolimlar: ['Qabul boʻlimi', 'Reanimatsiya', 'Travmatologiya'] },
  { id: 'MU07', nomi: 'Namangan tuman tibbiyot birlashmasi', turi: 'Tuman tibbiyot birlashmasi', hududId: 'R08', manzil: 'Namangan viloyati', bolimlar: ['Terapiya', 'Pediatriya', 'Hamshiralik'] },
  { id: 'MU08', nomi: 'Qashqadaryo viloyat koʻp tarmoqli tibbiyot markazi', turi: 'Viloyat markazi', hududId: 'R10', manzil: 'Qarshi sh.', bolimlar: ['Kardiologiya', 'Endokrinologiya', 'Xirurgiya'] },
  { id: 'MU09', nomi: 'Xorazm viloyat koʻz kasalliklari shifoxonasi', turi: 'Ixtisoslashgan shifoxona', hududId: 'R07', manzil: 'Urganch sh.', bolimlar: ['Oftalmologiya', 'Hamshiralik'] },
  { id: 'MU10', nomi: 'Nukus shahar 2-son oilaviy poliklinikasi', turi: 'Oilaviy poliklinika', hududId: 'R11', manzil: 'Nukus sh.', bolimlar: ['Umumiy amaliyot', 'Stomatologiya', 'Hamshiralik'] },
  { id: 'MU11', nomi: 'Toshkent viloyat koʻp tarmoqli tibbiyot markazi', turi: 'Viloyat markazi', hududId: 'R02', manzil: 'Nurafshon sh.', bolimlar: ['Anesteziologiya', 'Xirurgiya', 'Radiologiya', 'Farmatsiya'] },
  { id: 'MU12', nomi: 'Surxondaryo viloyat bolalar shifoxonasi', turi: 'Bolalar shifoxonasi', hududId: 'R14', manzil: 'Termiz sh.', bolimlar: ['Pediatriya', 'Hamshiralik'] },
]

type ProvSeed = [string, string, string, T.Provayder['turi'], string, string | undefined, T.AkkHolat]
const PROVAYDERLAR: ProvSeed[] = [
  ['P01', 'Tibbiyot xodimlarini kasbiy rivojlantirish instituti', 'TXKRI', 'davlat', 'Oʻzbekiston', 'R01', 'akkreditatsiyalangan'],
  ['P02', 'Respublika shoshilinch tibbiyot oʻquv-simulyatsiya markazi', 'RSTOSM', 'davlat', 'Oʻzbekiston', 'R01', 'akkreditatsiyalangan'],
  ['P03', 'Samarqand tibbiyot oʻquv-simulyatsiya markazi', 'STOSM', 'davlat', 'Oʻzbekiston', 'R12', 'akkreditatsiyalangan'],
  ['P04', 'Buxoro viloyat tibbiyot xodimlari malaka oshirish markazi', 'BVTMOM', 'davlat', 'Oʻzbekiston', 'R04', 'akkreditatsiyalangan'],
  ['P05', 'Fargʻona hamshiralar malaka markazi', 'FHMM', 'davlat', 'Oʻzbekiston', 'R05', 'akkreditatsiyalangan'],
  ['P06', 'Shifo Akademiyasi MChJ', 'Shifo Akademiyasi', 'nodavlat', 'Oʻzbekiston', 'R01', 'akkreditatsiyalangan'],
  ['P07', 'MedSkills simulyatsiya markazi MChJ', 'MedSkills', 'nodavlat', 'Oʻzbekiston', 'R01', 'akkreditatsiyalangan'],
  ['P08', 'Kardio Akademiya MChJ', 'Kardio Akademiya', 'nodavlat', 'Oʻzbekiston', 'R01', 'akkreditatsiyalangan'],
  ['P09', 'Pediatr Plus oʻquv markazi MChJ', 'Pediatr Plus', 'nodavlat', 'Oʻzbekiston', 'R03', 'akkreditatsiyalangan'],
  ['P10', 'Farm Bilim MChJ', 'Farm Bilim', 'nodavlat', 'Oʻzbekiston', 'R02', 'akkreditatsiyalangan'],
  ['P11', 'Diagnostika Maktabi MChJ', 'Diagnostika Maktabi', 'nodavlat', 'Oʻzbekiston', 'R12', 'shartli'],
  ['P12', 'Namangan Med Taʼlim MChJ', 'Namangan Med Taʼlim', 'nodavlat', 'Oʻzbekiston', 'R08', 'toxtatilgan'],
  ['P13', 'Xorazm tibbiyot oʻquv markazi', 'XTOM', 'davlat', 'Oʻzbekiston', 'R07', 'muddati_tugagan'],
  ['P14', 'EuroMed CME Institute', 'EuroMed CME', 'xorijiy', 'Germaniya', undefined, 'akkreditatsiyalangan'],
  ['P15', 'Anadolu Sağlık Eğitim Merkezi', 'Anadolu SEM', 'xorijiy', 'Turkiya', undefined, 'akkreditatsiyalangan'],
  ['P16', 'Seoul Clinical Skills Academy', 'Seoul CSA', 'xorijiy', 'Janubiy Koreya', undefined, 'shartli'],
  ['P17', 'Global Medical Learning Ltd', 'Global Med Learning', 'xorijiy', 'Buyuk Britaniya', undefined, 'korib_chiqilmoqda'],
  ['P18', 'Qarshi tibbiyot texnikumi UKR boʻlimi', 'QTT UKR', 'davlat', 'Oʻzbekiston', 'R10', 'ariza'],
]

// [provider, nomi, mutaxassisliklar, tinglovchi, nazariySoat, amaliySoat, shakl, tadbir, kursTuri, yonalish, kredit, holat]
type DasturSeed = [string, string, string[], T.DasturVersiya['tinglovchi'], number, number, T.Shakl, T.TadbirTuri, T.KursTuri, T.Yonalish, number, T.DasturHolat?]
const DASTURLAR: DasturSeed[] = [
  ['P01', 'Oʻtkir koronar sindrom: zamonaviy yondashuvlar', ['M01', 'M03', 'M08'], 'oliy', 24, 12, 'aralash', 'kurs', 'majburiy', 'nazariy', 12],
  ['P01', 'Yurak ritmi buzilishlari va EKG talqini', ['M01', 'M03', 'M09', 'M08'], 'oliy', 20, 10, 'oflayn', 'kurs', 'majburiy', 'nazariy', 10],
  ['P01', 'Arterial gipertenziya: 2026 klinik protokollari', ['M01', 'M03', 'M09', 'M11'], 'oliy', 16, 0, 'onlayn', 'kurs', 'majburiy', 'nazariy', 6],
  ['P01', 'ExoKG asoslari: amaliy kurs', ['M01', 'M10'], 'oliy', 12, 36, 'oflayn', 'kurs', 'tanlov', 'amaliy', 16],
  ['P01', 'Tibbiy etika va bemor huquqlari', [], 'barchasi', 8, 0, 'onlayn', 'kurs', 'majburiy', 'nazariy', 4],
  ['P01', 'Tibbiyotda sunʼiy intellekt va raqamli salomatlik', [], 'oliy', 12, 4, 'onlayn', 'kurs', 'tanlov', 'nazariy', 6, 'korib_chiqishda'],
  ['P01', 'Yurak yetishmovchiligini davolash: kengaytirilgan kurs', ['M01', 'M03'], 'oliy', 18, 6, 'aralash', 'kurs', 'tanlov', 'nazariy', 8, 'qoralama'],
  ['P02', 'Yurak-oʻpka reanimatsiyasi (BLS/ACLS) — simulyatsiya', [], 'oliy', 4, 16, 'oflayn', 'simulyatsiya', 'majburiy', 'amaliy', 8],
  ['P02', 'Politravma: ATLS tamoyillari', ['M08', 'M04', 'M07'], 'oliy', 8, 20, 'oflayn', 'simulyatsiya', 'tanlov', 'amaliy', 12],
  ['P02', 'Shoshilinch tibbiy yordamda triaj', ['M08', 'M09', 'M21'], 'barchasi', 8, 4, 'aralash', 'kurs', 'majburiy', 'nazariy', 6],
  ['P02', 'Birinchi yordam (BLS) — oʻrta tibbiyot xodimlari uchun', [], 'orta', 2, 10, 'oflayn', 'simulyatsiya', 'majburiy', 'amaliy', 6],
  ['P03', 'Laparoskopik jarrohlik asoslari (simulyator)', ['M04', 'M05'], 'oliy', 8, 32, 'oflayn', 'simulyatsiya', 'tanlov', 'amaliy', 16],
  ['P03', 'Insult: birinchi soatlar', ['M06', 'M08', 'M03'], 'oliy', 14, 4, 'aralash', 'kurs', 'majburiy', 'nazariy', 8],
  ['P03', 'Akusherlik qon ketishlari: simulyatsion trening', ['M05', 'M22'], 'barchasi', 4, 14, 'oflayn', 'simulyatsiya', 'majburiy', 'amaliy', 8],
  ['P04', 'Qandli diabet 2-tip: birlamchi boʻgʻinda boshqaruv', ['M09', 'M03', 'M11'], 'oliy', 16, 4, 'aralash', 'kurs', 'majburiy', 'nazariy', 8],
  ['P04', 'Birlamchi tibbiy yordamda skrining dasturlari', ['M09'], 'oliy', 12, 0, 'onlayn', 'kurs', 'tanlov', 'nazariy', 4],
  ['P04', 'Antibiotiklarni oqilona qoʻllash', [], 'oliy', 12, 0, 'onlayn', 'kurs', 'majburiy', 'nazariy', 6],
  ['P05', 'Hamshiralik jarayoni va bemor parvarishi', ['M20'], 'orta', 14, 6, 'aralash', 'kurs', 'majburiy', 'nazariy', 6],
  ['P05', 'Inyeksiya va infuziya xavfsizligi', ['M20', 'M21', 'M22'], 'orta', 4, 10, 'oflayn', 'kurs', 'majburiy', 'amaliy', 6],
  ['P05', 'Infeksion nazorat: qoʻl gigiyenasi va SHHV', [], 'orta', 8, 4, 'onlayn', 'kurs', 'majburiy', 'nazariy', 4],
  ['P05', 'Akusherkalar uchun tugʻruq parvarishi', ['M22'], 'orta', 6, 12, 'oflayn', 'kurs', 'tanlov', 'amaliy', 8],
  ['P06', 'Klinik farmakologiya: polipragmaziyadan qochish', ['M03', 'M09', 'M13', 'M01'], 'oliy', 16, 0, 'onlayn', 'kurs', 'tanlov', 'nazariy', 6],
  ['P06', 'Dalillarga asoslangan tibbiyot', [], 'oliy', 10, 2, 'onlayn', 'kurs', 'tanlov', 'nazariy', 4],
  ['P06', 'Tibbiy statistika va ilmiy maqola yozish', [], 'oliy', 16, 4, 'onlayn', 'kurs', 'tanlov', 'nazariy', 6, 'korib_chiqishda'],
  ['P07', 'Qiyin havo yoʻllari: simulyatsion kurs', ['M07', 'M08'], 'oliy', 4, 16, 'oflayn', 'simulyatsiya', 'tanlov', 'amaliy', 10],
  ['P07', 'Ultratovush tekshiruvi: POCUS asoslari', ['M08', 'M07', 'M09', 'M01'], 'oliy', 8, 16, 'oflayn', 'simulyatsiya', 'tanlov', 'amaliy', 10],
  ['P08', 'Yurak yetishmovchiligi: 2026 tavsiyalari', ['M01', 'M03'], 'oliy', 12, 0, 'onlayn', 'kurs', 'tanlov', 'nazariy', 6],
  ['P08', 'Respublika kardiologlar konferensiyasi 2026', ['M01'], 'oliy', 12, 0, 'oflayn', 'konferensiya', 'tanlov', 'nazariy', 6],
  ['P08', 'Mustaqil taʼlim: kardiologiya jurnal klubi', ['M01'], 'oliy', 8, 0, 'onlayn', 'mustaqil', 'tanlov', 'nazariy', 3],
  ['P09', 'Pediatriyada shoshilinch holatlar (PALS)', ['M02', 'M08'], 'oliy', 6, 14, 'oflayn', 'simulyatsiya', 'majburiy', 'amaliy', 10],
  ['P09', 'Yangi tugʻilgan chaqaloqlar reanimatsiyasi', ['M02', 'M05', 'M22', 'M20'], 'barchasi', 4, 10, 'oflayn', 'simulyatsiya', 'majburiy', 'amaliy', 8],
  ['P09', 'IMCI — bolalar kasalliklarini integratsiyalashgan olib borish', ['M02', 'M09'], 'oliy', 16, 4, 'aralash', 'kurs', 'majburiy', 'nazariy', 8],
  ['P10', 'Farmakonazorat va dori xavfsizligi', ['M13', 'M25'], 'barchasi', 12, 0, 'onlayn', 'kurs', 'majburiy', 'nazariy', 6],
  ['P10', 'Dorixona amaliyotida maslahat berish', ['M13', 'M25'], 'barchasi', 6, 6, 'aralash', 'kurs', 'tanlov', 'amaliy', 4],
  ['P11', 'KT va MRT talqini: asosiy patologiyalar', ['M10'], 'oliy', 20, 8, 'aralash', 'kurs', 'tanlov', 'nazariy', 12],
  ['P11', 'Rentgen texnikasida nur xavfsizligi', ['M24', 'M10'], 'barchasi', 8, 2, 'onlayn', 'kurs', 'majburiy', 'nazariy', 4],
  ['P12', 'Qalqonsimon bez kasalliklari', ['M11', 'M03'], 'oliy', 12, 0, 'onlayn', 'kurs', 'tanlov', 'nazariy', 6],
  ['P13', 'Glaukoma diagnostikasi', ['M14'], 'oliy', 8, 6, 'oflayn', 'kurs', 'tanlov', 'amaliy', 6],
  ['P13', 'Zamonaviy endodontiya', ['M12'], 'oliy', 6, 14, 'oflayn', 'kurs', 'tanlov', 'amaliy', 10],
  ['P14', 'Clinical Cardiology Update (online CME)', ['M01', 'M03'], 'oliy', 20, 0, 'onlayn', 'kurs', 'tanlov', 'nazariy', 8],
  ['P14', 'Evidence-based Diabetes Care', ['M11', 'M09'], 'oliy', 16, 0, 'onlayn', 'kurs', 'tanlov', 'nazariy', 6],
  ['P15', 'Ultrasound in Emergency Medicine', ['M08', 'M07'], 'oliy', 8, 16, 'aralash', 'kurs', 'tanlov', 'amaliy', 10],
  ['P16', 'Pediatric Critical Care Online', ['M02', 'M07'], 'oliy', 18, 0, 'onlayn', 'kurs', 'tanlov', 'nazariy', 8],
  ['P03', 'Laboratoriya sifat nazorati', ['M23'], 'orta', 8, 6, 'aralash', 'kurs', 'majburiy', 'amaliy', 6],
  ['P02', 'Feldsherlik amaliyotida shoshilinch yordam', ['M21'], 'orta', 6, 10, 'oflayn', 'simulyatsiya', 'majburiy', 'amaliy', 8],
]

const DARS_SHABLON: { nomi: string; turi: T.Dars['turi']; davomiylik: number }[] = [
  { nomi: 'Kirish va oʻquv maqsadlari', turi: 'video', davomiylik: 12 },
  { nomi: 'Patofiziologiya: asosiy tushunchalar', turi: 'video', davomiylik: 28 },
  { nomi: 'Klinik protokol (PDF)', turi: 'pdf', davomiylik: 20 },
  { nomi: 'Klinik holatlar tahlili — vebinar', turi: 'vebinar', davomiylik: 60 },
  { nomi: 'Amaliy topshiriq: holat tahlili', turi: 'topshiriq', davomiylik: 40 },
  { nomi: 'Yakuniy test (Test quyi tizimi)', turi: 'test', davomiylik: 30 },
]

const NATIJALAR_MATN = ['Klinik belgilarni erta aniqlash', 'Diagnostik algoritmni qoʻllash', 'Davolash protokolini tanlash', 'Asoratlarning oldini olish', 'Bemor bilan muloqot va xavfsizlik', 'Jamoaviy ishlash va hujjatlashtirish']

export function seedYarat(): DB {
  const r = rngYarat(20261113)
  const pick = <X,>(a: X[]) => a[Math.floor(r() * a.length)]
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1))
  const sana = (d: Date) => d.toISOString().slice(0, 10)
  const qosh = (s: string, kun: number) => {
    const d = new Date(s + 'T09:00:00+05:00')
    d.setDate(d.getDate() + kun)
    return sana(d)
  }
  const vaqt = (s: string, soat = 10) => `${s}T${String(soat).padStart(2, '0')}:00:00+05:00`
  let idc = 0
  const id = (p: string) => `${p}-${(++idc).toString(36).padStart(4, '0')}`

  const db: DB = {
    versiya: DB_VERSIYA, seq: 0, hisoblagich: {}, foydalanuvchilar: [], muassasalar: MUASSASALAR, shaxslar: [], mehnat: [], provayderlar: [], dasturlar: [], versiyalar: [], oqimlar: [],
    yozilishlar: [], davomat: [], baholashlar: [], natijalar: [], qoidalar: [], jurnal: [], tuzatishlar: [], sertifikatlar: [], rejalar: [], akkArizalar: [], ekspertlar: [], tanOlish: [], murojaatlar: [],
    signallar: [], klinikBazalar: [], kvotalar: [], rezidentlar: [], rotatsiyalar: [], logbook: [], rezidentBaholar: [], psv: [], bildirishnomalar: [], audit: [], hodisalar: [], taqvim: [], yillikHisobotlar: [],
    sozlamalar: {
      bayramlar: ['2026-01-01', '2026-01-14', '2026-03-08', '2026-03-21', '2026-03-22', '2026-05-09', '2026-09-01', '2026-10-01', '2026-12-08', '2027-01-01', '2027-01-14', '2027-03-08', '2027-03-21'],
      signalChegaralari: { kopSertifikatKunda: 40, birXilBallFoiz: 90 },
      muddatlar: { akkKorib: 30, akkToldirish: 10, tanOlishKorib: 10, tanOlishToldirish: 5, tanOlishUzaytirish: 20, murojaatKorib: 15, rejaYangiXodim: 30, rejaYillik: '12-31' },
      sertifikatShablon: { versiya: 'SH-2026.1', sarlavha: 'UZLUKSIZ KASBIY RIVOJLANISH SERTIFIKATI', imzolovchi: 'UKR markazi direktori', matn: 'ushbu sertifikat egasi quyidagi akkreditatsiyalangan dasturni muvaffaqiyatli tamomlaganini tasdiqlaydi' },
      rezidentLimit: 5,
      faylOmboriFoiz: 62,
      ochiqStatistikaMinGuruh: 10,
    },
  }

  // ── Kredit qoidalari ──
  const baseParams: T.KreditParametrlar = { talabOliy: 40, talabOrta: 24, majburiyUlush: 0.5, amaliyUlush: 0.2, otkazishUlush: 0.2, mustaqilLimit: 5, konferensiyaLimit: 10, yilBoshi: '01-01', yilOxiri: '12-31', istisnoKamaytirish: 'proporsional', yangiXodimProporsional: true }
  db.qoidalar.push(
    { id: 'Q-2025', versiya: '0.9', nomi: '2025-yil — eski tartib (koʻchirilgan)', hujjat: { nomi: 'SSV buyrugʻi (eski tartib)', raqam: '112', sana: '2024-12-20' }, kuchgaKirish: '2025-01-01', tugash: '2025-12-31', params: { ...baseParams, talabOliy: 36, talabOrta: 20, majburiyUlush: 0.4, amaliyUlush: 0.1 }, holat: 'arxiv', muallif: 'U-MARKAZ1', tasdiqlovchi: 'U-MARKAZ2', yaratilgan: '2024-12-21T10:00:00+05:00' },
    { id: 'Q-2026', versiya: '1.0', nomi: 'Oʻtish davri qoidasi (2026 – 2027 I yarim)', hujjat: { nomi: 'Sogʻliqni saqlash vazirining buyrugʻi', raqam: '48', sana: '2026-02-11' }, kuchgaKirish: '2026-01-01', tugash: '2027-06-30', params: baseParams, holat: 'amalda', muallif: 'U-MARKAZ1', tasdiqlovchi: 'U-MARKAZ2', yaratilgan: '2026-02-12T10:00:00+05:00' },
    { id: 'Q-2027', versiya: '2.0', nomi: 'PQ-319: yillik 50/28 kredit', hujjat: { nomi: 'Prezidentning PQ-319-son qarori', raqam: 'PQ-319', sana: '2026-09-10' }, kuchgaKirish: '2027-07-01', params: { ...baseParams, talabOliy: 50, talabOrta: 28 }, holat: 'tasdiqlangan', muallif: 'U-MARKAZ1', tasdiqlovchi: 'U-MARKAZ2', yaratilgan: '2026-09-20T10:00:00+05:00' },
    { id: 'Q-2027b', versiya: '2.1', nomi: 'PQ-319: ulushlar aniqlashtirildi (loyiha)', hujjat: { nomi: 'UKR toʻgʻrisidagi Nizom loyihasi', raqam: 'loyiha', sana: '2026-11-05' }, kuchgaKirish: '2027-07-01', params: { ...baseParams, talabOliy: 50, talabOrta: 28, majburiyUlush: 0.6, amaliyUlush: 0.3 }, holat: 'korib_chiqishda', muallif: 'U-MARKAZ1', yaratilgan: '2026-11-06T10:00:00+05:00', izoh: 'Majburiy 60% va amaliy 30% — Nizom loyihasidagi variant' },
  )

  // ── Provayderlar ──
  for (const [pid, nomi, qisqa, turi, mamlakat, hudud, holat] of PROVAYDERLAR) {
    const qarorSana = qosh('2026-01-15', int(0, 200))
    const tarix: T.HolatTarixi[] = [{ holat: 'ariza', sana: vaqt(qosh(qarorSana, -60)), kim: 'Provayder' }]
    if (holat !== 'ariza') tarix.push({ holat: 'korib_chiqilmoqda', sana: vaqt(qosh(qarorSana, -45)), kim: 'Tursunova G.' })
    if (!['ariza', 'korib_chiqilmoqda'].includes(holat)) tarix.push({ holat: holat === 'shartli' ? 'shartli' : 'akkreditatsiyalangan', sana: vaqt(qarorSana), kim: 'Abdullayev R.', qaror: `UKR-${qarorSana.slice(0, 4)}/${int(10, 199)}` })
    if (holat === 'toxtatilgan') tarix.push({ holat: 'toxtatilgan', sana: vaqt('2026-10-02'), kim: 'Abdullayev R.', qaror: 'UKR-2026/231', izoh: 'Sifat nazorati tekshiruvi natijasida' })
    if (holat === 'muddati_tugagan') tarix.push({ holat: 'muddati_tugagan', sana: vaqt('2026-09-30'), kim: 'Tizim', izoh: 'Akkreditatsiya muddati tugadi' })
    // P13 ning akkreditatsiyasi 2025-yildan
    if (pid === 'P13') tarix.splice(1, tarix.length - 2, { holat: 'akkreditatsiyalangan', sana: vaqt('2024-10-01'), kim: 'Abdullayev R.', qaror: 'UKR-2024/44' })
    if (pid === 'P12') tarix.splice(1, 0, { holat: 'akkreditatsiyalangan', sana: vaqt('2025-01-10'), kim: 'Abdullayev R.', qaror: 'UKR-2025/12' })
    db.provayderlar.push({
      id: pid, stir: turi === 'xorijiy' ? `INT-${pid}-${int(1000, 9999)}` : String(300000000 + int(1000000, 9999999)), nomi, qisqa, turi, mamlakat, hududId: hudud,
      manzil: turi === 'xorijiy' ? `${mamlakat}` : `${HUDUDLAR.find((h) => h.id === hudud)!.nomi}, ${pick(['Navoiy koʻchasi', 'Amir Temur shoh koʻchasi', 'Mustaqillik koʻchasi', 'Bogʻishamol koʻchasi'])}, ${int(2, 140)}-uy`,
      sayt: `https://${qisqa.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14) || pid.toLowerCase()}.example.uz`,
      litsenziya: turi === 'xorijiy' ? undefined : { raqam: `L-${int(10000, 99999)}`, sana: '2023-05-12', muddat: '2028-05-12' },
      xorijiyAkk: turi === 'xorijiy' ? { tashkilot: mamlakat === 'Germaniya' ? 'EACCME' : mamlakat === 'Turkiya' ? 'TTB-STE' : mamlakat === 'Janubiy Koreya' ? 'KMA CME' : 'RCP CPD', id: `ACC-${int(10000, 99999)}`, havola: 'https://example.org/registry' } : undefined,
      filiallar: pid === 'P01' ? ['Samarqand filiali', 'Fargʻona filiali', 'Nukus filiali'] : pid === 'P06' ? ['Chilonzor oʻquv zali'] : [],
      masullar: [{ fio: `${pick(FAMILIYA)} ${pick(ERKAK_ISM)}`, lavozim: 'Direktor', telefon: '+998 71 2' + int(100000, 999999) }],
      holat,
      qaror: ['akkreditatsiyalangan', 'shartli', 'toxtatilgan'].includes(holat) ? { raqam: tarix.find((t) => t.qaror)?.qaror ?? 'UKR-2026/1', sana: qarorSana, muddat: holat === 'shartli' ? '2027-06-30' : qosh(qarorSana, 365 * 3) } : holat === 'muddati_tugagan' ? { raqam: 'UKR-2024/44', sana: '2024-10-01', muddat: '2026-09-30' } : undefined,
      tarix, reyting: Math.round((3.8 + r() * 1.15) * 10) / 10, yaratilgan: vaqt(qosh(qarorSana, -60)),
    })
  }

  // ── Dasturlar ──
  const versiyaPid = new Map<string, string>()
  DASTURLAR.forEach(([pid, nomi, mut, ting, sn, sa, shakl, tadbir, kt, yon, kredit, holat], i) => {
    const dsId = `DS-${String(i + 1).padStart(3, '0')}`
    const vId = `V-${String(i + 1).padStart(3, '0')}`
    const h = holat ?? 'tasdiqlangan'
    const p = db.provayderlar.find((x) => x.id === pid)!
    db.dasturlar.push({ id: dsId, providerId: pid, kod: `${pid}-${String(100 + i)}`, versiyalar: [vId] })
    db.versiyalar.push({
      id: vId, dasturId: dsId, versiya: 1, nomi, mutaxassisliklar: mut, maqsad: `Tinglovchilarning «${nomi.split(':')[0]}» boʻyicha bilim va koʻnikmalarini zamonaviy klinik protokollar asosida takomillashtirish.`,
      natijalar: NATIJALAR_MATN.slice(0, 4 + (i % 3)), tinglovchi: ting, soatNazariy: sn, soatAmaliy: sa, shakl, tadbirTuri: tadbir, kursTuri: kt, yonalish: yon,
      baholash: yon === 'amaliy' ? ['test', 'OSKE'] : ['test'], oqituvchilar: [`prof. ${pick(FAMILIYA)} ${pick(ERKAK_ISM)[0]}.`, `t.f.n. ${pick(FAMILIYA)}a ${pick(AYOL_ISM)[0]}.`],
      klinikBaza: yon === 'amaliy' ? `${p.qisqa} simulyatsiya zali` : undefined, til: p.turi === 'xorijiy' ? 'ingliz' : 'oʻzbek', soralganKredit: kredit, tasdiqlanganKredit: h === 'tasdiqlangan' ? kredit : undefined,
      holat: h, amalMuddati: h === 'tasdiqlangan' ? (pid === 'P13' ? '2026-09-30' : '2029-06-30') : undefined,
      darslar: DARS_SHABLON.map((d, k) => ({ id: `${vId}-L${k + 1}`, ...d })), yaratilgan: vaqt('2026-01-20'),
    })
    versiyaPid.set(vId, pid)
  })
  const tasdiqVers = db.versiyalar.filter((v) => v.holat === 'tasdiqlangan')

  // ── Oqimlar ──
  let oqimN = 0
  const oqimYarat = (v: T.DasturVersiya, bosh: string, kun: number, holat: T.OqimHolat, orin = 30, extra: Partial<T.Oqim> = {}) => {
    const pid = versiyaPid.get(v.id)!
    const p = db.provayderlar.find((x) => x.id === pid)!
    oqimN++
    const tug = qosh(bosh, kun - 1)
    const o: T.Oqim = {
      id: `O-${String(oqimN).padStart(4, '0')}`, kod: `C-${bosh.slice(0, 4)}-${String(oqimN).padStart(4, '0')}`, providerId: pid, versiyaId: v.id, boshlanish: bosh, tugash: tug, qabulTugash: qosh(bosh, -1),
      joy: v.shakl === 'onlayn' ? 'Onlayn (Platforma kurs pleyeri)' : `${p.manzil}, ${int(1, 5)}-oʻquv zali`, havola: v.shakl !== 'oflayn' ? 'https://vebinar.example.uz/' + oqimN : undefined,
      hududId: p.hududId ?? 'R01', orinlar: orin, oqituvchi: v.oqituvchilar[0], moliya: pick(['byudjet', 'byudjet', 'ish_beruvchi', 'shaxsiy'] as T.Moliya[]), narx: 0, holat, story: r() > 0.6,
      mashgulotlar: Array.from({ length: Math.min(kun, 6) }, (_, k) => ({ id: `MS-${oqimN}-${k + 1}`, sana: vaqt(qosh(bosh, k), 10), mavzu: v.natijalar[k % v.natijalar.length], qrKod: `ETTP-QR-${oqimN}-${k + 1}` })),
      yaratilgan: vaqt(qosh(bosh, -30)), ...extra,
    }
    if (o.moliya === 'shaxsiy') o.narx = int(4, 18) * 100000
    db.oqimlar.push(o)
    return o
  }
  const otganOqimlar: T.Oqim[] = []
  tasdiqVers.forEach((v, i) => {
    // oʻtgan oqimlar (2025 va 2026)
    otganOqimlar.push(oqimYarat(v, qosh('2025-02-03', (i * 23) % 300), 5, 'yakunlangan'))
    otganOqimlar.push(oqimYarat(v, qosh('2026-01-19', (i * 37) % 270), 5, 'yakunlangan'))
    // kelgusi oqim (katalog)
    oqimYarat(v, qosh('2026-11-24', (i * 5) % 60), int(3, 10), 'elon_qilingan', int(20, 40))
  })
  // P12 (toʻxtatilgan) va P13 (muddati tugagan) kelgusi oqimlari katalogda koʻrinmasligi kerak — eʼlon qilingan holatda qoldiriladi (sinov uchun)

  // ── Shaxslar ──
  const jshshir = (jins: 'E' | 'A', tug: string) => `${jins === 'E' ? 3 : 4}${tug.slice(8, 10)}${tug.slice(5, 7)}${tug.slice(2, 4)}${int(100, 999)}${int(100, 999)}${int(0, 9)}`
  const shaxsYarat = (o: Partial<T.Shaxs> & { mutaxassislikId: string }) => {
    const jins = o.jins ?? (r() > 0.45 ? 'E' : 'A')
    const fam = o.familiya ?? (jins === 'E' ? pick(FAMILIYA) : pick(FAMILIYA) + 'a')
    const tug = o.tugilgan ?? `${int(1965, 1998)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`
    const m = MUTAXASSISLIKLAR.find((x) => x.id === o.mutaxassislikId)!
    const s: T.Shaxs = {
      id: o.id ?? id('SH'), jshshir: o.jshshir ?? jshshir(jins, tug), familiya: fam, ism: o.ism ?? (jins === 'E' ? pick(ERKAK_ISM) : pick(AYOL_ISM)), otasi: o.otasi ?? `${pick(OTA)}${jins === 'E' ? 'ovich' : 'ovna'}`, jins, tugilgan: tug,
      telefon: `+998 9${int(0, 9)} ${int(100, 999)} ${int(10, 99)} ${int(10, 99)}`, email: '', daraja: m.daraja, toifa: o.toifa ?? pick(['oliy', 'birinchi', 'ikkinchi', 'yoq'] as T.Toifa[]),
      toifaMuddati: `${int(2027, 2030)}-${String(int(1, 12)).padStart(2, '0')}-01`, davlatRoyxati: { raqam: `DR-${int(100000, 999999)}`, sana: `${int(2010, 2024)}-0${int(1, 9)}-15`, holat: 'amalda' }, hududId: o.hududId ?? 'R01',
      reestrYangilangan: vaqt('2026-11-13', 9), ...o,
    } as T.Shaxs
    s.email = `${s.ism.toLowerCase().replace(/[^a-z]/g, '')}.${s.familiya.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6)}@example.uz`
    db.shaxslar.push(s)
    return s
  }
  const ishga = (s: T.Shaxs, muId: string, lavozim: string, bolim: string, asosiy = true, dan = '2018-09-01', gacha?: string) => {
    db.mehnat.push({ id: id('MH'), personId: s.id, muassasaId: muId, lavozim, bolim, asosiy, dan, gacha, manba: 'HRM' })
  }

  // asosiy demo shaxslar
  const anvar = shaxsYarat({ id: 'SH-ANVAR', familiya: 'Karimov', ism: 'Anvar', otasi: 'Baxtiyorovich', jins: 'E', tugilgan: '1985-01-30', mutaxassislikId: 'M01', toifa: 'oliy', toifaMuddati: '2028-03-01', hududId: 'R01', jshshir: '33001851200345' })
  ishga(anvar, 'MU01', 'Kardiolog', 'Kardiologiya', true, '2014-09-01')
  ishga(anvar, 'MU02', 'Kardiolog (oʻrindosh)', 'Umumiy amaliyot', false, '2021-03-01') // 1-qabul sinovi: ikki muassasa, bitta kredit hisobi
  const dilnoza = shaxsYarat({ id: 'SH-DILNOZA', familiya: 'Yusupova', ism: 'Dilnoza', otasi: 'Rustamovna', jins: 'A', tugilgan: '1993-06-14', mutaxassislikId: 'M20', toifa: 'birinchi', hududId: 'R01', jshshir: '41406931200218' })
  ishga(dilnoza, 'MU01', 'Katta hamshira', 'Kardiologiya', true, '2016-08-15')
  const jasur = shaxsYarat({ id: 'SH-JASUR', familiya: 'Rustamov', ism: 'Jasur', otasi: 'Ilhomovich', jins: 'E', tugilgan: '1999-04-02', mutaxassislikId: 'M01', toifa: 'yoq', hududId: 'R01' })
  const nodira = shaxsYarat({ id: 'SH-NODIRA', familiya: 'Saidova', ism: 'Nodira', otasi: 'Akromovna', jins: 'A', tugilgan: '1974-11-21', mutaxassislikId: 'M01', toifa: 'oliy', hududId: 'R01' })
  ishga(nodira, 'MU01', 'Kardiologiya boʻlimi mudiri, klinik rahbar', 'Kardiologiya', true, '2005-09-01')
  // ishdan boʻshagan xodim (2-qabul sinovi)
  const ketgan = shaxsYarat({ id: 'SH-KETGAN', familiya: 'Latipov', ism: 'Elyor', otasi: 'Farhodovich', jins: 'E', mutaxassislikId: 'M03', toifa: 'birinchi', hududId: 'R01' })
  ishga(ketgan, 'MU01', 'Terapevt', 'Terapiya', false, '2017-01-10', '2026-08-31')
  ishga(ketgan, 'MU02', 'Terapevt', 'Umumiy amaliyot', true, '2026-09-01')
  // dekretdagi xodim (istisno)
  const dekret = shaxsYarat({ id: 'SH-DEKRET', familiya: 'Normatova', ism: 'Sevara', otasi: 'Erkinovna', jins: 'A', mutaxassislikId: 'M02', toifa: 'birinchi', hududId: 'R01', istisno: { turi: 'dekret', dan: '2026-03-01', gacha: '2027-02-28', hujjat: 'Buyruq №45-sh' } })
  ishga(dekret, 'MU02', 'Pediatr', 'Pediatriya', true, '2019-09-01')
  // yangi ishga kirgan
  const yangi = shaxsYarat({ id: 'SH-YANGI', familiya: 'Islomov', ism: 'Temur', otasi: 'Jamolovich', jins: 'E', mutaxassislikId: 'M08', toifa: 'yoq', hududId: 'R01' })
  ishga(yangi, 'MU01', 'Shoshilinch yordam shifokori', 'Qabul boʻlimi', true, '2026-07-01')

  // ommaviy xodimlar
  const lavozimlar: Record<string, string> = { M01: 'Kardiolog', M02: 'Pediatr', M03: 'Terapevt', M04: 'Jarroh', M05: 'Akusher-ginekolog', M06: 'Nevrolog', M07: 'Anesteziolog-reanimatolog', M08: 'Shoshilinch yordam shifokori', M09: 'Umumiy amaliyot shifokori', M10: 'Radiolog', M11: 'Endokrinolog', M12: 'Stomatolog', M13: 'Provizor', M14: 'Oftalmolog', M20: 'Hamshira', M21: 'Feldsher', M22: 'Akusherka', M23: 'Laborant', M24: 'Rentgen laboranti', M25: 'Farmatsevt' }
  for (const mu of MUASSASALAR) {
    const soni = mu.id === 'MU01' ? 34 : int(10, 16)
    for (let k = 0; k < soni; k++) {
      const bolim = pick(mu.bolimlar)
      const mut = bolim === 'Kardiologiya' ? pick(['M01', 'M01', 'M20']) : bolim === 'Pediatriya' || bolim === 'Neonatologiya' ? pick(['M02', 'M02', 'M20']) : bolim === 'Hamshiralik' ? pick(['M20', 'M20', 'M22', 'M21']) : bolim === 'Laboratoriya' ? 'M23' : bolim === 'Radiologiya' ? pick(['M10', 'M24']) : bolim === 'Akusherlik' ? pick(['M05', 'M22']) : bolim === 'Reanimatsiya' || bolim === 'Anesteziologiya' ? pick(['M07', 'M20']) : bolim === 'Xirurgiya' || bolim === 'Travmatologiya' ? pick(['M04', 'M20']) : bolim === 'Qabul boʻlimi' ? pick(['M08', 'M21']) : bolim === 'Umumiy amaliyot' ? pick(['M09', 'M09', 'M20']) : bolim === 'Nevrologiya' ? 'M06' : bolim === 'Endokrinologiya' ? 'M11' : bolim === 'Oftalmologiya' ? 'M14' : bolim === 'Stomatologiya' ? 'M12' : bolim === 'Farmatsiya' ? pick(['M13', 'M25']) : 'M03'
      const s = shaxsYarat({ mutaxassislikId: mut, hududId: mu.hududId })
      ishga(s, mu.id, lavozimlar[mut] ?? 'Shifokor', bolim, true, `${int(2005, 2024)}-0${int(1, 9)}-01`)
    }
  }

  // ── Foydalanuvchilar (demo hisoblar) ──
  const U = (o: Omit<T.Foydalanuvchi, 'faol'>) => db.foydalanuvchilar.push({ ...o, faol: true })
  U({ id: 'U-ANVAR', login: 'anvar', parol: 'anvar2026', rol: 'xodim', fio: 'Karimov Anvar Baxtiyorovich', personId: anvar.id, lavozim: 'Kardiolog, oliy toifa' })
  U({ id: 'U-DILNOZA', login: 'dilnoza', parol: 'dilnoza2026', rol: 'xodim', fio: 'Yusupova Dilnoza Rustamovna', personId: dilnoza.id, lavozim: 'Katta hamshira' })
  U({ id: 'U-OPER', login: 'operator', parol: 'operator2026', rol: 'provayder_operator', fio: 'Qodirov Sardor Ilhomovich', providerId: 'P01', lavozim: 'Oʻquv boʻlimi operatori' })
  U({ id: 'U-RAHBAR', login: 'rahbar', parol: 'rahbar2026', rol: 'provayder_rahbar', fio: 'Mirzayev Akmal Shuhratovich', providerId: 'P01', lavozim: 'Institut direktori' })
  U({ id: 'U-XOR-OPER', login: 'euromed', parol: 'euromed2026', rol: 'provayder_rahbar', fio: 'Dr. Lena Hoffmann', providerId: 'P14', lavozim: 'CME Director' })
  U({ id: 'U-MUASSASA', login: 'muassasa', parol: 'muassasa2026', rol: 'muassasa', fio: 'Ergasheva Feruza Abdullayevna', muassasaId: 'MU01', lavozim: 'Kadrlar boʻlimi boshligʻi' })
  U({ id: 'U-MARKAZ1', login: 'mutaxassis', parol: 'mutaxassis2026', rol: 'markaz_mutaxassis', fio: 'Tursunova Gulnoza Komilovna', lavozim: 'UKR markazi bosh mutaxassisi' })
  U({ id: 'U-MARKAZ2', login: 'qaror', parol: 'qaror2026', rol: 'markaz_rahbar', fio: 'Abdullayev Rustam Erkinovich', lavozim: 'UKR markazi direktori' })
  U({ id: 'U-VAZIRLIK', login: 'vazirlik', parol: 'vazirlik2026', rol: 'vazirlik', fio: 'Hasanov Javlon Murodovich', lavozim: 'Bosh tahlilchi' })
  U({ id: 'U-ADMIN', login: 'admin', parol: 'admin2026', rol: 'admin', fio: 'UZINFOCOM administratori', lavozim: 'Tizim administratori' })

  // ── Ekspertlar ──
  const ekspertlar: [string, string, string, string, string | undefined, { providerId: string; sabab: string }[]][] = [
    ['E1', 'Xolmatov Bobur Akromovich', 'Kardiologiya', 'Respublika ixtisoslashtirilgan kardiologiya markazi', undefined, [{ providerId: 'P08', sabab: 'Kardio Akademiyada shartnoma asosida dars beradi' }]],
    ['E2', 'Nazarova Malika Shuhratovna', 'Terapiya', 'Toshkent viloyat koʻp tarmoqli tibbiyot markazi', undefined, []],
    ['E3', 'Sobirov Doniyor Farhodovich', 'Anesteziologiya va reanimatologiya', 'Shifo Akademiyasi MChJ', 'P06', []],
    ['E4', 'Haydarova Kamola Zafarovna', 'Pediatriya', 'Andijon viloyat bolalar markazi', undefined, [{ providerId: 'P09', sabab: 'Turmush oʻrtogʻi — Pediatr Plus taʼsischisi' }]],
    ['E5', 'Oripov Sherzod Toʻlqinovich', 'Umumiy xirurgiya', 'Samarqand viloyat tibbiyot markazi', undefined, []],
    ['E6', 'Qosimova Lola Anvarovna', 'Hamshiralik ishi', 'Fargʻona viloyat shoshilinch yordam filiali', undefined, [{ providerId: 'P05', sabab: 'Avvalgi 2 yil ichida FHMMda ishlagan' }]],
    ['E7', 'Valiyev Ulugʻbek Hamidovich', 'Radiologiya', 'Toshkent shahar 3-son klinik shifoxonasi', undefined, []],
    ['E8', 'Zokirova Madina Murodovna', 'Farmatsiya', 'Farmatsevtika tarmogʻini rivojlantirish agentligi', undefined, []],
  ]
  for (const [eid, fio, mut, ish, ishP, dekl] of ekspertlar) {
    const [fam, ism, ota] = fio.split(' ')
    const ms = MUTAXASSISLIKLAR.find((m) => m.nomi === mut)!
    const s = shaxsYarat({ id: `SH-${eid}`, familiya: fam, ism, otasi: ota, jins: fam.endsWith('a') ? 'A' : 'E', mutaxassislikId: ms.id, toifa: 'oliy' })
    db.ekspertlar.push({ id: eid, personId: s.id, fio, mutaxassislik: mut, ishJoyi: ish, ishJoyiProviderId: ishP, vakolatMuddati: '2028-12-31', deklaratsiya: dekl, faol: true })
  }
  U({ id: 'U-EKSPERT', login: 'ekspert', parol: 'ekspert2026', rol: 'ekspert', fio: 'Xolmatov Bobur Akromovich', personId: 'SH-E1', lavozim: 'Ekspert (kardiologiya)' })
  U({ id: 'U-EKSPERT2', login: 'ekspert2', parol: 'ekspert2026', rol: 'ekspert', fio: 'Nazarova Malika Shuhratovna', personId: 'SH-E2', lavozim: 'Ekspert (terapiya)' })
  U({ id: 'U-KLINIK', login: 'klinik', parol: 'klinik2026', rol: 'klinik_rahbar', fio: 'Saidova Nodira Akromovna', personId: nodira.id, lavozim: 'Klinik rahbar, t.f.d.' })
  U({ id: 'U-REZIDENT', login: 'rezident', parol: 'rezident2026', rol: 'rezident', fio: 'Rustamov Jasur Ilhomovich', personId: jasur.id, lavozim: 'Kardiologiya rezidenti, 2-kurs' })

  // ── Oʻtgan kurslar: yozilish → baholash → natija → kredit → sertifikat ──
  const sertRaqam: Record<string, number> = {}
  const natijaYoz = (s: T.Shaxs, o: T.Oqim, ball: number, sanaS: string, opts: { davomat?: boolean; kochirilgan?: boolean; tasdiqlovchi?: string } = {}) => {
    const v = db.versiyalar.find((x) => x.id === o.versiyaId)!
    const p = db.provayderlar.find((x) => x.id === o.providerId)!
    const y: T.Yozilish = { id: id('Y'), personId: s.id, oqimId: o.id, holat: ball >= 70 ? 'tugatdi' : 'otmadi', yuborilgan: vaqt(qosh(o.boshlanish, -20)), tarix: [{ holat: 'yuborildi', sana: vaqt(qosh(o.boshlanish, -20)), kim: s.familiya }, { holat: 'qabul_qilindi', sana: vaqt(qosh(o.boshlanish, -15)), kim: 'Provayder' }, { holat: ball >= 70 ? 'tugatdi' : 'otmadi', sana: vaqt(sanaS, 16), kim: 'Provayder rahbari' }], progress: v.darslar.map((d) => d.id) }
    db.yozilishlar.push(y)
    if (opts.davomat) o.mashgulotlar.forEach((m) => db.davomat.push({ id: id('D'), yozilishId: y.id, mashgulotId: m.id, usul: r() > 0.5 ? 'QR' : 'jurnal', holat: r() > 0.06 ? 'keldi' : 'uzrli', vaqt: m.sana, kiritgan: 'Operator' }))
    db.baholashlar.push({ id: id('B'), yozilishId: y.id, turi: 'test', ball, otishBali: 70, otdi: ball >= 70, baholovchi: 'Test quyi tizimi', sana: vaqt(sanaS, 12), manba: 'Test quyi tizimi' })
    const n: T.YakuniyNatija = { id: id('NT'), yozilishId: y.id, eventId: `evt-${y.id}`, natija: ball >= 70 ? 'otdi' : 'otmadi', ball, holat: 'tasdiqlangan', kiritgan: 'U-OPER-X', kiritilgan: vaqt(sanaS, 14), tasdiqlovchi: opts.tasdiqlovchi ?? 'U-RAHBAR-X', tasdiqlangan: vaqt(sanaS, 16) }
    db.natijalar.push(n)
    if (ball < 70) return y
    const yil = Number(sanaS.slice(0, 4))
    const seriya = 'UKR'
    sertRaqam[yil] = (sertRaqam[yil] ?? 0) + 1
    const raqam = `${yil}-${String(sertRaqam[yil]).padStart(6, '0')}`
    const sert: T.Sertifikat = { id: id('S'), turi: 'UKR', seriya, raqam, qrKalit: fauxHash(seriya + raqam + s.id).slice(0, 20), personId: s.id, fio: `${s.familiya} ${s.ism} ${s.otasi}`, kurs: v.nomi, provider: p.nomi, sana: sanaS, soat: v.soatNazariy + v.soatAmaliy, kredit: v.tasdiqlanganKredit!, natijaId: n.id, holat: 'amalda', kochirilgan: opts.kochirilgan ? 'koʻchirilgan, manba: my.tipme.uz' : undefined, shablonVersiya: yil === 2025 ? 'SH-2025.1' : 'SH-2026.1' }
    db.sertifikatlar.push(sert)
    db.seq++
    db.jurnal.push({ id: id('K'), seq: db.seq, personId: s.id, yil, miqdor: v.tasdiqlanganKredit!, kursTuri: v.kursTuri, yonalish: v.yonalish, tadbirTuri: v.tadbirTuri, manba: opts.kochirilgan ? 'kochirilgan' : 'natija', manbaId: n.id, nomi: v.nomi, providerNomi: p.nomi, qoidaId: yil === 2025 ? 'Q-2025' : 'Q-2026', sana: vaqt(sanaS, 16), asos: opts.kochirilgan ? 'Koʻchirish partiyasi #2026-03 (my.tipme.uz)' : `Tasdiqlangan natija ${o.kod}`, sertifikatId: sert.id, yaratuvchi: opts.kochirilgan ? 'Koʻchirish' : 'Kredit xizmati' })
    return y
  }

  // ommaviy tarix
  for (const s of db.shaxslar) {
    if (['SH-ANVAR', 'SH-JASUR', 'SH-YANGI'].includes(s.id)) continue
    const mos = otganOqimlar.filter((o) => {
      const v = db.versiyalar.find((x) => x.id === o.versiyaId)!
      return (v.tinglovchi === 'barchasi' || v.tinglovchi === s.daraja) && (!v.mutaxassisliklar.length || v.mutaxassisliklar.includes(s.mutaxassislikId))
    })
    const n2025 = int(2, 5), n2026 = s.id === 'SH-DEKRET' ? 1 : int(0, 6)
    const ishlatilgan = new Set<string>()
    const tanla = (yil: string) => {
      const c = mos.filter((o) => o.boshlanish.startsWith(yil) && !ishlatilgan.has(o.versiyaId))
      if (!c.length) return undefined
      const o = pick(c)
      ishlatilgan.add(o.versiyaId)
      return o
    }
    for (let k = 0; k < n2025; k++) {
      const o = tanla('2025')
      if (o) natijaYoz(s, o, r() > 0.08 ? int(72, 98) : int(50, 68), o.tugash, { kochirilgan: r() > 0.5 })
    }
    for (let k = 0; k < n2026; k++) {
      const o = tanla('2026')
      if (o && o.tugash <= '2026-11-10') natijaYoz(s, o, r() > 0.08 ? int(72, 98) : int(50, 68), o.tugash)
    }
  }

  // Anvar Karimov: 2025 + 2026 tarixi (aniq)
  const anvarOqim = (nomi: string, yil: string) => otganOqimlar.find((o) => o.boshlanish.startsWith(yil) && db.versiyalar.find((v) => v.id === o.versiyaId)!.nomi === nomi)!
  ;[
    ['Yurak ritmi buzilishlari va EKG talqini', '2025', 91], ['Arterial gipertenziya: 2026 klinik protokollari', '2025', 88], ['Clinical Cardiology Update (online CME)', '2025', 84],
    ['Yurak-oʻpka reanimatsiyasi (BLS/ACLS) — simulyatsiya', '2025', 95], ['Tibbiy etika va bemor huquqlari', '2025', 90], ['Ultratovush tekshiruvi: POCUS asoslari', '2025', 86],
    ['Oʻtkir koronar sindrom: zamonaviy yondashuvlar', '2026', 89], ['Klinik farmakologiya: polipragmaziyadan qochish', '2026', 81],
    ['Respublika kardiologlar konferensiyasi 2026', '2026', 100], ['Mustaqil taʼlim: kardiologiya jurnal klubi', '2026', 100],
  ].forEach(([nomi, yil, ball]) => {
    const o = anvarOqim(nomi as string, yil as string)
    if (o) natijaYoz(anvar, o, ball as number, o.tugash > '2026-11-10' ? '2026-11-05' : o.tugash, { davomat: true })
  })
  // Dilnoza Yusupova: 2026 tarixi
  ;['Hamshiralik jarayoni va bemor parvarishi', 'Infeksion nazorat: qoʻl gigiyenasi va SHHV', 'Inyeksiya va infuziya xavfsizligi'].forEach((nomi, k) => {
    const o = otganOqimlar.find((x) => x.boshlanish.startsWith('2026') && db.versiyalar.find((v) => v.id === x.versiyaId)!.nomi === nomi)
    if (o && !db.yozilishlar.some((y) => y.personId === dilnoza.id && y.oqimId === o.id)) natijaYoz(dilnoza, o, [88, 94, 79][k], o.tugash > '2026-11-10' ? '2026-10-20' : o.tugash, { davomat: true })
  })
  // 2025 dan oʻtkazilgan kredit
  db.seq++
  db.jurnal.push({ id: id('K'), seq: db.seq, personId: anvar.id, yil: 2026, miqdor: 4, kursTuri: 'tanlov', yonalish: 'nazariy', tadbirTuri: 'kurs', manba: 'otkazish', manbaId: 'yil-2025', nomi: '2025-yildan oʻtkazilgan kredit', providerNomi: '—', qoidaId: 'Q-2025', sana: '2026-01-01T00:10:00+05:00', asos: 'Qoida 0.9: ortiqcha kreditning 20% igacha', yaratuvchi: 'Kredit xizmati' })
  // bekor qilingan yozuv (tuzatish tarixi namunasi)
  const bekorYozuv = db.jurnal.find((j) => j.personId === anvar.id && j.nomi.startsWith('Klinik farmakologiya'))
  if (bekorYozuv) {
    db.seq++
    db.jurnal.push({ ...bekorYozuv, id: id('K'), seq: db.seq, miqdor: -bekorYozuv.miqdor, manba: 'tuzatish', manbaId: 'TZ-0001', sana: vaqt('2026-10-21', 11), asos: 'Bekor qilish: oqim sanasi xato kiritilgan, natija qayta yuborilgan (xat №UKR-1187)', bekorQilinganId: bekorYozuv.id, yaratuvchi: 'Abdullayev Rustam Erkinovich' })
    db.seq++
    db.jurnal.push({ ...bekorYozuv, id: id('K'), seq: db.seq, miqdor: bekorYozuv.miqdor, manba: 'tuzatish', manbaId: 'TZ-0001', sana: vaqt('2026-10-21', 11), asos: 'Tuzatilgan yozuv: toʻgʻri sana bilan (xat №UKR-1187)', yaratuvchi: 'Abdullayev Rustam Erkinovich' })
    db.tuzatishlar.push({ id: 'TZ-0001', yozuvId: bekorYozuv.id, personId: anvar.id, turi: 'almashtirish', yangiMiqdor: bekorYozuv.miqdor, sabab: 'Oqim sanasi xato kiritilgan', hujjat: 'Xat №UKR-1187', taklifQilgan: 'U-MARKAZ1', holat: 'tasdiqlandi', tasdiqlovchi: 'U-MARKAZ2', sana: vaqt('2026-10-20') })
    const s = db.sertifikatlar.find((x) => x.id === bekorYozuv.sertifikatId)
    if (s) { s.holat = 'tuzatilgan'; s.sabab = 'Sana tuzatildi (xat №UKR-1187)' }
  }
  // xorijiy tan olish (qisman) — Anvar
  db.tanOlish.push({
    id: 'TO-0001', raqam: 'TO-2026-0001', personId: anvar.id, tashkilot: 'European Society of Cardiology', davlat: 'Germaniya', kurs: 'ESC Congress 2026 — Heart Failure track', sana: '2026-08-29', soat: 18, shakl: 'oflayn', sertifikatRaqam: 'ESC-26-884123',
    xorijiyKredit: 12, kreditTuri: 'CME', mutaxassislikId: 'M01', fayllar: [{ id: 'F1', nomi: 'ESC-certificate.pdf', turi: 'application/pdf', hajm: 412000, hash: fauxHash('esc'), yuklangan: vaqt('2026-09-05') }],
    holat: 'tasdiqlandi', tekshiruvlar: [{ usul: 'QR', natija: 'Sertifikat ESC rasmiy saytida tasdiqlandi', sana: vaqt('2026-09-08') }], ekspertId: 'E1',
    xulosa: { turi: 'qisman', milliyKredit: 5, kursTuri: 'tanlov', yonalish: 'nazariy', metodika: 'TM-2026.1', asos: '12 CME dan faqat Heart Failure sessiyalari (5 soat) mutaxassislikka mos; qolgani umumiy plenar', tayyorlagan: 'U-MARKAZ1' },
    tasdiqlovchi: 'U-MARKAZ2', muddat: '2026-09-19', yuborilgan: vaqt('2026-09-05'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-09-05'), kim: 'Karimov A.' }, { holat: 'tasdiqlandi', sana: vaqt('2026-09-16'), kim: 'Abdullayev R.' }],
  })
  db.seq++
  db.jurnal.push({ id: id('K'), seq: db.seq, personId: anvar.id, yil: 2026, miqdor: 5, kursTuri: 'tanlov', yonalish: 'nazariy', tadbirTuri: 'kurs', manba: 'tan_olish', manbaId: 'TO-0001', nomi: 'ESC Congress 2026 — Heart Failure track (xorijiy, Germaniya)', providerNomi: 'European Society of Cardiology', qoidaId: 'Q-2026', sana: vaqt('2026-09-16', 15), asos: 'Tan olish qarori TO-2026-0001 — qisman; metodika TM-2026.1', yaratuvchi: 'Kredit xizmati' })

  // ── Joriy oqimlar (P01) — demo jarayonlar ──
  const vOKS = db.versiyalar.find((v) => v.nomi.startsWith('Oʻtkir koronar'))!
  const vEKG = db.versiyalar.find((v) => v.nomi.startsWith('Yurak ritmi'))!
  const vExo = db.versiyalar.find((v) => v.nomi.startsWith('ExoKG'))!
  const vAG = db.versiyalar.find((v) => v.nomi.startsWith('Arterial'))!
  const vEtika = db.versiyalar.find((v) => v.nomi.startsWith('Tibbiy etika'))!
  // 1) ExoKG — davom etmoqda (Anvar oʻqiyapti, davomat qisman)
  const oExo = oqimYarat(vExo, '2026-11-09', 10, 'davom_etmoqda', 16)
  // 2) OKS — 2026-11-10 da tugagan, davomat va baholar kiritilgan, natija hali shakllantirilmagan (operator uchun V3)
  const oOKS = oqimYarat(vOKS, '2026-11-04', 6, 'davom_etmoqda', 24)
  // 3) EKG — natijalar shakllantirilgan, rahbar tasdiqlashini kutmoqda
  const oEKG = oqimYarat(vEKG, '2026-10-27', 5, 'davom_etmoqda', 20)
  // 4) Arterial gipertenziya (onlayn) — Anvar yozilgan, provayder qabul qilishini kutmoqda + boshqa arizalar
  const oAG = db.oqimlar.find((o) => o.versiyaId === vAG.id && o.holat === 'elon_qilingan')!
  const oEtika = db.oqimlar.find((o) => o.versiyaId === vEtika.id && o.holat === 'elon_qilingan')!

  const mu01 = db.mehnat.filter((m) => m.muassasaId === 'MU01').map((m) => db.shaxslar.find((s) => s.id === m.personId)!)
  const shifokorlar = (mutlar: string[]) => db.shaxslar.filter((s) => mutlar.includes(s.mutaxassislikId) && !['SH-ANVAR', 'SH-JASUR', 'SH-NODIRA'].includes(s.id) && !s.id.startsWith('SH-E'))
  const qabul = (s: T.Shaxs, o: T.Oqim, holat: T.YozilishHolat = 'qabul_qilindi') => {
    const y: T.Yozilish = { id: id('Y'), personId: s.id, oqimId: o.id, holat, yuborilgan: vaqt(qosh(o.boshlanish, -12)), tarix: [{ holat: 'yuborildi', sana: vaqt(qosh(o.boshlanish, -12)), kim: s.familiya }], progress: [] }
    if (holat !== 'yuborildi') y.tarix.push({ holat: 'qabul_qilindi', sana: vaqt(qosh(o.boshlanish, -8)), kim: 'Qodirov Sardor Ilhomovich' })
    db.yozilishlar.push(y)
    return y
  }
  // ExoKG
  const exoT = [anvar, ...shifokorlar(['M01', 'M10']).slice(0, 11)]
  exoT.forEach((s, i) => {
    const y = qabul(s, oExo, 'oqimoqda')
    y.progress = s.id === anvar.id ? [vExo.darslar[0].id, vExo.darslar[1].id, vExo.darslar[2].id] : vExo.darslar.slice(0, int(1, 4)).map((d) => d.id)
    oExo.mashgulotlar.filter((m) => m.sana < '2026-11-13').forEach((m) => db.davomat.push({ id: id('D'), yozilishId: y.id, mashgulotId: m.id, usul: i % 3 === 0 ? 'QR' : 'jurnal', holat: r() > 0.1 ? 'keldi' : 'kelmadi', vaqt: m.sana, kiritgan: 'Qodirov S.' }))
  })
  // OKS: 14 tinglovchi, toʻliq davomat va baholar
  shifokorlar(['M01', 'M03', 'M08']).slice(12, 26).forEach((s, i) => {
    const y = qabul(s, oOKS, 'oqimoqda')
    oOKS.mashgulotlar.forEach((m) => db.davomat.push({ id: id('D'), yozilishId: y.id, mashgulotId: m.id, usul: 'QR', holat: i === 5 && m.sana > '2026-11-06' ? 'kelmadi' : 'keldi', vaqt: m.sana, kiritgan: 'Qodirov S.' }))
    const tb = i === 9 ? 58 : int(71, 97)
    db.baholashlar.push({ id: id('B'), yozilishId: y.id, turi: 'test', ball: tb, otishBali: 70, otdi: tb >= 70, baholovchi: 'Test quyi tizimi', sana: vaqt('2026-11-09', 12), manba: 'Test quyi tizimi' })
    const ab = int(70, 95)
    db.baholashlar.push({ id: id('B'), yozilishId: y.id, turi: 'vaziyatli', ball: ab, otishBali: 70, otdi: true, baholovchi: 'prof. Rahimov B.', sana: vaqt('2026-11-09', 15), manba: 'Rubrika' })
  })
  // EKG: 12 tinglovchi, natija shakllantirilgan (rahbar uchun)
  shifokorlar(['M03', 'M09', 'M08', 'M01']).slice(30, 42).forEach((s, i) => {
    const y = qabul(s, oEKG, 'oqimoqda')
    oEKG.mashgulotlar.forEach((m) => db.davomat.push({ id: id('D'), yozilishId: y.id, mashgulotId: m.id, usul: 'jurnal', holat: 'keldi', vaqt: m.sana, kiritgan: 'Qodirov S.' }))
    const b = i === 4 ? 61 : int(72, 96)
    db.baholashlar.push({ id: id('B'), yozilishId: y.id, turi: 'test', ball: b, otishBali: 70, otdi: b >= 70, baholovchi: 'Test quyi tizimi', sana: vaqt('2026-10-31', 12), manba: 'Test quyi tizimi' })
    db.natijalar.push({ id: id('NT'), yozilishId: y.id, eventId: `evt-${y.id}-final`, natija: b >= 70 ? 'otdi' : 'otmadi', ball: b, holat: 'tasdiqlashda', kiritgan: 'U-OPER', kiritilgan: vaqt('2026-11-11', 11), tekshiruvSababi: b >= 70 ? [] : ['baholashdan oʻtmagan'] })
  })
  // Arterial gipertenziya — arizalar
  const agY = qabul(anvar, oAG, 'yuborildi')
  agY.yuborilgan = vaqt('2026-11-11', 9)
  shifokorlar(['M03', 'M09', 'M11']).slice(44, 50).forEach((s) => qabul(s, oAG, 'yuborildi'))
  shifokorlar(['M03', 'M09']).slice(50, 58).forEach((s) => qabul(s, oAG, 'qabul_qilindi'))
  // Dilnoza — etika onlayn kursida qabul qilingan
  qabul(dilnoza, oEtika, 'qabul_qilindi')

  // natija tekshiruvda (P12 — toʻxtatilgan provayder, natija 2026-10-15)
  const p12v = db.versiyalar.find((v) => db.dasturlar.find((d) => d.id === v.dasturId)!.providerId === 'P12')!
  const p12o = oqimYarat(p12v, '2026-10-05', 5, 'yakunlangan', 20)
  shifokorlar(['M11', 'M03']).slice(0, 3).forEach((s) => {
    const y = qabul(s, p12o, 'tugatdi')
    db.baholashlar.push({ id: id('B'), yozilishId: y.id, turi: 'test', ball: 85, otishBali: 70, otdi: true, baholovchi: 'Test', sana: vaqt('2026-10-09'), manba: 'Excel' })
    db.natijalar.push({ id: id('NT'), yozilishId: y.id, eventId: `evt-${y.id}`, natija: 'otdi', ball: 85, holat: 'tekshiruvda', kiritgan: 'U-P12-OP', kiritilgan: vaqt('2026-10-14'), tasdiqlovchi: 'U-P12-RH', tasdiqlangan: vaqt('2026-10-15'), tekshiruvSababi: ['Provayder akkreditatsiyasi natija sanasida amalda emas'] })
  })
  // bir xil ballar — sifat signali uchun (P11)
  const p11v = db.versiyalar.find((v) => v.nomi.startsWith('KT va MRT'))!
  const p11o = oqimYarat(p11v, '2026-10-12', 5, 'yakunlangan', 30)
  db.shaxslar.filter((s) => s.mutaxassislikId === 'M10').slice(0, 7).forEach((s) => {
    const y = qabul(s, p11o, 'tugatdi')
    p11o.mashgulotlar.forEach((m) => db.davomat.push({ id: id('D'), yozilishId: y.id, mashgulotId: m.id, usul: 'jurnal', holat: 'keldi', vaqt: m.sana, kiritgan: 'Operator' }))
    db.baholashlar.push({ id: id('B'), yozilishId: y.id, turi: 'test', ball: 100, otishBali: 70, otdi: true, baholovchi: 'Test', sana: vaqt('2026-10-16'), manba: 'Excel' })
  })

  // ── Tuzatish taklifi (rahbar uchun) ──
  const tzYozuv = db.jurnal.find((j) => j.personId !== anvar.id && j.yil === 2026 && j.manba === 'natija' && j.miqdor >= 8)
  if (tzYozuv) db.tuzatishlar.push({ id: 'TZ-0002', yozuvId: tzYozuv.id, personId: tzYozuv.personId, turi: 'bekor', sabab: 'Tinglovchi oqimda qatnashmagan — provayderning rasmiy xati', hujjat: 'Xat №P-2026/774, 2026-11-10', taklifQilgan: 'U-MARKAZ1', holat: 'kutilmoqda', sana: vaqt('2026-11-11', 15) })

  // ── Akkreditatsiya arizalari ──
  const fayl = (nomi: string, kun: string): T.Fayl => ({ id: id('F'), nomi, turi: 'application/pdf', hajm: int(180, 4800) * 1000, hash: fauxHash(nomi + kun), yuklangan: vaqt(kun) })
  const vAI = db.versiyalar.find((v) => v.nomi.startsWith('Tibbiyotda sunʼiy'))!
  const vStat = db.versiyalar.find((v) => v.nomi.startsWith('Tibbiy statistika'))!
  db.akkArizalar.push(
    {
      id: 'AK-1', raqam: 'AK-2026-0041', turi: 'provayder', providerId: 'P17', hujjatlar: { nizom: fayl('GML-charter.pdf', '2026-11-03'), litsenziya: fayl('UK-ofqual-licence.pdf', '2026-11-03'), kadrlar: fayl('faculty-list.pdf', '2026-11-03'), baza: fayl('clinical-partners.pdf', '2026-11-03') },
      holat: 'toliqlik', ekspertlar: [], varaqlar: [], muddat: '2026-12-15', yuborilgan: vaqt('2026-11-04'), tarix: [{ holat: 'qoralama', sana: vaqt('2026-10-30'), kim: 'Global Med Learning' }, { holat: 'yuborildi', sana: vaqt('2026-11-04'), kim: 'Global Med Learning', izoh: 'ERI bilan imzolandi' }], yaratilgan: vaqt('2026-10-30'),
    },
    {
      id: 'AK-2', raqam: 'AK-2026-0038', turi: 'dastur', providerId: 'P01', versiyaId: vAI.id, hujjatlar: { pasport: fayl('AI-pasport.pdf', '2026-10-20'), oquv_reja: fayl('AI-reja.pdf', '2026-10-20'), baholash: fayl('AI-testbank.pdf', '2026-10-20'), oqituvchilar: fayl('AI-CV.pdf', '2026-10-20') },
      holat: 'ekspertiza', ekspertlar: ['E1', 'E2'], varaqlar: [{ ekspertId: 'E2', mezonlar: { mazmun: 5, natijalar: 4, baza: 4, oqituvchi: 5, baholash: 4, kredit: 4 }, xulosa: 'Dastur dolzarb, oʻquv natijalari aniq. Soʻralgan 6 kredit asosli.', tavsiya: 'akkreditatsiya', topshirilgan: vaqt('2026-11-10') }],
      muddat: '2026-12-02', yuborilgan: vaqt('2026-10-21'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-10-21'), kim: 'Mirzayev A.' }, { holat: 'ekspertiza', sana: vaqt('2026-10-24'), kim: 'Tursunova G.', izoh: 'Toʻliqlik tekshiruvidan oʻtdi' }, { holat: 'ekspertiza', sana: vaqt('2026-10-25'), kim: 'Tursunova G.', izoh: 'Ekspertlar biriktirildi: 2' }], yaratilgan: vaqt('2026-10-18'),
    },
    {
      id: 'AK-3', raqam: 'AK-2026-0035', turi: 'dastur', providerId: 'P06', versiyaId: vStat.id, hujjatlar: { pasport: fayl('stat-pasport.pdf', '2026-10-01'), oquv_reja: fayl('stat-reja.pdf', '2026-10-01'), baholash: fayl('stat-test.pdf', '2026-10-01'), oqituvchilar: fayl('stat-cv.pdf', '2026-10-01') },
      holat: 'komissiya', ekspertlar: ['E2', 'E5'], varaqlar: [
        { ekspertId: 'E2', mezonlar: { mazmun: 4, natijalar: 4, baza: 3, oqituvchi: 4, baholash: 4, kredit: 3 }, xulosa: 'Kredit 6 emas, 5 boʻlishi maqsadga muvofiq (amaliy qism kam).', tavsiya: 'akkreditatsiya', topshirilgan: vaqt('2026-10-28') },
        { ekspertId: 'E5', mezonlar: { mazmun: 4, natijalar: 5, baza: 4, oqituvchi: 4, baholash: 3, kredit: 4 }, xulosa: 'Akkreditatsiyaga tavsiya etiladi.', tavsiya: 'akkreditatsiya', topshirilgan: vaqt('2026-10-30') }],
      muddat: '2026-11-18', yuborilgan: vaqt('2026-10-02'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-10-02'), kim: 'Shifo Akademiyasi' }, { holat: 'ekspertiza', sana: vaqt('2026-10-06'), kim: 'Tursunova G.' }, { holat: 'komissiya', sana: vaqt('2026-11-02'), kim: 'Tursunova G.' }], yaratilgan: vaqt('2026-09-28'),
    },
    {
      id: 'AK-4', raqam: 'AK-2026-0029', turi: 'provayder', providerId: 'P18', hujjatlar: { nizom: fayl('qtt-nizom.pdf', '2026-09-10'), litsenziya: fayl('qtt-lits.pdf', '2026-09-10') },
      holat: 'kamchilik', ekspertlar: [], varaqlar: [], izoh: 'Professor-oʻqituvchilar tarkibi va klinik baza shartnomasi yuklanmagan.', muddat: '2026-11-20', yuborilgan: vaqt('2026-09-12'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-09-12'), kim: 'QTT' }, { holat: 'kamchilik', sana: vaqt('2026-09-16'), kim: 'Tursunova G.', izoh: 'Kadrlar va baza hujjatlari yoʻq' }], yaratilgan: vaqt('2026-09-10'),
    },
    {
      id: 'AK-5', raqam: 'AK-2026-0012', turi: 'dastur', providerId: 'P01', versiyaId: vExo.id, hujjatlar: { pasport: fayl('exo-pasport.pdf', '2026-03-01'), oquv_reja: fayl('exo-reja.pdf', '2026-03-01'), baholash: fayl('exo-osce.pdf', '2026-03-01'), oqituvchilar: fayl('exo-cv.pdf', '2026-03-01') },
      holat: 'yakunlandi', ekspertlar: ['E1', 'E7'], varaqlar: [], komissiya: { azolar: ['Abdullayev R.', 'Tursunova G.', 'Xolmatov B.', 'Valiyev U.', 'Sobirova D.'], ovozlar: { za: 5, qarshi: 0, betaraf: 0 }, bayonnoma: 'Bayonnoma №7' },
      qaror: { turi: 'akkreditatsiya', raqam: 'UKR-2026/88', sana: vaqt('2026-04-02'), muddat: '2029-06-30', sabab: 'Barcha mezonlar bajarilgan', kredit: 16, eri: 'ERI:Abdullayev R.|2026-04-02', tasdiqlovchi: 'U-MARKAZ2' }, muddat: '2026-04-10', yuborilgan: vaqt('2026-03-02'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-03-02'), kim: 'Mirzayev A.' }, { holat: 'yakunlandi', sana: vaqt('2026-04-02'), kim: 'Abdullayev R.', qaror: 'UKR-2026/88' }], yaratilgan: vaqt('2026-02-25'),
    },
  )
  db.hisoblagich.akk = 41

  // ── Tan olish navbati (markaz uchun) ──
  const xodimlarOliy = db.shaxslar.filter((s) => s.daraja === 'oliy' && !s.id.startsWith('SH-E') && s.id.startsWith('SH-0'))
  const t1 = xodimlarOliy[3], t2 = xodimlarOliy[8]
  db.tanOlish.push(
    { id: 'TO-0002', raqam: 'TO-2026-0014', personId: t1.id, tashkilot: 'American Heart Association', davlat: 'AQSh', kurs: 'ACLS Provider Course', sana: '2026-10-12', soat: 16, shakl: 'oflayn', sertifikatRaqam: 'AHA-ACLS-2210457', xorijiyKredit: 30, kreditTuri: 'CME', mutaxassislikId: t1.mutaxassislikId, fayllar: [fayl('aha-acls.pdf', '2026-10-20'), fayl('aha-program.pdf', '2026-10-20')], holat: 'yuborildi', tekshiruvlar: [], muddat: '2026-11-17', yuborilgan: vaqt('2026-11-03'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-11-03'), kim: t1.familiya }] },
    { id: 'TO-0003', raqam: 'TO-2026-0011', personId: t2.id, tashkilot: 'Charité Academy', davlat: 'Germaniya', kurs: 'Clinical Ultrasound Workshop', sana: '2026-09-20', soat: 24, shakl: 'oflayn', sertifikatRaqam: 'CHA-US-55821', xorijiyKredit: 24, kreditTuri: 'CME', mutaxassislikId: t2.mutaxassislikId, fayllar: [fayl('charite.pdf', '2026-10-01')], holat: 'tekshiruvda', tekshiruvlar: [{ usul: 'reestr', natija: 'EACCME reestrida tadbir topildi, 24 CME', sana: vaqt('2026-10-14') }], muddat: '2026-11-14', yuborilgan: vaqt('2026-10-02'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-10-02'), kim: t2.familiya }, { holat: 'tekshiruvda', sana: vaqt('2026-10-14'), kim: 'Tursunova G.' }] },
  )
  db.hisoblagich.tanolish = 14

  // ── Murojaatlar ──
  db.murojaatlar.push(
    { id: 'MR-1', raqam: 'MR-2026-00087', turi: 'kredit', obyekt: { turi: 'KreditYozuvi', id: '-', nomi: 'Yurak-oʻpka reanimatsiyasi (2026)' }, arizachiId: 'U-ANVAR', matn: 'BLS/ACLS kursida 2 kun amaliy mashgʻulot boʻlgan, lekin kredit turi «nazariy» emas, «amaliy» boʻlishi kerak deb hisoblayman.', fayllar: [], holat: 'korib_chiqilmoqda', masulRol: 'markaz_mutaxassis', masulId: 'U-MARKAZ1', muddat: '2026-11-25', yozishmalar: [{ kim: 'Tursunova G.', matn: 'Murojaatingiz koʻrib chiqilmoqda, provayderdan soʻrov yuborildi.', sana: vaqt('2026-11-05') }], yuborilgan: vaqt('2026-11-03'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-11-03'), kim: 'Karimov A.' }, { holat: 'korib_chiqilmoqda', sana: vaqt('2026-11-05'), kim: 'Tursunova G.' }] },
    { id: 'MR-2', raqam: 'MR-2026-00091', turi: 'baho', obyekt: { turi: 'Yozilish', id: '-', nomi: 'Insult: birinchi soatlar — test' }, arizachiId: 'U-DILNOZA', matn: 'Yakuniy testda 3 ta savolning javob kaliti notoʻgʻri. Qayta baholashni soʻrayman.', fayllar: [], holat: 'yuborildi', masulRol: 'markaz_mutaxassis', muddat: '2026-12-01', yozishmalar: [], yuborilgan: vaqt('2026-11-10'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-11-10'), kim: 'Yusupova D.' }] },
    { id: 'MR-3', raqam: 'MR-2026-00079', turi: 'akkreditatsiya', obyekt: { turi: 'Provayder', id: 'P12', nomi: 'Namangan Med Taʼlim — toʻxtatish qarori' }, arizachiId: 'U-OPER', matn: 'Akkreditatsiyani toʻxtatish qarori ustidan apellyatsiya: signal asossiz, davomat dalillari ilova qilinadi.', fayllar: [], holat: 'malumot_soraldi', masulRol: 'markaz_mutaxassis', masulId: 'U-MARKAZ1', birinchiQarorChiqargan: 'U-MARKAZ2', muddat: '2026-11-20', yozishmalar: [{ kim: 'Tursunova G.', matn: 'Iltimos, 2026-yil sentyabr oqimlarining QR davomat jurnallarini yuklang.', sana: vaqt('2026-10-28') }], yuborilgan: vaqt('2026-10-20'), tarix: [{ holat: 'yuborildi', sana: vaqt('2026-10-20'), kim: 'Provayder' }, { holat: 'malumot_soraldi', sana: vaqt('2026-10-28'), kim: 'Tursunova G.' }] },
  )
  db.hisoblagich.murojaat = 91

  // ── Rivojlanish rejalari ──
  const rejaBand = (v: T.DasturVersiya, muddat: string, bajarildi = false): T.RejaBandi => ({ id: id('RB'), nomi: v.nomi, versiyaId: v.id, kredit: v.tasdiqlanganKredit ?? v.soralganKredit, kursTuri: v.kursTuri, yonalish: v.yonalish, muddat, majburiyModul: v.kursTuri === 'majburiy', bajarildi })
  db.rejalar.push({ id: 'RJ-ANVAR-2026', personId: anvar.id, muassasaId: 'MU01', yil: 2026, versiya: 2, holat: 'bajarilmoqda', tashabbuskor: 'U-ANVAR', tasdiqlovchi: 'U-MUASSASA', yangilangan: vaqt('2026-02-10'), bandlar: [rejaBand(vOKS, '1-chorak', true), rejaBand(db.versiyalar.find((v) => v.nomi.startsWith('Yurak-oʻpka'))!, '2-chorak', true), rejaBand(vExo, '4-chorak'), rejaBand(vAG, '4-chorak')], oldingiVersiyalar: [{ versiya: 1, holat: 'qaytarildi', bandlar: [rejaBand(vOKS, '1-chorak')], izoh: 'Amaliy kurs qoʻshilmagan (amaliy ulush 20%)', sana: vaqt('2026-01-25'), kim: 'Ergasheva F.' }] })
  mu01.filter((s) => s.daraja === 'oliy' && s.id.startsWith('SH-0')).slice(0, 4).forEach((s, i) => {
    const mos = tasdiqVers.filter((v) => (v.tinglovchi === 'barchasi' || v.tinglovchi === s.daraja) && (!v.mutaxassisliklar.length || v.mutaxassisliklar.includes(s.mutaxassislikId)))
    db.rejalar.push({ id: `RJ-${i}`, personId: s.id, muassasaId: 'MU01', yil: 2027, versiya: 1, holat: i === 3 ? 'tasdiqlandi' : 'yuborildi', tashabbuskor: s.id, tasdiqlovchi: i === 3 ? 'U-MUASSASA' : undefined, yangilangan: vaqt('2026-11-0' + (i + 3)), bandlar: mos.slice(0, 5).map((v, k) => rejaBand(v, `${(k % 4) + 1}-chorak`)), oldingiVersiyalar: [] })
  })
  const dilnozaRejaVers = tasdiqVers.filter((v) => v.tinglovchi !== 'oliy' && (!v.mutaxassisliklar.length || v.mutaxassisliklar.includes('M20')))
  db.rejalar.push({ id: 'RJ-DILNOZA', personId: dilnoza.id, muassasaId: 'MU01', yil: 2027, versiya: 1, holat: 'qoralama', tashabbuskor: 'U-DILNOZA', yangilangan: vaqt('2026-11-08'), bandlar: dilnozaRejaVers.slice(0, 3).map((v, k) => rejaBand(v, `${k + 1}-chorak`)), oldingiVersiyalar: [] })

  // ── Rezidentura ──
  db.klinikBazalar.push(
    { id: 'KB1', nomi: 'Toshkent shahar 3-son klinik shifoxonasi — kardiologiya', hududId: 'R01', mutaxassisliklar: ['M01', 'M03'], sigim: 12, shartnomaMuddati: '2028-08-31' },
    { id: 'KB2', nomi: 'Respublika ixtisoslashtirilgan kardiologiya markazi (demo)', hududId: 'R01', mutaxassisliklar: ['M01'], sigim: 20, shartnomaMuddati: '2029-08-31' },
    { id: 'KB3', nomi: 'Respublika shoshilinch tibbiy yordam markazi (demo)', hududId: 'R01', mutaxassisliklar: ['M08', 'M07', 'M01'], sigim: 25, shartnomaMuddati: '2028-12-31' },
    { id: 'KB4', nomi: 'Samarqand viloyat koʻp tarmoqli tibbiyot markazi', hududId: 'R12', mutaxassisliklar: ['M04', 'M06', 'M05'], sigim: 18, shartnomaMuddati: '2027-08-31' },
  )
  db.kvotalar.push(
    { id: 'KV1', mutaxassislikId: 'M01', tashkilot: 'Tibbiyot universiteti (demo)', yil: 2026, turi: 'davlat', soni: 40, versiya: 1 },
    { id: 'KV2', mutaxassislikId: 'M01', tashkilot: 'Tibbiyot universiteti (demo)', yil: 2026, turi: 'kontrakt', soni: 25, versiya: 1 },
    { id: 'KV3', mutaxassislikId: 'M02', tashkilot: 'Pediatriya instituti (demo)', yil: 2026, turi: 'davlat', soni: 55, versiya: 2 },
    { id: 'KV4', mutaxassislikId: 'M08', tashkilot: 'Tibbiyot universiteti (demo)', yil: 2026, turi: 'maqsadli', soni: 30, versiya: 1 },
  )
  const rezidentlar = [jasur, ...[0, 1, 2].map(() => shaxsYarat({ mutaxassislikId: 'M01', toifa: 'yoq', tugilgan: `${int(1997, 2000)}-0${int(1, 9)}-1${int(0, 9)}` }))]
  rezidentlar.forEach((s, i) => {
    db.rezidentlar.push({ id: `RZ${i + 1}`, personId: s.id, mutaxassislikId: 'M01', tashkilot: 'Tibbiyot universiteti (demo) — kardiologiya kafedrasi', kurs: i === 0 ? 2 : int(1, 3), boshlangan: i === 0 ? '2025-09-01' : '2024-09-01', tugash: i === 0 ? '2028-08-31' : '2027-08-31', rahbarId: 'U-KLINIK', moliya: i === 2 ? 'kontrakt' : 'davlat', holat: 'oqimoqda' })
  })
  db.rotatsiyalar.push(
    { id: 'RT1', rezidentId: 'RZ1', bazaId: 'KB2', bolim: 'Koronar reanimatsiya', dan: '2025-09-01', gacha: '2026-01-31', maqsad: 'OKS bemorlarini olib borish', holat: 'yakunlangan', xulosa: 'Mustaqil ishlay oladi, EKG talqini aʼlo.' },
    { id: 'RT2', rezidentId: 'RZ1', bazaId: 'KB1', bolim: 'Funksional diagnostika', dan: '2026-02-01', gacha: '2026-06-30', maqsad: 'ExoKG, Holter, stress-testlar', holat: 'yakunlangan', xulosa: 'ExoKG koʻnikmalari minimal talabga yaqin.' },
    { id: 'RT3', rezidentId: 'RZ1', bazaId: 'KB3', bolim: 'Shoshilinch kardiologiya', dan: '2026-09-01', gacha: '2027-01-31', maqsad: 'Shoshilinch holatlar, kardioversiya', holat: 'davom' },
    { id: 'RT4', rezidentId: 'RZ1', bazaId: 'KB2', bolim: 'Rentgen-endovaskulyar', dan: '2027-02-01', gacha: '2027-05-31', maqsad: 'Koronarografiyada ishtirok', holat: 'reja' },
  )
  const izohlar = ['58 yoshli erkak, OKS ST koʻtarilishi bilan', '64 yoshli ayol, boʻlmachalar fibrillyatsiyasi', 'rejali tekshiruv, gipertoniya', 'yurak yetishmovchiligi, NYHA III', '42 yoshli erkak, koʻkrak ogʻrigʻi', 'qabul boʻlimi, sinkopa']
  for (const rz of db.rezidentlar) {
    KONIKMALAR.M01.forEach((k) => {
      const n = rz.id === 'RZ1' ? Math.max(0, Math.round(k.minimal * (0.35 + r() * 0.55))) : int(0, Math.round(k.minimal * 0.8))
      for (let j = 0; j < Math.min(n, 14); j++) db.logbook.push({ id: id('LB'), rezidentId: rz.id, konikmaKod: k.kod, daraja: pick(['kuzatdi', 'yordam_berdi', 'nazorat_ostida', 'mustaqil'] as T.IshtirokDarajasi[]), sana: qosh('2025-09-15', int(0, 420)), joy: pick(['KB1', 'KB2', 'KB3']), izoh: pick(izohlar), holat: 'tasdiqlangan' })
    })
  }
  ;['KRD-02', 'KRD-01', 'KRD-05', 'KRD-03'].forEach((k, j) => db.logbook.unshift({ id: id('LB'), rezidentId: 'RZ1', konikmaKod: k, daraja: j % 2 ? 'mustaqil' : 'nazorat_ostida', sana: qosh('2026-11-05', j), joy: 'KB3', izoh: izohlar[j], holat: 'kutilmoqda' }))
  db.logbook.unshift({ id: id('LB'), rezidentId: 'RZ2', konikmaKod: 'KRD-01', daraja: 'mustaqil', sana: '2026-11-10', joy: 'KB1', izoh: 'rejali EKG, 50 yoshli ayol', holat: 'kutilmoqda' })
  db.rezidentBaholar.push(
    { id: 'RB1', rezidentId: 'RZ1', turi: 'joriy', sana: '2025-12-20', ball: 86, natija: 'otdi', komissiya: 'Kafedra', izoh: 'Koronar reanimatsiya rotatsiyasi' },
    { id: 'RB2', rezidentId: 'RZ1', turi: 'oraliq', sana: '2026-02-27', ball: 82, natija: 'otdi', komissiya: 'Oraliq attestatsiya komissiyasi', izoh: '1-yil yakuni' },
    { id: 'RB3', rezidentId: 'RZ1', turi: 'joriy', sana: '2026-06-25', ball: 90, natija: 'otdi', komissiya: 'Kafedra', izoh: 'Funksional diagnostika' },
  )

  // ── PSV ──
  db.psv.push(
    { id: 'PSV-1', raqam: 'PSV-2026-0007', soruvchi: 'shaxs', personId: anvar.id, qabulQiluvchi: 'Medical Council (UK) — demo', maqsad: 'Xorijda klinik stajirovka uchun malaka tasdigʻi', hujjatlar: [{ turi: 'diplom', manba: 'HEMIS', holat: 'kutilmoqda' }, { turi: 'toifa', manba: 'Platforma Reestri', holat: 'tasdiqlandi', javob: 'Oliy toifa, 2028-03-01 gacha', sana: vaqt('2026-11-02') }, { turi: 'ukr', manba: 'UKR quyi tizimi', holat: 'tasdiqlandi', javob: 'UKR: 2025 — bajarilgan', sana: vaqt('2026-11-02') }], rozilik: { hajm: 'diplom, toifa, ukr', muddat: '2027-05-01', berilgan: vaqt('2026-11-01') }, tolov: { tarif: 150000, holat: 'tolandi', hisob: 'INV-26110107' }, holat: 'javob_kutilmoqda', yaratilgan: vaqt('2026-11-01') },
    { id: 'PSV-2', raqam: 'PSV-2026-0004', soruvchi: 'xorijiy_tashkilot', personId: xodimlarOliy[12].id, qabulQiluvchi: 'Ministry of Health (UAE) — demo', maqsad: 'Ishga qabul uchun Good Standing toʻplamiga qoʻshimcha', hujjatlar: [{ turi: 'davlat_royxati', manba: 'Platforma Reestri', holat: 'tasdiqlandi', javob: 'Amalda', sana: vaqt('2026-10-12') }, { turi: 'staj', manba: 'Yagona milliy mehnat tizimi', holat: 'tasdiqlandi', javob: '12 yil 4 oy', sana: vaqt('2026-10-14') }], rozilik: { hajm: 'davlat roʻyxati, staj', muddat: '2027-01-01', berilgan: vaqt('2026-10-10') }, tolov: { tarif: 150000, holat: 'tolandi' }, holat: 'yetkazildi', yetkazish: { usul: 'API', sana: vaqt('2026-10-15') }, yaratilgan: vaqt('2026-10-10') },
  )
  db.hisoblagich.psv = 7

  // ── Signallar (dastlabki) ──
  db.signallar.push(
    { id: 'SG-1', turi: 'akk_muddati_tugagan', providerId: 'P12', tavsif: 'Namangan Med Taʼlim: akkreditatsiya toʻxtatilgan sanadan keyin 3 ta natija yuborilgan', qiymat: 'P12-2026-10', aniqlangan: vaqt('2026-10-16', 2), holat: 'tekshiruvda', ish: { masul: 'U-MARKAZ1', dalillar: ['Natijalar roʻyxati (3 ta)', 'Toʻxtatish qarori UKR-2026/231'], ijro: 'kutilmoqda' } },
    { id: 'SG-2', turi: 'mutaxassislik_mos_emas', providerId: 'P06', tavsif: 'Shifo Akademiyasi: «Klinik farmakologiya» oqimida 4 ta stomatolog tinglovchi', qiymat: 'P06-farm', aniqlangan: vaqt('2026-11-02', 2), holat: 'yangi' },
    { id: 'SG-3', turi: 'kop_sertifikat', providerId: 'P07', tavsif: 'MedSkills: 2026-09-14 kuni 46 ta sertifikat (chegara: 40)', qiymat: 'P07-0914', aniqlangan: vaqt('2026-09-15', 2), holat: 'yopildi', ish: { masul: 'U-MARKAZ1', dalillar: ['Oqimlar jadvali — 2 parallel guruh'], xulosa: 'Ikki parallel oqim — asossiz signal', ijro: 'bajarildi' } },
  )

  // ── Taqvim ──
  db.taqvim.push(
    { id: 'TQ1', personId: anvar.id, sana: '2026-11-09', tugash: '2026-11-18', nomi: 'ExoKG asoslari: amaliy kurs', turi: 'kurs' },
    { id: 'TQ2', personId: anvar.id, sana: '2026-11-16', nomi: 'ExoKG — oraliq OSKE', turi: 'test' },
    { id: 'TQ3', personId: anvar.id, sana: '2026-12-31', nomi: '2026-yil UKR hisobot davri yakuni', turi: 'muddat' },
    { id: 'TQ4', personId: anvar.id, sana: '2026-12-25', nomi: '2027-yil rivojlanish rejasini yuborish muddati', turi: 'muddat' },
    { id: 'TQ5', personId: anvar.id, sana: '2028-03-01', nomi: 'Malaka toifasi muddati', turi: 'muddat' },
  )

  // ── Bildirishnomalar ──
  const N = (userId: string, matn: string, turi: T.Bildirishnoma['turi'], sanaS: string, havola?: string, oqilgan = false) => db.bildirishnomalar.push({ id: id('N'), userId, matn, turi, sana: sanaS, havola, oqilgan, kanal: ['kabinet'] })
  N('U-ANVAR', 'Yil tugashiga 48 kun qoldi: amaldagi qoida boʻyicha talabni bajarish uchun kredit yetishmayapti', 'warn', vaqt('2026-11-13', 8), '/xodim/kreditlar')
  N('U-ANVAR', 'Ertaga 10:00 — ExoKG asoslari, 5-mashgʻulot (2-oʻquv zali)', 'info', vaqt('2026-11-12', 18), '/xodim/oquv/kurslarim')
  N('U-ANVAR', '+5 kredit: ESC Congress 2026 (xorijiy tan olish, qisman)', 'ok', vaqt('2026-09-16', 15), '/xodim/kreditlar', true)
  N('U-OPER', 'OKS oqimi (C-2026) yakunlandi — yakuniy natijani shakllantiring', 'warn', vaqt('2026-11-11', 9), '/provayder/natijalar')
  N('U-OPER', '7 ta yangi ariza: «Arterial gipertenziya» oqimiga', 'info', vaqt('2026-11-12', 10), '/provayder/tinglovchilar')
  N('U-RAHBAR', '12 ta yakuniy natija tasdiqlashingizni kutmoqda (EKG oqimi)', 'warn', vaqt('2026-11-11', 11), '/provayder/natijalar')
  N('U-RAHBAR', 'AK-2026-0038 ekspertiza bosqichida', 'info', vaqt('2026-10-25', 12), '/provayder/akkreditatsiya', true)
  N('U-MUASSASA', '3 ta rivojlanish rejasi tasdiqlashni kutmoqda', 'warn', vaqt('2026-11-07', 9), '/muassasa/rejalar')
  N('U-MUASSASA', 'Xavf ostidagi xodimlar soni oshdi', 'info', vaqt('2026-11-10', 9), '/muassasa/ukr')
  N('U-MARKAZ1', 'Yangi akkreditatsiya arizasi AK-2026-0041 — Global Med Learning', 'info', vaqt('2026-11-04', 10), '/markaz/akkreditatsiya')
  N('U-MARKAZ1', 'Tan olish arizasi TO-2026-0011 muddati: 14.11.2026', 'warn', vaqt('2026-11-12', 9), '/markaz/tanolish')
  N('U-MARKAZ2', 'AK-2026-0035 komissiya qaroriga tayyor', 'warn', vaqt('2026-11-02', 15), '/markaz/akkreditatsiya')
  N('U-MARKAZ2', 'Kredit qoidasi 2.1 tasdiqlashga yuborildi', 'info', vaqt('2026-11-06', 11), '/markaz/qoidalar')
  N('U-MARKAZ2', 'Kredit tuzatish taklifi kutmoqda', 'info', vaqt('2026-11-11', 15), '/markaz/jurnal')
  N('U-EKSPERT', 'Sizga AK-2026-0038 arizasi biriktirildi (muddat: 20.11.2026)', 'warn', vaqt('2026-10-25', 12), '/ekspert/arizalar')
  N('U-KLINIK', 'Rustamov J.: 4 ta logbook yozuvi tasdiqlashni kutmoqda', 'warn', vaqt('2026-11-09', 9), '/klinik/logbook')
  N('U-REZIDENT', 'Oraliq attestatsiya: 2027-02-26', 'info', vaqt('2026-11-01', 9), '/rezident/baholar')
  N('U-VAZIRLIK', 'Oktyabr oyi UKR monitoringi yangilandi', 'info', vaqt('2026-11-01', 9), '/vazirlik/ukr')
  N('U-ADMIN', 'Fayl ombori 62% band', 'info', vaqt('2026-11-12', 7), '/admin/tizim')

  // ── Hodisalar va audit (namuna) ──
  db.hodisalar.push(
    { id: 'evt-demo-lms-1', turi: 'lms_natija', manbaId: '-', vaqt: vaqt('2026-11-12', 23), holat: 'qayta_ishlandi', izoh: 'Moodle: 18 ta natija qabul qilindi' },
    { id: 'evt-demo-lms-1#r', turi: 'lms_natija', manbaId: '-', vaqt: vaqt('2026-11-12', 23), holat: 'takror_eʼtiborsiz', izoh: '409 — takror event_id (tarmoq qayta yuborishi)' },
    { id: 'sverka-2026-11-13', turi: 'reestrga_uzatildi', manbaId: 'solishtirish', vaqt: vaqt('2026-11-13', 3), holat: 'qayta_ishlandi', izoh: 'Kunlik solishtirish: farq 0' },
  )
  const auditN = (sanaS: string, userId: string, fio: string, rol: T.AuditYozuv['rol'], amal: string, obyekt: string, natija: 'ok' | 'rad_etildi' = 'ok') => db.audit.push({ id: id('A'), sana: sanaS, userId, fio, rol, amal, obyekt, ip: `10.10.${int(1, 250)}.${int(1, 250)}`, natija })
  auditN(vaqt('2026-11-12', 16), 'U-OPER', 'Qodirov Sardor Ilhomovich', 'provayder_operator', 'Dastur kreditini oʻzgartirishga urinish (16 → 20)', 'Dastur', 'rad_etildi')
  auditN(vaqt('2026-11-12', 11), 'U-MUASSASA', 'Ergasheva Feruza Abdullayevna', 'muassasa', 'Eksport: UKR holati (Excel, 41 qator)', 'Eksport')
  auditN(vaqt('2026-11-11', 15), 'U-MARKAZ1', 'Tursunova Gulnoza Komilovna', 'markaz_mutaxassis', 'Tuzatish taklif qilindi', 'KreditYozuvi')
  auditN(vaqt('2026-11-11', 11), 'U-OPER', 'Qodirov Sardor Ilhomovich', 'provayder_operator', 'Yakuniy natija shakllantirildi', 'Oqim')
  auditN(vaqt('2026-11-10', 9), 'U-ANVAR', 'Karimov Anvar Baxtiyorovich', 'xodim', 'Kirish (OneID)', 'Sessiya')

  db.hisoblagich.oqim = oqimN
  db.hisoblagich['sert-UKR'] = Math.max(...Object.values(sertRaqam))
  return db
}

export const DEMO_HISOBLAR: { login: string; parol: string; rol: string; izoh: string }[] = [
  { login: 'anvar', parol: 'anvar2026', rol: 'Xodim (shifokor)', izoh: 'Katalog, yozilish, kreditlar, portfolio, tan olish, PSV' },
  { login: 'dilnoza', parol: 'dilnoza2026', rol: 'Xodim (hamshira)', izoh: 'Oʻrta maʼlumotli — boshqa talab va kurslar' },
  { login: 'operator', parol: 'operator2026', rol: 'Provayder operatori', izoh: 'Dastur, oqim, davomat, baholash, natija shakllantirish' },
  { login: 'rahbar', parol: 'rahbar2026', rol: 'Provayder rahbari', izoh: 'Natijani tasdiqlash, akkreditatsiya arizasi' },
  { login: 'muassasa', parol: 'muassasa2026', rol: 'Muassasa (ish beruvchi)', izoh: 'Xodimlar UKR holati, rejalarni tasdiqlash' },
  { login: 'mutaxassis', parol: 'mutaxassis2026', rol: 'UKR markazi mutaxassisi', izoh: 'Reestr, arizalar, tuzatish taklifi, PSV' },
  { login: 'qaror', parol: 'qaror2026', rol: 'UKR markazi (qaror)', izoh: 'Akkreditatsiya, qoida, tuzatish qarorlari' },
  { login: 'ekspert', parol: 'ekspert2026', rol: 'Ekspert', izoh: 'Biriktirilgan arizalar, ekspertiza varagʻi' },
  { login: 'klinik', parol: 'klinik2026', rol: 'Klinik rahbar', izoh: 'Rezidentlar, logbook tasdiqlash, baholash' },
  { login: 'rezident', parol: 'rezident2026', rol: 'Rezident', izoh: 'Oʻquv reja, rotatsiyalar, logbook' },
  { login: 'vazirlik', parol: 'vazirlik2026', rol: 'Vazirlik tahlilchisi', izoh: 'UKR monitoringi va hisobotlar' },
  { login: 'admin', parol: 'admin2026', rol: 'Administrator', izoh: 'Foydalanuvchilar, sozlamalar, hodisalar' },
]

export { BAHOLASH_MEZONLARI }
