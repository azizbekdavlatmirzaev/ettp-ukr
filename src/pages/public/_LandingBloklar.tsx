import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookLock, FileSignature, History, Lock, Plus, QrCode, GraduationCap } from 'lucide-react'
import { useStore } from '@/domain/store'
import { Reveal, SecHead, bugunISO } from './_parts'
import { KursKarta, katalogQatorlar } from './_KursKarta'

export function TanlanganKurslar() {
  const db = useStore((s) => s.db)
  const nav = useNavigate()
  const kurslar = useMemo(() => {
    const q = katalogQatorlar(db, bugunISO())
    // turli provayderlardan 6 ta
    const tanlov: typeof q = []
    for (const x of q) if (tanlov.length < 6 && !tanlov.some((t) => t.p.id === x.p.id)) tanlov.push(x)
    for (const x of q) if (tanlov.length < 6 && !tanlov.includes(x)) tanlov.push(x)
    return tanlov
  }, [db])
  return (
    <section className="pb-sec">
      <div className="pb-wrap">
        <div className="row between wrap" style={{ alignItems: 'flex-end', gap: 20 }}>
          <SecHead kick="Ochiq kurslar" title={<>Qabul ochiq <span className="pb-grad">akkreditatsiyalangan</span> kurslar</>} sub="Kredit miqdori akkreditatsiyada tasdiqlangan va provayder tomonidan oʻzgartirilmaydi." />
          <Link to="/katalog" className="btn secondary lg" style={{ marginBottom: 40 }}>Butun katalog <ArrowRight /></Link>
        </div>
        <div className="ld-courses">
          {kurslar.map((q, i) => <KursKarta key={q.o.id} q={q} i={i} onClick={() => nav('/katalog', { state: { ochiq: q.o.id } })} />)}
        </div>
      </div>
    </section>
  )
}

const ISHONCH = [
  { icon: QrCode, t: 'QR-tekshiruv', m: 'Har bir sertifikat yagona QR yozuvga olib boradi; bekor qilingani «bekor qilingan» deb koʻrinadi.' },
  { icon: FileSignature, t: 'ERI va vaqt belgisi', m: 'Natijalar, qarorlar va tuzatishlar elektron raqamli imzo bilan tasdiqlanadi.' },
  { icon: History, t: 'Toʻliq audit', m: 'Har bir amal: kim, qachon, nima — oʻzgartirib boʻlmaydigan jurnalda.' },
  { icon: BookLock, t: 'Kredit jurnali oʻchirilmaydi', m: 'Xato faqat bekor qiluvchi yozuv bilan tuzatiladi, tarix saqlanadi.' },
  { icon: Lock, t: 'Shaxsiy maʼlumot himoyasi', m: 'Ochiq sahifalarda JSHSHIR koʻrsatilmaydi, F.I.Sh. qisqartiriladi.' },
]

