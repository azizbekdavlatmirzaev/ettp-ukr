import { useEffect, useId, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AnimatePresence, motion, animate, useInView } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle, Upload, FileCheck2, Inbox, ChevronRight } from 'lucide-react'
import { holat as holatMatn, type Ton } from '@/lib/holat'
import { hajm } from '@/lib/format'
import { fauxHash } from '@/domain/amallar'
import type { Fayl } from '@/domain/types'
import { Link } from 'react-router-dom'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

// ───────────── Button ─────────────
type BtnV = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger' | 'success' | 'accent' | 'white' | 'glassb'
export function Button({ v = 'secondary', size, icon, loading, block, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { v?: BtnV; size?: 'xs' | 'sm' | 'lg'; icon?: ReactNode; loading?: boolean; block?: boolean }) {
  return (
    <button className={cx('btn', v, size, block && 'block', className)} disabled={loading || p.disabled} {...p}>
      {loading ? <span className="spin" /> : icon}
      {children}
    </button>
  )
}

// ───────────── Status ─────────────
export function Holat({ h, ton, children, nodot }: { h?: string; ton?: Ton; children?: ReactNode; nodot?: boolean }) {
  const [m, t] = h ? holatMatn(h) : ['', 'muted' as Ton]
  return <span className={cx('badge', ton ?? t, nodot && 'nodot')}>{children ?? m}</span>
}
export function Badge({ ton = 'muted', children, nodot = true }: { ton?: Ton; children: ReactNode; nodot?: boolean }) {
  return <span className={cx('badge', ton, nodot && 'nodot')}>{children}</span>
}

// ───────────── Card ─────────────
export function Card({ children, className, hover, flush, delay = 0, onClick }: { children: ReactNode; className?: string; hover?: boolean; flush?: boolean; delay?: number; onClick?: () => void }) {
  return (
    <motion.div className={cx('card', hover && 'hover', flush && 'flush', className)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {children}
    </motion.div>
  )
}
export function CardH({ icon, title, sub, right }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="card-h">
      <div className="t">
        {icon && <div className="ic">{icon}</div>}
        <div>
          <h3>{title}</h3>
          {sub && <div className="s">{sub}</div>}
        </div>
      </div>
      {right && <div className="row wrap">{right}</div>}
    </div>
  )
}

// ───────────── Count-up number ─────────────
export function Raqam({ n, kasr = 0, suffix }: { n: number; kasr?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, n, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(x) })
    return () => c.stop()
  }, [n, inView])
  return (
    <span ref={ref} className="num">
      {v.toLocaleString('ru-RU', { minimumFractionDigits: kasr, maximumFractionDigits: kasr }).replace(/,/g, '.')}
      {suffix}
    </span>
  )
}

export function KPI({ icon, label, value, suffix, hint, ton, delay = 0, onClick, kasr }: { icon: ReactNode; label: string; value: number | string; suffix?: string; hint?: ReactNode; ton?: 'ok' | 'warn' | 'err' | 'teal'; delay?: number; onClick?: () => void; kasr?: number }) {
  return (
    <Card className={cx('kpi', ton)} hover delay={delay} onClick={onClick}>
      <div className="lbl">
        <span className="ic">{icon}</span>
        {label}
      </div>
      <div className="val">
        {typeof value === 'number' ? <Raqam n={value} kasr={kasr} /> : value}
        {suffix && <small>{suffix}</small>}
      </div>
      {hint && <div className="hint">{hint}</div>}
    </Card>
  )
}

// ───────────── Progress ─────────────
export function Bar({ v, max = 100, ton, thin }: { v: number; max?: number; ton?: 'ok' | 'warn' | 'err'; thin?: boolean }) {
  const p = Math.max(0, Math.min(100, max ? (v / max) * 100 : 0))
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = requestAnimationFrame(() => setW(p))
    return () => cancelAnimationFrame(t)
  }, [p])
  return (
    <div className={cx('bar', ton, thin && 'thin')} role="progressbar" aria-valuenow={Math.round(p)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${w}%` }} />
    </div>
  )
}

export function Ring({ v, max, size = 140, stroke = 12, children, color = 'url(#ringGrad)', track = 'var(--surface-3)', light }: { v: number; max: number; size?: number; stroke?: number; children?: ReactNode; color?: string; track?: string; light?: boolean }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, max ? v / max : 0))
  const [off, setOff] = useState(c)
  const gid = useId().replace(/:/g, '')
  useEffect(() => {
    const t = setTimeout(() => setOff(c * (1 - p)), 60)
    return () => clearTimeout(t)
  }, [p, c])
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={light ? '#ffffff' : '#1170a8'} />
            <stop offset="100%" stopColor={light ? '#7ff0e6' : '#0fa3a3'} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={light ? 'rgba(255,255,255,.18)' : track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color === 'url(#ringGrad)' ? `url(#${gid})` : color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="c">{children}</div>
    </div>
  )
}

// ───────────── Page header ─────────────
export function PageHeader({ title, desc, crumbs, source, actions }: { title: ReactNode; desc?: ReactNode; crumbs?: { l: string; to?: string }[]; source?: string; actions?: ReactNode }) {
  return (
    <motion.div className="page-head" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <div style={{ minWidth: 0 }}>
        {crumbs && (
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={i} className="row gap-6">
                {i > 0 && <ChevronRight size={13} />}
                {c.to ? <Link to={c.to}>{c.l}</Link> : <span>{c.l}</span>}
              </span>
            ))}
          </div>
        )}
        <h1>{title}</h1>
        {desc && <p className="desc">{desc}</p>}
        {source && (
          <div className="source">
            <span className="live" />
            {source}
          </div>
        )}
      </div>
      {actions && <div className="row wrap">{actions}</div>}
    </motion.div>
  )
}

