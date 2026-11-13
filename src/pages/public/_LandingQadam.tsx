import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Award, BookOpenCheck, Building2, CheckCircle2, ClipboardCheck, Database, Globe2, GraduationCap, Landmark, LibraryBig, MonitorPlay, QrCode, ShieldCheck, Stethoscope, UserRoundCheck } from 'lucide-react'
import { IMG } from '@/ui/art'
import { Reveal, SecHead } from './_parts'

const QADAMLAR = [
  { icon: LibraryBig, t: 'Katalog', m: 'Faqat akkreditatsiyalangan provayderning tasdiqlangan dasturlari va ochiq oqimlari.' },
  { icon: GraduationCap, t: 'Yozilish', m: 'Mutaxassislik va malaka darajasi Reestrdan avtomatik tekshiriladi.' },
  { icon: MonitorPlay, t: 'Oʻqish va davomat', m: 'Onlayn pleyer, vebinar yoki auditoriya — davomat QR orqali qayd etiladi.' },
  { icon: ClipboardCheck, t: 'Baholash', m: 'Test quyi tizimi, OSKE va rubrikalar — natija oʻzgartirilmaydi.' },
  { icon: UserRoundCheck, t: 'Natija tasdiqlanadi', m: 'Provayder rahbari ERI bilan tasdiqlaydi, tizim avtomatik tekshiradi.' },
  { icon: Award, t: 'Kredit', m: 'Kredit xizmati jurnalga yozadi; bitta natija uchun ikki marta berilmaydi.' },
  { icon: QrCode, t: 'QR-sertifikat', m: '1 daqiqa ichida yagona raqamli elektron sertifikat yaratiladi.' },
  { icon: Database, t: 'Reestr', m: 'Yillik natija Reestrga va malaka toifasi jarayonlariga uzatiladi.' },
]

export function QandayIshlaydi() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 60%'] })
  const sx = useTransform(scrollYProgress, [0, 1], [0, 1])
  return (
    <section className="pb-sec" id="qanday">
      <div className="pb-wrap" ref={ref}>
        <SecHead kick="Qanday ishlaydi" center title={<>Kursdan sertifikatgacha — <span className="pb-grad">8 qadam</span>, bitta tizimda</>} sub="Har bir qadam avtomatik tekshiriladi va audit jurnaliga yoziladi. Xodim maʼlumotni qayta kiritmaydi." />
        <div className="ld-line"><motion.i style={{ scaleX: sx }} /></div>
        <div className="ld-steps">
          {QADAMLAR.map((q, i) => (
            <Reveal key={q.t} delay={(i % 4) * 0.08}>
              <div className="ld-step pb-lift">
                <span className="no">{String(i + 1).padStart(2, '0')}</span>
                <motion.div className="ic" whileHover={{ rotate: -8, scale: 1.08 }}><q.icon /></motion.div>
                <h3>{q.t}</h3>
                <p>{q.m}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const ROLLAR = [
  { icon: Stethoscope, t: 'Tibbiyot xodimi', img: 'portret', l: ['Kurs tanlash va bir bosishda yozilish', 'Kreditlar, sertifikatlar va yillik holat bitta kabinetda', 'Xorijiy kreditlarni tan oldirish', 'Yillik hisobot PDF + QR'] },
  { icon: BookOpenCheck, t: 'Provayder', img: 'onlayn', l: ['Dastur pasporti va akkreditatsiya arizasi', 'Oqimlar, davomat va baholash', 'Natijani ERI bilan tasdiqlash', 'LMS bilan API integratsiya'] },
  { icon: Building2, t: 'Ish beruvchi', img: 'muassasa', l: ['Xodimlarning UKR holati va xavf guruhi', 'Rivojlanish rejalarini tasdiqlash', 'Eslatma va kurs tavsiyasi yuborish', 'Excel/PDF hisobotlar'] },
  { icon: ShieldCheck, t: 'UKR markazi', img: 'lab2', l: ['Provayder va dasturlar reestri', 'Akkreditatsiya va ekspertiza', 'Kredit qoidalari versiyalari', 'Sifat nazorati signallari'] },
  { icon: Landmark, t: 'Vazirlik', img: 'stetoskop', l: ['Hududlar va mutaxassisliklar kesimida monitoring', 'Qamrov va talab bajarilishi', 'Provayderlar faoliyati', 'Audit va tayyor hisobotlar'] },
  { icon: Globe2, t: 'Jamoatchilik (ochiq)', img: 'mobil', l: ['Sertifikatni QR yoki raqam boʻyicha tekshirish', 'Provayderlar reestri va API', 'Kurslar katalogi', 'Umumlashtirilgan ochiq statistika'] },
]

export function Rollar() {
  return (
    <section className="pb-sec alt">
      <div className="pb-wrap">
        <SecHead kick="Kim uchun" title={<>Har bir ishtirokchi uchun <span className="pb-grad">oʻz kabineti</span></>} sub="Rolga asoslangan kirish: har kim faqat oʻz vakolati doirasidagi maʼlumotni koʻradi." />
        <div className="ld-roles">
          {ROLLAR.map((r, i) => (
            <Reveal key={r.t} delay={(i % 3) * 0.1}>
              <div className="pb-card ld-role pb-lift">
                <div className="ph">
                  <img src={IMG(r.img)} alt="" loading="lazy" />
                  <div className="badge2"><i><r.icon /></i> {r.t}</div>
                </div>
                <ul>
                  {r.l.map((x) => <li key={x}><CheckCircle2 /> {x}</li>)}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
