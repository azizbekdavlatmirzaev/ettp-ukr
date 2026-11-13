import { useMemo, useState } from 'react'
import { Check, CheckCheck, NotebookPen, X } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { KONIKMALAR } from '@/domain/malumotnoma'
import { useJoriy } from '@/shared/hooks'
import { Alert, Button, Confirm, Empty, Holat, PageHeader, Seg } from '@/ui'
import { DataTable } from '@/ui/DataTable'
import { sana, sanaVaqt } from '@/lib/format'
import { DARAJA } from '@/lib/holat'
import { bazaNomi } from '../rezident/_rz'
import { useBajar } from '../xodim/_bajar'
import { rezidentlarim } from './_kl'

type Row = T.LogbookYozuv & { fio: string; konikma: string }

export default function KlinikLogbook() {
  const { db, user, toast } = useJoriy()
  const bajar = useBajar()
  const [korinish, setKorinish] = useState<'kutilmoqda' | 'barchasi'>('kutilmoqda')
  const [rad, setRad] = useState<{ ids: string[]; clear?: () => void } | null>(null)
  const mening = useMemo(() => rezidentlarim(db, user.id), [db, user.id])
  const rows = useMemo<Row[]>(() => {
    const map = new Map(mening.map((m) => [m.r.id, m]))
    const kon = Object.values(KONIKMALAR).flat()
    return db.logbook.filter((l) => map.has(l.rezidentId) && (korinish === 'barchasi' || l.holat === 'kutilmoqda'))
      .map((l) => ({ ...l, fio: map.get(l.rezidentId)!.qisqa, konikma: kon.find((k) => k.kod === l.konikmaKod)?.nomi ?? l.konikmaKod }))
  }, [db.logbook, mening, korinish])
  const kutil = db.logbook.filter((l) => l.holat === 'kutilmoqda' && mening.some((m) => m.r.id === l.rezidentId)).length

  const tasdiqla = (ids: string[], clear?: () => void) => {
    if (bajar(A.logbookQaror, ids, true, '')) {
      toast({ turi: 'ok', matn: `${ids.length} ta yozuv tasdiqlandi. Rezidentga xabar yuborildi.` })
      clear?.()
    }
  }
  return (
    <>
      <PageHeader title="Logbook tasdiqlash" desc="Faqat oʻz rezidentlaringiz yozuvlari. Rezident oʻz koʻnikmasini oʻzi tasdiqlay olmaydi." source={`Manba: Rezidentura moduli · ${sanaVaqt(new Date().toISOString())}`}
        actions={<Seg id="lb-k" value={korinish} onChange={setKorinish} items={[{ v: 'kutilmoqda', l: `Navbat (${kutil})` }, { v: 'barchasi', l: 'Barcha yozuvlar' }]} />} />
      <Alert ton="info">Tasdiqlashdan oldin izohda bemorni aniqlaydigan maʼlumot yoʻqligiga ishonch hosil qiling. Rad etishda sababini yozing — rezidentga yuboriladi.</Alert>
      <div className="mt-16">
        <DataTable
          rows={rows}
          selectable={korinish === 'kutilmoqda'}
          exportName="logbook-navbat"
          search={(r) => `${r.fio} ${r.konikmaKod} ${r.konikma} ${r.izoh}`}
          initialSort={{ k: 'sana', dir: -1 }}
          filters={[
            { k: 'rez', l: 'Rezident', options: mening.map((m) => ({ v: m.r.id, l: m.qisqa })), get: (r) => r.rezidentId },
            { k: 'kon', l: 'Koʻnikma', options: (KONIKMALAR.M01).map((k) => ({ v: k.kod, l: `${k.kod} ${k.nomi}` })), get: (r) => r.konikmaKod },
            ...(korinish === 'barchasi' ? [{ k: 'h', l: 'Holat', options: [{ v: 'kutilmoqda', l: 'Kutilmoqda' }, { v: 'tasdiqlangan', l: 'Tasdiqlangan' }, { v: 'rad_etildi', l: 'Rad etildi' }], get: (r: Row) => r.holat }] : []),
          ]}
          bulk={(ids, clear) => (
            <>
              <Button size="sm" v="success" icon={<CheckCheck />} onClick={() => tasdiqla(ids, clear)}>Tasdiqlash</Button>
              <Button size="sm" v="danger" icon={<X />} onClick={() => setRad({ ids, clear })}>Rad etish (izoh bilan)</Button>
            </>
          )}
          empty={<Empty icon={<NotebookPen />} title={korinish === 'kutilmoqda' ? 'Navbat boʻsh' : 'Yozuv yoʻq'}>Rezidentlar yangi yozuv qoʻshganda shu yerda paydo boʻladi.</Empty>}
          cols={[
            { k: 'sana', l: 'Sana', r: (r) => <span className="nowrap small">{sana(r.sana)}</span>, sort: (r) => r.sana, excel: (r) => r.sana },
            { k: 'fio', l: 'Rezident', r: (r) => <b className="small nowrap">{r.fio}</b>, sort: (r) => r.fio, excel: (r) => r.fio },
            { k: 'kon', l: 'Koʻnikma', r: (r) => <div><span className="mono xs muted">{r.konikmaKod}</span><div className="small">{r.konikma}</div></div>, excel: (r) => `${r.konikmaKod} ${r.konikma}` },
            { k: 'd', l: 'Daraja', r: (r) => <span className="small">{DARAJA[r.daraja]}</span>, excel: (r) => DARAJA[r.daraja] },
            { k: 'joy', l: 'Joy', r: (r) => <span className="xs">{bazaNomi(db, r.joy)}</span>, excel: (r) => bazaNomi(db, r.joy) },
            { k: 'izoh', l: 'Izoh', r: (r) => <span className="small">{r.izoh}</span>, excel: (r) => r.izoh },
            { k: 'holat', l: 'Holat', r: (r) => r.holat === 'kutilmoqda'
              ? <div className="row gap-4 nowrap">
                  <Button size="xs" v="success" icon={<Check />} onClick={(e) => { e.stopPropagation(); tasdiqla([r.id]) }}>Tasdiqlash</Button>
                  <Button size="xs" v="ghost" icon={<X />} onClick={(e) => { e.stopPropagation(); setRad({ ids: [r.id] }) }}>Rad</Button>
                </div>
              : <div><Holat h={r.holat} />{r.rahbarIzohi && <div className="xs muted">«{r.rahbarIzohi}»</div>}</div>, excel: (r) => r.holat },
          ]}
        />
      </div>
      <Confirm open={!!rad} onClose={() => setRad(null)} ton="danger" title={`Rad etish (${rad?.ids.length ?? 0} ta yozuv)`} izoh="Rad etish sababi" izohMajburiy okText="Rad etish"
        onOk={(iz) => { if (rad && bajar(A.logbookQaror, rad.ids, false, iz)) { toast({ turi: 'ok', matn: `${rad.ids.length} ta yozuv rad etildi. Sabab rezidentga yuborildi.` }); rad.clear?.() } setRad(null) }}>
        <p className="small muted">Masalan: «Ishtirok darajasi notoʻgʻri koʻrsatilgan — nazorat ostida emas, kuzatuv».</p>
      </Confirm>
    </>
  )
}
