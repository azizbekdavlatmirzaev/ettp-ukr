import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Radar, RefreshCw, SlidersHorizontal, Star } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Button, Card, CardH, Field, Holat, Inp, KPI, Modal, PageHeader, Tabs } from '@/ui'
import { foiz, sanaVaqt } from '@/lib/format'
import { SIGNAL, holat as holatMatn } from '@/lib/holat'
import { useMarkaz, manba, provQisqa, userQisqa, RolTugma, RAH_SABAB } from './_parts'
import { SignalDrawer } from './_sifatDrawer'

const SH: T.Signal['holat'][] = ['yangi', 'tekshiruvda', 'yopildi', 'asossiz']

export default function MarkazSifat() {
  const { db, rahbar, amal, ijro, ok, toast } = useMarkaz()
  const [tab, setTab] = useState<'signal' | 'sifat'>('signal')
  const [tanl, setTanl] = useState<string>()
  const [chek, setChek] = useState<{ kopSertifikatKunda: number; birXilBallFoiz: number }>()
  const s = db.signallar.find((x) => x.id === tanl)
  const ch = db.sozlamalar.signalChegaralari

  const hisobla = () => {
    const n = amal(A.signallarniHisobla)
    if (n !== undefined) toast({ turi: n ? 'warn' : 'ok', sarlavha: 'Signallar hisoblandi', matn: n ? `${n} ta yangi signal aniqlandi.` : 'Yangi signal aniqlanmadi — barcha mezonlar meʼyorda.' })
  }
  const chegaraSaqla = () => {
    if (!chek) return
    const r = ijro(A.sozlamaSaqla, { signalChegaralari: chek })
    if (r.ok) { ok('Signal chegaralari yangilandi (auditga yozildi).'); setChek(undefined) }
  }

  const sifat = useMemo(() => db.provayderlar.map((p) => {
    const oqimlar = new Set(db.oqimlar.filter((o) => o.providerId === p.id).map((o) => o.id))
    const ys = new Set(db.yozilishlar.filter((y) => oqimlar.has(y.oqimId)).map((y) => y.id))
    const nat = db.natijalar.filter((n) => ys.has(n.yozilishId) && n.holat !== 'qoralama')
    return { id: p.id, p, oqim: oqimlar.size, natija: nat.length, otdi: foiz(nat.filter((n) => n.natija === 'otdi').length, nat.length), signal: db.signallar.filter((x) => x.providerId === p.id).length, ochiqSignal: db.signallar.filter((x) => x.providerId === p.id && ['yangi', 'tekshiruvda'].includes(x.holat)).length }
  }), [db])

  return (
    <>
      <PageHeader title="Sifat nazorati" desc="Avtomatik signallar → tekshiruv ishi → chora va ijro. Signal provayder holatini avtomatik oʻzgartirmaydi." source={manba('Sifat signallari (tungi hisob 02:00)')}
        actions={<Button v="primary" icon={<RefreshCw />} onClick={hisobla}>Signallarni hozir hisoblash</Button>} />
      <Alert ton="warn" title="Signal huquqbuzarlik isboti emas">U faqat eʼtibor talab qiladigan holatni koʻrsatadi; xulosa tekshiruv ishi va dalillar asosida chiqariladi.</Alert>
      <div className="grid g4 mt-16 mb-16">
        <KPI icon={<Radar />} label="Yangi signallar" value={db.signallar.filter((x) => x.holat === 'yangi').length} ton="err" />
        <KPI icon={<Radar />} label="Tekshiruvda" value={db.signallar.filter((x) => x.holat === 'tekshiruvda').length} ton="warn" delay={0.05} />
        <KPI icon={<Radar />} label="Yopilgan / asossiz" value={db.signallar.filter((x) => ['yopildi', 'asossiz'].includes(x.holat)).length} ton="ok" delay={0.1} />
        <Card delay={0.15}>
          <CardH icon={<SlidersHorizontal />} title="Chegaralar" right={<RolTugma size="xs" v="ghost" ruxsat={rahbar} sabab={RAH_SABAB} onClick={() => setChek({ ...ch })}>Oʻzgartirish</RolTugma>} />
          <div className="small">Kuniga sertifikat: <b>≥ {ch.kopSertifikatKunda}</b></div>
          <div className="small">Bir xil ball: <b>≥ {ch.birXilBallFoiz}%</b></div>
          <div className="xs muted mt-4">Asosiy joy: <Link to="/admin/sozlamalar">administrator sozlamalari</Link></div>
        </Card>
      </div>
      <div className="mb-16">
        <Tabs id="sifat-tab" value={tab} onChange={setTab} tabs={[{ v: 'signal', l: 'Signallar', n: db.signallar.length }, { v: 'sifat', l: 'Provayderlar sifat koʻrsatkichlari' }]} />
      </div>
      {tab === 'signal' ? (
        <DataTable
          rows={db.signallar}
          exportName="sifat-signallari"
          onRow={(r) => setTanl(r.id)}
          search={(r) => `${r.tavsif} ${provQisqa(db, r.providerId)}`}
          filters={[
            { k: 't', l: 'Turi', options: Object.entries(SIGNAL).map(([v, l]) => ({ v, l })), get: (r) => r.turi },
            { k: 'h', l: 'Holat', options: SH.map((v) => ({ v, l: holatMatn(v)[0] })), get: (r) => r.holat },
            { k: 'p', l: 'Provayder', options: db.provayderlar.map((p) => ({ v: p.id, l: p.qisqa })), get: (r) => r.providerId },
          ]}
          cols={[
            { k: 'turi', l: 'Signal', r: (r) => <span className="small b">{SIGNAL[r.turi]}</span>, excel: (r) => SIGNAL[r.turi] },
            { k: 'p', l: 'Provayder', r: (r) => provQisqa(db, r.providerId), excel: (r) => provQisqa(db, r.providerId) },
            { k: 'tavsif', l: 'Tavsif', r: (r) => <span className="xs">{r.tavsif}</span>, excel: (r) => r.tavsif },
            { k: 'sana', l: 'Aniqlangan', r: (r) => <span className="small nowrap">{sanaVaqt(r.aniqlangan)}</span>, sort: (r) => r.aniqlangan, excel: (r) => r.aniqlangan },
            { k: 'masul', l: 'Masʼul', r: (r) => <span className="small">{r.ish?.masul ? userQisqa(db, r.ish.masul) : '—'}</span>, excel: (r) => userQisqa(db, r.ish?.masul) },
            { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.holat} />, sort: (r) => SH.indexOf(r.holat), excel: (r) => holatMatn(r.holat)[0] },
          ]}
          initialSort={{ k: 'holat', dir: 1 }}
        />
      ) : (
        <DataTable
          rows={sifat}
          exportName="provayderlar-sifati"
          search={(r) => r.p.nomi}
          initialSort={{ k: 'sig', dir: -1 }}
          cols={[
            { k: 'p', l: 'Provayder', r: (r) => <div><div className="small b">{r.p.qisqa}</div><div className="xs muted">{r.p.nomi}</div></div>, sort: (r) => r.p.qisqa, excel: (r) => r.p.nomi },
            { k: 'h', l: 'Holat', r: (r) => <Holat h={r.p.holat} />, excel: (r) => holatMatn(r.p.holat)[0] },
            { k: 'rey', l: 'Soʻrovnoma (1–5)', align: 'right', r: (r) => r.p.reyting ? <span className="row gap-4" style={{ justifyContent: 'flex-end' }}><Star size={13} color="var(--amber-500)" />{r.p.reyting.toFixed(1)}</span> : '—', sort: (r) => r.p.reyting ?? 0, excel: (r) => r.p.reyting },
            { k: 'oq', l: 'Oqimlar', align: 'right', r: (r) => r.oqim, sort: (r) => r.oqim, excel: (r) => r.oqim },
            { k: 'nat', l: 'Natijalar', align: 'right', r: (r) => r.natija, sort: (r) => r.natija, excel: (r) => r.natija },
            { k: 'otdi', l: 'Oʻtganlar %', align: 'right', r: (r) => (r.natija ? `${r.otdi}%` : '—'), sort: (r) => r.otdi, excel: (r) => r.otdi },
            { k: 'sig', l: 'Signallar (ochiq)', align: 'right', r: (r) => <span style={{ color: r.ochiqSignal ? 'var(--err)' : undefined }}>{r.signal} ({r.ochiqSignal})</span>, sort: (r) => r.signal, excel: (r) => r.signal },
          ]}
        />
      )}
      <SignalDrawer s={s} onClose={() => setTanl(undefined)} />
      <Modal open={!!chek} onClose={() => setChek(undefined)} title="Signal chegaralari" footer={<><Button v="ghost" onClick={() => setChek(undefined)}>Bekor qilish</Button><Button v="primary" onClick={chegaraSaqla}>Saqlash</Button></>}>
        {chek && (
          <div className="form-grid">
            <Field label="Bir kunda sertifikatlar (≥)"><Inp type="number" min={1} value={chek.kopSertifikatKunda} onChange={(e) => setChek({ ...chek, kopSertifikatKunda: Number(e.target.value) })} /></Field>
            <Field label="Bir xil ball ulushi, % (≥)"><Inp type="number" min={1} max={100} value={chek.birXilBallFoiz} onChange={(e) => setChek({ ...chek, birXilBallFoiz: Number(e.target.value) })} /></Field>
          </div>
        )}
      </Modal>
    </>
  )
}
