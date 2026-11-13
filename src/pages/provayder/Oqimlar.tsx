import { useMemo, useState, type MouseEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Megaphone, Play, Square, XCircle, Copy, Layers } from 'lucide-react'
import { Button, Confirm, Holat, PageHeader, Tabs, Empty, Bar } from '@/ui'
import { DataTable, type Col } from '@/ui/DataTable'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { sana, pul } from '@/lib/format'
import { MOLIYA, SHAKL } from '@/lib/holat'
import { hududNomi } from '@/shared/hooks'
import { manba, useProv } from './_umumiy'
import { OqimModal } from './_OqimModal'

type Filtr = 'hammasi' | T.OqimHolat
const HOLATLAR: { v: Filtr; l: string }[] = [
  { v: 'hammasi', l: 'Hammasi' }, { v: 'qoralama', l: 'Qoralama' }, { v: 'elon_qilingan', l: 'Eʼlon qilingan' }, { v: 'davom_etmoqda', l: 'Davom etmoqda' }, { v: 'yakunlangan', l: 'Yakunlangan' }, { v: 'bekor', l: 'Bekor' },
]

/** Oqim holatini oʻzgartirish tugmalari — roʻyxat va oqim sahifasida */
export function OqimTugmalari({ o, size = 'xs' }: { o: T.Oqim; size?: 'xs' | 'sm' }) {
  const { amal, toast } = useProv()
  const nav = useNavigate()
  const [tas, setTas] = useState<T.OqimHolat>()
  const ozgar = (h: T.OqimHolat, izoh?: string) => {
    const r = amal((db, ctx) => {
      A.oqimHolati(db, ctx, o.id, h)
      return true
    })
    if (r) toast({ turi: 'ok', matn: `${o.kod}: ${h === 'elon_qilingan' ? 'katalogga chiqarildi' + (o.story ? ' va story-eʼlon yuborildi' : '') : h === 'davom_etmoqda' ? 'oqim boshlandi' : h === 'yakunlangan' ? 'oqim yakunlandi — natijani shakllantiring' : 'oqim bekor qilindi'}${izoh ? ` (${izoh})` : ''}` })
  }
  const nusxa = () => {
    const n = amal(A.oqimNusxa, o.id)
    if (n) {
      toast({ turi: 'ok', sarlavha: `Nusxa: ${n.kod}`, matn: 'Sanalar 2 oyga surildi, oqim qoralama holatida ochildi.' })
      nav(`/provayder/oqimlar/${n.id}`)
    }
  }
  const stop = (f: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    f()
  }
  return (
    <div className="row wrap gap-4" onClick={(e) => e.stopPropagation()}>
      {o.holat === 'qoralama' && <Button size={size} v="soft" icon={<Megaphone />} onClick={stop(() => ozgar('elon_qilingan'))}>Eʼlon qilish</Button>}
      {o.holat === 'elon_qilingan' && <Button size={size} v="soft" icon={<Play />} onClick={stop(() => ozgar('davom_etmoqda'))}>Boshlash</Button>}
      {o.holat === 'davom_etmoqda' && <Button size={size} v="soft" icon={<Square />} onClick={stop(() => setTas('yakunlangan'))}>Yakunlash</Button>}
      {['qoralama', 'elon_qilingan', 'davom_etmoqda'].includes(o.holat) && <Button size={size} v="ghost" icon={<XCircle />} onClick={stop(() => setTas('bekor'))}>Bekor</Button>}
      <Button size={size} v="ghost" icon={<Copy />} onClick={stop(nusxa)}>Nusxa olish</Button>
      <Confirm
        open={!!tas}
        onClose={() => setTas(undefined)}
        title={tas === 'bekor' ? `${o.kod} oqimini bekor qilish` : `${o.kod} oqimini yakunlash`}
        ton={tas === 'bekor' ? 'danger' : 'primary'}
        okText={tas === 'bekor' ? 'Bekor qilish' : 'Yakunlash'}
        izoh={tas === 'bekor' ? 'Sabab (tinglovchilarga yuboriladi)' : undefined}
        izohMajburiy={tas === 'bekor'}
        onOk={(iz) => {
          if (tas) ozgar(tas, iz)
          setTas(undefined)
        }}
      >
        <p className="small sub">{tas === 'bekor' ? 'Oqim katalogdan olinadi. Qabul qilingan tinglovchilar xabardor qilinadi.' : 'Yakunlangandan soʻng «Natija» bandida yakuniy natijani shakllantiring va rahbar tasdigʻiga yuboring.'}</p>
      </Confirm>
    </div>
  )
}

