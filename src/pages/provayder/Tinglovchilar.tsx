import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check as CheckI, Clock, X, Inbox, Users, GraduationCap, ExternalLink } from 'lucide-react'
import { Button, DL, Holat, KPI, Modal, PageHeader, Timeline, Empty } from '@/ui'
import { DataTable, type Col } from '@/ui/DataTable'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { niqob, sanaVaqt, sana } from '@/lib/format'
import { holat as holatMatn } from '@/lib/holat'
import { mutNomi } from '@/shared/hooks'
import { manba, useProv } from './_umumiy'
import { useArizaAmal } from './_OqimTinglovchi'

const OCHIQ = ['yuborildi', 'navbatda']
const HOLATLAR = ['yuborildi', 'navbatda', 'qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi', 'rad_etildi', 'chiqdi']

export default function ProvayderTinglovchilar() {
  const { db, oqimlar, yozilishlar } = useProv()
  const nav = useNavigate()
  const { bajar, radSo, radOyna } = useArizaAmal()
  const [tanl, setTanl] = useState<T.Yozilish>()
  const rows = useMemo(() => [...yozilishlar].sort((a, b) => b.yuborilgan.localeCompare(a.yuborilgan)), [yozilishlar])
  const sel = tanl ? yozilishlar.find((y) => y.id === tanl.id) : undefined
  const soni = (h: string[]) => yozilishlar.filter((y) => h.includes(y.holat)).length

  const cols: Col<T.Yozilish>[] = [
    { k: 'fio', l: 'Tinglovchi', sort: (y) => A.shaxs(db, y.personId)?.familiya ?? '', excel: (y) => A.toliqFio(A.shaxs(db, y.personId)!), r: (y) => { const s = A.shaxs(db, y.personId)!; return <div><div className="b">{A.toliqFio(s)}</div><div className="xs muted">{mutNomi(s.mutaxassislikId)} · <span className="mono">{niqob(s.jshshir)}</span></div></div> } },
    { k: 'oqim', l: 'Oqim / dastur', sort: (y) => A.oqim(db, y.oqimId)?.kod ?? '', excel: (y) => `${A.oqim(db, y.oqimId)?.kod} ${A.versiya(db, A.oqim(db, y.oqimId)?.versiyaId)?.nomi}`, r: (y) => { const o = A.oqim(db, y.oqimId)!; return <div style={{ maxWidth: 280 }}><div className="small b">{A.versiya(db, o.versiyaId)?.nomi}</div><div className="xs muted mono">{o.kod} · {sana(o.boshlanish)}</div></div> } },
    { k: 'sana', l: 'Yuborilgan', sort: (y) => y.yuborilgan, excel: (y) => y.yuborilgan, r: (y) => <span className="small nowrap">{sanaVaqt(y.yuborilgan)}</span> },
    { k: 'orin', l: 'Oʻrin', align: 'right', r: (y) => { const o = A.oqim(db, y.oqimId)!; return <span className="small">{A.bandOrinlar(db, o.id)}/{o.orinlar}</span> } },
    { k: 'holat', l: 'Holat', sort: (y) => y.holat, excel: (y) => holatMatn(y.holat)[0], r: (y) => <Holat h={y.holat} /> },
    {
      k: 'amal', l: 'Amal', r: (y) => OCHIQ.includes(y.holat) ? (
        <div className="row gap-4" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" v="success" icon={<CheckI />} onClick={() => bajar([y.id], 'qabul_qilindi')}>Qabul</Button>
          {y.holat !== 'navbatda' && <Button size="xs" v="soft" icon={<Clock />} onClick={() => bajar([y.id], 'navbatda')}>Navbat</Button>}
          <Button size="xs" v="ghost" icon={<X />} onClick={() => radSo([y.id])}>Rad</Button>
        </div>
      ) : null,
    },
  ]

  return (
    <>
      <PageHeader title="Tinglovchilar" desc="Barcha oqimlar boʻyicha arizalar: qabul qilish, navbatga qoʻyish yoki sababi bilan rad etish. Bir nechtasini belgilab ommaviy amal bajaring." source={manba('Arizalar, Reestr (mutaxassislik)')} />
      <div className="grid g4 mb-16">
        <KPI icon={<Inbox />} label="Yangi arizalar" value={soni(['yuborildi'])} ton={soni(['yuborildi']) ? 'warn' : undefined} />
        <KPI icon={<Clock />} label="Navbatda" value={soni(['navbatda'])} delay={0.04} />
        <KPI icon={<GraduationCap />} label="Oʻqimoqda / qabul" value={soni(['oqimoqda', 'qabul_qilindi'])} ton="teal" delay={0.08} />
        <KPI icon={<Users />} label="Tugatgan" value={soni(['tugatdi'])} ton="ok" delay={0.12} />
      </div>
      <DataTable
        rows={rows}
        cols={cols}
        search={(y) => { const s = A.shaxs(db, y.personId)!; return `${A.toliqFio(s)} ${s.jshshir} ${A.oqim(db, y.oqimId)?.kod}` }}
        filters={[
          { k: 'oqim', l: 'Oqim', options: oqimlar.filter((o) => yozilishlar.some((y) => y.oqimId === o.id)).map((o) => ({ v: o.id, l: `${o.kod} · ${A.versiya(db, o.versiyaId)?.nomi.slice(0, 30)}` })), get: (y) => y.oqimId },
          { k: 'holat', l: 'Holat', options: HOLATLAR.map((v) => ({ v, l: holatMatn(v)[0] })), get: (y) => y.holat },
        ]}
        exportName="tinglovchilar"
        selectable
        onRow={setTanl}
        bulk={(ids, clear) => {
          const t = ids.filter((id) => OCHIQ.includes(rows.find((r) => r.id === id)?.holat ?? ''))
          return (
            <>
              {t.length < ids.length && <span className="xs muted">{ids.length - t.length} tasi allaqachon koʻrib chiqilgan</span>}
              <Button size="sm" v="success" icon={<CheckI />} disabled={!t.length} onClick={() => bajar(t, 'qabul_qilindi', undefined, clear)}>Qabul ({t.length})</Button>
              <Button size="sm" v="soft" icon={<Clock />} disabled={!t.length} onClick={() => bajar(t, 'navbatda', undefined, clear)}>Navbat</Button>
              <Button size="sm" v="danger" icon={<X />} disabled={!t.length} onClick={() => radSo(t, clear)}>Rad (sabab)</Button>
            </>
          )
        }}
        empty={<Empty title="Ariza yoʻq">Oqimni eʼlon qiling — xodimlar katalogdan yoziladi. Yoki oqim sahifasidan guruhni ommaviy qoʻshing.</Empty>}
      />
      {radOyna}
      <Modal drawer open={!!sel} onClose={() => setTanl(undefined)} title={sel ? A.toliqFio(A.shaxs(db, sel.personId)!) : ''} sub="Ariza tafsiloti"
        footer={sel && (
          <>
            <Button v="ghost" icon={<ExternalLink />} onClick={() => nav(`/provayder/oqimlar/${sel.oqimId}`)}>Oqimga oʻtish</Button>
            {OCHIQ.includes(sel.holat) && (
              <>
                <Button v="danger" className="soft" onClick={() => radSo([sel.id])}>Rad etish</Button>
                <Button v="success" onClick={() => bajar([sel.id], 'qabul_qilindi')}>Qabul qilish</Button>
              </>
            )}
          </>
        )}>
        {sel && (() => {
          const s = A.shaxs(db, sel.personId)!
          const o = A.oqim(db, sel.oqimId)!
          const v = A.versiya(db, o.versiyaId)!
          const m = A.mosmi(db, s, v)
          return (
            <div className="col gap-16">
              <DL items={[
                ['Holat', <Holat h={sel.holat} />],
                ['JSHSHIR', <span className="mono">{niqob(s.jshshir)}</span>],
                ['Mutaxassislik (Reestr)', mutNomi(s.mutaxassislikId)],
                ['Maʼlumot darajasi', s.daraja === 'oliy' ? 'Oliy' : 'Oʻrta'],
                ['Dasturga mosligi', m.ok ? 'Mos' : m.sabab],
                ['Oqim', `${o.kod} · ${sana(o.boshlanish)} — ${sana(o.tugash)}`],
                ['Dastur', v.nomi],
                ['Davomat', `${A.davomatFoizi(db, sel)}%`],
                ['Darslar progressi', `${sel.progress.length} / ${v.darslar.length}`],
              ]} />
              <div>
                <h3 className="mb-8">Holatlar tarixi</h3>
                <Timeline items={sel.tarix.map((t) => ({ h: <span>{holatMatn(t.holat)[0]}</span>, m: `${sanaVaqt(t.sana)} · ${t.kim}${t.izoh ? ' · ' + t.izoh : ''}`, ton: t.holat === 'rad_etildi' ? 'err' : t.holat === 'tugatdi' ? 'ok' : undefined }))} />
              </div>
            </div>
          )
        })()}
      </Modal>
    </>
  )
}
