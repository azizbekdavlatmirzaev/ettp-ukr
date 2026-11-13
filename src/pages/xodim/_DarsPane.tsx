import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Download, ExternalLink, Pause, Play, Send, Video } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Alert, Bar, Button, FileDrop } from '@/ui'
import { kursRasmi } from '@/ui/art'
import { sanaVaqt } from '@/lib/format'
import { umumiyPdf } from '@/lib/eksport'
import { useBajar } from './_bajar'

function useBelgila(y: T.Yozilish, d: T.Dars) {
  const { toast } = useXodim()
  const bajar = useBajar()
  const korilgan = y.progress.includes(d.id)
  return {
    korilgan,
    belgila: (matn = 'Dars koʻrildi deb belgilandi.') => {
      if (korilgan) return
      if (bajar(A.darsKorildi, y.id, d.id)) toast({ turi: 'ok', matn: `${matn} Progress yangilandi (kredit bermaydi).` })
    },
  }
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function VideoPane({ y, v, d }: { y: T.Yozilish; v: T.DasturVersiya; d: T.Dars }) {
  const { korilgan, belgila } = useBelgila(y, d)
  const [p, setP] = useState(korilgan ? 100 : 0)
  const [play, setPlay] = useState(false)
  const t = useRef<ReturnType<typeof setInterval>>()
  useEffect(() => {
    setP(y.progress.includes(d.id) ? 100 : 0)
    setPlay(false)
  }, [d.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!play) return
    t.current = setInterval(() => setP((x) => Math.min(100, x + 1.6)), 100)
    return () => clearInterval(t.current)
  }, [play])
  useEffect(() => {
    if (p >= 100 && play) {
      setPlay(false)
      belgila('Video oxirigacha koʻrildi.')
    }
  }, [p, play]) // eslint-disable-line react-hooks/exhaustive-deps
  const jami = d.davomiylik * 60
  return (
    <div className="col gap-12">
      <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden', background: '#061e30' }}>
        <img src={kursRasmi(v)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: play ? 0.55 : 0.4, transition: 'opacity .4s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(6,30,48,.2),rgba(6,30,48,.85))' }} />
        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={() => setPlay(!play)} aria-label={play ? 'Pauza' : 'Ijro etish'}
          style={{ position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%,-50%)', width: 74, height: 74, borderRadius: '50%', border: '2px solid rgba(255,255,255,.7)', background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(6px)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          {play ? <Pause size={30} /> : <Play size={30} style={{ marginLeft: 4 }} />}
        </motion.button>
        <div style={{ position: 'absolute', left: 16, top: 14, color: '#fff' }} className="row gap-6 small"><Video size={15} /> {d.nomi}</div>
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, color: '#fff' }}>
          <div style={{ height: 5, background: 'rgba(255,255,255,.25)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${p}%`, height: '100%', background: 'linear-gradient(90deg,#2ec4bd,#7ff0e6)', transition: 'width .1s linear' }} />
          </div>
          <div className="row between xs mt-4" style={{ opacity: 0.85 }}><span>{mmss((jami * p) / 100)}</span><span>{mmss(jami)}</span></div>
        </div>
      </div>
      <div className="row wrap between">
        <span className="small muted">Video LMS pleyerida (prototipda tezlashtirilgan imitatsiya). Koʻrish foizi saqlanadi.</span>
        {korilgan ? <span className="row gap-6 small" style={{ color: 'var(--ok)' }}><CheckCircle2 size={16} /> Koʻrilgan</span> : <Button v="soft" size="sm" icon={<CheckCircle2 />} onClick={() => belgila()}>Koʻrildi deb belgilash</Button>}
      </div>
    </div>
  )
}

export function PdfPane({ y, v, d }: { y: T.Yozilish; v: T.DasturVersiya; d: T.Dars }) {
  const { korilgan, belgila } = useBelgila(y, d)
  const yukla = async () => {
    await umumiyPdf(`${v.nomi}-protokol`, `${v.nomi}: klinik protokol`, [
      { t: 'Oʻquv maqsadi', qatorlar: [v.maqsad] },
      { t: 'Asosiy natijalar', qatorlar: v.natijalar.map((n, i) => `${i + 1}. ${n}`) },
      { t: 'Eslatma', qatorlar: ['Material oʻquv maqsadida. Klinik qaror amaldagi milliy protokollarga muvofiq qabul qilinadi.'] },
    ])
    belgila('Material yuklab olindi va oʻqildi deb belgilandi.')
  }
  return (
    <div className="col gap-12">
      <div className="card" style={{ background: 'var(--surface-2)', boxShadow: 'none', padding: 22 }}>
        <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
          <div style={{ width: 120, height: 160, borderRadius: 8, background: '#fff', border: '1px solid var(--border)', padding: 12, flex: 'none', boxShadow: 'var(--sh-2)' }}>
            <div style={{ height: 10, width: '70%', background: 'var(--brand-600)', borderRadius: 3 }} />
            {[90, 80, 95, 60, 85, 70, 92, 50].map((w, i) => <div key={i} style={{ height: 5, width: `${w}%`, background: 'var(--surface-3)', borderRadius: 3, marginTop: 8 }} />)}
          </div>
          <div className="grow">
            <div className="b">{d.nomi}</div>
            <div className="small muted mt-4">PDF · taxminan {d.davomiylik} daqiqa oʻqish</div>
            <p className="small mt-12">{v.maqsad}</p>
            <div className="row wrap mt-16">
              <Button v="primary" size="sm" icon={<Download />} onClick={yukla}>Yuklab olish (PDF)</Button>
              {!korilgan && <Button v="soft" size="sm" icon={<CheckCircle2 />} onClick={() => belgila('Material oʻqildi.')}>Oʻqildi deb belgilash</Button>}
              {korilgan && <span className="row gap-6 small" style={{ color: 'var(--ok)' }}><CheckCircle2 size={16} /> Oʻqilgan</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VebinarPane({ y, o, d }: { y: T.Yozilish; o: T.Oqim; d: T.Dars }) {
  const { korilgan, belgila } = useBelgila(y, d)
  const keyingi = o.mashgulotlar.find((m) => m.sana.slice(0, 10) >= new Date().toISOString().slice(0, 10))
  const havola = o.havola ?? `https://vebinar.example.uz/${o.kod}`
  return (
    <div className="col gap-12">
      <div className="hero" style={{ padding: 22 }}>
        <div className="hero-pattern" />
        <div className="sub small">Jonli vebinar</div>
        <h2 className="mt-4">{d.nomi}</h2>
        <div className="sub small mt-8">{keyingi ? `Keyingi sessiya: ${sanaVaqt(keyingi.sana)} — ${keyingi.mavzu}` : 'Vebinar yozuvi mavjud'} · {d.davomiylik} daqiqa</div>
        <div className="row wrap mt-16">
          <Button v="white" icon={<ExternalLink />} onClick={() => { window.open(havola, '_blank', 'noopener'); belgila('Vebinarga ulanish qayd etildi.') }}>Vebinarga ulanish</Button>
          {!korilgan && <Button v="glassb" icon={<CheckCircle2 />} onClick={() => belgila('Vebinar yozuvi koʻrildi.')}>Yozuvni koʻrdim</Button>}
        </div>
      </div>
      <div className="xs muted mono" style={{ wordBreak: 'break-all' }}>{havola}</div>
      {korilgan && <Alert ton="ok">Vebinar ishtiroki progressga yozildi.</Alert>}
    </div>
  )
}

export function TopshiriqPane({ y, d }: { y: T.Yozilish; d: T.Dars }) {
  const { korilgan, belgila } = useBelgila(y, d)
  const [f, setF] = useState<T.Fayl | undefined>()
  const [yuborildi, setYuborildi] = useState<string | null>(null)
  return (
    <div className="col gap-12">
      <div className="b">{d.nomi}</div>
      <p className="small sub">Klinik holatni tahlil qiling: tashxis algoritmi, davolash rejasi va asoratlar profilaktikasini 1–2 sahifada yozing. Bemorni aniqlaydigan maʼlumot (F.I.Sh., JSHSHIR, kasallik tarixi raqami) kiritmang.</p>
      <FileDrop value={f} onChange={setF} label="Javob faylini yuklang (DOCX/PDF)" />
      <div className="row wrap between">
        <span className="xs muted">Topshiriq oʻqituvchi tomonidan rubrika boʻyicha baholanadi.</span>
        <Button v="primary" size="sm" icon={<Send />} disabled={!f || !!yuborildi} onClick={() => { setYuborildi(f!.nomi); belgila('Topshiriq yuborildi.') }}>Topshirish</Button>
      </div>
      {(yuborildi || korilgan) && <Alert ton="ok" title="Topshiriq qabul qilindi">{yuborildi ? `${yuborildi} — baholash kutilmoqda.` : 'Avval topshirilgan. Baholash natijasi provayder tomonidan kiritiladi.'}</Alert>}
      <Bar v={korilgan ? 100 : f ? 50 : 0} thin ton="ok" />
    </div>
  )
}
