import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, BookOpen, Building2, Home, LayoutDashboard, LogIn, Mail, MapPin, Menu, Moon, Phone, QrCode, ShieldCheck, Sun, X, Info, ChevronRight } from 'lucide-react'
import { useUser } from '@/domain/store'
import { ROL_YOL } from '@/layout/nav'
import { EKG, Logo, Molekula } from '@/ui/art'
import { cx } from '@/ui'
import './public.css'
import './public2.css'
import './public3.css'

export const bugunISO = () => new Date().toISOString().slice(0, 10)
export const yangilanganMatn = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** «Karimov Anvar Baxtiyorovich» → «Karimov A. B.» (ochiq sahifalar uchun) */
export function qisqaFioMatn(fio: string) {
  const [f, i, o] = fio.trim().split(/\s+/)
  return [f, i ? i[0] + '.' : '', o ? o[0] + '.' : ''].filter(Boolean).join(' ')
}

/** Kichik guruhlarni yashirish (TZ: 10 kishidan kichik guruh «<10») */
export const yashir = (n: number, min: number) => (n < min ? `<${min}` : n.toLocaleString('ru-RU').replace(/,/g, '.'))

export const NAV_OCHIQ = [
  { to: '/', l: 'Bosh sahifa', icon: Home, end: true },
  { to: '/katalog', l: 'Kurslar katalogi', icon: BookOpen },
  { to: '/reestr', l: 'Provayderlar reestri', icon: Building2 },
  { to: '/tekshirish', l: 'Sertifikatni tekshirish', icon: QrCode },
  { to: '/statistika', l: 'Statistika', icon: BarChart3 },
]

export function useMavzu() {
  const [t, setT] = useState<string>(() => document.documentElement.dataset.theme ?? (() => { try { return localStorage.getItem('ettp-theme') ?? 'light' } catch { return 'light' } })())
  const almashtir = () => {
    const n = t === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = n
    try { localStorage.setItem('ettp-theme', n) } catch { /* */ }
    setT(n)
  }
  return [t, almashtir] as const
}