// ───────────── Tabs ─────────────
export function Tabs<T extends string>({ tabs, value, onChange, id = 'tabs' }: { tabs: { v: T; l: ReactNode; n?: number; icon?: ReactNode }[]; value: T; onChange: (v: T) => void; id?: string }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.v} role="tab" aria-selected={value === t.v} className={cx('tab', value === t.v && 'on')} onClick={() => onChange(t.v)}>
          {t.icon}
          {t.l}
          {t.n !== undefined && <span className="n">{t.n}</span>}
          {value === t.v && <motion.span layoutId={id + '-ul'} className="ul" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
        </button>
      ))}
    </div>
  )
}
export function Seg<T extends string>({ items, value, onChange, id = 'seg' }: { items: { v: T; l: ReactNode }[]; value: T; onChange: (v: T) => void; id?: string }) {
  return (
    <div className="seg">
      {items.map((t) => (
        <button key={t.v} className={cx(value === t.v && 'on')} onClick={() => onChange(t.v)}>
          {value === t.v && <motion.span layoutId={id + '-bg'} className="bg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <span>{t.l}</span>
        </button>
      ))}
    </div>
  )
}

// ───────────── Form ─────────────
export function Field({ label, req, help, err, children, full }: { label?: ReactNode; req?: boolean; help?: ReactNode; err?: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={cx('field', full && 'full')}>
      {label && (
        <label>
          {label} {req && <span className="req">*</span>}
        </label>
      )}
      {children}
      {err ? <span className="errt">{err}</span> : help ? <span className="help">{help}</span> : null}
    </div>
  )
}
export const Inp = ({ className, bad, ...p }: InputHTMLAttributes<HTMLInputElement> & { bad?: boolean }) => <input className={cx('inp', bad && 'bad', className)} {...p} />
export const Txt = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cx('inp', className)} {...p} />
export function Sel({ options, className, placeholder, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: { v: string; l: string }[] | string[]; placeholder?: string }) {
  return (
    <select className={cx('inp', className)} {...p}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>))}
    </select>
  )
}
export const Check = ({ label, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) => (
  <label className="check">
    <input type="checkbox" {...p} />
    {label}
  </label>
)
export const RO = ({ children, icon }: { children: ReactNode; icon?: ReactNode }) => (
  <div className="ro">
    {icon}
    {children}
  </div>
)

/** Fayl yuklash: haqiqiy faylni tanlaydi, SHA-256 nazorat yigʻindisini hisoblaydi (fayl ombori imitatsiyasi). */
export function FileDrop({ value, onChange, label = 'Faylni tanlang yoki shu yerga tashlang', accept, maxMb = 50 }: { value?: Fayl; onChange: (f: Fayl | undefined) => void; label?: string; accept?: string; maxMb?: number }) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [xato, setXato] = useState('')
  const ol = async (f?: File) => {
    if (!f) return
    if (f.size > maxMb * 1024 * 1024) return setXato(`Fayl ${maxMb} MB dan katta`)
    setXato('')
    let hash = fauxHash(f.name + f.size)
    try {
      const b = await f.arrayBuffer()
      const d = await crypto.subtle.digest('SHA-256', b)
      hash = Array.from(new Uint8Array(d)).map((x) => x.toString(16).padStart(2, '0')).join('')
    } catch {
      /* */
    }
    onChange({ id: 'F-' + hash.slice(0, 10), nomi: f.name, turi: f.type || 'application/octet-stream', hajm: f.size, hash, yuklangan: new Date().toISOString() })
  }
  return (
    <div>
      <div
        className={cx('filedrop', drag && 'drag', value && 'done')}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          ol(e.dataTransfer.files[0])
        }}
        role="button"
        tabIndex={0}
      >
        <div className="ic">{value ? <FileCheck2 size={18} color="var(--ok)" /> : <Upload size={18} />}</div>
        <div className="grow">
          {value ? (
            <>
              <div className="b small" style={{ wordBreak: 'break-all' }}>{value.nomi}</div>
              <div className="xs muted mono">{hajm(value.hajm)} · SHA-256 {value.hash.slice(0, 16)}…</div>
            </>
          ) : (
            <>
              <div className="b small">{label}</div>
              <div className="xs muted">PDF, JPG, PNG, DOCX · {maxMb} MB gacha · zararli kodga tekshiriladi</div>
            </>
          )}
        </div>
        {value && (
          <button className="btn ghost xs" onClick={(e) => { e.stopPropagation(); onChange(undefined) }}>
            <X size={14} />
          </button>
        )}
        <input ref={ref} type="file" hidden accept={accept} onChange={(e) => ol(e.target.files?.[0])} />
      </div>
      {xato && <div className="errt small mt-4" style={{ color: 'var(--err)' }}>{xato}</div>}
    </div>
  )
}

