import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, CheckCircle2, AlertTriangle, CircleAlert, Percent, Building2, MapPin } from 'lucide-react'
import { Card, CardH, KPI, PageHeader, Ring, Seg, Empty } from '@/ui'
import { Donut, Legenda, BarCh } from '@/ui/charts'
import { EKG } from '@/ui/art'
import { hududNomi } from '@/shared/hooks'
import { sanaVaqt } from '@/lib/format'
import { useMuassasa, statistika, kesim, XAVF_RANG, XAVF_NOM, XAVF_TARTIB, type XodimQator } from './_umumiy'
import { XodimJadval } from './_XodimJadval'
import { XodimKarta } from './_XodimKarta'

export default function MuassasaUkr() {
  const { muassasa, qatorlar, yil, db } = useMuassasa()
  const [tanlangan, setTanlangan] = useState<XodimQator | null>(null)
  const [kesimTuri, setKesimTuri] = useState<'bolim' | 'mut'>('bolim')
  const st = statistika(qatorlar)
  const kesimData = useMemo(() => kesim(qatorlar, (r) => (kesimTuri === 'bolim' ? r.m.bolim : r.mut)), [qatorlar, kesimTuri])
  const yangilangan = db.shaxslar.map((s) => s.reestrYangilangan).sort().pop()
  const joriyTanlangan = tanlangan ? qatorlar.find((q) => q.id === tanlangan.id) ?? null : null
  const soni = (x: string) => qatorlar.filter((q) => q.h.xavf === x).length

  if (!muassasa) return <Empty title="Muassasa biriktirilmagan">Hisobingizga muassasa biriktirilmagan. Administratorga murojaat qiling.</Empty>

  return (
    <>
      <PageHeader title="Xodimlar UKR holati" desc="Oʻz xodimlaringizning yillik kredit talabi bajarilishi, xavf ostidagilar va qarzdorlar." source={`Manba: HRM (tasdiqlangan mehnat munosabatlari) · UKR kredit jurnali · yangilangan: ${sanaVaqt(yangilangan)}`} />

      <motion.div className="hero mb-16" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="hero-pattern" />
        <EKG className="hero-ekg" />
        <div className="row between wrap" style={{ position: 'relative', gap: 20 }}>
          <div style={{ minWidth: 0, maxWidth: 620 }}>
            <div className="sub small row gap-6"><Building2 size={15} /> Ish beruvchi kabineti · {yil}-yil</div>
            <h1 style={{ margin: '6px 0 10px', fontSize: 26 }}>{muassasa.nomi}</h1>
            <div className="row wrap gap-6">
              <span className="chip">{muassasa.turi}</span>
              <span className="chip"><MapPin size={13} /> {hududNomi(muassasa.hududId)}</span>
              <span className="chip">{muassasa.bolimlar.length} ta boʻlim</span>
              <span className="chip">{st.n} ta faol xodim</span>
            </div>
          </div>
          <div className="glass row gap-16">
            <Ring v={st.ortacha} max={100} size={104} stroke={10} light>
              <div className="center"><div className="b" style={{ fontSize: 22 }}>{st.ortacha}%</div><div className="xs" style={{ opacity: 0.8 }}>oʻrtacha</div></div>
            </Ring>
            <div className="col gap-4 small">
              <span><b>{st.bajarildi}</b> bajardi</span>
              <span><b>{st.xavf}</b> xavf ostida</span>
              <span><b>{st.qarzdor}</b> qarzdor</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid mb-16" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        <KPI icon={<Users />} label="Xodimlar" value={st.n} hint="Tasdiqlangan mehnat munosabati bor" />
        <KPI icon={<CheckCircle2 />} label="Talabni bajarganlar" value={st.bajarildi} ton="ok" delay={0.05} hint={`${st.n ? Math.round((st.bajarildi / st.n) * 100) : 0}% xodim`} />
        <KPI icon={<AlertTriangle />} label="Xavf ostidagilar" value={st.xavf} ton="warn" delay={0.1} hint="Yil oxirigacha yetkaza olmasligi mumkin" />
        <KPI icon={<CircleAlert />} label="Qarzdorlar" value={st.qarzdor} ton="err" delay={0.15} hint={`${yil - 1}-yil talabi bajarilmagan`} />
        <KPI icon={<Percent />} label="Oʻrtacha bajarilish" value={st.ortacha} suffix="%" ton="teal" delay={0.2} hint="X / T, 100% bilan cheklangan" />
      </div>

      <div className="grid g-main mb-16">
        <Card>
          <CardH title="Boʻlimlar va mutaxassisliklar kesimida" sub="Xodimlar soni holat boʻyicha" right={<Seg id="kesim" value={kesimTuri} onChange={setKesimTuri} items={[{ v: 'bolim', l: 'Boʻlimlar' }, { v: 'mut', l: 'Mutaxassisliklar' }]} />} />
          {kesimData.length ? (
            <BarCh data={kesimData} keys={XAVF_TARTIB} names={XAVF_NOM} stacked colors={XAVF_RANG} height={Math.max(240, kesimData.length * 38)} horizontal />
          ) : <Empty title="Xodimlar yoʻq" />}
        </Card>
        <Card delay={0.05}>
          <CardH title="Holatlar taqsimoti" sub={`${yil}-yil, bugungi holat`} />
          <Donut data={XAVF_TARTIB.map((x) => ({ name: XAVF_NOM[x], value: soni(x) }))} colors={XAVF_RANG} center={<div><div className="stat-big">{st.n}</div><div className="xs muted">xodim</div></div>} />
          <Legenda colors={XAVF_RANG} items={XAVF_TARTIB.map((x) => ({ l: XAVF_NOM[x], v: soni(x) }))} />
          <div className="xs muted mt-12">«Xavf ostida» — hisobga olingan kredit yilning oʻtgan qismiga nisbatan 75% dan kam. «Qarzdor» — yil yakunida talab bajarilmagan.</div>
        </Card>
      </div>

      {qatorlar.length ? (
        <XodimJadval rows={qatorlar} bolimlar={muassasa.bolimlar} onRow={setTanlangan} />
      ) : (
        <Empty icon={<Users />} title="Xodimlar roʻyxati boʻsh">HRM dan tasdiqlangan mehnat munosabatlari kelmagan. «Xodimlar» tabida manbani tekshiring.</Empty>
      )}
      <div className="xs muted mt-12">Manba: Platforma Reestri (shaxs), HRM (mehnat munosabatlari), UKR kredit jurnali. Ishdan boʻshagan xodimlar va boshqa muassasa xodimlari koʻrsatilmaydi.</div>

      <XodimKarta q={joriyTanlangan} onClose={() => setTanlangan(null)} />
    </>
  )
}
