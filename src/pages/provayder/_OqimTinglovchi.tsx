// Oqim → «Tinglovchilar» bandi: arizalarni qabul/navbat/rad va guruhni ommaviy qoʻshish.
import { useMemo, useRef, useState } from 'react'
import { Check as CheckI, Clock, X, UserPlus, Upload, Download, Wand2 } from 'lucide-react'
import { Alert, Button, Confirm, Field, Holat, Modal, Txt, Badge } from '@/ui'
import { DataTable, type Col } from '@/ui/DataTable'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { excelOqi, excelShablon } from '@/lib/eksport'
import { niqob, sanaVaqt } from '@/lib/format'
import { mutNomi } from '@/shared/hooks'
import { holat as holatMatn } from '@/lib/holat'
import { useProv } from './_umumiy'

/** Arizalar holatini oʻzgartirish (bitta yoki bir nechta) — rad etishda sabab soʻraladi */
export function useArizaAmal() {
  const { amal, toast } = useProv()
  const [rad, setRad] = useState<{ ids: string[]; done?: () => void }>()
  const bajar = (ids: string[], h: 'qabul_qilindi' | 'navbatda' | 'rad_etildi', sabab?: string, done?: () => void) => {
    const r = amal((db, ctx) => {
      A.arizaHolati(db, ctx, ids, h, sabab)
      return true
    })
    if (r) {
      toast({ turi: 'ok', matn: `${ids.length} ta ariza: ${h === 'qabul_qilindi' ? 'qabul qilindi — tinglovchilarga xabar va taqvim yozuvi yuborildi' : h === 'navbatda' ? 'navbatga qoʻyildi' : 'rad etildi, sabab tinglovchiga yuborildi'}` })
      done?.()
    }
  }
  const radOyna = (
    <Confirm
      open={!!rad}
      onClose={() => setRad(undefined)}
      title={`${rad?.ids.length ?? 0} ta arizani rad etish`}
      ton="danger"
      okText="Rad etish"
      izoh="Rad etish sababi (tinglovchiga yuboriladi)"
      izohMajburiy
      onOk={(s) => {
        if (rad) bajar(rad.ids, 'rad_etildi', s, rad.done)
        setRad(undefined)
      }}
    />
  )
  return { bajar, radSo: (ids: string[], done?: () => void) => setRad({ ids, done }), radOyna }
}

