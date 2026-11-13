import { useEffect, useState } from 'react'
import { Download, Landmark } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { Alert, Button, Field, FileDrop, Inp, Modal, Seg, Sel, Txt } from '@/ui'
import { HUDUDLAR, MAMLAKATLAR } from '@/domain/malumotnoma'
import { useMarkaz } from './_parts'
import { litsenziyaSorov, soliqSorov } from './_amallar'

const bosh = { stir: '', nomi: '', qisqa: '', manzil: '', hududId: '', sayt: '', masulFio: '', masulLav: 'Direktor', masulTel: '', filiallar: '', mamlakat: 'Germaniya', akkTash: '', akkId: '', havola: '' }

export function RoyxatModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (p: T.Provayder) => void }) {
  const { ijro, ok } = useMarkaz()
  const [turi, setTuri] = useState<T.Provayder['turi']>('nodavlat')
  const [f, setF] = useState(bosh)
  const [lits, setLits] = useState<T.Provayder['litsenziya']>()
  const [xato, setXato] = useState('')
  const [soliqOk, setSoliqOk] = useState(false)
  useEffect(() => {
    if (open) { setF(bosh); setLits(undefined); setXato(''); setSoliqOk(false) }
  }, [open])
  const s = (k: keyof typeof bosh) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const soliq = () => {
    const r = ijro(soliqSorov, f.stir.trim())
    if (r.ok && r.r) {
      setF({ ...f, nomi: r.r.nomi, manzil: r.r.manzil, hududId: r.r.hududId, masulFio: r.r.rahbar })
      setSoliqOk(true)
      ok('Rekvizitlar Soliq tizimidan olindi (imitatsiya).')
    } else setXato(r.xato ?? '')
  }
  const litsenziya = () => {
    const r = ijro(litsenziyaSorov, f.stir.trim())
    if (r.ok && r.r) { setLits(r.r); ok(`Litsenziya ${r.r.raqam} topildi.`) } else setXato(r.xato ?? '')
  }
  const saqla = () => {
    setXato('')
    const d: Partial<T.Provayder> & { stir: string; nomi: string; turi: T.Provayder['turi'] } = {
      stir: f.stir.trim(), nomi: f.nomi.trim(), qisqa: f.qisqa.trim() || undefined, turi, manzil: f.manzil, sayt: f.sayt || undefined,
      hududId: turi === 'xorijiy' ? undefined : f.hududId || undefined, mamlakat: turi === 'xorijiy' ? f.mamlakat : 'Oʻzbekiston',
      litsenziya: turi === 'xorijiy' ? undefined : lits,
      xorijiyAkk: turi === 'xorijiy' ? { tashkilot: f.akkTash, id: f.akkId, havola: f.havola } : undefined,
      filiallar: f.filiallar.split(',').map((x) => x.trim()).filter(Boolean),
      masullar: f.masulFio ? [{ fio: f.masulFio, lavozim: f.masulLav, telefon: f.masulTel }] : [],
    }
    if (!d.nomi) return setXato('Tashkilot nomini kiriting (yoki Soliq tizimidan oling).')
    if (turi === 'xorijiy' && (!f.akkTash || !f.akkId || !f.havola)) return setXato('Xorijiy provayder uchun akkreditatsiya tashkiloti, ID va rasmiy havola majburiy.')
    const r = ijro(A.provayderRoyxat, d)
    if (r.ok && r.r) { ok(`${r.r.nomi} reestrga «Ariza berilgan» holatida kiritildi.`, 'Provayder roʻyxatga olindi'); onDone(r.r); onClose() } else setXato(r.xato ?? '')
  }
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Provayder roʻyxatga olish" sub="Bitta STIR — bitta provayder yozuvi. Holat faqat qaror asosida oʻzgaradi."
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" onClick={saqla}>Reestrga kiritish</Button></>}>
      <div className="col gap-16">
        <Seg id="prov-turi" value={turi} onChange={(v) => { setTuri(v); setXato('') }} items={[{ v: 'davlat', l: 'Davlat' }, { v: 'nodavlat', l: 'Nodavlat' }, { v: 'xorijiy', l: 'Xorijiy' }]} />
        {xato && <Alert ton="err" title="Saqlanmadi">{xato}</Alert>}
        {turi !== 'xorijiy' ? (
          <div className="form-grid">
            <Field label="STIR" req help="9 raqam">
              <div className="row">
                <Inp value={f.stir} onChange={s('stir')} inputMode="numeric" maxLength={9} placeholder="301234567" />
                <Button v="soft" icon={<Download />} onClick={soliq} disabled={f.stir.length !== 9}>Soliq tizimidan olish</Button>
              </div>
            </Field>
            <Field label="Hudud">
              <Sel value={f.hududId} onChange={s('hududId')} options={HUDUDLAR.map((h) => ({ v: h.id, l: h.nomi }))} placeholder="Tanlang" />
            </Field>
            <Field label="Tashkilot nomi" req full help={soliqOk ? 'Soliq tizimidan olingan (imitatsiya)' : undefined}><Inp value={f.nomi} onChange={s('nomi')} /></Field>
            <Field label="Qisqa nomi"><Inp value={f.qisqa} onChange={s('qisqa')} /></Field>
            <Field label="Manzil"><Inp value={f.manzil} onChange={s('manzil')} /></Field>
            <Field label="Taʼlim litsenziyasi" full help="Litsenziyalash tizimidan avtomatik olinadi (imitatsiya)">
              <div className="row wrap">
                <Button v="soft" icon={<Landmark />} onClick={litsenziya} disabled={f.stir.length !== 9}>Litsenziyalash tizimidan</Button>
                {lits ? <span className="small">№ <b>{lits.raqam}</b> · {lits.sana} → {lits.muddat}</span> : <span className="xs muted">Hali olinmagan</span>}
              </div>
            </Field>
            <Field label="Filiallar" full help="Vergul bilan ajrating"><Inp value={f.filiallar} onChange={s('filiallar')} placeholder="Samarqand filiali, Fargʻona filiali" /></Field>
          </div>
        ) : (
          <div className="form-grid">
            <Field label="Tashkilot ID (xorijiy)" req><Inp value={f.stir} onChange={s('stir')} placeholder="INT-DE-12345" /></Field>
            <Field label="Mamlakat" req><Sel value={f.mamlakat} onChange={s('mamlakat')} options={MAMLAKATLAR.filter((m) => m !== 'Oʻzbekiston')} /></Field>
            <Field label="Tashkilot nomi" req full><Inp value={f.nomi} onChange={s('nomi')} /></Field>
            <Field label="Akkreditatsiya tashkiloti" req><Inp value={f.akkTash} onChange={s('akkTash')} placeholder="EACCME, ACCME, RCP CPD ..." /></Field>
            <Field label="Akkreditatsiya ID" req><Inp value={f.akkId} onChange={s('akkId')} /></Field>
            <Field label="Rasmiy manba havolasi" req full><Inp value={f.havola} onChange={s('havola')} placeholder="https://..." /></Field>
            <Field label="Manzil" full><Inp value={f.manzil} onChange={s('manzil')} /></Field>
          </div>
        )}
        <div className="form-grid">
          <Field label="Masʼul shaxs F.I.Sh."><Inp value={f.masulFio} onChange={s('masulFio')} /></Field>
          <Field label="Lavozimi / telefon">
            <div className="row"><Inp value={f.masulLav} onChange={s('masulLav')} /><Inp value={f.masulTel} onChange={s('masulTel')} placeholder="+998 ..." /></div>
          </Field>
        </div>
      </div>
    </Modal>
  )
}

