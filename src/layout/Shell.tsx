import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Menu, Moon, Search, Sun, LogOut, RotateCcw, UserRound, ShieldQuestion, QrCode, CheckCheck, CornerDownLeft } from 'lucide-react'
import { useStore, useUser } from '@/domain/store'
import { NAV, KABINET_NOMI, ROL_YOL } from './nav'
import { ROL_NOMI } from '@/domain/malumotnoma'
import { Logo } from '@/ui/art'
import { Avatar, Confirm, Modal, cx } from '@/ui'
import { nisbiy } from '@/lib/format'
import { Toasts } from './Toasts'
import { MurojaatModal } from '@/shared/Murojaat'
import type { DB } from '@/domain/db'
import type { Foydalanuvchi } from '@/domain/types'

export function useTheme() {
  const [t, setT] = useState<string>(() => {
    try {
      return localStorage.getItem('ettp-theme') ?? 'light'
    } catch {
      return 'light'
    }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem('ettp-theme', t)
    } catch {
      /* */
    }
  }, [t])
  return [t, () => setT(t === 'dark' ? 'light' : 'dark')] as const
}

function badgeSoni(db: DB, u: Foydalanuvchi, k?: string): number {
  switch (k) {
    case 'arizalar':
      return db.yozilishlar.filter((y) => y.holat === 'yuborildi' && db.oqimlar.find((o) => o.id === y.oqimId)?.providerId === u.providerId).length
    case 'natijalar':
      return u.rol === 'provayder_rahbar' ? db.natijalar.filter((n) => n.holat === 'tasdiqlashda' && db.oqimlar.find((o) => o.id === db.yozilishlar.find((y) => y.id === n.yozilishId)?.oqimId)?.providerId === u.providerId).length : 0
    case 'akk':
      return db.akkArizalar.filter((a) => (u.rol === 'markaz_mutaxassis' ? ['toliqlik', 'ekspertiza', 'joyida'].includes(a.holat) : a.holat === 'komissiya')).length
    case 'jurnal':
      return u.rol === 'markaz_rahbar' ? db.tuzatishlar.filter((t) => t.holat === 'kutilmoqda').length + db.natijalar.filter((n) => n.holat === 'tekshiruvda').length : db.natijalar.filter((n) => n.holat === 'tekshiruvda').length
    case 'tanolish':
      return db.tanOlish.filter((t) => (u.rol === 'markaz_rahbar' ? t.holat === 'qaror' : ['yuborildi', 'tekshiruvda'].includes(t.holat))).length
    case 'murojaat':
      return db.murojaatlar.filter((m) => !['qaror', 'yopildi'].includes(m.holat)).length
    case 'signal':
      return db.signallar.filter((s) => s.holat === 'yangi').length
    case 'ekspert': {
      const e = db.ekspertlar.find((x) => x.personId === u.personId)
      return e ? db.akkArizalar.filter((a) => a.holat === 'ekspertiza' && a.ekspertlar.includes(e.id) && !a.varaqlar.some((v) => v.ekspertId === e.id)).length : 0
    }
    case 'rejalar':
      return db.rejalar.filter((r) => r.muassasaId === u.muassasaId && r.holat === 'yuborildi').length
    case 'logbook':
      return db.logbook.filter((l) => l.holat === 'kutilmoqda' && db.rezidentlar.find((r) => r.id === l.rezidentId)?.rahbarId === u.id).length
    default:
      return 0
  }
}