export default function ProvayderOqimlar() {
  const { db, oqimlar } = useProv()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [f, setF] = useState<Filtr>('hammasi')
  const yangiOchiq = sp.get('yangi') === '1'
  const yop = () => {
    sp.delete('yangi')
    sp.delete('versiya')
    setSp(sp, { replace: true })
  }
  const rows = useMemo(() => [...oqimlar].sort((a, b) => b.boshlanish.localeCompare(a.boshlanish)).filter((o) => f === 'hammasi' || o.holat === f), [oqimlar, f])

  const cols: Col<T.Oqim>[] = [
    { k: 'kod', l: 'Oqim', sort: (o) => o.kod, excel: (o) => o.kod, r: (o) => { const v = A.versiya(db, o.versiyaId); return <div><div className="b">{v?.nomi}</div><div className="xs muted"><span className="mono">{o.kod}</span> · v{v?.versiya} · {SHAKL[v?.shakl ?? 'oflayn']}</div></div> } },
    { k: 'nomi', l: 'Dastur', excel: (o) => A.versiya(db, o.versiyaId)?.nomi, r: () => null, hide: true },
    { k: 'sana', l: 'Sanalar', sort: (o) => o.boshlanish, excel: (o) => `${o.boshlanish} — ${o.tugash}`, r: (o) => <span className="nowrap small">{sana(o.boshlanish)} — {sana(o.tugash)}<div className="xs muted">qabul {sana(o.qabulTugash)} gacha</div></span> },
    { k: 'orin', l: 'Bandlik', sort: (o) => A.bandOrinlar(db, o.id) / o.orinlar, excel: (o) => `${A.bandOrinlar(db, o.id)}/${o.orinlar}`, r: (o) => { const b = A.bandOrinlar(db, o.id); return <div style={{ minWidth: 90 }}><div className="small b">{b}/{o.orinlar}</div><Bar v={b} max={o.orinlar} thin ton={b >= o.orinlar ? 'warn' : undefined} /></div> } },
    { k: 'hudud', l: 'Hudud', excel: (o) => hududNomi(o.hududId), r: (o) => <span className="small">{hududNomi(o.hududId)}</span> },
    { k: 'moliya', l: 'Moliya', excel: (o) => MOLIYA[o.moliya], r: (o) => <span className="small">{MOLIYA[o.moliya]}{o.narx ? <div className="xs muted">{pul(o.narx)}</div> : null}</span> },
    { k: 'holat', l: 'Holat', sort: (o) => o.holat, excel: (o) => o.holat, r: (o) => <Holat h={o.holat} /> },
    { k: 'amal', l: 'Amallar', r: (o) => <OqimTugmalari o={o} /> },
  ]

  return (
    <>
      <PageHeader
        title="Oqimlar"
        desc="Oʻquv oqimlari (guruhlar): eʼlon qilish katalogga chiqaradi, boshlash — davomat va baholashni ochadi, yakunlash — natija shakllantirishga oʻtkazadi."
        source={manba()}
        actions={<Button v="primary" icon={<Plus />} onClick={() => setSp({ yangi: '1' })}>Yangi oqim</Button>}
      />
      <Tabs id="oqim-f" value={f} onChange={setF} tabs={HOLATLAR.map((h) => ({ v: h.v, l: h.l, n: h.v === 'hammasi' ? oqimlar.length : oqimlar.filter((o) => o.holat === h.v).length }))} />
      <div className="mt-16">
        <DataTable
          rows={rows}
          cols={cols}
          search={(o) => `${o.kod} ${A.versiya(db, o.versiyaId)?.nomi} ${o.joy}`}
          filters={[{ k: 'moliya', l: 'Moliya', options: Object.entries(MOLIYA).map(([v, l]) => ({ v, l })), get: (o) => o.moliya }]}
          exportName="oqimlar"
          onRow={(o) => nav(`/provayder/oqimlar/${o.id}`)}
          empty={<Empty icon={<Layers />} title="Oqim topilmadi" action={<Button v="primary" icon={<Plus />} onClick={() => setSp({ yangi: '1' })}>Yangi oqim ochish</Button>}>Tanlangan holatda oqim yoʻq.</Empty>}
        />
      </div>
      <OqimModal open={yangiOchiq} versiyaId={sp.get('versiya') ?? undefined} onClose={yop} onSaved={(o) => nav(`/provayder/oqimlar/${o.id}`)} />
    </>
  )
}