const HOLATLAR = [
  { v: 'akkreditatsiyalangan', l: 'Akkreditatsiyalangan' },
  { v: 'shartli', l: 'Shartli akkreditatsiya' },
  { v: 'toxtatilgan', l: 'Toʻxtatilgan' },
  { v: 'bekor', l: 'Bekor qilingan' },
  { v: 'muddati_tugagan', l: 'Muddati tugagan' },
  { v: 'tiklash', l: 'Tiklash → Akkreditatsiyalangan' },
]

export function HolatModal({ p, onClose }: { p?: T.Provayder; onClose: () => void }) {
  const { ijro, ok, bugun } = useMarkaz()
  const [h, setH] = useState('akkreditatsiyalangan')
  const [raqam, setRaqam] = useState('')
  const [sana, setSana] = useState(bugun)
  const [muddat, setMuddat] = useState('')
  const [fayl, setFayl] = useState<T.Fayl>()
  const [sabab, setSabab] = useState('')
  const [xato, setXato] = useState('')
  useEffect(() => {
    if (p) { setH(p.holat === 'toxtatilgan' ? 'tiklash' : 'akkreditatsiyalangan'); setRaqam(''); setSana(bugun); setMuddat(''); setFayl(undefined); setSabab(''); setXato('') }
  }, [p, bugun])
  const akk = h === 'akkreditatsiyalangan' || h === 'shartli' || h === 'tiklash'
  const saqla = () => {
    if (!p) return
    if (akk && !muddat) return setXato('Akkreditatsiya muddatini kiriting.')
    if (!fayl) return setXato('Qogʻozdagi qaror nusxasini ilova qiling (1-bosqich: qaror hujjatsiz kiritilmaydi).')
    const yangi = (h === 'tiklash' ? 'akkreditatsiyalangan' : h) as T.AkkHolat
    const r = ijro(A.provayderHolati, p.id, yangi, { raqam, sana, muddat: akk ? muddat : undefined, hujjat: `${fayl.nomi} (SHA-256 ${fayl.hash.slice(0, 12)})`, sabab: h === 'tiklash' ? `Tiklash: ${sabab}` : sabab })
    if (r.ok) { ok(`${p.qisqa}: holat «${HOLATLAR.find((x) => x.v === h)?.l}» (${raqam}). Provayderga xabar yuborildi.`, 'Reestr yangilandi'); onClose() } else setXato(r.xato ?? '')
  }
  return (
    <Modal open={!!p} onClose={onClose} title="Holatni oʻzgartirish (qaror asosida)" sub={p?.nomi}
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" onClick={saqla} disabled={!raqam.trim() || !sabab.trim()}>🔐 ERI bilan saqlash</Button></>}>
      <div className="col gap-16">
        <Alert ton="info">1-bosqich: qogʻozdagi qaror asosida qoʻlda kiritiladi. Akkreditatsiya tugashi yoki toʻxtatilishi ilgari berilgan qonuniy sertifikatlarni bekor qilmaydi — faqat yangi qabul va yangi kreditlar toʻxtaydi.</Alert>
        {xato && <Alert ton="err">{xato}</Alert>}
        <div className="form-grid">
          <Field label="Yangi holat" req full><Sel value={h} onChange={(e) => setH(e.target.value)} options={HOLATLAR} /></Field>
          <Field label="Qaror raqami" req><Inp value={raqam} onChange={(e) => setRaqam(e.target.value)} placeholder="UKR-2026/245" /></Field>
          <Field label="Qaror sanasi" req><Inp type="date" value={sana} onChange={(e) => setSana(e.target.value)} /></Field>
          {akk && <Field label="Amal qilish muddati" req><Inp type="date" value={muddat} onChange={(e) => setMuddat(e.target.value)} /></Field>}
          <Field label="Qaror hujjati (skan)" req full><FileDrop value={fayl} onChange={setFayl} /></Field>
          <Field label="Sabab / asos" req full><Txt rows={3} value={sabab} onChange={(e) => setSabab(e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  )
}
