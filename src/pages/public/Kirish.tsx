import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Award, BarChart3, BookOpenCheck, Building2, ChevronDown, ClipboardCheck, Eye, EyeOff, Fingerprint, GraduationCap, HeartPulse, KeyRound, Landmark, LogIn, QrCode, Scale, Settings, ShieldCheck, Stethoscope, UserCog, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '@/domain/store'
import { DEMO_HISOBLAR } from '@/domain/seed'
import { QoidaXatosi } from '@/domain/amallar'
import { ROL_YOL } from '@/layout/nav'
import { EKG, IMG, Logo } from '@/ui/art'
import { Button, Check, Field, Inp, cx } from '@/ui'
import './public.css'
import './public3.css'

const IKON: Record<string, LucideIcon> = {
  anvar: Stethoscope, dilnoza: HeartPulse, operator: ClipboardCheck, rahbar: BookOpenCheck, muassasa: Building2, mutaxassis: ShieldCheck,
  qaror: Scale, ekspert: Award, klinik: Users, rezident: GraduationCap, vazirlik: Landmark, admin: Settings,
}
const KUCHAYTIRILGAN = ['rahbar', 'mutaxassis', 'qaror', 'ekspert', 'admin']

export default function PublicKirish() {
  const nav = useNavigate()
  const loc = useLocation()
  const kirish = useStore((s) => s.kirish)
  const toast = useStore((s) => s.toast)
  const [login, setLogin] = useState('')
  const [parol, setParol] = useState('')
  const [korin, setKorin] = useState(false)
  const [eslab, setEslab] = useState(true)
  const [xato, setXato] = useState('')
  const [silk, setSilk] = useState(0)
  const [busy, setBusy] = useState(false)
  const [demo, setDemo] = useState(true)

  const bajar = async (l: string, p: string) => {
    setXato('')
    if (!l.trim() || !p) {
      setXato('Login va parolni kiriting.')
      setSilk((x) => x + 1)
      return
    }
    setBusy(true)
    await new Promise((r) => setTimeout(r, 380))
    try {
      const u = kirish(l, p)
      if (!eslab) {
        try { localStorage.removeItem('ettp-ukr-sessiya') } catch { /* */ }
      }
      toast({ turi: 'ok', matn: `Xush kelibsiz, ${u.fio}!` })
      const qayt = (loc.state as { qayt?: string } | null)?.qayt
      nav(qayt && qayt !== '/kirish' ? qayt : ROL_YOL[u.rol], { replace: true })
    } catch (e) {
      setXato(e instanceof QoidaXatosi ? e.message + ' Pastdagi demo hisoblardan birini tanlashingiz mumkin.' : 'Kutilmagan xato. Sahifani yangilab, qayta urinib koʻring.')
      setSilk((x) => x + 1)
      setBusy(false)
    }
  }
  const yubor = (e: FormEvent) => {
    e.preventDefault()
    bajar(login, parol)
  }

  return (
    <div className="kr">
      <aside className="kr-l">
        <img src={IMG('jamoa')} alt="" />
        <EKG className="ekg pb-ekg" height={70} />
        <div className="row between">
          <Link to="/" className="pb-brand" style={{ color: '#fff' }}>
            <Logo size={42} />
            <div><div className="t1">ETTP</div><div className="t2">Elektron tibbiy taʼlim platformasi</div></div>
          </Link>
          <Link to="/" className="btn glassb sm"><ArrowLeft /> Bosh sahifa</Link>
        </div>
        <motion.div style={{ marginTop: 'auto', marginBottom: 'auto', paddingTop: 40 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="pb-kick" style={{ color: '#7ff0e6' }}>UKR quyi tizimi</div>
          <h1>Uzluksiz kasbiy rivojlanish — bitta kabinetda</h1>
          <div className="ben">
            {[
              { i: <GraduationCap />, t: 'Akkreditatsiyalangan kurslarga bir bosishda yozilish' },
              { i: <Award />, t: 'Kreditlar avtomatik hisoblanadi, yillik holat real vaqtda' },
              { i: <QrCode />, t: 'QR-kodli elektron sertifikat va yillik hisobot PDF' },
            ].map((b, k) => (
              <motion.div key={b.t} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + k * 0.12, duration: 0.5 }}>
                <i>{b.i}</i> <span>{b.t}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <div className="xs hide-m" style={{ color: 'rgba(255,255,255,.7)' }}>Oʻzbekiston Respublikasi Sogʻliqni saqlash vazirligi · Prototip — sintetik maʼlumotlar</div>
      </aside>

      <section className="kr-r">
        <motion.div key={silk} className={cx('kr-card', silk > 0 && 'shake')} initial={silk ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <h2>Tizimga kirish</h2>
          <p className="sub mt-4 small">Shaxsiy kabinetingizga kiring</p>
          <form className="col gap-16 mt-20" onSubmit={yubor} noValidate>
            <Field label="Login">
              <Inp value={login} onChange={(e) => setLogin(e.target.value)} placeholder="masalan, anvar" autoComplete="username" bad={!!xato} />
            </Field>
            <Field label="Parol">
              <div className="kr-pw">
                <Inp type={korin ? 'text' : 'password'} value={parol} onChange={(e) => setParol(e.target.value)} placeholder="••••••••" autoComplete="current-password" bad={!!xato} />
                <button type="button" onClick={() => setKorin(!korin)} aria-label={korin ? 'Parolni yashirish' : 'Parolni koʻrsatish'}>{korin ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </div>
            </Field>
            <AnimatePresence>
              {xato && (
                <motion.div className="kr-err" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <AlertCircle /> <span>{xato}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="row between wrap">
              <Check label="Eslab qolish" checked={eslab} onChange={(e) => setEslab(e.target.checked)} />
              <span className="xs muted">Parolni tiklash — OneID orqali</span>
            </div>
            <Button v="primary" size="lg" block loading={busy} type="submit" icon={<LogIn />}>Kirish</Button>
          </form>
          <div className="kr-or">yoki</div>
          <div className="col gap-6">
            <Button block disabled icon={<Fingerprint />} title="Prototipda mavjud emas">OneID orqali kirish</Button>
            <Button block disabled icon={<KeyRound />} title="Prototipda mavjud emas">ERI kaliti bilan</Button>
          </div>
          <p className="xs muted mt-12" style={{ lineHeight: 1.5 }}>
            Ishlab chiqarishda — OneID/MyID; prototipda login-parol. UKR markazi xodimlari, provayder rahbari va ekspertlar ishlab chiqarishda kuchaytirilgan autentifikatsiyadan (ERI/MyID) foydalanadi.
          </p>
        </motion.div>

        <div className="kr-demo">
          <button className="kr-demo-h" onClick={() => setDemo(!demo)} aria-expanded={demo}>
            <span className="row gap-6"><UserCog size={18} color="var(--primary)" /> Demo hisoblar ({DEMO_HISOBLAR.length})</span>
            <motion.span animate={{ rotate: demo ? 180 : 0 }} style={{ display: 'grid' }}><ChevronDown size={18} /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {demo && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} style={{ overflow: 'hidden' }}>
                <div className="kr-demo-g">
                  {DEMO_HISOBLAR.map((d, i) => {
                    const Ic = IKON[d.login] ?? BarChart3
                    return (
                      <motion.button key={d.login} className="kr-acc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => { setLogin(d.login); setParol(d.parol); bajar(d.login, d.parol) }} disabled={busy} title={`${d.login} / ${d.parol}`}>
                        <span className="ic"><Ic /></span>
                        <span className="grow">
                          <span className="r" style={{ display: 'block' }}>{d.rol}</span>
                          <span className="lg" style={{ display: 'block' }}>{d.login} · {d.parol}</span>
                          <span className="iz" style={{ display: 'block' }}>{d.izoh}{KUCHAYTIRILGAN.includes(d.login) ? ' · ishlab chiqarishda ERI/MyID' : ''}</span>
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
