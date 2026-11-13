import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ClipboardCheck, Hospital, NotebookPen, PenLine, Users } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useJoriy, mutNomi } from '@/shared/hooks'
import { Alert, Avatar, Bar, Button, Card, Confirm, Empty, Holat, KPI, Modal, PageHeader, Stagger, staggerItem } from '@/ui'
import { sana, sanaVaqt } from '@/lib/format'
import { bazaNomi } from '../rezident/_rz'
import { useBajar } from '../xodim/_bajar'
import { rezidentlarim, type RezInfo } from './_kl'

export default function Rezidentlar() {
  const { db, user } = useJoriy()
  const nav = useNavigate()
  const [tanl, setTanl] = useState<string | null>(null)
  const list = useMemo(() => rezidentlarim(db, user.id), [db, user.id])
  const t = list.find((x) => x.r.id === tanl) ?? null
  const kutil = list.reduce((a, x) => a + x.kutil, 0)
  return (
    <>
      <PageHeader title="Rezidentlarim" desc="Sizga biriktirilgan rezidentlar — logbook, rotatsiyalar va attestatsiya holati" source={`Manba: Rezidentura moduli · ${sanaVaqt(new Date().toISOString())}`}
        actions={<Button v="primary" icon={<NotebookPen />} onClick={() => nav('/klinik/logbook')}>Logbook navbati ({kutil})</Button>} />
      <div className="grid g3 mb-16">
        <KPI icon={<Users />} label="Rezidentlar" value={list.length} hint={`Limit: ${db.sozlamalar.rezidentLimit} ta`} />
        <KPI icon={<NotebookPen />} label="Tasdiq kutayotgan yozuvlar" value={kutil} ton={kutil ? 'warn' : 'ok'} delay={0.05} onClick={() => nav('/klinik/logbook')} />
        <KPI icon={<ClipboardCheck />} label="Attestatsiyaga tayyor" value={list.filter((x) => x.att.ruxsat).length} ton="teal" delay={0.1} onClick={() => nav('/klinik/baholar')} />
      </div>
      {list.length === 0 ? <Card><Empty title="Biriktirilgan rezident yoʻq">Rezidentlar taʼlim tashkiloti buyrugʻi bilan biriktiriladi.</Empty></Card> : (
        <Stagger className="grid g3">
          {list.map((x) => (
            <motion.div key={x.r.id} variants={staggerItem}>
              <Card hover onClick={() => setTanl(x.r.id)}>
                <div className="row" style={{ gap: 12 }}>
                  <Avatar name={`${x.s.ism} ${x.s.familiya}`} />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="b">{x.qisqa}</div>
                    <div className="xs muted">{mutNomi(x.r.mutaxassislikId)} · {x.r.kurs}-kurs</div>
                  </div>
                  <Holat h={x.r.holat} />
                </div>
                <div className="mt-16">
                  <div className="row between small" style={{ marginBottom: 4 }}><span className="muted">Logbook</span><b>{x.foiz}%</b></div>
                  <Bar v={x.foiz} ton={x.foiz >= 100 ? 'ok' : undefined} />
                </div>
                <div className="row wrap gap-6 mt-12 small">
                  {x.kutil > 0 ? <Holat ton="warn">{x.kutil} ta kutilmoqda</Holat> : <Holat ton="ok">Navbat boʻsh</Holat>}
                  {x.att.ruxsat ? <Holat ton="ok">Attestatsiyaga ruxsat</Holat> : <Holat ton="muted">{x.att.yetmaydi.length} koʻnikma yetmaydi</Holat>}
                </div>
                <div className="xs muted mt-12 row gap-6"><Hospital size={13} /> {x.joriy ? `${x.joriy.bolim} (${sana(x.joriy.gacha)} gacha)` : 'Faol rotatsiya yoʻq'}</div>
              </Card>
            </motion.div>
          ))}
        </Stagger>
      )}
      <Modal open={!!t} onClose={() => setTanl(null)} drawer title={t?.fio ?? ''} sub={t ? `${t.r.id} · ${t.r.tashkilot}` : ''}>
        {t && <Tafsilot x={t} />}
      </Modal>
    </>
  )
}

function Tafsilot({ x }: { x: RezInfo }) {
  const { db, toast } = useJoriy()
  const bajar = useBajar()
  const nav = useNavigate()
  const [rot, setRot] = useState<T.Rotatsiya | null>(null)
  return (
    <div className="col gap-16">
      {!x.att.ruxsat && <Alert ton="warn" title="Yakuniy attestatsiyaga hali ruxsat yoʻq">{x.att.yetmaydi.map((k) => `${k.kod} (${k.tasdiqlangan}/${k.minimal})`).join(', ')}</Alert>}
      <div>
        <div className="b small mb-12">Logbook — koʻnikmalar</div>
        {x.lh.map((k) => (
          <div key={k.kod} className="mb-12">
            <div className="row between small" style={{ marginBottom: 4 }}>
              <span><span className="mono xs muted">{k.kod}</span> {k.nomi}{!k.majburiy && <span className="xs muted"> (ixtiyoriy)</span>}</span>
              <b className="nowrap">{k.tasdiqlangan}/{k.minimal}{k.kutilmoqda ? <span className="xs" style={{ color: 'var(--warn)' }}> +{k.kutilmoqda}</span> : null}</b>
            </div>
            <Bar v={k.tasdiqlangan} max={k.minimal} thin ton={k.foiz >= 100 ? 'ok' : k.majburiy && k.foiz < 50 ? 'err' : 'warn'} />
          </div>
        ))}
        {x.kutil > 0 && <Button size="sm" v="soft" icon={<NotebookPen />} onClick={() => nav('/klinik/logbook')}>{x.kutil} ta yozuvni koʻrib chiqish</Button>}
      </div>
      <div>
        <div className="b small mb-12">Rotatsiyalar</div>
        {x.rot.length === 0 ? <div className="small muted">Rotatsiya rejalashtirilmagan.</div> : x.rot.map((r) => (
          <div key={r.id} className="li" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="grow" style={{ minWidth: 200 }}>
              <div className="row wrap gap-6"><b className="small">{r.bolim}</b><Holat h={r.holat} /></div>
              <div className="xs muted">{bazaNomi(db, r.bazaId)} · {sana(r.dan)} – {sana(r.gacha)}</div>
              <div className="xs mt-4">Maqsad: {r.maqsad}</div>
              {r.xulosa && <div className="xs mt-4" style={{ color: 'var(--ok)' }}>Xulosa: «{r.xulosa}»</div>}
            </div>
            {r.holat !== 'reja' && <Button size="xs" v={r.xulosa ? 'ghost' : 'soft'} icon={<PenLine />} onClick={() => setRot(r)}>{r.xulosa ? 'Xulosani yangilash' : 'Xulosa yozish'}</Button>}
          </div>
        ))}
      </div>
      <Confirm open={!!rot} onClose={() => setRot(null)} title={`Rotatsiya xulosasi: ${rot?.bolim ?? ''}`} izoh="Rahbar xulosasi" izohMajburiy okText="Saqlash" eri
        onOk={(iz) => { if (rot && bajar(A.rotatsiyaXulosa, rot.id, iz)) toast({ turi: 'ok', matn: 'Rotatsiya xulosasi saqlandi va rotatsiya yakunlandi.' }); setRot(null) }}>
        <p className="small muted">Xulosa saqlangach rotatsiya «yakunlangan» holatiga oʻtadi va rezident kartasida koʻrinadi.</p>
      </Confirm>
    </div>
  )
}
