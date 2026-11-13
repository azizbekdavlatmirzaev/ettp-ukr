import { motion } from 'framer-motion'
import { Building2, CalendarDays, Clock, MapPin, MonitorPlay, Users } from 'lucide-react'
import type { DB } from '@/domain/db'
import type { DasturVersiya, Oqim, Provayder } from '@/domain/types'
import * as A from '@/domain/amallar'
import { kursRasmi } from '@/ui/art'
import { cx } from '@/ui'
import { sana } from '@/lib/format'
import { SHAKL, TADBIR, KURS_TURI } from '@/lib/holat'
import { HUDUDLAR } from '@/domain/malumotnoma'

export interface KatalogQator { o: Oqim; v: DasturVersiya; p: Provayder; band: number }

/** Ochiq katalog: faqat tasdiqlangan versiya + faol akkreditatsiya + eʼlon qilingan + qabul ochiq */
export function katalogQatorlar(db: DB, bugun: string): KatalogQator[] {
  return db.oqimlar
    .filter((o) => A.katalogdami(db, o, bugun))
    .map((o) => ({ o, v: A.versiya(db, o.versiyaId)!, p: A.provayder(db, o.providerId)!, band: A.bandOrinlar(db, o.id) }))
    .sort((a, b) => a.o.boshlanish.localeCompare(b.o.boshlanish))
}

export const hududYoki = (q: KatalogQator) => (q.p.turi === 'xorijiy' ? `${q.p.mamlakat} (xorijiy)` : HUDUDLAR.find((h) => h.id === q.o.hududId)?.nomi ?? '—')

export function KursKarta({ q, onClick, i = 0 }: { q: KatalogQator; onClick?: () => void; i?: number }) {
  const { o, v, p, band } = q
  const qoldi = Math.max(0, o.orinlar - band)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.55, delay: Math.min(i, 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="card course hover kt-c pb-lift"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
    >
      <div className="cover">
        <img src={kursRasmi(v)} alt="" loading="lazy" />
        <div className="ov2" />
        <div className="tl2">
          <span className={cx('badge nodot', v.kursTuri === 'majburiy' ? 'brand' : 'teal')} style={{ background: 'rgba(255,255,255,.92)' }}>{KURS_TURI[v.kursTuri]}</span>
          <span className="badge nodot muted" style={{ background: 'rgba(255,255,255,.92)' }}>{TADBIR[v.tadbirTuri]}</span>
        </div>
        <div className="cr">{v.tasdiqlanganKredit} kredit</div>
      </div>
      <div className="body">
        <div className="prov"><Building2 size={13} /> {p.qisqa} · {p.turi === 'xorijiy' ? p.mamlakat : 'akkreditatsiyalangan'}</div>
        <h3>{v.nomi}</h3>
        <div className="kt-meta mt-4">
          <span><CalendarDays /> {sana(o.boshlanish)}</span>
          <span><Clock /> {v.soatNazariy + v.soatAmaliy} soat</span>
          <span>{v.shakl === 'onlayn' ? <MonitorPlay /> : <MapPin />} {SHAKL[v.shakl]}</span>
        </div>
        <div className="row between mt-8" style={{ marginTop: 'auto', paddingTop: 10 }}>
          <span className="xs muted">Qabul {sana(o.qabulTugash)} gacha</span>
          <span className={cx('badge nodot', qoldi === 0 ? 'warn' : qoldi < 8 ? 'warn' : 'ok')}><Users size={12} /> {qoldi === 0 ? 'Navbat' : `${qoldi} oʻrin`}</span>
        </div>
      </div>
    </motion.div>
  )
}
