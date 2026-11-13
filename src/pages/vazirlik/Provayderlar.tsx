import { useMemo, useState } from 'react'
import { Building2, ShieldCheck, Star, Radar } from 'lucide-react'
import * as A from '@/domain/amallar'
import type { Provayder } from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Bar, Card, CardH, DL, Holat, KPI, Modal, PageHeader, Timeline, Badge } from '@/ui'
import { Donut, Legenda, RANG } from '@/ui/charts'
import { useJoriy, hududNomi } from '@/shared/hooks'
import { sana, sanaVaqt } from '@/lib/format'
import { PROV_TURI, SIGNAL, holat as holatMatn } from '@/lib/holat'

interface PQ { id: string; p: Provayder; dasturlar: number; tinglovchi: number; otish: number | null; natijalar: number; signal: number; ochiqSignal: number }
const HOLATLAR = ['akkreditatsiyalangan', 'shartli', 'korib_chiqilmoqda', 'ariza', 'toxtatilgan', 'muddati_tugagan', 'bekor']

export default function VazirlikProvayderlar() {
  const { db } = useJoriy()
  const [ochiq, setOchiq] = useState<string | null>(null)
  const rows = useMemo<PQ[]>(() => db.provayderlar.map((p) => {
    const oqimIds = new Set(db.oqimlar.filter((o) => o.providerId === p.id).map((o) => o.id))
    const ys = db.yozilishlar.filter((y) => oqimIds.has(y.oqimId))
    const yIds = new Set(ys.map((y) => y.id))
    const nat = db.natijalar.filter((n) => yIds.has(n.yozilishId) && n.holat !== 'qoralama')
    const sg = db.signallar.filter((s) => s.providerId === p.id)
    return { id: p.id, p, dasturlar: db.dasturlar.filter((d) => d.providerId === p.id).length, tinglovchi: ys.filter((y) => ['qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi'].includes(y.holat)).length, natijalar: nat.length, otish: nat.length ? Math.round((nat.filter((n) => n.natija === 'otdi').length / nat.length) * 100) : null, signal: sg.length, ochiqSignal: sg.filter((s) => s.holat === 'yangi' || s.holat === 'tekshiruvda').length }
  }), [db])
  const faol = rows.filter((r) => A.akkFaolmi(r.p)).length
  const reytingli = rows.filter((r) => r.p.reyting)
  const ortReyting = reytingli.length ? reytingli.reduce((a, r) => a + (r.p.reyting ?? 0), 0) / reytingli.length : 0
  const turlar = (['davlat', 'nodavlat', 'xorijiy'] as const).map((t) => ({ name: PROV_TURI[t], value: rows.filter((r) => r.p.turi === t).length }))
  const holatlar = HOLATLAR.map((h) => ({ h, n: rows.filter((r) => r.p.holat === h).length })).filter((x) => x.n)
  const t = rows.find((r) => r.id === ochiq)

  return (
    <>
      <PageHeader title="Provayderlar" desc="Taʼlim provayderlari: akkreditatsiya holati, turlari va sifat koʻrsatkichlari (faqat oʻqish)." source={`Manba: Provayderlar reestri, natijalar, sifat signallari · yangilangan: ${sanaVaqt(new Date().toISOString())}`} />
      <div className="grid g4 mb-16">
        <KPI icon={<Building2 />} label="Reestrdagi provayderlar" value={rows.length} />
        <KPI icon={<ShieldCheck />} label="Akkreditatsiyasi amalda" value={faol} ton="ok" delay={0.05} hint="akkreditatsiyalangan + shartli" />
        <KPI icon={<Star />} label="Oʻrtacha soʻrovnoma bahosi" value={ortReyting} kasr={1} suffix="/ 5" ton="teal" delay={0.1} hint="Tinglovchilar anonim soʻrovnomasi" />
        <KPI icon={<Radar />} label="Ochiq sifat signallari" value={rows.reduce((a, r) => a + r.ochiqSignal, 0)} ton="warn" delay={0.15} />
      </div>
      <div className="grid g-main mb-16">
        <Card>
          <CardH title="Holatlar boʻyicha" sub="Akkreditatsiya reestri" />
          <div className="col gap-8">
            {holatlar.map((x) => (
              <div key={x.h}>
                <div className="row between small"><Holat h={x.h} /><b>{x.n}</b></div>
                <Bar v={x.n} max={rows.length} thin ton={x.h === 'akkreditatsiyalangan' ? 'ok' : x.h === 'toxtatilgan' || x.h === 'bekor' ? 'err' : 'warn'} />
              </div>
            ))}
          </div>
        </Card>
        <Card delay={0.05}>
          <CardH title="Turlari boʻyicha" />
          <Donut data={turlar} height={180} center={<div className="stat-big">{rows.length}</div>} />
          <Legenda items={turlar.map((x) => ({ l: x.name, v: x.value }))} colors={RANG} />
        </Card>
      </div>
      <DataTable<PQ>
        rows={rows}
        exportName="provayderlar-sifat"
        onRow={(r) => setOchiq(r.id)}
        search={(r) => `${r.p.nomi} ${r.p.qisqa} ${r.p.mamlakat}`}
        filters={[
          { k: 'holat', l: 'Holat', options: HOLATLAR.map((h) => ({ v: h, l: holatMatn(h)[0] })), get: (r) => r.p.holat },
          { k: 'turi', l: 'Turi', options: Object.entries(PROV_TURI).map(([v, l]) => ({ v, l })), get: (r) => r.p.turi },
        ]}
        cols={[
          { k: 'nomi', l: 'Provayder', r: (r) => <div><div className="b small">{r.p.qisqa}</div><div className="xs muted">{r.p.turi === 'xorijiy' ? r.p.mamlakat : hududNomi(r.p.hududId)}</div></div>, sort: (r) => r.p.qisqa, excel: (r) => r.p.nomi },
          { k: 'turi', l: 'Turi', r: (r) => <span className="tag">{PROV_TURI[r.p.turi]}</span>, excel: (r) => PROV_TURI[r.p.turi] },
          { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.p.holat} />, sort: (r) => r.p.holat, excel: (r) => holatMatn(r.p.holat)[0] },
          { k: 'dastur', l: 'Dasturlar', align: 'right', r: (r) => r.dasturlar, sort: (r) => r.dasturlar, excel: (r) => r.dasturlar },
          { k: 'ting', l: 'Tinglovchilar', align: 'right', r: (r) => r.tinglovchi, sort: (r) => r.tinglovchi, excel: (r) => r.tinglovchi },
          { k: 'reyting', l: 'Soʻrovnoma', align: 'right', r: (r) => (r.p.reyting ? `${r.p.reyting.toFixed(1)} ★` : '—'), sort: (r) => r.p.reyting ?? 0, excel: (r) => r.p.reyting ?? '' },
          { k: 'otish', l: 'Oʻtish ulushi', w: 130, r: (r) => (r.otish === null ? <span className="xs muted">natija yoʻq</span> : <div><div className="xs">{r.otish}%</div><Bar v={r.otish} thin ton={r.otish >= 98 ? 'warn' : 'ok'} /></div>), sort: (r) => r.otish ?? -1, excel: (r) => (r.otish === null ? '' : r.otish) },
          { k: 'signal', l: 'Signallar', align: 'right', r: (r) => (r.signal ? <Badge ton={r.ochiqSignal ? 'err' : 'muted'}>{r.signal}{r.ochiqSignal ? ` (${r.ochiqSignal} ochiq)` : ''}</Badge> : '0'), sort: (r) => r.signal, excel: (r) => r.signal },
        ]}
      />
      <Modal open={!!t} onClose={() => setOchiq(null)} drawer title={t?.p.nomi ?? ''} sub={t ? `${PROV_TURI[t.p.turi]} · ${t.p.mamlakat}` : ''}>
        {t && (
          <div className="col gap-16">
            <div className="row wrap"><Holat h={t.p.holat} />{t.p.reyting && <Badge ton="teal">{t.p.reyting.toFixed(1)} ★</Badge>}</div>
            <DL items={[['STIR / ID', <span className="mono">{t.p.stir}</span>], ['Manzil', t.p.manzil], ['Qaror', t.p.qaror ? `${t.p.qaror.raqam} · ${sana(t.p.qaror.sana)} · muddat ${sana(t.p.qaror.muddat)}` : '—'], ['Dasturlar', t.dasturlar], ['Tinglovchilar', t.tinglovchi], ['Oʻtish ulushi', t.otish === null ? '—' : `${t.otish}% (${t.natijalar} natija)`]]} />
            <section>
              <h3 className="mb-8">Sifat signallari</h3>
              {db.signallar.filter((s) => s.providerId === t.id).length === 0 ? <div className="small muted">Signal yoʻq.</div> : db.signallar.filter((s) => s.providerId === t.id).map((s) => (
                <div key={s.id} className="li"><div className="grow"><div className="small b">{SIGNAL[s.turi]}</div><div className="xs muted">{s.tavsif}</div></div><Holat h={s.holat} /></div>
              ))}
            </section>
            <section>
              <h3 className="mb-8">Holat tarixi</h3>
              <Timeline items={[...t.p.tarix].reverse().map((h) => ({ h: <span>{holatMatn(h.holat)[0]}{h.qaror ? ` · ${h.qaror}` : ''}</span>, m: `${sana(h.sana)} · ${h.kim}${h.izoh ? ' · ' + h.izoh : ''}` }))} />
            </section>
            <div className="xs muted">Vazirlik tahlilchisi maʼlumotni oʻzgartira olmaydi — holat oʻzgarishi UKR markazi qarori bilan.</div>
          </div>
        )}
      </Modal>
    </>
  )
}
