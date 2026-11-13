import { CalendarClock, LineChart as LineIc, Star } from 'lucide-react'
import { MurojaatTugma } from '@/shared/Murojaat'
import { Card, CardH, Holat, KPI, PageHeader } from '@/ui'
import { DataTable } from '@/ui/DataTable'
import { LineCh } from '@/ui/charts'
import { kunFarq, sana, sanaVaqt } from '@/lib/format'
import { RezidentYoq, baholashBosqichlari, useRezident } from './_rz'

const TURI: Record<string, string> = { joriy: 'Joriy', oraliq: 'Oraliq attestatsiya', yakuniy: 'Yakuniy attestatsiya' }

export default function Baholar() {
  const d = useRezident()
  if (!d.r) return <><PageHeader title="Baholashlar" /><RezidentYoq /></>
  const { r, rot, baholar, bugun, att } = d
  const ortacha = baholar.length ? Math.round(baholar.reduce((a, b) => a + b.ball, 0) / baholar.length) : 0
  const trend = baholar.map((b) => ({ x: sana(b.sana).slice(3), ball: b.ball, otish: 60 }))
  const kelgusi = baholashBosqichlari(r, rot, baholar).filter((b) => !b.bajarildi && b.sana >= bugun).slice(0, 4)
  return (
    <>
      <PageHeader title="Baholashlar" desc="Joriy, oraliq (yarim yilda) va yakuniy attestatsiya natijalari" source={`Manba: Rezidentura moduli · ${sanaVaqt(new Date().toISOString())}`} />
      <div className="grid g3 mb-16">
        <KPI icon={<Star />} label="Oʻrtacha ball" value={ortacha} suffix="/ 100" ton="teal" />
        <KPI icon={<LineIc />} label="Baholashlar soni" value={baholar.length} hint={`${baholar.filter((b) => b.natija === 'otdi').length} ta oʻtdi`} delay={0.05} />
        <KPI icon={<CalendarClock />} label="Yakuniy attestatsiya" value={att.ruxsat ? 'Ruxsat bor' : 'Ruxsat yoʻq'} ton={att.ruxsat ? 'ok' : 'warn'} hint={att.ruxsat ? 'Logbook toʻliq' : `${att.yetmaydi.length} ta majburiy koʻnikma yetishmaydi`} delay={0.1} />
      </div>
      <div className="grid g-main">
        <Card>
          <CardH icon={<LineIc />} title="Ballar dinamikasi" sub="Oʻtish bali — 60" />
          {trend.length ? <LineCh data={trend} keys={['ball', 'otish']} names={{ ball: 'Ball', otish: 'Oʻtish bali' }} height={240} /> : <div className="muted small">Hali baho yoʻq.</div>}
        </Card>
        <Card>
          <CardH icon={<CalendarClock />} title="Kelgusi baholashlar" />
          {kelgusi.length === 0 ? <div className="small muted">Rejalashtirilgan baholash yoʻq.</div> : kelgusi.map((b) => (
            <div key={b.nomi + b.sana} className="li">
              <span className="ic brand"><CalendarClock /></span>
              <div className="grow"><div className="b small">{b.nomi}</div><div className="xs muted">{sana(b.sana)} · {kunFarq(b.sana + 'T12:00:00')} kundan keyin</div></div>
              {b.turi === 'yakuniy' && !att.ruxsat && <Holat ton="warn">Bloklangan</Holat>}
            </div>
          ))}
        </Card>
      </div>
      <div className="mt-16">
        <DataTable title="Baholar" rows={[...baholar].reverse()} exportName="rezident-baholar" initialSort={{ k: 'sana', dir: -1 }}
          filters={[{ k: 't', l: 'Turi', options: Object.entries(TURI).map(([v, l]) => ({ v, l })), get: (b) => b.turi }]}
          cols={[
            { k: 'sana', l: 'Sana', r: (b) => sana(b.sana), sort: (b) => b.sana, excel: (b) => b.sana },
            { k: 'turi', l: 'Turi', r: (b) => <span className="tag">{TURI[b.turi]}</span>, excel: (b) => TURI[b.turi] },
            { k: 'ball', l: 'Ball', align: 'right', r: (b) => <b>{b.ball}</b>, sort: (b) => b.ball, excel: (b) => b.ball },
            { k: 'natija', l: 'Natija', r: (b) => <Holat h={b.natija} />, excel: (b) => b.natija },
            { k: 'kom', l: 'Komissiya', r: (b) => <span className="small">{b.komissiya}</span>, excel: (b) => b.komissiya },
            { k: 'izoh', l: 'Izoh', r: (b) => <span className="small muted">{b.izoh}</span>, excel: (b) => b.izoh },
            { k: 'm', l: '', r: (b) => <MurojaatTugma size="xs" turi="rezidentura" obyekt={{ turi: 'RezidentBaho', id: b.id, nomi: `${TURI[b.turi]} ${sana(b.sana)} — ${b.ball} ball` }} label="Apellyatsiya" /> },
          ]} />
      </div>
    </>
  )
}
