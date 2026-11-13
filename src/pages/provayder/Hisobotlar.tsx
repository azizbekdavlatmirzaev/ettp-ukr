import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileDown, Users, CheckCircle2, XCircle, Award, Star, BarChart3 } from 'lucide-react'
import { Button, Card, CardH, KPI, PageHeader, Seg, Holat } from '@/ui'
import { DataTable, type Col } from '@/ui/DataTable'
import { BarCh } from '@/ui/charts'
import * as A from '@/domain/amallar'
import { umumiyPdf } from '@/lib/eksport'
import { sana } from '@/lib/format'
import { manba, oxirgiVersiya, useProv } from './_umumiy'
import { oqimStat } from './_OqimHisobot'

type St = ReturnType<typeof oqimStat>
interface Qator extends St { id: string; nomi: string; kod: string; sana?: string; holat?: string; oqimSoni?: number }

const jamla = (a: St[]): St => {
  const s = a.reduce((x, y) => ({ arizalar: x.arizalar + y.arizalar, qabul: x.qabul + y.qabul, tugatgan: x.tugatgan + y.tugatgan, otmagan: x.otmagan + y.otmagan, dav: x.dav + y.dav * y.qabul, sorov: x.sorov + y.sorov * y.sorSoni, sorSoni: x.sorSoni + y.sorSoni, sert: x.sert + y.sert, kredit: x.kredit + y.kredit }), { arizalar: 0, qabul: 0, tugatgan: 0, otmagan: 0, dav: 0, sorov: 0, sorSoni: 0, sert: 0, kredit: 0 })
  return { ...s, dav: s.qabul ? Math.round(s.dav / s.qabul) : 0, sorov: s.sorSoni ? Math.round((s.sorov / s.sorSoni) * 10) / 10 : 0 }
}

