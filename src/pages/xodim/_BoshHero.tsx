import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, GraduationCap, QrCode, CalendarClock } from 'lucide-react'
import { useXodim } from '@/shared/hooks'
import { Button, Holat, Ring } from '@/ui'
import { EKG } from '@/ui/art'

export function BoshHero({ onQr }: { onQr: () => void }) {
  const { shaxs, holat: h, yil, muassasa } = useXodim()
  const nav = useNavigate()
  const soat = new Date().getHours()
  const salom = soat < 11 ? 'Xayrli tong' : soat < 18 ? 'Xayrli kun' : 'Xayrli kech'
  return (
    <motion.div className="hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="hero-pattern" />
      <EKG className="hero-ekg" />
      <div className="row wrap" style={{ gap: 24, position: 'relative', alignItems: 'center' }}>
        <div className="grow" style={{ minWidth: 240, flex: '1 1 320px' }}>
          <div className="sub small">{muassasa?.nomi ?? 'Tibbiyot xodimi'}</div>
          <h1 style={{ marginTop: 4 }}>{salom}, {shaxs.ism}!</h1>
          <p className="sub mt-8" style={{ maxWidth: 520 }}>
            {yil}-yil uzluksiz kasbiy rivojlanish holatingiz. Kredit faqat akkreditatsiyalangan provayder tasdiqlagan natijadan yoziladi.
          </p>
          <div className="row wrap gap-6 mt-16">
            <span className="chip">Majburiy: {h.majburiy}/{h.majburiyKerak}</span>
            <span className="chip">Amaliy: {h.amaliy}/{h.amaliyKerak}</span>
            {h.tekshiruvda > 0 && <span className="chip">Tekshiruvda: {h.tekshiruvda}</span>}
            <span className="chip"><CalendarClock /> {h.qolganKun} kun qoldi</span>
            <Holat h={h.xavf} />
          </div>
          <div className="row wrap mt-20">
            <Button v="white" icon={<GraduationCap />} onClick={() => nav('/xodim/oquv')}>Kurs tanlash</Button>
            <Button v="glassb" icon={<Award />} onClick={() => nav('/xodim/kreditlar')}>Kreditlarim</Button>
            <Button v="glassb" icon={<QrCode />} onClick={onQr}>QR davomat</Button>
          </div>
        </div>
        <div className="glass row" style={{ gap: 18, padding: 16, flex: '0 1 auto' }}>
          <Ring v={h.X} max={h.T || 1} size={150} stroke={13} light>
            <div className="center">
              <div style={{ font: '800 30px/1 var(--font-head)' }}>{h.X}</div>
              <div className="xs" style={{ opacity: 0.8 }}>/ {h.T} kredit</div>
            </div>
          </Ring>
          <div className="col gap-6 small" style={{ minWidth: 120 }}>
            <div><span style={{ opacity: 0.75 }}>Toʻplangan (K):</span> <b>{h.K}</b></div>
            {h.O > 0 && <div><span style={{ opacity: 0.75 }}>Oʻtkazilgan (O):</span> <b>{h.O}</b></div>}
            {h.limitKesildi > 0 && <div><span style={{ opacity: 0.75 }}>Limitdan kesildi:</span> <b>−{h.limitKesildi}</b></div>}
            <div><span style={{ opacity: 0.75 }}>Yetishmaydi:</span> <b>{h.yetishmaydi}</b></div>
            <div className="xs" style={{ opacity: 0.7 }}>Qoida v{h.qoidaVersiya}</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
