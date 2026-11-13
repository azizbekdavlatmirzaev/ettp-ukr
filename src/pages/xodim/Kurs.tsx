import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ClipboardCheck, FileText, ListChecks, MonitorPlay, PenLine, PlayCircle, QrCode, Info } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Alert, Bar, Button, Card, CardH, Empty, Holat, PageHeader, Ring, cx } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { OCHIQ_KURS, QrDavomatModal } from './_parts'
import { PdfPane, TopshiriqPane, VebinarPane, VideoPane } from './_DarsPane'
import { TestPane } from './_TestPane'

const IKON: Record<T.Dars['turi'], typeof PlayCircle> = { video: PlayCircle, pdf: FileText, vebinar: MonitorPlay, topshiriq: PenLine, test: ListChecks }
const TUR: Record<T.Dars['turi'], string> = { video: 'Video', pdf: 'PDF material', vebinar: 'Vebinar', topshiriq: 'Topshiriq', test: 'Test' }

export default function Kurs() {
  const { oqimId } = useParams()
  const nav = useNavigate()
  const { db, shaxs } = useXodim()
  const [qr, setQr] = useState(false)
  const o = A.oqim(db, oqimId)
  const y = o && db.yozilishlar.find((x) => x.personId === shaxs.id && x.oqimId === o.id && OCHIQ_KURS.includes(x.holat))
  const v = o && A.versiya(db, o.versiyaId)
  const [darsId, setDarsId] = useState<string | undefined>(() => v?.darslar.find((d) => !y?.progress.includes(d.id))?.id ?? v?.darslar[0]?.id)

  if (!o || !v || !y) {
    const kutil = o && db.yozilishlar.find((x) => x.personId === shaxs.id && x.oqimId === o.id && ['yuborildi', 'navbatda'].includes(x.holat))
    return (
      <>
        <PageHeader title="Kurs pleyeri" crumbs={[{ l: 'Oʻquv tadbirlari', to: '/xodim/oquv' }, { l: 'Kurs' }]} />
        <Card>
          <Empty title={kutil ? 'Arizangiz hali qabul qilinmagan' : 'Kurs topilmadi yoki sizga tegishli emas'} action={<Button v="primary" onClick={() => nav('/xodim/oquv/kurslarim')}>Mening kurslarim</Button>}>
            {kutil ? 'Provayder arizani qabul qilgach, kurs materiallari ochiladi.' : 'Faqat oʻzingiz qabul qilingan kurs materiallarini koʻra olasiz.'}
          </Empty>
        </Card>
      </>
    )
  }

  const p = A.provayder(db, o.providerId)!
  const dars = v.darslar.find((d) => d.id === darsId) ?? v.darslar[0]
  const df = A.davomatFoizi(db, y)
  const qayd = db.davomat.filter((d) => d.yozilishId === y.id)
  const bugun = new Date().toISOString().slice(0, 10)
  const progressF = Math.round((y.progress.length / Math.max(1, v.darslar.length)) * 100)

  return (
    <>
      <PageHeader title={v.nomi} crumbs={[{ l: 'Oʻquv tadbirlari', to: '/xodim/oquv' }, { l: 'Mening kurslarim', to: '/xodim/oquv/kurslarim' }, { l: o.kod }]}
        desc={`${p.nomi} · oʻqituvchi ${o.oqituvchi}`} source={`Manba: provayder LMS va davomat jurnali · ${sanaVaqt(new Date().toISOString())}`}
        actions={<><Holat h={y.holat} /><Button v="primary" icon={<QrCode />} onClick={() => setQr(true)}>QR davomat</Button></>} />

      <Card className="mb-16">
        <div className="row wrap" style={{ gap: 20 }}>
          <div className="grow" style={{ minWidth: 220 }}>
            <div className="row between small" style={{ marginBottom: 4 }}><span className="muted">Kurs progressi</span><b>{y.progress.length} / {v.darslar.length} dars · {progressF}%</b></div>
            <Bar v={progressF} />
          </div>
          <div className="grow" style={{ minWidth: 220 }}>
            <div className="row between small" style={{ marginBottom: 4 }}><span className="muted">Davomat</span><b>{df}% (talab ≥ 75%)</b></div>
            <Bar v={df} ton={df < 75 ? 'warn' : 'ok'} />
          </div>
        </div>
      </Card>

      <div className="grid g-side">
        <Card flush>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }} className="b">Darslar</div>
          <div style={{ padding: 8 }}>
            {v.darslar.map((d, i) => {
              const Ic = IKON[d.turi]
              const kor = y.progress.includes(d.id)
              const on = d.id === dars.id
              return (
                <motion.button key={d.id} whileHover={{ x: 2 }} onClick={() => setDarsId(d.id)} className={cx('row')}
                  style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '10px 10px', borderRadius: 10, background: on ? 'var(--primary-soft)' : 'transparent', color: on ? 'var(--primary-text)' : 'var(--text)', alignItems: 'flex-start' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', flex: 'none', background: kor ? 'var(--ok-soft)' : 'var(--surface-3)', color: kor ? 'var(--ok)' : 'var(--text-2)' }}>
                    {kor ? <CheckCircle2 size={16} /> : <Ic size={16} />}
                  </span>
                  <span className="grow">
                    <span className="small b" style={{ display: 'block' }}>{i + 1}. {d.nomi}</span>
                    <span className="xs muted">{TUR[d.turi]} · {d.davomiylik} daq</span>
                  </span>
                </motion.button>
              )
            })}
          </div>
        </Card>

        <div className="col gap-16" style={{ minWidth: 0 }}>
          <Card key={dars.id}>
            <CardH icon={(() => { const Ic = IKON[dars.turi]; return <Ic /> })()} title={dars.nomi} sub={`${TUR[dars.turi]} · ${dars.davomiylik} daqiqa`} />
            {dars.turi === 'video' && <VideoPane y={y} v={v} d={dars} />}
            {dars.turi === 'pdf' && <PdfPane y={y} v={v} d={dars} />}
            {dars.turi === 'vebinar' && <VebinarPane y={y} o={o} d={dars} />}
            {dars.turi === 'topshiriq' && <TopshiriqPane y={y} d={dars} />}
            {dars.turi === 'test' && <TestPane y={y} v={v} dars={dars} />}
          </Card>
          <Alert ton="info" title="Kredit qanday yoziladi?">Materialni koʻrish kredit bermaydi — kredit faqat provayder tasdiqlagan yakuniy natijadan (davomat ≥ 75% va baholashdan oʻtish) avtomatik yoziladi.</Alert>

          <div className="grid g2">
            <Card>
              <CardH icon={<ClipboardCheck />} title="Davomat" sub={`${qayd.filter((d) => d.holat !== 'kelmadi').length} / ${o.mashgulotlar.length} mashgʻulot`} />
              <div className="row" style={{ gap: 16 }}>
                <Ring v={df} max={100} size={104} stroke={10}><div className="center"><b style={{ fontSize: 20 }}>{df}%</b></div></Ring>
                <div className="small muted">QR, jurnal yoki LMS orqali qayd etiladi. 75% dan kam boʻlsa, natija tasdiqlanmaydi.</div>
              </div>
              <Button v="soft" block className="mt-16" icon={<QrCode />} onClick={() => setQr(true)}>QR-kodni skanerlash</Button>
            </Card>
            <Card>
              <CardH icon={<Info />} title="Mashgʻulotlar jadvali" />
              {o.mashgulotlar.map((m) => {
                const d = qayd.find((x) => x.mashgulotId === m.id)
                return (
                  <div key={m.id} className="li" style={{ padding: '8px 0' }}>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="small b">{sanaVaqt(m.sana)}</div>
                      <div className="xs muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.mavzu}</div>
                    </div>
                    {d ? <Holat ton={d.holat === 'kelmadi' ? 'err' : 'ok'}>{d.holat === 'keldi' ? `Keldi · ${d.usul}` : d.holat === 'uzrli' ? 'Uzrli' : 'Kelmadi'}</Holat>
                      : m.sana.slice(0, 10) === bugun ? <Holat ton="info">Bugun</Holat> : m.sana.slice(0, 10) > bugun ? <Holat ton="muted">Kutilmoqda</Holat> : <Holat ton="warn">Qayd yoʻq</Holat>}
                  </div>
                )
              })}
            </Card>
          </div>
        </div>
      </div>
      <QrDavomatModal open={qr} onClose={() => setQr(false)} />
    </>
  )
}