export default function ProvayderHisobotlar() {
  const { db, p, oqimlar, dasturlar, toast } = useProv()
  const nav = useNavigate()
  const [kesim, setKesim] = useState<'oqim' | 'dastur'>('oqim')
  const oq = useMemo<Qator[]>(() => oqimlar.map((o) => ({ id: o.id, nomi: A.versiya(db, o.versiyaId)?.nomi ?? '', kod: o.kod, sana: o.boshlanish, holat: o.holat, ...oqimStat(db, o) })), [db, oqimlar])
  const ds = useMemo<Qator[]>(() => dasturlar.map((d) => {
    const ids = new Set(d.versiyalar)
    const qs = oq.filter((x) => ids.has(oqimlar.find((o) => o.id === x.id)!.versiyaId))
    return { id: d.id, nomi: oxirgiVersiya(db, d).nomi, kod: d.kod, oqimSoni: qs.length, ...jamla(qs) }
  }), [db, dasturlar, oq, oqimlar])
  const jami = jamla(oq)
  const rows = kesim === 'oqim' ? oq : ds
  const grafik = [...ds].filter((d) => d.qabul).sort((a, b) => b.qabul - a.qabul).slice(0, 8).map((d) => ({ x: d.nomi.length > 26 ? d.nomi.slice(0, 25) + '…' : d.nomi, tugatgan: d.tugatgan, otmagan: d.otmagan, jarayonda: d.qabul - d.tugatgan - d.otmagan }))

  const cols: Col<Qator>[] = [
    { k: 'nomi', l: kesim === 'oqim' ? 'Oqim' : 'Dastur', sort: (r) => r.nomi, excel: (r) => `${r.kod} ${r.nomi}`, r: (r) => <div style={{ maxWidth: 300 }}><div className="b small">{r.nomi}</div><div className="xs muted mono">{r.kod}{r.sana ? ` · ${sana(r.sana)}` : ` · ${r.oqimSoni} ta oqim`}</div></div> },
    ...(kesim === 'oqim' ? [{ k: 'holat', l: 'Holat', excel: (r: Qator) => r.holat, r: (r: Qator) => <Holat h={r.holat!} /> }] : []),
    { k: 'qabul', l: 'Qabul', align: 'right', sort: (r) => r.qabul, excel: (r) => r.qabul, r: (r) => r.qabul },
    { k: 'tug', l: 'Tugatgan', align: 'right', sort: (r) => r.tugatgan, excel: (r) => r.tugatgan, r: (r) => r.tugatgan },
    { k: 'otm', l: 'Oʻtmagan', align: 'right', sort: (r) => r.otmagan, excel: (r) => r.otmagan, r: (r) => r.otmagan },
    { k: 'dav', l: 'Davomat', align: 'right', sort: (r) => r.dav, excel: (r) => r.dav, r: (r) => (r.qabul ? `${r.dav}%` : '—') },
    { k: 'sert', l: 'Sertifikat', align: 'right', sort: (r) => r.sert, excel: (r) => r.sert, r: (r) => r.sert },
    { k: 'kr', l: 'Kredit berilgan', align: 'right', sort: (r) => r.kredit, excel: (r) => r.kredit, r: (r) => <b>{r.kredit}</b> },
    { k: 'sor', l: 'Soʻrovnoma', align: 'right', sort: (r) => r.sorov, excel: (r) => r.sorov, r: (r) => (r.sorSoni ? `${r.sorov} ★` : '—') },
  ]

  const pdf = async () => {
    await umumiyPdf(`provayder-hisobot-${p.id}`, `${p.nomi}: oʻquv faoliyati hisoboti`, [
      { t: 'Jami koʻrsatkichlar', qatorlar: [`Qabul qilingan: ${jami.qabul}`, `Tugatgan: ${jami.tugatgan}`, `Oʻtmagan: ${jami.otmagan}`, `Oʻrtacha davomat: ${jami.dav}%`, `Sertifikatlar: ${jami.sert}`, `Berilgan kredit: ${jami.kredit}`, `Soʻrovnoma: ${jami.sorov} (${jami.sorSoni} javob)`] },
      { t: kesim === 'oqim' ? 'Oqimlar boʻyicha' : 'Dasturlar boʻyicha', qatorlar: rows.filter((r) => r.arizalar).map((r) => `${r.kod} ${r.nomi}: qabul ${r.qabul}, tugatgan ${r.tugatgan}, oʻtmagan ${r.otmagan}, davomat ${r.dav}%, sertifikat ${r.sert}, kredit ${r.kredit}`) },
    ])
    toast({ turi: 'ok', matn: 'PDF hisobot yaratildi va yuklandi.' })
  }

  return (
    <>
      <PageHeader title="Hisobotlar" desc="Dastur va oqimlar kesimida qabul, tugatish, davomat, sertifikat, kredit va tinglovchilar bahosi." source={manba('Natijalar, Kredit jurnali, soʻrovnomalar')} actions={<Button v="primary" icon={<FileDown />} onClick={pdf}>PDF hisobot</Button>} />
      <div className="grid mb-16" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <KPI icon={<Users />} label="Qabul qilingan" value={jami.qabul} />
        <KPI icon={<CheckCircle2 />} label="Tugatgan" value={jami.tugatgan} ton="ok" delay={0.04} />
        <KPI icon={<XCircle />} label="Oʻtmagan" value={jami.otmagan} ton="err" delay={0.08} />
        <KPI icon={<Award />} label="Sertifikatlar" value={jami.sert} ton="teal" hint={`${jami.kredit} kredit berilgan`} delay={0.12} />
        <KPI icon={<Star />} label="Soʻrovnoma" value={jami.sorov} kasr={1} suffix="/ 5" hint={`${jami.sorSoni} ta javob`} delay={0.16} />
      </div>
      <Card className="mb-16">
        <CardH icon={<BarChart3 />} title="Dasturlar boʻyicha natijalar" sub="Eng koʻp tinglovchili 8 ta dastur" />
        <BarCh data={grafik} keys={['tugatgan', 'otmagan', 'jarayonda']} names={{ tugatgan: 'Tugatgan', otmagan: 'Oʻtmagan', jarayonda: 'Jarayonda' }} stacked horizontal height={Math.max(220, grafik.length * 38)} colors={['#3ba776', '#d1495b', '#0fa3a3']} />
      </Card>
      <DataTable
        key={kesim}
        rows={rows}
        cols={cols}
        title={<Seg id="his-k" value={kesim} onChange={setKesim} items={[{ v: 'oqim' as const, l: 'Oqimlar kesimi' }, { v: 'dastur' as const, l: 'Dasturlar kesimi' }]} />}
        search={(r) => `${r.kod} ${r.nomi}`}
        exportName={`provayder-hisobot-${kesim}`}
        initialSort={{ k: 'qabul', dir: -1 }}
        onRow={(r) => nav(kesim === 'oqim' ? `/provayder/oqimlar/${r.id}?tab=hisobot` : `/provayder/dasturlar/${r.id}`)}
      />
    </>
  )
}
