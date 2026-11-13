import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'
import { KPI } from '@/ui'
import { HUDUDLAR } from '@/domain/malumotnoma'
import { Sel } from '@/ui'
import type { Filtr } from './_hisob'
import { mutNomlari } from './_hisob'

/** KPI + «Qanday hisoblandi · Manba · Yangilangan · kiritilgan holatlar» (TZ 4.2.16). Maxraj nomaʼlum boʻlsa qiymat koʻrsatilmaydi. */
export function Korsatkich({ icon, label, value, suffix, kasr, ton, formula, manba, yangilangan, kiritilgan, maxrajYoq, delay = 0, hint }: {
  icon: ReactNode; label: string; value: number; suffix?: string; kasr?: number; ton?: 'ok' | 'warn' | 'err' | 'teal'; formula: string; manba: string; yangilangan: string; kiritilgan: string; maxrajYoq?: boolean; delay?: number; hint?: ReactNode
}) {
  const [ochiq, setOchiq] = useState(false)
  return (
    <div className="col gap-6" title={formula}>
      <KPI icon={icon} label={label} value={maxrajYoq ? 'Maxraj aniqlanmagan' : value} suffix={maxrajYoq ? undefined : suffix} kasr={kasr} ton={maxrajYoq ? 'warn' : ton} delay={delay}
        hint={maxrajYoq ? 'Reestrdan sana bilan jami xodimlar soni olinmagan — koʻrsatkich chiqarilmaydi' : hint} />
      <button type="button" className="btn ghost xs" style={{ alignSelf: 'flex-start' }} onClick={() => setOchiq(!ochiq)} aria-expanded={ochiq}>
        <Info size={13} /> Qanday hisoblandi
      </button>
      <AnimatePresence>
        {ochiq && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div className="ro" style={{ display: 'block', fontSize: 12 }}>
              <div><b>Formula:</b> {formula}</div>
              <div><b>Manba:</b> {manba}</div>
              <div><b>Yangilangan:</b> {yangilangan}</div>
              <div><b>Kiritilgan holatlar:</b> {kiritilgan}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const st = { width: 'auto', minWidth: 140, height: 36, minHeight: 36, fontSize: 13 }

/** Barcha vidjetlarga qoʻllanadigan filtrlar paneli */
export function FiltrPanel({ f, setF, turlar, yillar }: { f: Filtr; setF: (f: Filtr) => void; turlar: string[]; yillar: number[] }) {
  return (
    <div className="card row wrap" style={{ padding: 12, gap: 8 }}>
      <Sel style={st} aria-label="Hudud" value={f.hudud} onChange={(e) => setF({ ...f, hudud: e.target.value })} placeholder="Hudud: barchasi" options={HUDUDLAR.map((h) => ({ v: h.id, l: h.nomi }))} />
      <Sel style={st} aria-label="Mutaxassislik" value={f.mut} onChange={(e) => setF({ ...f, mut: e.target.value })} placeholder="Mutaxassislik: barchasi" options={mutNomlari()} />
      <Sel style={st} aria-label="Maʼlumot darajasi" value={f.daraja} onChange={(e) => setF({ ...f, daraja: e.target.value })} placeholder="Daraja: barchasi" options={[{ v: 'oliy', l: 'Oliy maʼlumotli' }, { v: 'orta', l: 'Oʻrta maʼlumotli' }]} />
      <Sel style={st} aria-label="Muassasa turi" value={f.turi} onChange={(e) => setF({ ...f, turi: e.target.value })} placeholder="Muassasa turi: barchasi" options={turlar} />
      <Sel style={st} aria-label="Yil" value={String(f.yil)} onChange={(e) => setF({ ...f, yil: Number(e.target.value) })} options={yillar.map((y) => ({ v: String(y), l: `${y}-yil` }))} />
      {(f.hudud || f.mut || f.daraja || f.turi) && <button type="button" className="btn ghost sm" onClick={() => setF({ ...f, hudud: '', mut: '', daraja: '', turi: '' })}>Filtrni tozalash</button>}
    </div>
  )
}