function Header() {
  const u = useUser()
  const loc = useLocation()
  const [mavzu, almashtir] = useMavzu()
  const [qattiq, setQattiq] = useState(false)
  const [ochiq, setOchiq] = useState(false)
  useEffect(() => {
    const f = () => setQattiq(window.scrollY > 24)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => setOchiq(false), [loc.pathname])
  const isOn = (to: string, end?: boolean) => (end ? loc.pathname === to : loc.pathname.startsWith(to))
  return (
    <>
      <header className={cx('pb-top', (qattiq || ochiq) && 'qattiq')}>
        <div className="pb-wrap">
          <Link to="/" className="pb-brand" aria-label="ETTP bosh sahifa">
            <Logo size={38} />
            <div>
              <div className="t1">ETTP</div>
              <div className="t2">Uzluksiz kasbiy rivojlanish</div>
            </div>
          </Link>
          <nav className="pb-nav" aria-label="Asosiy menyu">
            {NAV_OCHIQ.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={cx(isOn(n.to, n.end) && 'on')}>
                {n.l}
                {isOn(n.to, n.end) && <motion.span layoutId="pb-nav-ul" className="ul" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
              </NavLink>
            ))}
          </nav>
          <div className="pb-act">
            <button className="pb-ib" onClick={almashtir} aria-label={mavzu === 'dark' ? 'Yorugʻ mavzu' : 'Qorongʻi mavzu'} title={mavzu === 'dark' ? 'Yorugʻ mavzu' : 'Qorongʻi mavzu'}>
              {mavzu === 'dark' ? <Sun /> : <Moon />}
            </button>
            {u ? (
              <Link to={ROL_YOL[u.rol]} className={cx('btn pb-kir', qattiq || ochiq ? 'primary' : 'white')}>
                <LayoutDashboard /> <span>Kabinetga oʻtish</span>
              </Link>
            ) : (
              <Link to="/kirish" className={cx('btn pb-kir', qattiq || ochiq ? 'primary' : 'white')}>
                <LogIn /> <span>Tizimga kirish</span>
              </Link>
            )}
            <button className="pb-ib pb-burger" onClick={() => setOchiq(!ochiq)} aria-label="Menyu" aria-expanded={ochiq}>
              {ochiq ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {ochiq && (
          <motion.nav className="pb-mob" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} aria-label="Mobil menyu">
            {NAV_OCHIQ.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={cx(isOn(n.to, n.end) && 'on')}>
                <n.icon /> {n.l}
              </NavLink>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}

function Footer() {
  return (
    <footer className="pb-foot">
      <div className="pb-wrap">
        <div className="pb-foot-g">
          <div>
            <div className="pb-brand" style={{ color: '#fff' }}>
              <Logo size={40} />
              <div>
                <div className="t1">ETTP</div>
                <div className="t2">Elektron tibbiy taʼlim platformasi</div>
              </div>
            </div>
            <p className="mt-16" style={{ fontSize: 13.5, lineHeight: 1.65, maxWidth: 340 }}>
              «Uzluksiz kasbiy rivojlanish (UKR)» quyi tizimi — tibbiyot va farmatsevtika xodimlarining kasbiy rivojlanishi bitta elektron muhitda.
            </p>
          </div>
          <div>
            <h4>Ochiq xizmatlar</h4>
            {NAV_OCHIQ.slice(1).map((n) => <Link key={n.to} to={n.to}>{n.l}</Link>)}
          </div>
          <div>
            <h4>Foydalanuvchilar</h4>
            <Link to="/kirish">Tizimga kirish</Link>
            <Link to="/katalog">Kurs tanlash</Link>
            <Link to="/reestr">API: ochiq reestr</Link>
            <Link to="/statistika">Ochiq maʼlumotlar</Link>
          </div>
          <div>
            <h4>Oʻzbekiston Respublikasi Sogʻliqni saqlash vazirligi</h4>
            <div className="li2"><MapPin /> Toshkent sh., Navoiy koʻchasi, 4-uy</div>
            <div className="li2"><Phone /> Ishonch telefoni: 1003 (namuna)</div>
            <div className="li2"><Mail /> ukr@example.uz (namuna)</div>
          </div>
        </div>
        <div className="pb-foot-b">
          <span>© 2026 ETTP · UKR quyi tizimi. Operator: UZINFOCOM (namuna)</span>
          <span className="pb-demo"><Info size={14} /> Prototip — sintetik maʼlumotlar</span>
        </div>
      </div>
    </footer>
  )
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const loc = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [loc.pathname])
  return (
    <div className="pb">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

/** Ichki sahifa bandi: gradient, molekula, EKG, manba */
export function PageBand({ crumb, icon, title, lead, source, children }: { crumb: string; icon: ReactNode; title: ReactNode; lead?: ReactNode; source?: string; children?: ReactNode }) {
  return (
    <section className="pb-band">
      <div className="dots" />
      <div className="blob a" />
      <div className="blob b" />
      <Molekula className="mol" opacity={0.12} />
      <EKG className="pb-ekg" />
      <div className="pb-wrap">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="crumb"><i>{icon}</i> <Link to="/" style={{ color: 'inherit' }}>Bosh sahifa</Link> <ChevronRight size={13} /> {crumb}</div>
          <h1>{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {source && <div className="src"><span className="live" /> {source}</div>}
          {children}
        </motion.div>
      </div>
    </section>
  )
}

export function Reveal({ children, className, delay = 0, y = 24 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

export function SecHead({ kick, title, sub, center }: { kick: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <Reveal className={cx('pb-sh', center && 'c')}>
      <div className="pb-kick">{kick}</div>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </Reveal>
  )
}

/** Har bir koʻrsatkich ostida: qanday hisoblangan, manba, yangilangan */
export function Hisob({ qanday, manba, holatlar }: { qanday: string; manba: string; holatlar?: string }) {
  return (
    <details className="pb-calc">
      <summary><ShieldCheck size={13} /> Qanday hisoblangan</summary>
      <dl>
        <dt>Formula</dt><dd>{qanday}</dd>
        <dt>Manba</dt><dd>{manba}</dd>
        {holatlar && (<><dt>Kiritilgan</dt><dd>{holatlar}</dd></>)}
        <dt>Yangilangan</dt><dd>{yangilanganMatn()}</dd>
      </dl>
    </details>
  )
}
