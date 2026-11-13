import { useEffect, useState } from 'react'
import { PenLine } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { Alert, Button, DL, Field, FileDrop, Inp, Modal, Seg, Txt } from '@/ui'
import { sanaVaqt } from '@/lib/format'
import { KURS_TURI, MANBA, TADBIR, YONALISH } from '@/lib/holat'
import { useMarkaz, RolTugma, MUT_SABAB, shaxsQisqa, Qulf } from './_parts'

/** Jurnal yozuvi tafsiloti + «Tuzatish taklifi» (faqat mutaxassis). */
export function YozuvDrawer({ y, onClose }: { y?: T.KreditYozuvi; onClose: () => void }) {
  const { db, mutaxassis, ijro, ok } = useMarkaz()
  const [taklif, setTaklif] = useState(false)
  const [turi, setTuri] = useState<'bekor' | 'almashtirish'>('bekor')
  const [miqdor, setMiqdor] = useState('')
  const [sabab, setSabab] = useState('')
  const [hujjat, setHujjat] = useState('')
  const [fayl, setFayl] = useState<T.Fayl>()
  useEffect(() => { setTaklif(false); setTuri('bekor'); setMiqdor(''); setSabab(''); setHujjat(''); setFayl(undefined) }, [y?.id])
  if (!y) return <Modal open={false} onClose={onClose} title=""><span /></Modal>
  const bekorQiluvchi = db.jurnal.find((j) => j.bekorQilinganId === y.id)
  const asl = y.bekorQilinganId ? db.jurnal.find((j) => j.id === y.bekorQilinganId) : undefined
  const kutilmoqda = db.tuzatishlar.find((t) => t.yozuvId === y.id && t.holat === 'kutilmoqda')
  const qoida = db.qoidalar.find((q) => q.id === y.qoidaId)
  const blok = !mutaxassis ? MUT_SABAB : y.miqdor < 0 ? 'Bekor qiluvchi yozuvni tuzatib boʻlmaydi.' : bekorQiluvchi ? 'Yozuv allaqachon bekor qilingan.' : kutilmoqda ? 'Bu yozuv boʻyicha taklif koʻrib chiqilmoqda.' : ''
  const yubor = () => {
    const r = ijro(A.tuzatishTaklif, { yozuvId: y.id, turi, yangiMiqdor: turi === 'almashtirish' ? Number(miqdor) : undefined, sabab, hujjat: fayl ? `${hujjat} (${fayl.nomi}, SHA-256 ${fayl.hash.slice(0, 12)})` : hujjat })
    if (r.ok) { ok('Taklif qaror qabul qiluvchiga yuborildi. Jurnal tasdiqlangunga qadar oʻzgarmaydi.', 'Tuzatish taklifi'); setTaklif(false) }
  }
  return (
    <>
      <Modal open onClose={onClose} drawer title={`Yozuv #${y.seq}`} sub={y.nomi}
        footer={<RolTugma ruxsat={!blok} sabab={blok} v="primary" icon={<PenLine />} onClick={() => setTaklif(true)}>Tuzatish taklifi</RolTugma>}>
        <div className="col gap-12">
          {!mutaxassis && <Qulf>Tuzatishni mutaxassis taklif qiladi, siz «Tuzatishlar» boʻlimida tasdiqlaysiz yoki rad etasiz.</Qulf>}
          {bekorQiluvchi && <Alert ton="warn">Bu yozuv #{bekorQiluvchi.seq} yozuv bilan bekor qilingan ({sanaVaqt(bekorQiluvchi.sana)}).</Alert>}
          {asl && <Alert ton="info">Bu bekor qiluvchi yozuv: asl yozuv #{asl.seq} ({asl.miqdor} kredit).</Alert>}
          <DL items={[
            ['Xodim', shaxsQisqa(db, y.personId)],
            ['Yil', y.yil],
            ['Miqdor', <b style={{ color: y.miqdor < 0 ? 'var(--err)' : 'var(--ok)' }}>{y.miqdor > 0 ? '+' : ''}{y.miqdor}</b>],
            ['Turi', `${KURS_TURI[y.kursTuri]} · ${YONALISH[y.yonalish]} · ${TADBIR[y.tadbirTuri]}`],
            ['Manba', `${MANBA[y.manba]} (${y.manbaId})`],
            ['Provayder', y.providerNomi],
            ['Qoida versiyasi', qoida ? `${qoida.versiya} — ${qoida.nomi}` : y.qoidaId],
            ['Sana', sanaVaqt(y.sana)],
            ['Asos', y.asos],
            ['Yaratuvchi', y.yaratuvchi],
            ['Sertifikat', y.sertifikatId ? db.sertifikatlar.find((s) => s.id === y.sertifikatId)?.raqam ?? y.sertifikatId : '—'],
          ]} />
          <div className="xs muted">Jurnal yozuvlari oʻchirilmaydi va oʻzgartirilmaydi: tuzatish — bekor qiluvchi va kerak boʻlsa yangi yozuv qoʻshish orqali.</div>
        </div>
      </Modal>
      <Modal open={taklif} onClose={() => setTaklif(false)} title="Tuzatish taklifi" sub={`#${y.seq} · ${y.nomi} · ${y.miqdor} kredit`}
        footer={<><Button v="ghost" onClick={() => setTaklif(false)}>Bekor qilish</Button><Button v="primary" disabled={!sabab.trim() || !hujjat.trim() || (turi === 'almashtirish' && !(Number(miqdor) > 0))} onClick={yubor}>Taklifni yuborish</Button></>}>
        <div className="col gap-16">
          <Seg id="tz-turi" value={turi} onChange={setTuri} items={[{ v: 'bekor', l: 'Bekor qilish' }, { v: 'almashtirish', l: 'Almashtirish (yangi miqdor)' }]} />
          {turi === 'almashtirish' && <Field label="Yangi miqdor" req help={`Hozirgi: ${y.miqdor}. Asl yozuvga qarshi −${y.miqdor} va yangi +N yozuv qoʻshiladi.`}><Inp type="number" min={0} step={0.5} value={miqdor} onChange={(e) => setMiqdor(e.target.value)} /></Field>}
          <Field label="Sabab" req><Txt rows={3} value={sabab} onChange={(e) => setSabab(e.target.value)} /></Field>
          <Field label="Asos hujjat (raqam, sana)" req><Inp value={hujjat} onChange={(e) => setHujjat(e.target.value)} placeholder="Xat №P-2026/801, 12.11.2026" /></Field>
          <Field label="Hujjat nusxasi"><FileDrop value={fayl} onChange={setFayl} /></Field>
          <Alert ton="info">Taklifni qilgan va tasdiqlagan — turli shaxslar. Tasdiqlangach xodim, ish beruvchi, Reestr va sertifikat avtomatik yangilanadi.</Alert>
        </div>
      </Modal>
    </>
  )
}
