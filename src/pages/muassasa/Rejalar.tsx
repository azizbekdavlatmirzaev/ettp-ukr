import { useMemo, useState } from 'react'
import { ClipboardCheck, Clock, CheckCircle2, CalendarClock } from 'lucide-react'
import * as A from '@/domain/amallar'
import type { Reja } from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Bar, Card, CardH, DL, Empty, Holat, KPI, PageHeader, Tabs } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { mutNomi } from '@/shared/hooks'
import { holat as holatMatn } from '@/lib/holat'
import { useMuassasa } from './_umumiy'
import { RejaKarta, rejaQoplash } from './_RejaKarta'

type Tab = 'kutilmoqda' | 'tasdiqlangan' | 'barchasi'

export default function MuassasaRejalar() {
  const { db, mid, bugun, yil } = useMuassasa()
  const [tab, setTab] = useState<Tab>('kutilmoqda')
  const [ochiq, setOchiq] = useState<string | null>(null)
  const xodimlar = useMemo(() => new Set(A.muassasaXodimlari(db, mid, bugun).map((m) => m.personId)), [db, mid, bugun])
  // muassasa faqat oʻz (hozir ishlayotgan) xodimlarining yuborilgan rejalarini koʻradi; qoralama — xodimning shaxsiy ishi
  const barcha = useMemo(() => db.rejalar.filter((r) => r.muassasaId === mid && xodimlar.has(r.personId) && r.holat !== 'qoralama'), [db.rejalar, mid, xodimlar])
  const kut = barcha.filter((r) => r.holat === 'yuborildi')
  const tas = barcha.filter((r) => ['tasdiqlandi', 'bajarilmoqda', 'yopildi'].includes(r.holat))
  const rows = tab === 'kutilmoqda' ? kut : tab === 'tasdiqlangan' ? tas : barcha
  const md = db.sozlamalar.muddatlar
  const tanlangan = ochiq ? db.rejalar.find((r) => r.id === ochiq) ?? null : null
  const fio = (r: Reja) => { const s = A.shaxs(db, r.personId); return s ? A.toliqFio(s) : '—' }
  const yangiXodimlar = A.muassasaXodimlari(db, mid, bugun).filter((m) => m.dan.slice(0, 4) === String(yil))

  return (
    <>
      <PageHeader title="Rivojlanish rejalari" desc="Xodimlar yuborgan rejalarni koʻrib tasdiqlang yoki izoh bilan qaytaring (TZ 4.2.3)." source={`Manba: UKR quyi tizimi — rejalar · yangilangan: ${sanaVaqt(barcha.map((r) => r.yangilangan).sort().pop())}`} />
      <div className="grid g4 mb-16">
        <KPI icon={<Clock />} label="Tasdiqlash kutilmoqda" value={kut.length} ton="warn" onClick={() => setTab('kutilmoqda')} />
        <KPI icon={<CheckCircle2 />} label="Tasdiqlangan" value={tas.length} ton="ok" delay={0.05} onClick={() => setTab('tasdiqlangan')} />
        <KPI icon={<ClipboardCheck />} label="Jami rejalar" value={barcha.length} delay={0.1} onClick={() => setTab('barchasi')} />
        <KPI icon={<CalendarClock />} label="Keyingi yil rejasi muddati" value={`${md.rejaYillik.split('-').reverse().join('.')}`} ton="teal" delay={0.15} hint={`Yangi xodim — ${md.rejaYangiXodim} kun ichida`} />
      </div>

      <div className="grid g-main">
        <div className="col gap-16">
          <Tabs id="rej" value={tab} onChange={setTab} tabs={[{ v: 'kutilmoqda', l: 'Tasdiqlash kutilmoqda', n: kut.length }, { v: 'tasdiqlangan', l: 'Tasdiqlangan', n: tas.length }, { v: 'barchasi', l: 'Barchasi', n: barcha.length }]} />
          <DataTable<Reja>
            rows={rows}
            exportName="muassasa-rejalar"
            onRow={(r) => setOchiq(r.id)}
            search={(r) => `${fio(r)} ${r.yil}`}
            empty={<Empty icon={<ClipboardCheck />} title={tab === 'kutilmoqda' ? 'Tasdiqlash kutayotgan reja yoʻq' : 'Rejalar yoʻq'}>Xodim rejani yuborganda bu yerda paydo boʻladi va sizga bildirishnoma keladi.</Empty>}
            cols={[
              { k: 'fio', l: 'Xodim', r: (r) => <div><div className="b small">{fio(r)}</div><div className="xs muted">{mutNomi(A.shaxs(db, r.personId)?.mutaxassislikId)}</div></div>, sort: fio, excel: fio },
              { k: 'yil', l: 'Yil', r: (r) => r.yil, sort: (r) => r.yil, excel: (r) => r.yil },
              { k: 'v', l: 'Versiya', r: (r) => `v${r.versiya}`, excel: (r) => r.versiya },
              { k: 'band', l: 'Bandlar', align: 'right', r: (r) => r.bandlar.length, excel: (r) => r.bandlar.length },
              { k: 'qop', l: 'Talab qoplanishi', w: 150, r: (r) => { const k = rejaQoplash(db, r); return <div><div className="xs muted">{k.jami} / {k.T} kredit</div><Bar v={k.jami} max={k.T || 1} thin ton={k.jami >= k.T ? 'ok' : 'warn'} /></div> }, sort: (r) => { const k = rejaQoplash(db, r); return k.T ? k.jami / k.T : 1 }, excel: (r) => { const k = rejaQoplash(db, r); return `${k.jami}/${k.T}` } },
              { k: 'baj', l: 'Bajarilgan', align: 'right', r: (r) => `${r.bandlar.filter((b) => b.bajarildi).length}/${r.bandlar.length}`, excel: (r) => `${r.bandlar.filter((b) => b.bajarildi).length}/${r.bandlar.length}` },
              { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.holat} />, sort: (r) => r.holat, excel: (r) => holatMatn(r.holat)[0] },
              { k: 'yang', l: 'Yangilangan', r: (r) => <span className="xs nowrap">{sanaVaqt(r.yangilangan)}</span>, sort: (r) => r.yangilangan, excel: (r) => sanaVaqt(r.yangilangan) },
            ]}
          />
        </div>
        <div className="col gap-16">
          <Card>
            <CardH icon={<CalendarClock />} title="Reja muddatlari" sub="Administrator sozlamalaridan" />
            <DL items={[
              ['Keyingi yil rejasi', `har yili ${md.rejaYillik.split('-').reverse().join('.')} gacha`],
              ['Yangi ishga kelgan xodim', `${md.rejaYangiXodim} kalendar kun ichida`],
              ['Kim tasdiqlaydi', 'Faqat asosiy ish beruvchi'],
            ]} />
          </Card>
          <Card delay={0.05}>
            <CardH title="Yangi xodimlar" sub={`${yil}-yilda ishga kelganlar — reja muddati`} />
            {yangiXodimlar.length === 0 ? <div className="small muted">Bu yil yangi xodim yoʻq.</div> : yangiXodimlar.map((m) => {
              const s = A.shaxs(db, m.personId)!
              const muddat = new Date(m.dan + 'T12:00:00')
              muddat.setDate(muddat.getDate() + md.rejaYangiXodim)
              const bor = db.rejalar.some((r) => r.personId === s.id && r.holat !== 'qoralama')
              return (
                <div key={m.id} className="li">
                  <div className="grow"><div className="small b">{A.toliqFio(s)}</div><div className="xs muted">{m.lavozim} · reja muddati: {muddat.toISOString().slice(0, 10).split('-').reverse().join('.')}</div></div>
                  <Holat ton={bor ? 'ok' : 'warn'}>{bor ? 'Reja bor' : 'Reja yoʻq'}</Holat>
                </div>
              )
            })}
          </Card>
          <Alert ton="info">Rejani oʻzgartirish yangi versiya ochadi; avvalgi versiya, tashabbuskor va tasdiqlovchi saqlanadi.</Alert>
        </div>
      </div>
      {tanlangan && <RejaKarta r={tanlangan} onClose={() => setOchiq(null)} />}
    </>
  )
}