export function Ishonch() {
  return (
    <section className="pb-sec alt">
      <div className="pb-wrap">
        <SecHead kick="Ishonch va xavfsizlik" center title={<>Har bir kredit — <span className="pb-grad">tekshiriladigan</span> va izi bor</>} />
        <div className="ld-trustg">
          {ISHONCH.map((x, i) => (
            <Reveal key={x.t} delay={i * 0.07}>
              <div className="ld-tr pb-lift">
                <div className="ic"><x.icon /></div>
                <h3>{x.t}</h3>
                <p>{x.m}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function YillikTalab() {
  return (
    <section className="pb-sec">
      <div className="pb-wrap">
        <Reveal>
          <div className="ld-talab">
            <div className="hero-pattern" />
            <div style={{ position: 'relative' }}>
              <div className="pb-kick" style={{ color: '#7ff0e6' }}>Yillik talab</div>
              <h2>2027-yil 1-iyuldan PQ-319 boʻyicha yillik kredit talabi</h2>
              <p>Talab maʼlumot darajasiga bogʻliq. Majburiy va amaliy kreditlar ulushi, mustaqil taʼlim va konferensiya limitlari — kredit qoidasining parametrlari: ular UKR markazi tomonidan dasturchisiz, versiyalar bilan oʻzgartiriladi.</p>
              <div className="ul2">
                <span>Majburiy ulush — parametr</span>
                <span>Amaliy ulush — parametr</span>
                <span>Yangi xodimga proporsional</span>
                <span>Dekret/kasallikda kamaytiriladi</span>
                <span>Ortiqchasi keyingi yilga qisman oʻtadi</span>
              </div>
            </div>
            <div className="pq">
              <motion.div className="pqc" whileHover={{ y: -6 }}>
                <div className="n">50</div>
                <div className="k">kredit / yil<br />oliy maʼlumotli xodim</div>
              </motion.div>
              <motion.div className="pqc" whileHover={{ y: -6 }}>
                <div className="n">28</div>
                <div className="k">kredit / yil<br />oʻrta maʼlumotli xodim</div>
              </motion.div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const FAQ = [
  { q: 'Kursga qanday yozilaman?', a: 'Katalogdan kursni tanlang va «Yozilish» tugmasini bosing. Tizim OneID/MyID orqali kirganingizdan soʻng mutaxassislik va malaka darajangizni Reestrdan tekshiradi — hech qanday hujjat yuklash shart emas.' },
  { q: 'Kredit qachon hisobimga tushadi?', a: 'Provayder natijani tasdiqlagach, avtomatik tekshiruvdan oʻtgan natija uchun kredit darhol jurnalga yoziladi va 1 daqiqa ichida QR-sertifikat yaratiladi.' },
  { q: 'Akkreditatsiyasiz kurs uchun kredit beriladimi?', a: 'Yoʻq. Kredit faqat oʻqish sanasida faol akkreditatsiyaga ega provayderning tasdiqlangan dastur versiyasi uchun beriladi.' },
  { q: 'Xorijda olgan sertifikatimni qanday tan oldiraman?', a: 'Kabinetdagi «Arizalarim» boʻlimidan tan olish arizasini yuboring. UKR markazi sertifikatni QR, xorijiy reestr yoki rasmiy soʻrov orqali tekshiradi va milliy kreditga aylantiradi.' },
  { q: 'Ish beruvchi sertifikatni qanday tekshiradi?', a: '«Sertifikatni tekshirish» sahifasida QR-kodni skanerlash yoki seriya-raqamni kiritish kifoya. Tashkilotlar uchun raqam boʻyicha tekshirish API ham mavjud.' },
  { q: 'Mening shaxsiy maʼlumotlarim ochiq sahifalarda koʻrinadimi?', a: 'Yoʻq. Ochiq sahifalarda JSHSHIR, pasport va tibbiy maʼlumot koʻrsatilmaydi, F.I.Sh. qisqartiriladi (masalan, «Karimov A. B.»), statistikada 10 kishidan kichik guruhlar yashiriladi.' },
]

export function Faq() {
  const [ochiq, setOchiq] = useState<number>(0)
  return (
    <section className="pb-sec alt">
      <div className="pb-wrap">
        <SecHead kick="Savol-javob" center title="Koʻp beriladigan savollar" />
        <div className="ld-faq">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className={'ld-q' + (ochiq === i ? ' on' : '')}>
                <button onClick={() => setOchiq(ochiq === i ? -1 : i)} aria-expanded={ochiq === i}>
                  {f.q}
                  <span className="pm"><Plus size={16} /></span>
                </button>
                <AnimatePresence initial={false}>
                  {ochiq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
                      <div className="a">{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export function YakuniyCta() {
  return (
    <section className="pb-sec" style={{ paddingTop: 72 }}>
      <div className="pb-wrap">
        <Reveal>
          <div className="ld-final">
            <h2>Kasbiy rivojlanishingizni bugun rejalashtiring</h2>
            <p>Yil oxirigacha talabni bajarish uchun mos kurslarni toping — kredit va sertifikat avtomatik.</p>
            <div className="row wrap mt-24" style={{ justifyContent: 'center' }}>
              <Link to="/katalog" className="btn primary lg"><GraduationCap /> Kurs tanlash</Link>
              <Link to="/kirish" className="btn secondary lg">Tizimga kirish</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