export default function Shell() {
  const user = useUser()!
  const db = useStore((s) => s.db)
  const chiqish = useStore((s) => s.chiqish)
  const tiklash = useStore((s) => s.tiklash)
  const oqildi = useStore((s) => s.oqildi)
  const toast = useStore((s) => s.toast)
  const nav = useNavigate()
  const loc = useLocation()
  const [theme, toggle] = useTheme()
  const [side, setSide] = useState(false)
  const [pop, setPop] = useState<'' | 'bell' | 'user'>('')
  const [cmd, setCmd] = useState(false)
  const [reset, setReset] = useState(false)
  const [murojaat, setMurojaat] = useState(false)
  const items = NAV[user.rol]
  const bildir = useMemo(() => db.bildirishnomalar.filter((n) => n.userId === user.id).slice(0, 40), [db.bildirishnomalar, user.id])
  const yangi = bildir.filter((n) => !n.oqilgan).length
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => setSide(false), [loc.pathname])
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmd(true)
      }
    }
    const c = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setPop('')
    }
    window.addEventListener('keydown', k)
    window.addEventListener('mousedown', c)
    return () => {
      window.removeEventListener('keydown', k)
      window.removeEventListener('mousedown', c)
    }
  }, [])

  let grp: string | undefined
  return (
    <div className="shell">
      <aside className={cx('side', side && 'open')} aria-label="Asosiy menyu">
        <div className="side-brand">
          <Logo size={42} />
          <div>
            <div className="t1">ETTP · UKR</div>
            <div className="t2">Elektron tibbiy taʼlim platformasi</div>
          </div>
        </div>
        <div className="side-cab">
          <div className="l">{KABINET_NOMI[user.rol]}</div>
          <div className="v">{ROL_NOMI[user.rol]}</div>
        </div>
        <nav>
          {items.map((it) => {
            const g = it.grp && it.grp !== grp ? it.grp : undefined
            if (it.grp) grp = it.grp
            const n = badgeSoni(db, user, it.badge)
            return (
              <div key={it.to}>
                {g && <div className="grp">{g}</div>}
                <NavLink to={it.to} end={it.end} className={({ isActive }) => cx('nav-a', isActive && 'on')}>
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="nav-pill" className="pill" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                      <it.icon />
                      <span>{it.l}</span>
                      {n > 0 && <span className="cnt">{n}</span>}
                    </>
                  )}
                </NavLink>
              </div>
            )
          })}
        </nav>
        <div className="side-foot">
          <button className="btn glassb sm block" onClick={() => setMurojaat(true)}>
            <ShieldQuestion /> Murojaat yuborish
          </button>
          <div className="mt-12">Demo maʼlumotlar · prototip v0.1</div>
        </div>
      </aside>
      <div className={cx('scrim', side && 'open')} onClick={() => setSide(false)} />
      <div className="main">
        <header className="top">
          <button className="icon-btn burger" onClick={() => setSide(true)} aria-label="Menyu">
            <Menu />
          </button>
          <div className="search" onClick={() => setCmd(true)}>
            <Search />
            <input readOnly placeholder="Boʻlim yoki amalni qidirish..." aria-label="Qidirish" />
            <kbd>Ctrl K</kbd>
          </div>
          <div style={{ flex: 1 }} />
          <button className="icon-btn" onClick={() => window.open(`${location.pathname}#/tekshirish`, '_blank')} title="QR-tekshiruv (ochiq sahifa)" aria-label="QR-tekshiruv">
            <QrCode />
          </button>
          <button className="icon-btn" onClick={toggle} title="Mavzu" aria-label="Yorugʻ/qorongʻi mavzu">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <div style={{ position: 'relative' }} ref={popRef}>
            <button className="icon-btn" onClick={() => setPop(pop === 'bell' ? '' : 'bell')} aria-label="Bildirishnomalar">
              <Bell />
              {yangi > 0 && <span className="dot">{yangi}</span>}
            </button>
            <AnimatePresence>
              {pop === 'bell' && (
                <motion.div className="pop" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  <div className="pop-h">
                    <b>Bildirishnomalar</b>
                    <button className="btn ghost xs" onClick={() => oqildi(bildir.map((n) => n.id))}>
                      <CheckCheck /> Hammasi oʻqildi
                    </button>
                  </div>
                  <div className="pop-l">
                    {bildir.length === 0 && <div className="empty small">Bildirishnoma yoʻq</div>}
                    {bildir.map((n) => (
                      <div
                        key={n.id}
                        className={cx('notif', !n.oqilgan && 'new')}
                        onClick={() => {
                          oqildi([n.id])
                          setPop('')
                          if (n.havola) nav(n.havola)
                        }}
                      >
                        <span className={cx('d', n.turi)} />
                        <div className="grow">
                          <div className="small">{n.matn}</div>
                          <div className="xs muted">{nisbiy(n.sana)} · {n.kanal.join(', ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {pop === 'user' && (
                <motion.div className="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div className="b">{user.fio}</div>
                    <div className="xs muted">{ROL_NOMI[user.rol]} · {user.lavozim}</div>
                  </div>
                  <div className="divider" style={{ margin: '4px 0' }} />
                  {user.rol === 'xodim' && (
                    <button onClick={() => { setPop(''); nav('/xodim/profil') }}>
                      <UserRound /> Profil va maʼlumot manbalari
                    </button>
                  )}
                  <button onClick={() => { setPop(''); setReset(true) }}>
                    <RotateCcw /> Demo maʼlumotlarni tiklash
                  </button>
                  <button
                    onClick={() => {
                      chiqish()
                      nav('/kirish')
                    }}
                  >
                    <LogOut /> Chiqish
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div style={{ position: 'relative' }}>
            <div className="user-chip" onClick={() => setPop(pop === 'user' ? '' : 'user')} role="button" tabIndex={0}>
              <Avatar name={user.fio} />
              <div className="txt">
                <div className="n">{user.fio.split(' ').slice(0, 2).join(' ')}</div>
                <div className="r">{ROL_NOMI[user.rol]}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="content">
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toasts />
      <div className="demo-ribbon">Prototip · sintetik demo maʼlumotlar · {ROL_NOMI[user.rol]}</div>
      <Komanda open={cmd} onClose={() => setCmd(false)} />
      <MurojaatModal open={murojaat} onClose={() => setMurojaat(false)} />
      <Confirm
        open={reset}
        onClose={() => setReset(false)}
        title="Demo maʼlumotlarni tiklash"
        okText="Tiklash"
        ton="danger"
        onOk={() => {
          tiklash()
          setReset(false)
          toast({ turi: 'ok', matn: 'Demo maʼlumotlar boshlangʻich holatga qaytarildi.' })
          nav(ROL_YOL[user.rol])
        }}
      >
        <p className="sub">Siz kiritgan barcha oʻzgarishlar (arizalar, natijalar, qarorlar) oʻchadi va baza boshlangʻich demo holatiga qaytadi. Bu faqat sizning brauzeringizga taʼsir qiladi.</p>
      </Confirm>
    </div>
  )
}

function Komanda({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useUser()!
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  useEffect(() => {
    if (open) {
      setQ('')
      setI(0)
    }
  }, [open])
  const items = [
    ...NAV[user.rol].map((n) => ({ l: n.l, s: KABINET_NOMI[user.rol], to: n.to, icon: n.icon })),
    { l: 'Sertifikatni QR orqali tekshirish', s: 'Ochiq sahifa', to: '/tekshirish', icon: QrCode },
    { l: 'Provayderlar reestri', s: 'Ochiq sahifa', to: '/reestr', icon: Search },
    { l: 'UKR statistikasi', s: 'Ochiq sahifa', to: '/statistika', icon: Search },
  ]
  const f = items.filter((x) => (x.l + ' ' + x.s).toLowerCase().includes(q.toLowerCase()))
  const go = (to: string) => {
    onClose()
    nav(to)
  }
  return (
    <Modal open={open} onClose={onClose} title="Tezkor oʻtish" sub="Boʻlim nomini yozing · ↑↓ tanlash · Enter oʻtish">
      <input
        className="inp"
        autoFocus
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setI(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setI(Math.min(f.length - 1, i + 1))
          if (e.key === 'ArrowUp') setI(Math.max(0, i - 1))
          if (e.key === 'Enter' && f[i]) go(f[i].to)
        }}
        placeholder="Masalan: kredit, katalog, akkreditatsiya..."
      />
      <div className="mt-12 col gap-4">
        {f.map((x, k) => (
          <button key={x.to} className={cx('btn', k === i ? 'soft' : 'ghost')} style={{ justifyContent: 'flex-start', height: 42 }} onMouseEnter={() => setI(k)} onClick={() => go(x.to)}>
            <x.icon />
            <span className="grow" style={{ textAlign: 'left' }}>{x.l}</span>
            <span className="xs muted">{x.s}</span>
            {k === i && <CornerDownLeft size={14} />}
          </button>
        ))}
      </div>
    </Modal>
  )
}
