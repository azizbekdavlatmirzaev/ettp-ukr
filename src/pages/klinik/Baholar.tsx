import { useMemo, useState } from 'react'
import { ClipboardCheck, Save } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useJoriy } from '@/shared/hooks'
import { Alert, Button, Card, CardH, Confirm, Field, Holat, Inp, PageHeader, Sel, Txt } from '@/ui'
import { DataTable } from '@/ui/DataTable'
import { sana, sanaVaqt } from '@/lib/format'
import { useBajar } from '../xodim/_bajar'
import { rezidentlarim } from './_kl'

const TURI: Record<T.RezidentBaho['turi'], string> = { joriy: 'Joriy', oraliq: 'Oraliq attestatsiya', yakuniy: 'Yakuniy attestatsiya' }

export default function KlinikBaholar() {
  const { db, user, toast, bugun } = useJoriy()
  const bajar = useBajar()
  const mening = useMemo(() => rezidentlarim(db, user.id), [db, user.id])
  const bosh = () => ({ rezidentId: mening[0]?.r.id ?? '', turi: 'joriy' as T.RezidentBaho['turi'], sana: bugun, ball: '', natija: 'otdi' as T.RezidentBaho['natija'], komissiya: 'Kafedra', izoh: '' })
  const [d, setD] = useState(bosh)
  const [tasdiq, setTasdiq] = useState(false)
  const tanl = mening.find((m) => m.r.id === d.rezidentId)
  const blok = d.turi === 'yakuniy' && tanl && !tanl.att.ruxsat
  const ball = Number(d.ball)
  const ballOk = d.ball !== '' && ball >= 0 && ball <= 100
  const rows = db.rezidentBaholar.filter((b) => mening.some((m) => m.r.id === b.rezidentId)).map((b) => ({ ...b, fio: mening.find((m) => m.r.id === b.rezidentId)!.qisqa }))

  const saqla = () => {
    setTasdiq(false)
    if (bajar(A.rezidentBaholash, { rezidentId: d.rezidentId, turi: d.turi, sana: d.sana, ball, natija: d.natija, komissiya: d.komissiya, izoh: d.izoh })) {
      toast({ turi: 'ok', sarlavha: 'Baho saqlandi', matn: d.turi === 'yakuniy' && d.natija === 'otdi' ? 'Rezidentura diplomi yaratildi va Reestrga uzatildi.' : 'Rezidentga xabar yuborildi.' })
      setD({ ...bosh(), rezidentId: d.rezidentId })
    }
  }
  return (
    <>
      <PageHeader title="Baholashlar" desc="Joriy, oraliq va yakuniy attestatsiya — faqat oʻz rezidentlaringiz" source={`Manba: Rezidentura moduli · ${sanaVaqt(new Date().toISOString())}`} />
      <div className="grid g-main">
        <Card>
          <CardH icon={<ClipboardCheck />} title="Yangi baho" sub="Bayonnoma asosida kiritiladi" />
          <div className="form-grid">
            <Field label="Rezident" req full>
              <Sel value={d.rezidentId} onChange={(e) => setD({ ...d, rezidentId: e.target.value })} options={mening.map((m) => ({ v: m.r.id, l: `${m.fio} (${m.r.kurs}-kurs)` }))} />
            </Field>
            <Field label="Turi" req>
              <Sel value={d.turi} onChange={(e) => setD({ ...d, turi: e.target.value as T.RezidentBaho['turi'] })} options={Object.entries(TURI).map(([v, l]) => ({ v, l }))} />
            </Field>
            <Field label="Sana" req><Inp type="date" value={d.sana} max={bugun} onChange={(e) => setD({ ...d, sana: e.target.value })} /></Field>
            <Field label="Ball (0–100)" req err={d.ball !== '' && !ballOk ? '0 dan 100 gacha' : undefined}>
              <Inp type="number" min={0} max={100} value={d.ball} onChange={(e) => { const b = e.target.value; setD({ ...d, ball: b, natija: b !== '' && Number(b) < 60 ? 'otmadi' : 'otdi' }) }} />
            </Field>
            <Field label="Natija" req>
              <Sel value={d.natija} onChange={(e) => setD({ ...d, natija: e.target.value as T.RezidentBaho['natija'] })} options={[{ v: 'otdi', l: 'Oʻtdi' }, { v: 'otmadi', l: 'Oʻtmadi' }]} />
            </Field>
            <Field label="Komissiya" req full><Inp value={d.komissiya} onChange={(e) => setD({ ...d, komissiya: e.target.value })} /></Field>
            <Field label="Izoh / bayonnoma" full><Txt rows={2} value={d.izoh} onChange={(e) => setD({ ...d, izoh: e.target.value })} placeholder="Masalan: Shoshilinch kardiologiya rotatsiyasi, OSKE" /></Field>
          </div>
          {blok && tanl && (
            <Alert ton="err" title="Yakuniy attestatsiyaga ruxsat yoʻq">
              Majburiy koʻnikmalar yetishmaydi: {tanl.att.yetmaydi.map((k) => `${k.kod} ${k.nomi} (${k.tasdiqlangan}/${k.minimal})`).join('; ')}.
            </Alert>
          )}
          <div className="row mt-16"><Button v="primary" icon={<Save />} disabled={!d.rezidentId || !ballOk || !d.komissiya.trim() || !!blok} onClick={() => setTasdiq(true)}>Bahoni saqlash</Button></div>
        </Card>
        <Card>
          <CardH title="Attestatsiyaga tayyorlik" />
          {mening.map((m) => (
            <div key={m.r.id} className="li">
              <div className="grow"><div className="b small">{m.qisqa}</div><div className="xs muted">Logbook {m.foiz}%</div></div>
              {m.att.ruxsat ? <Holat ton="ok">Ruxsat bor</Holat> : <Holat ton="warn">{m.att.yetmaydi.length} koʻnikma yetmaydi</Holat>}
            </div>
          ))}
        </Card>
      </div>
      <div className="mt-16">
        <DataTable title="Kiritilgan baholar" rows={rows} exportName="rezident-baholar" search={(b) => `${b.fio} ${b.komissiya} ${b.izoh}`} initialSort={{ k: 'sana', dir: -1 }}
          filters={[
            { k: 'rez', l: 'Rezident', options: mening.map((m) => ({ v: m.r.id, l: m.qisqa })), get: (b) => b.rezidentId },
            { k: 't', l: 'Turi', options: Object.entries(TURI).map(([v, l]) => ({ v, l })), get: (b) => b.turi },
          ]}
          cols={[
            { k: 'sana', l: 'Sana', r: (b) => sana(b.sana), sort: (b) => b.sana, excel: (b) => b.sana },
            { k: 'fio', l: 'Rezident', r: (b) => <b className="small">{b.fio}</b>, sort: (b) => b.fio, excel: (b) => b.fio },
            { k: 'turi', l: 'Turi', r: (b) => <span className="tag">{TURI[b.turi]}</span>, excel: (b) => TURI[b.turi] },
            { k: 'ball', l: 'Ball', align: 'right', r: (b) => <b>{b.ball}</b>, sort: (b) => b.ball, excel: (b) => b.ball },
            { k: 'n', l: 'Natija', r: (b) => <Holat h={b.natija} />, excel: (b) => b.natija },
            { k: 'kom', l: 'Komissiya', r: (b) => <span className="small">{b.komissiya}</span>, excel: (b) => b.komissiya },
            { k: 'izoh', l: 'Izoh', r: (b) => <span className="small muted">{b.izoh}</span>, excel: (b) => b.izoh },
          ]} />
      </div>
      <Confirm open={tasdiq} onClose={() => setTasdiq(false)} onOk={saqla} title="Bahoni tasdiqlash" okText="Saqlash" eri>
        <p className="small">{tanl?.fio}: {TURI[d.turi]} — <b>{d.ball} ball</b>, {d.natija === 'otdi' ? 'oʻtdi' : 'oʻtmadi'} ({sana(d.sana)}).</p>
        {d.turi === 'yakuniy' && d.natija === 'otdi' && <Alert ton="info">Yakuniy attestatsiyadan oʻtganda rezidentura diplomi (QR bilan) avtomatik yaratiladi va Reestrga uzatiladi.</Alert>}
      </Confirm>
    </>
  )
}
