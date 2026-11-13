import { motion } from 'framer-motion'
import { BookOpen, CalendarCheck, Hospital, Scale } from 'lucide-react'
import { mutNomi } from '@/shared/hooks'
import { Bar, Card, CardH, Holat, PageHeader, Timeline } from '@/ui'
import { DataTable } from '@/ui/DataTable'
import { kunFarq, sana, sanaVaqt } from '@/lib/format'
import { RezidentYoq, baholashBosqichlari, bazaNomi, useRezident } from './_rz'

const NAZARIY = [
  { yil: 1, nomi: 'Klinik kardiologiya asoslari', soat: 120 },
  { yil: 1, nomi: 'Elektrokardiografiya va ritm buzilishlari', soat: 80 },
  { yil: 2, nomi: 'Exokardiografiya va vizualizatsiya usullari', soat: 90 },
  { yil: 2, nomi: 'Oʻtkir koronar sindrom va shoshilinch kardiologiya', soat: 100 },
  { yil: 3, nomi: 'Intervension kardiologiya asoslari', soat: 60 },
  { yil: 3, nomi: 'Dalillarga asoslangan tibbiyot va tadqiqot metodologiyasi', soat: 40 },
]
const MOLIYA: Record<string, string> = { davlat: 'Davlat buyurtmasi', maqsadli: 'Maqsadli', kontrakt: 'Toʻlov-kontrakt' }

export default function Reja() {
  const d = useRezident()
  if (!d.r) return <><PageHeader title="Oʻquv reja" /><RezidentYoq /></>
  const { r, db, rot, baholar, bugun } = d
  const bosqich = baholashBosqichlari(r, rot, baholar)
  const kvota = db.kvotalar.filter((k) => k.mutaxassislikId === r.mutaxassislikId)
  return (
    <>
      <PageHeader title="Individual oʻquv reja" desc={`${mutNomi(r.mutaxassislikId)} · ${sana(r.boshlangan)} – ${sana(r.tugash)}`} source={`Manba: Rezidentura moduli · ${sanaVaqt(new Date().toISOString())}`} />
      <Card>
        <CardH icon={<Hospital />} title="Rotatsiyalar jadvali" sub="Klinik bazalar, maqsad va rahbar xulosasi" />
        <div className="col gap-12">
          {rot.map((x, i) => {
            const jami = kunFarq(x.gacha + 'T12:00:00', x.dan + 'T12:00:00')
            const otdi = Math.max(0, Math.min(jami, kunFarq(bugun + 'T12:00:00', x.dan + 'T12:00:00')))
            return (
              <motion.div key={x.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="card" style={{ boxShadow: 'none', borderLeft: `4px solid ${x.holat === 'yakunlangan' ? 'var(--ok)' : x.holat === 'davom' ? 'var(--teal-500)' : 'var(--border-strong)'}` }}>
                <div className="row wrap between">
                  <div>
                    <div className="row wrap gap-6"><span className="mono xs muted">{x.id}</span><b>{x.bolim}</b><Holat h={x.holat} /></div>
                    <div className="small muted mt-4">{bazaNomi(db, x.bazaId)}</div>
                  </div>
                  <div className="small nowrap">{sana(x.dan)} – {sana(x.gacha)}</div>
                </div>
                <div className="small mt-8">Maqsad: {x.maqsad}</div>
                {x.holat === 'davom' && <div className="mt-8"><Bar v={otdi} max={jami} thin /><div className="xs muted mt-4">{Math.round((otdi / jami) * 100)}% · {jami - otdi} kun qoldi</div></div>}
                {x.xulosa && <div className="small mt-8" style={{ color: 'var(--ok)' }}>Rahbar xulosasi: «{x.xulosa}»</div>}
              </motion.div>
            )
          })}
        </div>
      </Card>
      <div className="grid g2 mt-16">
        <Card>
          <CardH icon={<BookOpen />} title="Nazariy bloklar" />
          {NAZARIY.map((n) => (
            <div key={n.nomi} className="li">
              <span className={`ic ${n.yil < r.kurs ? 'ok' : n.yil === r.kurs ? 'brand' : ''}`}><b className="small">{n.yil}</b></span>
              <div className="grow"><div className="b small">{n.nomi}</div><div className="xs muted">{n.yil}-yil · {n.soat} soat</div></div>
              <Holat ton={n.yil < r.kurs ? 'ok' : n.yil === r.kurs ? 'teal' : 'muted'}>{n.yil < r.kurs ? 'Yakunlangan' : n.yil === r.kurs ? 'Joriy' : 'Rejada'}</Holat>
            </div>
          ))}
        </Card>
        <Card>
          <CardH icon={<CalendarCheck />} title="Baholash bosqichlari" />
          <Timeline items={bosqich.map((b) => ({ h: <span className="row wrap gap-6">{b.nomi}</span>, m: `${sana(b.sana)} · ${b.bajarildi ? 'bajarildi' : b.sana < bugun ? 'oʻtgan' : 'rejada'}`, ton: b.bajarildi ? 'ok' : b.turi === 'yakuniy' ? 'warn' : 'muted' }))} />
        </Card>
      </div>
      <div className="mt-16">
        <DataTable title={<span className="row gap-6"><Scale size={16} /> Kvotalar ({mutNomi(r.mutaxassislikId)})</span>} rows={kvota} exportName="rezidentura-kvotalar"
          cols={[
            { k: 'tash', l: 'Tashkilot', r: (k) => k.tashkilot, excel: (k) => k.tashkilot },
            { k: 'yil', l: 'Yil', r: (k) => k.yil, excel: (k) => k.yil },
            { k: 'turi', l: 'Turi', r: (k) => <span className="row gap-6">{MOLIYA[k.turi]}{k.turi === r.moliya && <Holat ton="brand">Sizniki</Holat>}</span>, excel: (k) => MOLIYA[k.turi] },
            { k: 'soni', l: 'Oʻrinlar', align: 'right', r: (k) => <b>{k.soni}</b>, excel: (k) => k.soni },
            { k: 'v', l: 'Versiya', r: (k) => `v${k.versiya}`, excel: (k) => k.versiya },
          ]} />
      </div>
    </>
  )
}