export function TinglovchilarTab({ o }: { o: T.Oqim }) {
  const { db, yozilishlar } = useProv()
  const [guruh, setGuruh] = useState(false)
  const { bajar, radSo, radOyna } = useArizaAmal()
  const rows = useMemo(() => yozilishlar.filter((y) => y.oqimId === o.id), [yozilishlar, o.id])
  const ochiq = ['yuborildi', 'navbatda']

  const cols: Col<T.Yozilish>[] = [
    { k: 'fio', l: 'Tinglovchi', sort: (y) => A.shaxs(db, y.personId)?.familiya ?? '', excel: (y) => { const s = A.shaxs(db, y.personId); return s ? A.toliqFio(s) : '' }, r: (y) => { const s = A.shaxs(db, y.personId)!; return <div><div className="b">{A.toliqFio(s)}</div><div className="xs muted mono">{niqob(s.jshshir)}</div></div> } },
    { k: 'mut', l: 'Mutaxassislik', excel: (y) => mutNomi(A.shaxs(db, y.personId)?.mutaxassislikId), r: (y) => <span className="small">{mutNomi(A.shaxs(db, y.personId)?.mutaxassislikId)}</span> },
    { k: 'sana', l: 'Ariza', sort: (y) => y.yuborilgan, excel: (y) => y.yuborilgan, r: (y) => <span className="small nowrap">{sanaVaqt(y.yuborilgan)}</span> },
    { k: 'dav', l: 'Davomat', align: 'right', sort: (y) => A.davomatFoizi(db, y), excel: (y) => A.davomatFoizi(db, y), r: (y) => (['yuborildi', 'navbatda', 'rad_etildi', 'chiqdi'].includes(y.holat) ? <span className="muted">—</span> : `${A.davomatFoizi(db, y)}%`) },
    { k: 'holat', l: 'Holat', sort: (y) => y.holat, excel: (y) => y.holat, r: (y) => <div className="col gap-4"><Holat h={y.holat} />{y.sabab && <span className="xs muted">{y.sabab}</span>}</div> },
    {
      k: 'amal', l: 'Amal', r: (y) => ochiq.includes(y.holat) ? (
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
      <DataTable
        rows={rows}
        cols={cols}
        title={`${rows.length} ta yozuv · ${A.bandOrinlar(db, o.id)}/${o.orinlar} oʻrin band`}
        search={(y) => { const s = A.shaxs(db, y.personId); return s ? `${A.toliqFio(s)} ${s.jshshir}` : '' }}
        filters={[{ k: 'h', l: 'Holat', options: ['yuborildi', 'navbatda', 'qabul_qilindi', 'oqimoqda', 'tugatdi', 'otmadi', 'rad_etildi', 'chiqdi'].map((v) => ({ v, l: holatMatn(v)[0] })), get: (y) => y.holat }]}
        exportName={`tinglovchilar-${o.kod}`}
        selectable
        bulk={(ids, clear) => {
          const t = ids.filter((id) => ochiq.includes(rows.find((r) => r.id === id)?.holat ?? ''))
          return (
            <>
              {t.length < ids.length && <span className="xs muted">{ids.length - t.length} tasi koʻrib chiqilgan — oʻtkazib yuboriladi</span>}
              <Button size="sm" v="success" icon={<CheckI />} disabled={!t.length} onClick={() => bajar(t, 'qabul_qilindi', undefined, clear)}>Qabul ({t.length})</Button>
              <Button size="sm" v="soft" icon={<Clock />} disabled={!t.length} onClick={() => bajar(t, 'navbatda', undefined, clear)}>Navbat</Button>
              <Button size="sm" v="danger" icon={<X />} disabled={!t.length} onClick={() => radSo(t, clear)}>Rad</Button>
            </>
          )
        }}
        tools={<Button size="sm" v="primary" icon={<UserPlus />} onClick={() => setGuruh(true)}>Guruhni ommaviy qoʻshish</Button>}
      />
      {radOyna}
      <GuruhModal o={o} open={guruh} onClose={() => setGuruh(false)} />
    </>
  )
}

function GuruhModal({ o, open, onClose }: { o: T.Oqim; open: boolean; onClose: () => void }) {
  const { db, amal, toast } = useProv()
  const [matn, setMatn] = useState('')
  const [natija, setNatija] = useState<{ qoshildi: number; xatolar: string[] }>()
  const ref = useRef<HTMLInputElement>(null)
  const roy = matn.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean)

  const namuna = () => {
    const v = A.versiya(db, o.versiyaId)!
    const mos = db.shaxslar.filter((s) => A.mosmi(db, s, v).ok && !db.yozilishlar.some((y) => y.oqimId === o.id && y.personId === s.id)).slice(0, 3).map((s) => s.jshshir)
    const nomos = db.shaxslar.find((s) => !A.mosmi(db, s, v).ok)?.jshshir
    setMatn([...mos, nomos, '12345'].filter(Boolean).join('\n'))
    setNatija(undefined)
  }
  const fayl = async (f?: File) => {
    if (!f) return
    try {
      const qator = await excelOqi(f)
      const j = qator.map((r) => String(r.JSHSHIR ?? r.jshshir ?? Object.values(r)[0] ?? '').trim()).filter(Boolean)
      setMatn(j.join('\n'))
      setNatija(undefined)
      toast({ turi: 'info', matn: `${f.name}: ${j.length} ta JSHSHIR oʻqildi. «Qoʻshish»ni bosing.` })
    } catch {
      toast({ turi: 'err', sarlavha: 'Fayl oʻqilmadi', matn: 'Excel (.xlsx) faylini «JSHSHIR» ustuni bilan yuklang — shablonni yuklab oling.' })
    }
  }
  const qosh = () => {
    const r = amal(A.guruhQoshish, o.id, roy)
    if (r) {
      setNatija(r)
      toast({ turi: r.xatolar.length ? 'warn' : 'ok', matn: `${r.qoshildi} ta tinglovchi qoʻshildi${r.xatolar.length ? `, ${r.xatolar.length} ta qatorda xato` : ''}.` })
    }
  }
  return (
    <Modal open={open} onClose={() => { onClose(); setNatija(undefined); setMatn('') }} size="lg" title="Guruhni ommaviy qoʻshish" sub={`${o.kod} · JSHSHIR roʻyxati yoki Excel fayl · har bir qator Reestr bilan tekshiriladi`}
      footer={<><Button v="ghost" onClick={onClose}>Yopish</Button><Button v="primary" icon={<UserPlus />} disabled={!roy.length} onClick={qosh}>Qoʻshish ({roy.length})</Button></>}>
      <div className="row wrap mb-12">
        <Button size="sm" v="secondary" icon={<Upload />} onClick={() => ref.current?.click()}>Excel yuklash</Button>
        <Button size="sm" v="ghost" icon={<Download />} onClick={() => excelShablon('guruh-shablon', ['JSHSHIR'], [['30101851234567'], ['42505901234561']])}>Shablon</Button>
        <Button size="sm" v="ghost" icon={<Wand2 />} onClick={namuna}>Namuna maʼlumot (demo)</Button>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { fayl(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      <Field label="JSHSHIR roʻyxati" help="Har qatorda bitta 14 xonali JSHSHIR (vergul yoki boʻsh joy bilan ham ajratish mumkin)">
        <Txt rows={7} className="mono" value={matn} onChange={(e) => setMatn(e.target.value)} placeholder={'30101851234567\n42505901234561'} />
      </Field>
      {natija && (
        <div className="col gap-6 mt-12">
          <Alert ton={natija.xatolar.length ? 'warn' : 'ok'} title={`${natija.qoshildi} ta qoʻshildi · ${natija.xatolar.length} ta xato`}>Xatosiz qatorlar qabul qilindi; xatolilar oʻtkazib yuborildi.</Alert>
          {natija.xatolar.map((x) => <div key={x} className="row gap-6 small"><Badge ton="err">xato</Badge>{x}</div>)}
        </div>
      )}
    </Modal>
  )
}
