import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardCheck, GraduationCap, Hospital, NotebookPen, Plus, Route, Star, Hourglass } from 'lucide-react'
import { mutNomi } from '@/shared/hooks'
import { Alert, Bar, Button, Card, CardH, Holat, KPI, PageHeader, Ring } from '@/ui'
import { EKG } from '@/ui/art'
import { kunFarq, sana, sanaVaqt } from '@/lib/format'
import { RezidentYoq, baholashBosqichlari, bazaNomi, useRezident } from './_rz'

export default function RezidentBosh() {
  const d = useRezident()
  const nav = useNavigate()
  if (!d.r) return <><PageHeader title="Bosh sahifa" /><RezidentYoq /></>
  const { r, s, db, rot, baholar, lh, att, yozuvlar, joriyRot, lFoiz, rahbar, bugun } = d
  const jami = kunFarq(r.tugash + 'T12:00:00', r.boshlangan + 'T12:00:00')
  const otdi = Math.max(0, Math.min(jami, kunFarq(bugun + 'T12:00:00', r.boshlangan + 'T12:00:00')))
  const vaqtF = Math.round((otdi / jami) * 100)
  const kutil = yozuvlar.filter((y) => y.holat === 'kutilmoqda').length
  const keyingi = baholashBosqichlari(r, rot, baholar).find((b) => !b.bajarildi && b.sana >= bugun)
  const ortacha = baholar.length ? Math.round(baholar.reduce((a, b) => a + b.ball, 0) / baholar.length) : 0
  const kam = lh.filter((k) => k.majburiy && k.tasdiqlangan < k.minimal).sort((a, b) => a.foiz - b.foiz).slice(0, 4)

  return (
    <>
      <PageHeader title="Bosh sahifa" desc="Rezidentura jarayoni: rotatsiyalar, logbook va baholashlar" source={`Manba: Rezidentura moduli · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <motion.div className="hero" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-pattern" />
        <EKG className="hero-ekg" />
        <div className="row wrap" style={{ gap: 24, position: 'relative' }}>
          <div className="grow" style={{ flex: '1 1 320px' }}>
            <div className="sub small">{r.tashkilot}</div>
            <h1 className="mt-4">Salom, {s.ism}!</h1>
            <p className="sub mt-8">{mutNomi(r.mutaxassislikId)} rezidenturasi · {r.kurs}-kurs · bitirish {sana(r.tugash)}</p>
            <div className="mt-16" style={{ maxWidth: 460 }}>
              <div className="row between small" style={{ marginBottom: 6 }}><span>Bitiruvgacha</span><b>{vaqtF}% · {Math.max(0, jami - otdi)} kun qoldi</b></div>
              <div className="bar" style={{ background: 'rgba(255,255,255,.2)' }}><i style={{ width: `${vaqtF}%`, background: '#fff' }} /></div>
            </div>
            <div className="row wrap mt-20">
              <Button v="white" icon={<Plus />} onClick={() => nav('/rezident/logbook')}>Logbookka yozuv</Button>
              <Button v="glassb" icon={<Route />} onClick={() => nav('/rezident/reja')}>Oʻquv reja</Button>
            </div>
          </div>
          <div className="glass row" style={{ gap: 16, padding: 16 }}>
            <Ring v={lFoiz} max={100} size={140} stroke={12} light>
              <div className="center"><div style={{ font: '800 28px/1 var(--font-head)' }}>{lFoiz}%</div><div className="xs" style={{ opacity: 0.8 }}>logbook</div></div>
            </Ring>
            <div className="col gap-6 small">
              <div><span style={{ opacity: 0.75 }}>Joriy rotatsiya:</span><br /><b>{joriyRot?.bolim ?? '—'}</b></div>
              <div><span style={{ opacity: 0.75 }}>Rahbar:</span> <b>{rahbar?.fio.split(' ').slice(0, 2).join(' ')}</b></div>
              <Holat h={r.holat} />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid g4 mt-20">
        <KPI icon={<NotebookPen />} label="Tasdiqlangan yozuvlar" value={yozuvlar.filter((y) => y.holat === 'tasdiqlangan').length} ton="ok" onClick={() => nav('/rezident/logbook')} />
        <KPI icon={<Hourglass />} label="Rahbar tasdigʻini kutmoqda" value={kutil} ton={kutil ? 'warn' : undefined} delay={0.05} onClick={() => nav('/rezident/logbook')} />
        <KPI icon={<Star />} label="Oʻrtacha baho" value={ortacha} suffix="ball" ton="teal" delay={0.1} onClick={() => nav('/rezident/baholar')} />
        <KPI icon={<Route />} label="Rotatsiyalar" value={`${rot.filter((x) => x.holat === 'yakunlangan').length}/${rot.length}`} hint="yakunlangan / jami" delay={0.15} onClick={() => nav('/rezident/reja')} />
      </div>

      <div className="grid g-main mt-20">
        <Card>
          <CardH icon={<ClipboardCheck />} title="Majburiy koʻnikmalar — eng kam bajarilganlari" right={<Button size="xs" v="ghost" onClick={() => nav('/rezident/logbook')}>Barchasi</Button>} />
          {att.ruxsat ? <Alert ton="ok" title="Yakuniy attestatsiyaga ruxsat bor">Barcha majburiy koʻnikmalar minimal talabga yetgan.</Alert> : (
            <>
              {kam.map((k) => (
                <div key={k.kod} className="mb-12">
                  <div className="row between small" style={{ marginBottom: 4 }}><span><span className="mono xs muted">{k.kod}</span> {k.nomi}</span><b>{k.tasdiqlangan}/{k.minimal}</b></div>
                  <Bar v={k.tasdiqlangan} max={k.minimal} ton={k.foiz >= 100 ? 'ok' : k.foiz < 50 ? 'err' : 'warn'} />
                </div>
              ))}
              <Alert ton="warn">Yakuniy attestatsiyaga ruxsat uchun {att.yetmaydi.length} ta majburiy koʻnikma yetishmaydi.</Alert>
            </>
          )}
        </Card>
        <div className="col gap-16">
          <Card>
            <CardH icon={<Hospital />} title="Joriy rotatsiya" />
            {joriyRot ? (
              <>
                <div className="b">{joriyRot.bolim}</div>
                <div className="small muted">{bazaNomi(db, joriyRot.bazaId)}</div>
                <div className="small mt-8">{sana(joriyRot.dan)} – {sana(joriyRot.gacha)} · maqsad: {joriyRot.maqsad}</div>
                <div className="mt-12"><Bar v={kunFarq(bugun + 'T12:00:00', joriyRot.dan + 'T12:00:00')} max={kunFarq(joriyRot.gacha + 'T12:00:00', joriyRot.dan + 'T12:00:00')} /></div>
              </>
            ) : <div className="small muted">Hozir faol rotatsiya yoʻq.</div>}
          </Card>
          <Card>
            <CardH icon={<GraduationCap />} title="Keyingi baholash" />
            {keyingi ? (
              <div className="row" style={{ gap: 14 }}>
                <div className="center" style={{ width: 60, padding: '8px 0', borderRadius: 14, background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  <div style={{ font: '800 20px/1 var(--font-head)' }}>{Number(keyingi.sana.slice(8, 10))}</div>
                  <div className="xs b">{keyingi.sana.slice(5, 7)}.{keyingi.sana.slice(2, 4)}</div>
                </div>
                <div><div className="b small">{keyingi.nomi}</div><div className="xs muted">{kunFarq(keyingi.sana + 'T12:00:00')} kundan keyin</div></div>
              </div>
            ) : <div className="small muted">Rejalashtirilgan baholash yoʻq.</div>}
          </Card>
        </div>
      </div>
    </>
  )
}
