import { motion } from 'framer-motion'
import { Gauge, Info } from 'lucide-react'
import { QR } from '@/ui/charts'
import { DL, Badge, cx } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { QR_ASOS } from '@/lib/eksport'
import { qisqaFioMatn } from './_parts'
import { HUJJAT_NOMI, type Natija } from './_tekshir'

type Ton = 'ok' | 'err' | 'warn' | 'muted'

function Belgi({ ton }: { ton: Ton }) {
  const chiz = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.55, delay: 0.25, ease: 'easeOut' as const } }
  return (
    <motion.div className={cx('tk-ico', ton)} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}>
      <motion.span className="pulse" initial={{ scale: 0.9, opacity: 0.7 }} animate={{ scale: 1.35, opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }} style={{ color: 'currentColor' }} />
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {ton === 'ok' && <motion.path d="M5 12.5l4.5 4.5L19 7.5" {...chiz} />}
        {ton === 'err' && <><motion.path d="M6.5 6.5l11 11" {...chiz} /><motion.path d="M17.5 6.5l-11 11" {...chiz} /></>}
        {ton === 'warn' && <><motion.path d="M12 6v8" {...chiz} /><motion.path d="M12 18h.01" {...chiz} /></>}
        {ton === 'muted' && <><motion.path d="M9.2 9a3 3 0 1 1 4 2.8c-.8.3-1.2 1-1.2 1.8v.4" {...chiz} /><motion.path d="M12 18h.01" {...chiz} /></>}
      </svg>
    </motion.div>
  )
}

export function TekshirNatija({ n, ms }: { n: Natija; ms: number }) {
  let ton: Ton = 'muted'
  let sarlavha = 'Topilmadi'
  let izoh = 'Bunday raqam yoki QR-kalit bilan hujjat topilmadi. Raqamni sertifikatdagidek kiriting (masalan, «UKR 2026-000123») yoki QR-kodni qayta skanerlang. Soxta hujjatdan shubha qilsangiz, UKR markaziga murojaat qiling.'
  let maydon: [string, React.ReactNode][] = []
  let qr = ''
  if (n.tur === 'sert') {
    const s = n.s
    qr = QR_ASOS() + s.qrKalit
    if (s.holat === 'amalda') { ton = 'ok'; sarlavha = 'Haqiqiy'; izoh = 'Sertifikat Platforma reestrida mavjud va amalda.' }
    if (s.holat === 'tuzatilgan') { ton = 'warn'; sarlavha = 'Tuzatilgan'; izoh = `Sertifikat amalda, lekin maʼlumotlari tuzatilgan${n.ozgarish ? ` (${sanaVaqt(n.ozgarish)})` : ''}. Sabab: ${s.sabab ?? '—'}. Avvalgi holat tarixi saqlanadi.` }
    if (s.holat === 'bekor_qilingan') { ton = 'err'; sarlavha = 'Bekor qilingan'; izoh = `Sertifikat bekor qilingan${n.ozgarish ? ` — ${sanaVaqt(n.ozgarish)}` : ''}. Sabab: ${s.sabab ?? '—'}. Bu hujjat asosida kredit hisobga olinmaydi; yozuv tarixi saqlanadi.` }
    maydon = [
      ['Hujjat turi', HUJJAT_NOMI[s.turi] ?? s.turi],
      ['Seriya va raqam', <span className="mono b">{s.seriya} {s.raqam}</span>],
      ['F.I.Sh.', qisqaFioMatn(s.fio)],
      ['Kurs', s.kurs],
      ['Provayder', s.provider],
      ['Sana', sana(s.sana)],
      ['Hajm', `${s.soat} soat`],
      ['Kredit', <Badge ton="brand">{s.kredit} kredit</Badge>],
    ]
    if (s.kochirilgan) maydon.push(['Manba', <Badge ton="muted">{s.kochirilgan}</Badge>])
  }
  if (n.tur === 'hisobot') {
    ton = 'ok'; sarlavha = 'Haqiqiy'; izoh = 'Yillik UKR hisoboti Platformada roʻyxatdan oʻtgan.'
    qr = QR_ASOS() + 'hisobot-' + n.h.qr
    maydon = [
      ['Hujjat turi', 'Yillik UKR hisoboti'],
      ['Yil', n.h.yil],
      ['F.I.Sh.', n.fio],
      ['Natija', n.h.holat.natija === 'bajarildi' ? <Badge ton="ok">Talab bajarildi</Badge> : <Badge ton="err">Yetishmaydi: {n.h.holat.yetishmaydi} kredit</Badge>],
      ['Kreditlar', `${n.h.holat.K} / ${n.h.holat.T}`],
      ['Shakllangan', sanaVaqt(n.h.sana)],
    ]
  }

  return (
    <motion.div className="tk-res" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} aria-live="polite">
      <div className={cx('tk-head', ton)}>
        <Belgi ton={ton} />
        <div className="grow">
          <div className="row wrap gap-6">
            <h2>{sarlavha}</h2>
            <span className="tk-ms" title="Javob vaqti (talab: 2 soniyagacha)"><Gauge size={13} /> {(ms / 1000).toFixed(2)} s</span>
          </div>
          <p className="sub mt-4" style={{ lineHeight: 1.55 }}>{izoh}</p>
          {n.tur === 'yoq' && <p className="xs muted mt-8 mono">Soʻrov: {n.kalit || '—'}</p>}
        </div>
      </div>
      {maydon.length > 0 && (
        <div className="tk-body">
          <DL items={maydon} />
          <div className="col" style={{ alignItems: 'center' }}>
            <QR matn={qr} size={124} />
            <span className="xs muted">Yagona QR yozuv</span>
          </div>
        </div>
      )}
      <div className="pb-note" style={{ padding: '0 28px 20px' }}>
        <Info /> Ochiq tekshiruvda faqat cheklangan maʼlumot koʻrsatiladi: JSHSHIR va toʻliq shaxsiy maʼlumotlar chiqarilmaydi.
      </div>
    </motion.div>
  )
}
