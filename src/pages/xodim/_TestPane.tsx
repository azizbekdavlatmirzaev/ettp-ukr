import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, RotateCcw, ScanFace, ShieldCheck, XCircle } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Alert, Badge, Button, cx } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { testSavollari } from './_testlar'
import { useBajar } from './_bajar'

export function TestPane({ y, v, dars }: { y: T.Yozilish; v: T.DasturVersiya; dars: T.Dars }) {
  const { db, amal, toast } = useXodim()
  const bajar = useBajar()
  const savollar = useMemo(() => testSavollari(v.nomi), [v.nomi])
  const [myid, setMyid] = useState<'yoq' | 'tekshir' | 'ok'>('yoq')
  const [javob, setJavob] = useState<Record<number, number>>({})
  const [natija, setNatija] = useState<{ ball: number; togri: number } | null>(null)
  const urinishlar = db.baholashlar.filter((b) => b.yozilishId === y.id && b.turi === 'test' && b.manba === 'Test quyi tizimi')
  const qoldi = Math.max(0, 3 - urinishlar.length)
  const eng = urinishlar.reduce((m, b) => Math.max(m, b.ball), 0)

  const myidTekshir = () => {
    setMyid('tekshir')
    setTimeout(() => {
      setMyid('ok')
      toast({ turi: 'ok', matn: 'MyID: shaxs tasdiqlandi (imitatsiya).' })
    }, 1600)
  }
  const topshir = () => {
    const togri = savollar.filter((s, i) => javob[i] === s.t).length
    const ball = amal(A.onlaynTest, y.id, togri, savollar.length)
    if (ball === undefined) return
    setNatija({ ball, togri })
    if (ball >= 70) bajar(A.darsKorildi, y.id, dars.id)
    toast({ turi: ball >= 70 ? 'ok' : 'warn', sarlavha: `Natija: ${ball} ball`, matn: ball >= 70 ? 'Test topshirildi. Yakuniy natijani provayder shakllantiradi va tasdiqlaydi.' : 'Oʻtish bali 70. Qayta urinib koʻring.' })
  }
  const qayta = () => {
    setJavob({})
    setNatija(null)
  }

  return (
    <div className="col gap-16">
      <div className="row wrap between">
        <div className="row wrap gap-6">
          <Badge ton="brand">Test quyi tizimi</Badge>
          <span className="small muted">{savollar.length} savol · oʻtish bali 70 · {dars.davomiylik} daqiqa</span>
        </div>
        <span className="small">Qolgan urinishlar: <b>{qoldi} / 3</b>{urinishlar.length > 0 && <> · eng yaxshi: <b>{eng}</b></>}</span>
      </div>

      {myid !== 'ok' ? (
        <div className="card" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
          <div className="row wrap" style={{ gap: 16 }}>
            <div style={{ width: 84, height: 84, borderRadius: 20, background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden', flex: 'none' }}>
              <ScanFace size={40} color="var(--primary)" />
              {myid === 'tekshir' && <motion.div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: 'var(--teal-500)' }} initial={{ top: 0 }} animate={{ top: [0, 80, 0] }} transition={{ duration: 1.6 }} />}
            </div>
            <div className="grow" style={{ minWidth: 200 }}>
              <div className="b">MyID yuz tekshiruvi (imitatsiya)</div>
              <div className="small muted mt-4">Yakuniy test oldidan shaxsingiz MyID orqali tasdiqlanadi — test boshqa shaxs tomonidan topshirilmasligi uchun.</div>
              <Button v="primary" className="mt-12" icon={<ShieldCheck />} loading={myid === 'tekshir'} disabled={qoldi === 0} onClick={myidTekshir}>Yuzni tasdiqlash</Button>
            </div>
          </div>
        </div>
      ) : natija ? (
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="center col" style={{ alignItems: 'center', padding: 20 }}>
          {natija.ball >= 70 ? <CheckCircle2 size={56} color="var(--ok)" /> : <XCircle size={56} color="var(--err)" />}
          <div className="stat-big mt-8">{natija.ball} ball</div>
          <div className="muted">{natija.togri} / {savollar.length} toʻgʻri javob · {natija.ball >= 70 ? 'Oʻtdi' : 'Oʻtmadi'}</div>
          {natija.ball < 70 && qoldi > 0 && <Button v="secondary" className="mt-12" icon={<RotateCcw />} onClick={qayta}>Qayta topshirish ({qoldi} urinish)</Button>}
        </motion.div>
      ) : (
        <>
          {savollar.map((s, i) => (
            <div key={i}>
              <div className="b small mb-8">{i + 1}. {s.s}</div>
              <div className="col gap-6">
                {s.v.map((x, j) => (
                  <label key={j} className={cx('check', 'card')} style={{ padding: '9px 12px', boxShadow: 'none', borderColor: javob[i] === j ? 'var(--primary)' : undefined, background: javob[i] === j ? 'var(--primary-soft)' : undefined, cursor: 'pointer' }}>
                    <input type="radio" name={`q${i}`} checked={javob[i] === j} onChange={() => setJavob({ ...javob, [i]: j })} />
                    <span className="small">{x}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="row wrap between">
            <span className="small muted">Javob berildi: {Object.keys(javob).length} / {savollar.length}</span>
            <Button v="primary" disabled={Object.keys(javob).length < savollar.length || qoldi === 0} onClick={topshir}>Testni topshirish</Button>
          </div>
        </>
      )}
      {qoldi === 0 && !natija && <Alert ton="warn" title="Urinishlar tugagan">3 ta urinishdan foydalanildi. Qayta topshirish uchun provayderga murojaat qiling.</Alert>}
      {urinishlar.length > 0 && (
        <div className="xs muted">Avvalgi urinishlar: {urinishlar.map((b) => `${b.ball} ball (${sanaVaqt(b.sana)})`).join(' · ')}</div>
      )}
    </div>
  )
}
