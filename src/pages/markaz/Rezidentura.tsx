import { useMemo, useState } from 'react'
import { Hospital, Users, ClipboardList, NotebookPen } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Bar, Card, CardH, DL, Holat, KPI, Modal, PageHeader, Tabs } from '@/ui'
import { BarCh, Donut, Legenda } from '@/ui/charts'
import { sana } from '@/lib/format'
import { holat as holatMatn } from '@/lib/holat'
import { hududNomi, mutNomi } from '@/shared/hooks'
import { useMarkaz, manba, shaxsQisqa, userFio, Sec } from './_parts'

type Tab = 'baza' | 'kvota' | 'rezident' | 'monitoring'
const MOLIYA: Record<string, string> = { davlat: 'Davlat granti', maqsadli: 'Maqsadli', kontrakt: 'Kontrakt' }

export default function MarkazRezidentura() {
  const { db } = useMarkaz()
  const [tab, setTab] = useState<Tab>('rezident')
  const [tanl, setTanl] = useState<string>()
  const logFoiz = useMemo(() => new Map(db.rezidentlar.map((r) => {
    const h = A.logbookHolati(db, r.id)
    return [r.id, h.length ? Math.round(h.reduce((s, k) => s + k.foiz, 0) / h.length) : 0]
  })), [db])
  const band = (bazaId: string) => db.rotatsiyalar.filter((r) => r.bazaId === bazaId && r.holat === 'davom').length
  const r = db.rezidentlar.find((x) => x.id === tanl)
  const kvotaGrafik = useMemo(() => {
    const m = new Map<string, Record<string, number | string>>()
    db.kvotalar.forEach((k) => {
      const x = m.get(k.mutaxassislikId) ?? { x: mutNomi(k.mutaxassislikId), davlat: 0, maqsadli: 0, kontrakt: 0 }
      x[k.turi] = Number(x[k.turi]) + k.soni
      m.set(k.mutaxassislikId, x)
    })
    return Array.from(m.values())
  }, [db.kvotalar])
  const holatlar = useMemo(() => {
    const m = new Map<string, number>()
    db.rezidentlar.forEach((x) => m.set(x.holat, (m.get(x.holat) ?? 0) + 1))
    return Array.from(m.entries()).map(([h, v]) => ({ name: holatMatn(h)[0], value: v }))
  }, [db.rezidentlar])

  return (
    <>
      <PageHeader title="Rezidentura" desc="Klinik bazalar, kvotalar, rezidentlar va logbook monitoringi (3-bosqich). UKR markazi uchun — kuzatish va hisobot." source={manba('Rezidentura moduli, klinik bazalar shartnomalari')} />
      <div className="grid g4 mb-16">
        <KPI icon={<Users />} label="Rezidentlar" value={db.rezidentlar.length} />
        <KPI icon={<Hospital />} label="Klinik bazalar" value={db.klinikBazalar.length} ton="teal" delay={0.05} />
        <KPI icon={<ClipboardList />} label="Kvotalar (jami oʻrin)" value={db.kvotalar.reduce((s, k) => s + k.soni, 0)} delay={0.1} />
        <KPI icon={<NotebookPen />} label="Logbook: tasdiq kutmoqda" value={db.logbook.filter((l) => l.holat === 'kutilmoqda').length} ton="warn" delay={0.15} />
      </div>
      <div className="mb-16">
        <Tabs id="rez-tab" value={tab} onChange={setTab} tabs={[{ v: 'baza', l: 'Klinik bazalar', n: db.klinikBazalar.length }, { v: 'kvota', l: 'Kvotalar', n: db.kvotalar.length }, { v: 'rezident', l: 'Rezidentlar', n: db.rezidentlar.length }, { v: 'monitoring', l: 'Monitoring' }]} />
      </div>
      {tab === 'baza' && (
        <DataTable rows={db.klinikBazalar} exportName="klinik-bazalar" search={(b) => b.nomi}
          cols={[
            { k: 'nomi', l: 'Nomi', r: (b) => <span className="small b">{b.nomi}</span>, excel: (b) => b.nomi },
            { k: 'hudud', l: 'Hudud', r: (b) => hududNomi(b.hududId), excel: (b) => hududNomi(b.hududId) },
            { k: 'mut', l: 'Mutaxassisliklar', r: (b) => <span className="xs">{b.mutaxassisliklar.map(mutNomi).join(', ')}</span>, excel: (b) => b.mutaxassisliklar.map(mutNomi).join(', ') },
            { k: 'sig', l: 'Sigʻim / band', r: (b) => <div style={{ minWidth: 110 }}><div className="xs">{band(b.id)} / {b.sigim}</div><Bar thin v={band(b.id)} max={b.sigim} /></div>, excel: (b) => `${band(b.id)}/${b.sigim}` },
            { k: 'sh', l: 'Shartnoma muddati', r: (b) => <span className="small nowrap">{sana(b.shartnomaMuddati)}</span>, sort: (b) => b.shartnomaMuddati, excel: (b) => b.shartnomaMuddati },
          ]} />
      )}
      {tab === 'kvota' && (
        <div className="col gap-16">
          <Card>
            <CardH title="Kvotalar mutaxassislik va moliyalash turi boʻyicha" />
            <BarCh data={kvotaGrafik} keys={['davlat', 'maqsadli', 'kontrakt']} names={MOLIYA} stacked height={230} />
          </Card>
          <DataTable rows={db.kvotalar} exportName="rezidentura-kvotalari"
            cols={[
              { k: 'mut', l: 'Mutaxassislik', r: (k) => <span className="b small">{mutNomi(k.mutaxassislikId)}</span>, excel: (k) => mutNomi(k.mutaxassislikId) },
              { k: 'tash', l: 'Tashkilot', r: (k) => k.tashkilot, excel: (k) => k.tashkilot },
              { k: 'yil', l: 'Yil', r: (k) => k.yil, excel: (k) => k.yil },
              { k: 'turi', l: 'Turi', r: (k) => <span className="tag">{MOLIYA[k.turi]}</span>, excel: (k) => MOLIYA[k.turi] },
              { k: 'soni', l: 'Oʻrinlar', align: 'right', r: (k) => <b>{k.soni}</b>, sort: (k) => k.soni, excel: (k) => k.soni },
              { k: 'v', l: 'Versiya', r: (k) => `v${k.versiya}`, excel: (k) => k.versiya },
            ]} />
        </div>
      )}
      {tab === 'rezident' && (
        <DataTable rows={db.rezidentlar} exportName="rezidentlar" onRow={(x) => setTanl(x.id)} search={(x) => shaxsQisqa(db, x.personId)}
          filters={[{ k: 'h', l: 'Holat', options: ['oqimoqda', 'akademik_tatil', 'chetlashtirilgan', 'bitirgan'].map((v) => ({ v, l: holatMatn(v)[0] })), get: (x) => x.holat }]}
          cols={[
            { k: 'fio', l: 'Rezident', r: (x) => <span className="b small">{shaxsQisqa(db, x.personId)}</span>, excel: (x) => shaxsQisqa(db, x.personId) },
            { k: 'mut', l: 'Mutaxassislik', r: (x) => mutNomi(x.mutaxassislikId), excel: (x) => mutNomi(x.mutaxassislikId) },
            { k: 'kurs', l: 'Kurs', r: (x) => `${x.kurs}-kurs`, sort: (x) => x.kurs, excel: (x) => x.kurs },
            { k: 'rah', l: 'Klinik rahbar', r: (x) => <span className="small">{userFio(db, x.rahbarId)}</span>, excel: (x) => userFio(db, x.rahbarId) },
            { k: 'mol', l: 'Moliya', r: (x) => <span className="tag">{MOLIYA[x.moliya]}</span>, excel: (x) => MOLIYA[x.moliya] },
            { k: 'log', l: 'Logbook', r: (x) => <div style={{ minWidth: 110 }}><div className="xs">{logFoiz.get(x.id)}%</div><Bar thin v={logFoiz.get(x.id) ?? 0} ton={(logFoiz.get(x.id) ?? 0) >= 80 ? 'ok' : undefined} /></div>, sort: (x) => logFoiz.get(x.id) ?? 0, excel: (x) => logFoiz.get(x.id) },
            { k: 'h', l: 'Holat', r: (x) => <Holat h={x.holat} />, excel: (x) => holatMatn(x.holat)[0] },
          ]} />
      )}
      {tab === 'monitoring' && (
        <div className="grid g2">
          <Card>
            <CardH title="Logbook bajarilishi (oʻrtacha %)" sub="Minimal koʻnikmalar soniga nisbatan" />
            <BarCh data={db.rezidentlar.map((x) => ({ x: shaxsQisqa(db, x.personId), foiz: logFoiz.get(x.id) ?? 0 }))} keys={['foiz']} names={{ foiz: 'Bajarilgan, %' }} height={230} />
          </Card>
          <Card>
            <CardH title="Rezidentlar holati" />
            <Donut data={holatlar} height={190} center={<div className="stat-big">{db.rezidentlar.length}</div>} />
            <Legenda items={holatlar.map((h) => ({ l: h.name, v: h.value }))} />
          </Card>
          <Card>
            <CardH title="Rotatsiyalar" sub="Reja / davom / yakunlangan" />
            <BarCh data={(['reja', 'davom', 'yakunlangan'] as T.Rotatsiya['holat'][]).map((h) => ({ x: holatMatn(h)[0], soni: db.rotatsiyalar.filter((r) => r.holat === h).length }))} keys={['soni']} names={{ soni: 'Rotatsiyalar' }} height={200} />
          </Card>
          <Card>
            <CardH title="Baholar" sub="Joriy, oraliq, yakuniy" />
            <BarCh data={(['joriy', 'oraliq', 'yakuniy'] as const).map((t) => { const b = db.rezidentBaholar.filter((x) => x.turi === t); return { x: t, ball: b.length ? Math.round(b.reduce((s, x) => s + x.ball, 0) / b.length) : 0 } })} keys={['ball']} names={{ ball: 'Oʻrtacha ball' }} height={200} />
          </Card>
        </div>
      )}
      <Modal open={!!r} onClose={() => setTanl(undefined)} drawer title={r ? shaxsQisqa(db, r.personId) : ''} sub={r && <span className="row gap-6"><Holat h={r.holat} /><span className="small">{mutNomi(r.mutaxassislikId)} · {r.kurs}-kurs</span></span>}>
        {r && (() => {
          const h = A.logbookHolati(db, r.id)
          const att = A.attestatsiyagaRuxsat(db, r.id)
          return (
            <>
              <DL items={[['Tashkilot', r.tashkilot], ['Davr', `${sana(r.boshlangan)} — ${sana(r.tugash)}`], ['Klinik rahbar', userFio(db, r.rahbarId)], ['Moliyalash', MOLIYA[r.moliya]]]} />
              <Alert ton={att.ruxsat ? 'ok' : 'warn'} title={att.ruxsat ? 'Yakuniy attestatsiyaga ruxsat bor' : 'Attestatsiyaga hali ruxsat yoʻq'}>{att.ruxsat ? 'Barcha majburiy koʻnikmalar minimal sonda bajarilgan.' : `Yetishmaydi: ${att.yetmaydi.map((k) => k.kod).join(', ')}`}</Alert>
              <Sec icon={<NotebookPen />} title="Logbook koʻnikmalar boʻyicha">
                {h.map((k) => (
                  <div key={k.kod} className="li" style={{ display: 'block' }}>
                    <div className="row between"><span className="small"><b>{k.kod}</b> {k.nomi} {k.majburiy && <span className="tag">majburiy</span>}</span><span className="xs muted nowrap">{k.tasdiqlangan}/{k.minimal}{k.kutilmoqda ? ` (+${k.kutilmoqda})` : ''}</span></div>
                    <Bar thin v={k.foiz} ton={k.foiz >= 100 ? 'ok' : undefined} />
                  </div>
                ))}
              </Sec>
              <Sec title="Rotatsiyalar">
                {db.rotatsiyalar.filter((x) => x.rezidentId === r.id).map((x) => (
                  <div key={x.id} className="li"><div className="grow"><div className="small b">{x.bolim}</div><div className="xs muted">{db.klinikBazalar.find((b) => b.id === x.bazaId)?.nomi} · {sana(x.dan)} — {sana(x.gacha)}</div></div><Holat h={x.holat} /></div>
                ))}
              </Sec>
            </>
          )
        })()}
      </Modal>
    </>
  )
}
