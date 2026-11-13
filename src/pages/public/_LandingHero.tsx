import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { Award, BadgeCheck, BookOpen, Building2, GraduationCap, HeartPulse, QrCode, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useStore } from '@/domain/store'
import * as A from '@/domain/amallar'
import { EKG, IMG, Molekula } from '@/ui/art'
import { Raqam } from '@/ui'

const ease = [0.22, 1, 0.36, 1] as const

function Suzuvchi({ className, delay, dy = 12, children }: { className: string; delay: number; dy?: number; children: React.ReactNode }) {
  const kam = useReducedMotion()
  return (
    <motion.div
      className={'ld-gl ' + className}
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: kam ? 0 : [0, -dy, 0] }}
      transition={{ opacity: { delay, duration: 0.6 }, scale: { delay, duration: 0.6, ease }, y: kam ? { delay, duration: 0.6 } : { delay: delay + 0.6, duration: 5 + delay, repeat: Infinity, ease: 'easeInOut' } }}
    >
      {children}
    </motion.div>
  )
}

export function LandingHero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yRasm = useTransform(scrollYProgress, [0, 1], [0, 90])
  const yMatn = useTransform(scrollYProgress, [0, 1], [0, 40])
  const yBlob = useTransform(scrollYProgress, [0, 1], [0, -120])
  const xira = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])

  return (
    <section className="ld-hero" ref={ref}>
      <div className="dots" />
      <motion.div className="ld-blob a" style={{ y: yBlob }} />
      <motion.div className="ld-blob b" style={{ y: yBlob }} />
      <div className="ld-blob c" />
      <Molekula className="mol" opacity={0.13} />
      <EKG className="ekg pb-ekg" height={70} />
      <div className="pb-wrap">
        <div className="ld-hero-g">
          <motion.div style={{ y: yMatn, opacity: xira }}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
              <span className="ld-pill"><b>YANGI</b> ETTP · UKR quyi tizimi</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease }}>
              Tibbiyot xodimlarining <span className="hl">uzluksiz kasbiy rivojlanishi</span> — bitta elektron muhitda
            </motion.h1>
            <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18, ease }}>
              Akkreditatsiyalangan kurslar katalogi, onlayn va oflayn oʻqish, avtomatik kredit hisobi, QR-kodli elektron sertifikat va provayderlarning milliy reestri — qogʻozsiz va shaffof.
            </motion.p>
            <motion.div className="ld-cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.28, ease }}>
              <Link to="/katalog" className="btn white lg"><GraduationCap /> Kurs tanlash</Link>
              <Link to="/tekshirish" className="btn glassb lg"><QrCode /> Sertifikatni tekshirish</Link>
            </motion.div>
            <motion.div className="ld-trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.45 }}>
              <span><ShieldCheck /> Faqat akkreditatsiyalangan dasturlar</span>
              <span><BadgeCheck /> OneID / MyID orqali kirish</span>
              <span><Sparkles /> Kredit avtomatik hisoblanadi</span>
            </motion.div>
          </motion.div>

          <motion.div className="ld-photo" style={{ y: yRasm }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.15, ease }}>
            <div className="ld-ring" />
            <div className="ld-frame">
              <img src={IMG('hero')} alt="Shifokorlar tibbiy tasvirni muhokama qilmoqda" />
            </div>
            <Suzuvchi className="g1" delay={0.6}>
              <span className="ic tl"><HeartPulse /></span>
              <div><div className="k">Yillik talab</div><div className="v">50 kredit</div></div>
            </Suzuvchi>
            <Suzuvchi className="g2" delay={0.85} dy={16}>
              <span className="ic ok"><QrCode /></span>
              <div><div className="k">QR-sertifikat</div><div className="v">Haqiqiy ✓</div></div>
            </Suzuvchi>
            <Suzuvchi className="g3" delay={1.1} dy={10}>
              <span className="ic"><Award /></span>
              <div><div className="k">+12 kredit</div><div className="v">Oʻtkir koronar sindrom</div></div>
            </Suzuvchi>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export function LandingStat() {
  const db = useStore((s) => s.db)
  const s = useMemo(() => {
    const bugun = new Date().toISOString().slice(0, 10)
    const faol = new Set(db.mehnat.filter((m) => !m.gacha || m.gacha >= bugun).map((m) => m.personId))
    return [
      { icon: <Users />, n: faol.size, l: 'tibbiyot xodimi UKR hisobida' },
      { icon: <Building2 />, n: db.provayderlar.filter((p) => A.akkFaolmi(p)).length, l: 'akkreditatsiyalangan provayder' },
      { icon: <BookOpen />, n: db.versiyalar.filter((v) => v.holat === 'tasdiqlangan').length, l: 'tasdiqlangan oʻquv dasturi' },
      { icon: <Award />, n: db.sertifikatlar.filter((x) => x.holat !== 'tayyorlanmoqda').length, l: 'QR-kodli elektron sertifikat' },
    ]
  }, [db])
  return (
    <section className="ld-stats">
      <div className="pb-wrap">
        <motion.div className="ld-stats-g" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease }}>
          {s.map((x) => (
            <div className="ld-stat" key={x.l}>
              <div className="ic">{x.icon}</div>
              <div className="n"><Raqam n={x.n} /></div>
              <div className="l">{x.l}</div>
            </div>
          ))}
        </motion.div>
        <div className="pb-note mt-12" style={{ justifyContent: 'center' }}>
          <span className="pb-demo" style={{ color: 'var(--warn)', background: 'var(--warn-soft)', borderColor: 'var(--warn-border)' }}>Jonli hisob: prototip bazasidan · sintetik maʼlumotlar</span>
        </div>
      </div>
    </section>
  )
}
