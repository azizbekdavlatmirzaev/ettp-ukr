import { useEffect, useState } from 'react'
import { Lock, Plus, X } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { Alert, Badge, Bar, Button, Check, Confirm, Field, FileDrop, Inp, Modal, Sel, Txt } from '@/ui'
import { sana } from '@/lib/format'
import { useMarkaz } from './_parts'

export function EkspertModal({ a, onClose }: { a?: T.AkkAriza; onClose: () => void }) {
  const { db, ijro, ok, bugun } = useMarkaz()
  const [sel, setSel] = useState<string[]>([])
  useEffect(() => setSel([]), [a?.id])
  if (!a) return <Modal open={false} onClose={onClose} title=""><span /></Modal>
  const nomzod = A.ekspertNomzodlar(db, a.id)
  const balllar = a.varaqlar.map(A.varaqBali)
  const farq = balllar.length >= 2 ? Math.max(...balllar) - Math.min(...balllar) : 0
  const kerak = farq > 25 ? 3 : 2
  const yetmaydi = Math.max(0, kerak - a.ekspertlar.length)
  const urinish = (id: string) => {
    const r = ijro(A.ekspertBiriktir, a.id, [id])
    if (r.ok) ok('Ekspert biriktirildi.')
  }
  const saqla = () => {
    const r = ijro(A.ekspertBiriktir, a.id, sel)
    if (r.ok) { ok(`${sel.length} ta ekspert biriktirildi va xabardor qilindi.`, a.raqam); onClose() }
  }
  return (
    <Modal open onClose={onClose} size="lg" title="Ekspert biriktirish" sub={`${a.raqam} · ish joyi va deklaratsiya boʻyicha avtomatik toʻqnashuv tekshiruvi`}
      footer={<><Button v="ghost" onClick={onClose}>Yopish</Button><Button v="primary" disabled={!sel.length} onClick={saqla}>Tanlanganlarni biriktirish ({sel.length})</Button></>}>
      <div className="col gap-12">
        {farq > 25 ? <Alert ton="warn" title={`Ballar farqi ${farq}% (> 25%)`}>Uchinchi ekspert biriktirilishi kerak — aks holda komissiyaga yuborilmaydi.</Alert>
          : <Alert ton="info">Ikki ekspert mustaqil baholaydi. Hozir biriktirilgan: {a.ekspertlar.length}; yana kerak: {yetmaydi}.</Alert>}
        {nomzod.map(({ e, toqnashuv, sabab }) => {
          const bor = a.ekspertlar.includes(e.id)
          const muddatOtgan = e.vakolatMuddati < bugun
          const blok = toqnashuv || !e.faol || muddatOtgan
          return (
            <div key={e.id} className="li" style={{ alignItems: 'flex-start', opacity: bor ? 0.7 : 1 }}>
              <div style={{ paddingTop: 2 }}>
                {bor ? <Badge ton="ok">Biriktirilgan</Badge> : blok ? <Lock size={16} color="var(--err)" /> : <Check label="" checked={sel.includes(e.id)} onChange={() => setSel(sel.includes(e.id) ? sel.filter((x) => x !== e.id) : [...sel, e.id])} />}
              </div>
              <div className="grow">
                <div className="small b">{e.fio}</div>
                <div className="xs muted">{e.mutaxassislik} · {e.ishJoyi} · vakolat {sana(e.vakolatMuddati)} gacha</div>
                {toqnashuv && <div className="xs mt-4" style={{ color: 'var(--err)' }}>Manfaatlar toʻqnashuvi: {sabab}</div>}
                {!e.faol && <div className="xs mt-4" style={{ color: 'var(--err)' }}>Vakolati toʻxtatilgan</div>}
                {muddatOtgan && <div className="xs mt-4" style={{ color: 'var(--err)' }}>Vakolat muddati tugagan</div>}
              </div>
              {toqnashuv && !bor && <Button size="xs" v="ghost" onClick={() => urinish(e.id)} title="Tizim 403 bilan bloklaydi va auditga yozadi">Baribir urinish</Button>}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export function JoyidaModal({ a, onClose }: { a?: T.AkkAriza; onClose: () => void }) {
  const { db, user, ijro, ok, bugun } = useMarkaz()
  const [f, setF] = useState({ sana: bugun, manzil: '', tekshiruvchilar: '', xulosa: '' })
  const [fayl, setFayl] = useState<T.Fayl>()
  useEffect(() => {
    if (a) {
      setF({ sana: a.joyida?.sana ?? bugun, manzil: a.joyida?.manzil ?? A.provayder(db, a.providerId)?.manzil ?? '', tekshiruvchilar: a.joyida?.tekshiruvchilar.join(', ') ?? user.fio, xulosa: '' })
      setFayl(undefined)
    }
  }, [a?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const saqla = () => {
    if (!a) return
    const r = ijro(A.joyidaTekshiruv, a.id, { sana: f.sana, manzil: f.manzil, tekshiruvchilar: f.tekshiruvchilar.split(',').map((x) => x.trim()).filter(Boolean), dalolatnoma: fayl ? `${fayl.nomi} · SHA-256 ${fayl.hash.slice(0, 16)}` : undefined, xulosa: f.xulosa.trim() || undefined })
    if (r.ok) { ok(f.xulosa.trim() ? 'Dalolatnoma saqlandi — ariza komissiyaga oʻtdi.' : `Joyida tekshiruv ${sana(f.sana)} ga belgilandi.`, a.raqam); onClose() }
  }
  return (
    <Modal open={!!a} onClose={onClose} title="Joyida tekshiruv" sub={a?.raqam}
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" onClick={saqla} disabled={!f.manzil.trim() || !f.tekshiruvchilar.trim()}>Saqlash</Button></>}>
      <div className="form-grid">
        <Field label="Sana" req><Inp type="date" value={f.sana} onChange={(e) => setF({ ...f, sana: e.target.value })} /></Field>
        <Field label="Manzil" req><Inp value={f.manzil} onChange={(e) => setF({ ...f, manzil: e.target.value })} /></Field>
        <Field label="Tekshiruvchilar" req full help="Vergul bilan ajrating"><Inp value={f.tekshiruvchilar} onChange={(e) => setF({ ...f, tekshiruvchilar: e.target.value })} /></Field>
        <Field label="Dalolatnoma (foto/hujjat dalillari)" full><FileDrop value={fayl} onChange={setFayl} /></Field>
        <Field label="Xulosa" full help="Xulosa kiritilsa, ariza komissiya bosqichiga oʻtadi. Boʻsh qoldirilsa — faqat tekshiruv rejalashtiriladi."><Txt rows={3} value={f.xulosa} onChange={(e) => setF({ ...f, xulosa: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

type QTuri = NonNullable<T.AkkAriza['qaror']>['turi']
const QT: { v: QTuri; l: string }[] = [{ v: 'akkreditatsiya', l: 'Akkreditatsiya' }, { v: 'shartli', l: 'Shartli akkreditatsiya' }, { v: 'rad', l: 'Rad etish' }, { v: 'qoshimcha', l: 'Qoʻshimcha tekshiruv' }]
const yilQosh = (s: string, n: number) => `${Number(s.slice(0, 4)) + n}${s.slice(4, 10)}`

export function QarorModal({ a, onClose }: { a?: T.AkkAriza; onClose: () => void }) {
  const { db, ijro, ok, bugun } = useMarkaz()
  const v = a?.versiyaId ? A.versiya(db, a.versiyaId) : undefined
  const [azolar, setAzolar] = useState<string[]>([])
  const [yangiAzo, setYangiAzo] = useState('')
  const [ov, setOv] = useState({ za: 0, qarshi: 0, betaraf: 0 })
  const [f, setF] = useState({ turi: 'akkreditatsiya' as QTuri, raqam: '', muddat: '', kredit: '', bayonnoma: '', sabab: '' })
  const [tasdiq, setTasdiq] = useState(false)
  useEffect(() => {
    if (!a) return
    const ekspFio = a.ekspertlar.map((id) => db.ekspertlar.find((e) => e.id === id)?.fio.split(' ').slice(0, 2).join(' ')).filter(Boolean) as string[]
    const az = ['Abdullayev Rustam (rais)', 'Tursunova Gulnoza (kotib)', ...ekspFio, 'Valiyev Ulugʻbek', 'Sobirova Dilfuza']
    setAzolar(az)
    setOv({ za: az.length, qarshi: 0, betaraf: 0 })
    setF({ turi: 'akkreditatsiya', raqam: `UKR-${bugun.slice(0, 4)}/${(db.akkArizalar.filter((x) => x.qaror).length + 240)}`, muddat: yilQosh(bugun, 3), kredit: String(v?.soralganKredit ?? ''), bayonnoma: `Komissiya bayonnomasi №${(db.akkArizalar.filter((x) => x.komissiya).length + 8)}, ${bugun}`, sabab: '' })
  }, [a?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!a) return null
  const jami = ov.za + ov.qarshi + ov.betaraf
  const kvorum = Math.ceil((azolar.length * 2) / 3)
  const akk = f.turi === 'akkreditatsiya' || f.turi === 'shartli'
  const yubor = () => {
    const r = ijro(A.akkQaror, a.id, { turi: f.turi, raqam: f.raqam, muddat: akk ? f.muddat : undefined, sabab: f.sabab, kredit: a.turi !== 'provayder' && akk ? Number(f.kredit) : undefined, komissiya: { azolar, ovozlar: ov, bayonnoma: f.bayonnoma } })
    setTasdiq(false)
    if (r.ok) { ok(`Qaror ${f.raqam} ERI bilan tasdiqlandi. Reestr avtomatik yangilandi, provayderga xabar yuborildi.`, a.raqam); onClose() }
  }
  const num = (k: keyof typeof ov) => <Inp type="number" min={0} value={ov[k]} onChange={(e) => setOv({ ...ov, [k]: Math.max(0, Number(e.target.value)) })} />
  return (
    <>
      <Modal open onClose={onClose} size="lg" title="Komissiya qarori" sub={`${a.raqam} · qaror ERI bilan imzolanadi`}
        footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" disabled={!f.raqam.trim() || !f.sabab.trim() || jami < kvorum} onClick={() => setTasdiq(true)}>Qarorni tasdiqlash</Button></>}>
        <div className="col gap-16">
          {a.varaqlar.length > 0 && (
            <Alert ton="info" title="Ekspertlar tavsiyasi (qaror emas)">
              {a.varaqlar.map((x) => <div key={x.ekspertId} className="small">{db.ekspertlar.find((e) => e.id === x.ekspertId)?.fio}: <b>{x.tavsiya}</b>, {A.varaqBali(x)}% — {x.xulosa}</div>)}
            </Alert>
          )}
          <div>
            <div className="small b mb-8">Komissiya aʼzolari ({azolar.length})</div>
            <div className="row wrap gap-6">
              {azolar.map((z, i) => (
                <span key={z + i} className="chip">{z}<button className="btn ghost xs" style={{ height: 20, padding: '0 4px' }} onClick={() => setAzolar(azolar.filter((_, k) => k !== i))} aria-label="Olib tashlash"><X size={12} /></button></span>
              ))}
            </div>
            <div className="row mt-8">
              <Inp value={yangiAzo} onChange={(e) => setYangiAzo(e.target.value)} placeholder="Aʼzo F.I.Sh." />
              <Button v="soft" icon={<Plus />} disabled={!yangiAzo.trim()} onClick={() => { setAzolar([...azolar, yangiAzo.trim()]); setYangiAzo('') }}>Qoʻshish</Button>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Za"> {num('za')}</Field>
            <Field label="Qarshi">{num('qarshi')}</Field>
            <Field label="Betaraf">{num('betaraf')}</Field>
            <Field label={`Kvorum: ${jami} / ${kvorum} kerak`}>
              <Bar v={jami} max={Math.max(kvorum, 1)} ton={jami >= kvorum ? 'ok' : 'err'} />
              <span className="xs" style={{ color: jami >= kvorum ? 'var(--ok)' : 'var(--err)' }}>{jami >= kvorum ? 'Kvorum bor' : 'Kvorum yoʻq — qaror qabul qilinmaydi'}</span>
            </Field>
            <Field label="Bayonnoma" full><Inp value={f.bayonnoma} onChange={(e) => setF({ ...f, bayonnoma: e.target.value })} /></Field>
            <Field label="Qaror turi" req><Sel value={f.turi} onChange={(e) => { const t = e.target.value as QTuri; setF({ ...f, turi: t, muddat: t === 'shartli' ? yilQosh(bugun, 1) : yilQosh(bugun, 3) }) }} options={QT} /></Field>
            <Field label="Qaror raqami" req><Inp value={f.raqam} onChange={(e) => setF({ ...f, raqam: e.target.value })} /></Field>
            {akk && <Field label="Akkreditatsiya muddati" req><Inp type="date" value={f.muddat} onChange={(e) => setF({ ...f, muddat: e.target.value })} /></Field>}
            {akk && a.turi !== 'provayder' && <Field label="Tasdiqlangan kredit" req help={`Soʻralgan: ${v?.soralganKredit ?? '—'}. Provayder bu qiymatni oʻzgartira olmaydi.`}><Inp type="number" min={0} step={0.5} value={f.kredit} onChange={(e) => setF({ ...f, kredit: e.target.value })} /></Field>}
            <Field label="Sabab / asos" req full><Txt rows={3} value={f.sabab} onChange={(e) => setF({ ...f, sabab: e.target.value })} /></Field>
          </div>
        </div>
      </Modal>
      <Confirm open={tasdiq} onClose={() => setTasdiq(false)} onOk={yubor} eri title="Qarorni ERI bilan imzolash" okText="Imzolash">
        <p className="small">{QT.find((x) => x.v === f.turi)?.l} · {f.raqam}{akk ? ` · ${sana(f.muddat)} gacha` : ''}{akk && a.turi !== 'provayder' ? ` · ${f.kredit} kredit` : ''}. Ovozlar: {ov.za}/{ov.qarshi}/{ov.betaraf}.</p>
      </Confirm>
    </>
  )
}