// ───────────── Stepper ─────────────
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div key={s} className={cx('step', i === current && 'on', i < current && 'done')}>
          <div className="row gap-6">
            <div className="bubble">{i < current ? '✓' : i + 1}</div>
          </div>
          <div className="line"><i /></div>
          <div className="lb">{s}</div>
        </div>
      ))}
    </div>
  )
}

// ───────────── Timeline ─────────────
export function Timeline({ items }: { items: { h: ReactNode; m?: ReactNode; ton?: 'ok' | 'warn' | 'err' | 'muted' }[] }) {
  return (
    <div className="tl">
      {items.map((x, i) => (
        <motion.div key={i} className={cx('tl-i', x.ton)} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <div className="h">{x.h}</div>
          {x.m && <div className="m">{x.m}</div>}
        </motion.div>
      ))}
    </div>
  )
}

// ───────────── Alert / Empty ─────────────
export function Alert({ ton = 'info', title, children, action }: { ton?: 'info' | 'warn' | 'err' | 'ok'; title?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const Ic = ton === 'ok' ? CheckCircle2 : ton === 'err' ? XCircle : ton === 'warn' ? AlertTriangle : Info
  return (
    <div className={cx('alert', ton)}>
      <Ic />
      <div className="grow">
        {title && <div className="t">{title}</div>}
        {children}
      </div>
      {action}
    </div>
  )
}
export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ic">{icon ?? <Inbox />}</div>
      <h3>{title}</h3>
      {children && <p style={{ maxWidth: 420 }}>{children}</p>}
      {action}
    </div>
  )
}
export function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: number | string }) {
  return <div className="sk" style={{ height: h, width: w }} />
}
export function Avatar({ name, lg }: { name: string; lg?: boolean }) {
  const t = name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()
  return <div className={cx('avatar', lg && 'lg')}>{t}</div>
}

// ───────────── Modal / Drawer ─────────────
export function Modal({ open, onClose, title, sub, children, footer, size, drawer }: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'lg' | 'xl'; drawer?: boolean }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className={cx('ov', drawer && 'drawer-ov')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            className={drawer ? 'drawer' : cx('modal', size)}
            role="dialog"
            aria-modal="true"
            initial={drawer ? { x: 60, opacity: 0 } : { y: 18, scale: 0.97, opacity: 0 }}
            animate={drawer ? { x: 0, opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
            exit={drawer ? { x: 60, opacity: 0 } : { y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="modal-h">
              <div>
                <h2>{title}</h2>
                {sub && <div className="s">{sub}</div>}
              </div>
              <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={onClose} aria-label="Yopish">
                <X />
              </button>
            </div>
            <div className="modal-b">{children}</div>
            {footer && <div className="modal-f">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Tasdiqlash oynasi (ixtiyoriy izoh maydoni bilan) */
export function Confirm({ open, onClose, onOk, title, children, okText = 'Tasdiqlash', ton = 'primary', izoh, izohMajburiy, eri }: { open: boolean; onClose: () => void; onOk: (izoh: string) => void; title: string; children?: ReactNode; okText?: string; ton?: 'primary' | 'danger' | 'success'; izoh?: string; izohMajburiy?: boolean; eri?: boolean }) {
  const [t, setT] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (open) setT('')
  }, [open])
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button v="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button
            v={ton}
            loading={busy}
            disabled={izohMajburiy && !t.trim()}
            onClick={async () => {
              setBusy(true)
              await new Promise((r) => setTimeout(r, eri ? 650 : 250))
              setBusy(false)
              onOk(t)
            }}
          >
            {eri ? '🔐 ERI bilan ' + okText.toLowerCase() : okText}
          </Button>
        </>
      }
    >
      {children}
      {izoh !== undefined && (
        <Field label={izoh} req={izohMajburiy}>
          <Txt value={t} onChange={(e) => setT(e.target.value)} placeholder="Izoh..." autoFocus />
        </Field>
      )}
      {eri && <div className="xs muted mt-12">Amal elektron raqamli imzo va vaqt belgisi bilan tasdiqlanadi (prototipda ERI imitatsiyasi).</div>}
    </Modal>
  )
}

export function DL({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="dl">
      {items.map(([a, b], i) => (
        <div key={i} style={{ display: 'contents' }}>
          <dt>{a}</dt>
          <dd>{b ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="h" animate="s" variants={{ h: {}, s: { transition: { staggerChildren: 0.06 } } }}>
      {children}
    </motion.div>
  )
}
export const staggerItem = { h: { opacity: 0, y: 12 }, s: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }
