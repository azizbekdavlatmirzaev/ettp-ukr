// Onlayn test savollari (demo). Toʻgʻri javob indeksi — `t`.
export interface Savol { s: string; v: string[]; t: number }

const EKG: Savol[] = [
  { s: 'Normal sinus ritmida yurak urish chastotasi qaysi oraliqda?', v: ['40–60 / daq', '60–90 / daq', '100–140 / daq', '150–200 / daq'], t: 1 },
  { s: 'Boʻlmachalar fibrillyatsiyasining EKGdagi asosiy belgisi?', v: ['P tishchalari yoʻqligi va RR notekisligi', 'QRS kengayishi', 'ST koʻtarilishi', 'Uzun QT'], t: 0 },
  { s: 'QRS kompleksining normal davomiyligi?', v: ['0,20 s dan ortiq', '0,12 s gacha', '0,30–0,40 s', '0,02 s dan kam'], t: 1 },
  { s: 'II darajali AV-blokada Mobits I uchun xos:', v: ['PQ asta-sekin uzayib, QRS tushib qoladi', 'PQ doimiy, QRS toʻsatdan tushadi', 'P va QRS bogʻliq emas', 'PQ qisqargan'], t: 0 },
  { s: 'Qorinchalar fibrillyatsiyasida birinchi navbatdagi chora?', v: ['Atropin', 'Defibrillyatsiya', 'Beta-bloker', 'Kuzatish'], t: 1 },
]
const OKS: Savol[] = [
  { s: 'ST koʻtarilishli MI da birlamchi PCI uchun maqbul vaqt (FMC dan)?', v: ['≤ 120 daqiqa', '≤ 24 soat', '≤ 6 soat', 'Vaqt ahamiyatsiz'], t: 0 },
  { s: 'OKS da yuqori sezgir troponin qachon qayta tekshiriladi (0/1 soat algoritmi)?', v: ['1 soatdan keyin', '24 soatdan keyin', 'Faqat bir marta', '7 kundan keyin'], t: 0 },
  { s: 'Kontrendikatsiya boʻlmasa, OKS da darhol beriladigan dori?', v: ['Aspirin', 'Digoksin', 'Furosemid', 'Amiodaron'], t: 0 },
  { s: 'Pastki devor MI EKG da qaysi tarmoqlarda koʻrinadi?', v: ['V1–V4', 'II, III, aVF', 'I, aVL', 'V5–V6'], t: 1 },
  { s: 'Kardiogen shokning asosiy belgisi?', v: ['Gipertoniya', 'Sistolik bosim < 90 mm sim. ust. va gipoperfuziya', 'Bradikardiya yolgʻiz', 'Isitma'], t: 1 },
]
const EXO: Savol[] = [
  { s: 'Chap qorincha otish fraksiyasining normal qiymati (Simpson)?', v: ['≥ 52–55%', '20–30%', '35–40%', '80–90%'], t: 0 },
  { s: 'Mitral oqimda E/A < 1 nimani koʻrsatadi?', v: ['Relaksatsiya buzilishi (I tur diastolik disfunksiya)', 'Restriktiv tur', 'Normal yosh bemor', 'Mitral stenoz'], t: 0 },
  { s: 'Parasternal uzun oʻq kesimida koʻrinmaydi:', v: ['Aorta ildizi', 'Mitral klapan', 'Oʻng boʻlmacha toʻliq', 'Chap qorincha'], t: 2 },
  { s: 'Perikard suyuqligida tamponada belgisi?', v: ['Oʻng boʻlmacha/qorincha diastolik kollapsi', 'Chap qorincha gipertrofiyasi', 'Aorta kengayishi', 'Mitral prolaps'], t: 0 },
  { s: 'TAPSE qaysi funksiyani baholaydi?', v: ['Oʻng qorincha sistolik funksiyasi', 'Chap boʻlmacha hajmi', 'Aorta klapani', 'Diastolik bosim'], t: 0 },
]
const AG: Savol[] = [
  { s: 'Arterial gipertenziya tashxisi uchun ofis AQB chegarasi?', v: ['≥ 140/90 mm sim. ust.', '≥ 120/80', '≥ 160/100', '≥ 180/110'], t: 0 },
  { s: 'Koʻpchilik bemorlarda boshlangʻich terapiya:', v: ['Ikki dorili qatʼiy kombinatsiya', 'Faqat parhez', 'Beta-bloker monoterapiyasi', 'Diuretik + beta-bloker majburiy'], t: 0 },
  { s: 'Gipertonik kriz (organ shikastlanishi bilan)da maqsad:', v: ['Birinchi soatda AQB ni ≤ 25% ga tushirish', 'Darhol normallashtirish', 'Davolamaslik', '7 kunda tushirish'], t: 0 },
  { s: 'Ikkilamchi AG sababi boʻlishi mumkin:', v: ['Birlamchi giperaldosteronizm', 'Gripp', 'Gastrit', 'Kariyes'], t: 0 },
  { s: 'Uy sharoitida AQB oʻlchash uchun gipertenziya chegarasi?', v: ['≥ 135/85', '≥ 150/95', '≥ 125/75', '≥ 145/95'], t: 0 },
]
const REAN: Savol[] = [
  { s: 'Kattalarda koʻkrak qafasi kompressiyasi chastotasi?', v: ['100–120 / daq', '60–80 / daq', '140–160 / daq', '30 / daq'], t: 0 },
  { s: 'Kompressiya chuqurligi (kattalar)?', v: ['5–6 sm', '2–3 sm', '8–10 sm', '1 sm'], t: 0 },
  { s: 'Kompressiya : nafas nisbati (bir yoki ikki qutqaruvchi, kattalar)?', v: ['30 : 2', '15 : 1', '5 : 1', '50 : 5'], t: 0 },
  { s: 'Shokka chidamli VF da adrenalin qachon beriladi?', v: ['3-shokdan keyin', 'Birinchi shokdan oldin', 'Hech qachon', 'Faqat ROSC dan keyin'], t: 0 },
  { s: 'Asistoliyada defibrillyatsiya:', v: ['Koʻrsatilmagan', 'Darhol 360 J', 'Har 30 s da', 'Faqat bolalarda'], t: 0 },
]
const UMUMIY: Savol[] = [
  { s: 'Qoʻl gigiyenasining JSST «5 lahzasi»dan biri:', v: ['Bemor bilan aloqadan oldin', 'Faqat smena oxirida', 'Faqat ovqatdan oldin', 'Faqat qoʻlqop kiygandan keyin'], t: 0 },
  { s: 'Xabardor rozilik olinishi shart:', v: ['Invaziv muolajadan oldin', 'Faqat operatsiyadan keyin', 'Hech qachon', 'Faqat bolalarda'], t: 0 },
  { s: 'Bemorni identifikatsiya qilish uchun kamida nechta belgi ishlatiladi?', v: ['2 ta (masalan, F.I.Sh. va tugʻilgan sana)', '1 ta — palata raqami', '0', 'Faqat tashxis'], t: 0 },
  { s: 'Dori xatosi aniqlansa, birinchi qadam:', v: ['Bemor xavfsizligini taʼminlash va xabar berish', 'Yashirish', 'Hujjatni oʻchirish', 'Kutish'], t: 0 },
  { s: 'Dalillarga asoslangan tibbiyotda eng yuqori dalil darajasi:', v: ['RNS larning tizimli sharhi va meta-tahlili', 'Ekspert fikri', 'Bitta holat tavsifi', 'Reklama'], t: 0 },
]

export function testSavollari(nomi: string): Savol[] {
  const n = nomi.toLowerCase()
  if (n.includes('ekg') || n.includes('ritm')) return EKG
  if (n.includes('koronar')) return OKS
  if (n.includes('exokg') || n.includes('ultratovush') || n.includes('ultrasound')) return EXO
  if (n.includes('gipertenziya')) return AG
  if (n.includes('reanimatsiya') || n.includes('bls') || n.includes('shoshilinch')) return REAN
  return UMUMIY
}
