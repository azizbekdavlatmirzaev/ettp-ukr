import { useEffect, useState } from 'react'
import { Plus, UserCheck, ShieldAlert, ClipboardList } from 'lucide-react'
import type * as T from '@/domain/types'
import { DataTable } from '@/ui/DataTable'
import { Alert, Badge, Button, DL, Empty, Field, Holat, Inp, KPI, Modal, PageHeader, Sel, Txt } from '@/ui'
import { sana } from '@/lib/format'
import { MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { useMarkaz, manba, Sec, RolTugma, RAH_SABAB, provQisqa } from './_parts'
import { ekspertQosh, deklaratsiyaQosh, ekspertFaollik } from './_amallar'

const bosh = { fio: '', mutaxassislik: 'Kardiologiya', ishJoyi: '', ishJoyiProviderId: '', vakolatMuddati: '2029-12-31' }

export default function MarkazEkspertlar() {
  const { db, bugun, rahbar, ijro, ok } = useMarkaz()
  const [tanl, setTanl] = useState<string>()
  const [yangi, setYangi] = useState(false)
  const [f, setF] = useState(bosh)
  const [dek, setDek] = useState({ providerId: '', sabab: '' })
  const [xato, setXato] = useState('')
  const e = db.ekspertlar.find((x) => x.id === tanl)
  useEffect(() => setDek({ providerId: '', sabab: '' }), [tanl])
  useEffect(() => { if (yangi) { setF(bosh); setXato('') } }, [yangi])
  const faolArizalar = (id: string) => db.akkArizalar.filter((a) => a.ekspertlar.includes(id) && a.holat !== 'yakunlandi')
  const provOpts = db.provayderlar.map((p) => ({ v: p.id, l: `${p.qisqa} (${p.stir})` }))

  const qosh = () => {
    const r = ijro(ekspertQosh, { ...f, ishJoyiProviderId: f.ishJoyiProviderId || undefined })
    if (r.ok && r.r) { ok(`${r.r.fio} ekspertlar reestriga qoʻshildi.`); setYangi(false); setTanl(r.r.id) } else setXato(r.xato ?? '')
  }
  const dekQosh = () => {
    if (!e) return
    const r = ijro(deklaratsiyaQosh, e.id, dek.providerId, dek.sabab)
    if (r.ok) { ok('Deklaratsiya qoʻshildi. Bu provayder arizalariga ekspert endi biriktirilmaydi.'); setDek({ providerId: '', sabab: '' }) }
  }
  const faollik = (x: T.Ekspert) => {
    const r = ijro(ekspertFaollik, x.id, !x.faol)
    if (r.ok) ok(x.faol ? 'Ekspert vakolati toʻxtatildi.' : 'Ekspert vakolati tiklandi.')
  }

  return (
    <>
      <PageHeader title="Ekspertlar reestri" desc="Mutaxassislik, ish joyi, vakolat muddati va manfaatlar toʻqnashuvi deklaratsiyasi. Toʻqnashuvi bor ekspert arizaga biriktirilmaydi." source={manba('Ekspertlar reestri')}
        actions={<Button v="primary" icon={<Plus />} onClick={() => setYangi(true)}>Ekspert qoʻshish</Button>} />
      <div className="grid g4 mb-16">
        <KPI icon={<UserCheck />} label="Faol ekspertlar" value={db.ekspertlar.filter((x) => x.faol).length} ton="ok" />
        <KPI icon={<ShieldAlert />} label="Deklaratsiyalar" value={db.ekspertlar.reduce((s, x) => s + x.deklaratsiya.length + (x.ishJoyiProviderId ? 1 : 0), 0)} ton="warn" delay={0.05} />
        <KPI icon={<ClipboardList />} label="Ekspertizadagi arizalar" value={db.akkArizalar.filter((a) => a.holat === 'ekspertiza').length} delay={0.1} />
        <KPI icon={<UserCheck />} label="Vakolati yil oxirigacha tugaydi" value={db.ekspertlar.filter((x) => x.vakolatMuddati <= `${Number(bugun.slice(0, 4))}-12-31` || x.vakolatMuddati < bugun).length} ton="teal" delay={0.15} />
      </div>
      <DataTable
        rows={db.ekspertlar}
        exportName="ekspertlar-reestri"
        onRow={(r) => setTanl(r.id)}
        search={(r) => `${r.fio} ${r.mutaxassislik} ${r.ishJoyi}`}
        filters={[{ k: 'm', l: 'Mutaxassislik', options: Array.from(new Set(db.ekspertlar.map((x) => x.mutaxassislik))).map((v) => ({ v, l: v })), get: (r) => r.mutaxassislik }]}
        cols={[
          { k: 'fio', l: 'F.I.Sh.', r: (r) => <span className="b small">{r.fio}</span>, sort: (r) => r.fio, excel: (r) => r.fio },
          { k: 'mut', l: 'Mutaxassislik', r: (r) => r.mutaxassislik, excel: (r) => r.mutaxassislik },
          { k: 'ish', l: 'Ish joyi', r: (r) => <span className="small">{r.ishJoyi}{r.ishJoyiProviderId && <> <Badge ton="warn">provayder</Badge></>}</span>, excel: (r) => r.ishJoyi },
          { k: 'vak', l: 'Vakolat muddati', r: (r) => <span className="small nowrap" style={{ color: r.vakolatMuddati < bugun ? 'var(--err)' : undefined }}>{sana(r.vakolatMuddati)}</span>, sort: (r) => r.vakolatMuddati, excel: (r) => r.vakolatMuddati },
          { k: 'dek', l: 'Deklaratsiyalar', align: 'center', r: (r) => r.deklaratsiya.length + (r.ishJoyiProviderId ? 1 : 0), sort: (r) => r.deklaratsiya.length, excel: (r) => r.deklaratsiya.length },
          { k: 'faolA', l: 'Faol arizalar', align: 'center', r: (r) => faolArizalar(r.id).length, sort: (r) => faolArizalar(r.id).length, excel: (r) => faolArizalar(r.id).length },
          { k: 'holat', l: 'Holat', r: (r) => <Holat h={r.faol ? 'faol' : 'nofaol'}>{r.faol ? 'Faol' : 'Toʻxtatilgan'}</Holat>, excel: (r) => (r.faol ? 'Faol' : 'Toʻxtatilgan') },
        ]}
      />
      <Modal open={!!e} onClose={() => setTanl(undefined)} drawer title={e?.fio ?? ''} sub={e?.mutaxassislik}
        footer={e && <RolTugma ruxsat={rahbar} sabab={RAH_SABAB} v={e.faol ? 'danger' : 'success'} onClick={() => faollik(e)}>{e.faol ? 'Vakolatni toʻxtatish' : 'Vakolatni tiklash'}</RolTugma>}>
        {e && (
          <>
            <DL items={[['Ish joyi', e.ishJoyi], ['Ish joyi — provayder', e.ishJoyiProviderId ? provQisqa(db, e.ishJoyiProviderId) : '—'], ['Vakolat muddati', sana(e.vakolatMuddati)], ['Holat', e.faol ? 'Faol' : 'Toʻxtatilgan']]} />
            <Sec icon={<ShieldAlert />} title="Manfaatlar toʻqnashuvi">
              {e.ishJoyiProviderId && <Alert ton="warn">Ish joyi boʻyicha avtomatik: {provQisqa(db, e.ishJoyiProviderId)} arizalariga biriktirilmaydi.</Alert>}
              {e.deklaratsiya.length ? e.deklaratsiya.map((d) => (
                <div key={d.providerId} className="li"><div className="grow"><div className="small b">{provQisqa(db, d.providerId)}</div><div className="xs muted">{d.sabab}</div></div><Badge ton="err">bloklangan</Badge></div>
              )) : <div className="small muted">Deklaratsiya qilingan toʻqnashuv yoʻq.</div>}
              <div className="form-grid mt-12">
                <Field label="Provayder"><Sel value={dek.providerId} onChange={(x) => setDek({ ...dek, providerId: x.target.value })} options={provOpts} placeholder="Tanlang" /></Field>
                <Field label="Sabab"><Inp value={dek.sabab} onChange={(x) => setDek({ ...dek, sabab: x.target.value })} placeholder="Masalan: shartnoma asosida dars beradi" /></Field>
              </div>
              <Button className="mt-8" v="soft" icon={<Plus />} disabled={!dek.providerId || !dek.sabab.trim()} onClick={dekQosh}>Deklaratsiya qoʻshish</Button>
            </Sec>
            <Sec icon={<ClipboardList />} title="Faol arizalar">
              {faolArizalar(e.id).length ? faolArizalar(e.id).map((a) => (
                <div key={a.id} className="li"><div className="grow"><div className="small b">{a.raqam}</div><div className="xs muted">{provQisqa(db, a.providerId)} · varaq {a.varaqlar.some((v) => v.ekspertId === e.id) ? 'topshirilgan' : 'kutilmoqda'}</div></div><Holat h={a.holat} /></div>
              )) : <Empty title="Faol ariza yoʻq">Akkreditatsiya sahifasida «Ekspert biriktirish» orqali tayinlanadi.</Empty>}
            </Sec>
          </>
        )}
      </Modal>
      <Modal open={yangi} onClose={() => setYangi(false)} title="Ekspert qoʻshish" footer={<><Button v="ghost" onClick={() => setYangi(false)}>Bekor qilish</Button><Button v="primary" onClick={qosh}>Saqlash</Button></>}>
        <div className="col gap-12">
          {xato && <Alert ton="err">{xato}</Alert>}
          <div className="form-grid">
            <Field label="F.I.Sh." req full><Inp value={f.fio} onChange={(x) => setF({ ...f, fio: x.target.value })} /></Field>
            <Field label="Mutaxassislik" req><Sel value={f.mutaxassislik} onChange={(x) => setF({ ...f, mutaxassislik: x.target.value })} options={MUTAXASSISLIKLAR.map((m) => m.nomi)} /></Field>
            <Field label="Vakolat muddati" req><Inp type="date" value={f.vakolatMuddati} onChange={(x) => setF({ ...f, vakolatMuddati: x.target.value })} /></Field>
            <Field label="Ish joyi" req full><Txt rows={2} value={f.ishJoyi} onChange={(x) => setF({ ...f, ishJoyi: x.target.value })} /></Field>
            <Field label="Ish joyi provayder boʻlsa" full help="Tanlansa, shu provayder arizalariga avtomatik bloklanadi"><Sel value={f.ishJoyiProviderId} onChange={(x) => setF({ ...f, ishJoyiProviderId: x.target.value })} options={provOpts} placeholder="Provayder emas" /></Field>
          </div>
        </div>
      </Modal>
    </>
  )
}
