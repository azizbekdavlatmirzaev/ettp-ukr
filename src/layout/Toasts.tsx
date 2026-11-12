import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useStore } from '@/domain/store'

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const yop = useStore((s) => s.toastYop)
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          const Ic = t.turi === 'ok' ? CheckCircle2 : t.turi === 'err' ? XCircle : t.turi === 'warn' ? AlertTriangle : Info
          return (
            <motion.div key={t.id} className={`toast ${t.turi}`} layout initial={{ opacity: 0, x: 40, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
              <Ic />
              <div className="grow">
                {t.sarlavha && <div className="t">{t.sarlavha}</div>}
                <div>{t.matn}</div>
              </div>
              <button className="btn ghost xs" onClick={() => yop(t.id)} aria-label="Yopish">
                <X />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
