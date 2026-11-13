import { useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { DataTable } from '@/ui/DataTable'
import { Alert, PageHeader, Tabs } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { KURS_TURI, MANBA, TADBIR, YONALISH } from '@/lib/holat'
import { useMarkaz, manba, shaxsQisqa } from './_parts'
import { YozuvDrawer } from './_jurnalTaklif'
import { TekshiruvTab, TuzatishTab, SolishtirishTab, YilTab } from './_jurnalTabs'

type Tab = 'jurnal' | 'tekshiruv' | 'tuzatish' | 'solishtirish' | 'yil'

export default function MarkazJurnal() {
  const { db } = useMarkaz()
  const [tab, setTab] = useState<Tab>('jurnal')
  const [tanl, setTanl] = useState<string>()
  const rows = useMemo(() => [...db.jurnal].sort((a, b) => b.seq - a.seq), [db.jurnal])
  const seqById = useMemo(() => new Map(db.jurnal.map((j) => [j.id, j.seq])), [db.jurnal])
  const bekorlar = useMemo(() => new Map(db.jurnal.filter((j) => j.bekorQilinganId).map((j) => [j.bekorQilinganId!, j.seq])), [db.jurnal])
  const qv = (id: string) => db.qoidalar.find((q) => q.id === id)?.versiya ?? id
  const yillar = Array.from(new Set(db.jurnal.map((j) => j.yil))).sort().map((y) => ({ v: String(y), l: String(y) }))
  const y = db.jurnal.find((j) => j.id === tanl)

  return (
    <>
      <PageHeader title="Kredit jurnali" desc="Har bir kredit harakati: berish, tuzatish, bekor qilish, oʻtkazish, xorijiy tan olish. Xodim balansi faqat jurnaldan hisoblanadi." source={manba('Kredit xizmati (append-only jurnal)')} />
      <Alert ton="info" title="Yozuvlar oʻchirilmaydi va oʻzgartirilmaydi">
        <span className="row gap-6"><Lock size={14} /> Hech kim, jumladan administrator ham, balansni bevosita oʻzgartira olmaydi. Tuzatish — faqat bekor qiluvchi va yangi yozuv orqali, taklif qilgan va tasdiqlagan turli shaxslar.</span>
      </Alert>
      <div className="mt-16 mb-16">
        <Tabs id="jurnal-tab" value={tab} onChange={setTab} tabs={[
          { v: 'jurnal', l: 'Jurnal', n: db.jurnal.length },
          { v: 'tekshiruv', l: 'Tekshiruvdagi natijalar', n: db.natijalar.filter((n) => n.holat === 'tekshiruvda').length },
          { v: 'tuzatish', l: 'Tuzatishlar', n: db.tuzatishlar.filter((t) => t.holat === 'kutilmoqda').length },
          { v: 'solishtirish', l: 'Solishtirish' },
          { v: 'yil', l: 'Yil yakuni' },
        ]} />
      </div>
      {tab === 'jurnal' && (
        <DataTable
          rows={rows}
          exportName="kredit-jurnali"
          pageSize={15}
          onRow={(r) => setTanl(r.id)}
          search={(r) => `${r.seq} ${shaxsQisqa(db, r.personId)} ${r.nomi} ${r.providerNomi} ${r.asos}`}
          filters={[
            { k: 'yil', l: 'Yil', options: yillar, get: (r) => String(r.yil) },
            { k: 'manba', l: 'Manba', options: Object.entries(MANBA).map(([v, l]) => ({ v, l })), get: (r) => r.manba },
            { k: 'kt', l: 'Kurs turi', options: Object.entries(KURS_TURI).map(([v, l]) => ({ v, l })), get: (r) => r.kursTuri },
            { k: 'yon', l: 'Yoʻnalish', options: Object.entries(YONALISH).map(([v, l]) => ({ v, l })), get: (r) => r.yonalish },
          ]}
          rowClass={(r) => (bekorlar.has(r.id) ? 'muted' : undefined)}
          cols={[
            { k: 'seq', l: '№', r: (r) => <span className="mono xs">#{r.seq}</span>, sort: (r) => r.seq, excel: (r) => r.seq },
            { k: 'sana', l: 'Sana', r: (r) => <span className="small nowrap">{sanaVaqt(r.sana)}</span>, sort: (r) => r.sana, excel: (r) => r.sana },
            { k: 'xodim', l: 'Xodim', r: (r) => <span className="small b">{shaxsQisqa(db, r.personId)}</span>, excel: (r) => shaxsQisqa(db, r.personId) },
            { k: 'yil', l: 'Yil', r: (r) => r.yil, sort: (r) => r.yil, excel: (r) => r.yil },
            { k: 'miqdor', l: 'Miqdor', align: 'right', r: (r) => <b style={{ color: r.miqdor < 0 ? 'var(--err)' : undefined, textDecoration: bekorlar.has(r.id) ? 'line-through' : undefined }}>{r.miqdor > 0 ? '+' : ''}{r.miqdor}</b>, sort: (r) => r.miqdor, excel: (r) => r.miqdor },
            { k: 'turi', l: 'Turi', r: (r) => <div className="xs"><div>{KURS_TURI[r.kursTuri]} · {YONALISH[r.yonalish]}</div><div className="muted">{TADBIR[r.tadbirTuri]}</div></div>, excel: (r) => `${KURS_TURI[r.kursTuri]}, ${YONALISH[r.yonalish]}, ${TADBIR[r.tadbirTuri]}` },
            { k: 'manba', l: 'Manba', r: (r) => <div className="xs" style={{ maxWidth: 220 }}><span className="tag">{MANBA[r.manba]}</span><div className="muted mt-4">{r.nomi}</div></div>, excel: (r) => `${MANBA[r.manba]}: ${r.nomi}` },
            { k: 'qoida', l: 'Qoida', r: (r) => <span className="tag">v{qv(r.qoidaId)}</span>, excel: (r) => qv(r.qoidaId) },
            { k: 'asos', l: 'Asos', r: (r) => <span className="xs muted" title={r.asos}>{r.asos.length > 48 ? r.asos.slice(0, 48) + '…' : r.asos}</span>, excel: (r) => r.asos },
            { k: 'bekor', l: 'Bekor havolasi', r: (r) => r.bekorQilinganId ? <span className="tag">#{seqById.get(r.bekorQilinganId)} ni bekor qiladi</span> : bekorlar.has(r.id) ? <span className="tag">#{bekorlar.get(r.id)} bilan bekor</span> : '—', excel: (r) => (r.bekorQilinganId ? `#${seqById.get(r.bekorQilinganId)}` : bekorlar.has(r.id) ? `bekor: #${bekorlar.get(r.id)}` : '') },
          ]}
        />
      )}
      {tab === 'tekshiruv' && <TekshiruvTab />}
      {tab === 'tuzatish' && <TuzatishTab />}
      {tab === 'solishtirish' && <SolishtirishTab />}
      {tab === 'yil' && <YilTab />}
      <YozuvDrawer y={y} onClose={() => setTanl(undefined)} />
    </>
  )
}
