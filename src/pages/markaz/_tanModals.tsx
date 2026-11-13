import { useEffect, useState } from 'react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { Alert, Button, Field, Inp, Modal, Seg, Sel, Txt } from '@/ui'
import { useMarkaz } from './_parts'

const USUL: { v: 'QR' | 'reestr' | 'rasmiy_sorov'; l: string }[] = [
  { v: 'QR', l: 'Sertifikat QR-kodi' },
  { v: 'reestr', l: 'Xorijiy reestr' },
  { v: 'rasmiy_sorov', l: 'Tashkilotga rasmiy soʻrov' },
]
export const USUL_NOMI: Record<string, string> = Object.fromEntries(USUL.map((u) => [u.v, u.l]))

export function TekshiruvModal({ t, onClose }: { t?: T.TanOlishAriza; onClose: () => void }) {
  const { ijro, ok } = useMarkaz()
  const [usul, setUsul] = useState<'QR' | 'reestr' | 'rasmiy_sorov'>('reestr')
  const [natija, setNatija] = useState('')
  useEffect(() => { setUsul('reestr'); setNatija('') }, [t?.id])
  const saqla = () => {
    if (!t) return
    const r = ijro(A.tanOlishTekshiruv, t.id, usul, natija)
    if (r.ok) { ok('Tekshiruv natijasi dalil sifatida saqlandi.', t.raqam); onClose() }
  }
  return (
    <Modal open={!!t} onClose={onClose} title="Tekshiruv qoʻshish" sub={t ? `${t.raqam} · ${t.tashkilot} · sertifikat ${t.sertifikatRaqam}` : ''}
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" disabled={!natija.trim()} onClick={saqla}>Saqlash</Button></>}>
      <div className="col gap-16">
        <Field label="Usul" req><Sel value={usul} onChange={(e) => setUsul(e.target.value as typeof usul)} options={USUL} /></Field>
        <Field label="Natija (soʻrov va javob)" req help="Barcha soʻrov va javoblar dalil sifatida saqlanadi"><Txt rows={4} value={natija} onChange={(e) => setNatija(e.target.value)} placeholder={usul === 'rasmiy_sorov' ? 'Xat №UKR-2026/..., javob: ... ' : 'Reestrda topildi: ...'} /></Field>
      </div>
    </Modal>
  )
}

export function XulosaModal({ t, onClose }: { t?: T.TanOlishAriza; onClose: () => void }) {
  const { ijro, ok } = useMarkaz()
  const [f, setF] = useState({ turi: 'qisman' as 'toliq' | 'qisman' | 'rad', milliyKredit: '', kursTuri: 'tanlov' as T.KursTuri, yonalish: 'nazariy' as T.Yonalish, metodika: 'TM-2026.1', asos: '' })
  useEffect(() => {
    if (t) setF({ turi: 'qisman', milliyKredit: '', kursTuri: 'tanlov', yonalish: t.shakl === 'oflayn' && /work|skill|acls|bls|practical|simul/i.test(t.kurs) ? 'amaliy' : 'nazariy', metodika: 'TM-2026.1', asos: '' })
  }, [t?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!t) return null
  const tavsiya = Math.floor(t.soat / 2)
  const saqla = () => {
    const r = ijro(A.tanOlishXulosa, t.id, { turi: f.turi, milliyKredit: Number(f.milliyKredit) || 0, kursTuri: f.kursTuri, yonalish: f.yonalish, metodika: f.metodika, asos: f.asos })
    if (r.ok) { ok('Xulosa tayyor — qaror qabul qiluvchiga tasdiqlash uchun yuborildi.', t.raqam); onClose() }
  }
  return (
    <Modal open onClose={onClose} size="lg" title="Xulosa tayyorlash" sub={`${t.raqam} · ${t.kurs}`}
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" disabled={!f.asos.trim() || (f.turi !== 'rad' && !(Number(f.milliyKredit) > 0))} onClick={saqla}>Xulosani yuborish</Button></>}>
      <div className="col gap-16">
        <Alert ton="warn" title="Xorijiy kredit avtomatik milliy kredit hisoblanmaydi">
          Sertifikatda {t.xorijiyKredit} {t.kreditTuri} koʻrsatilgan, lekin bu {t.xorijiyKredit} milliy kredit degani emas. Milliy kredit metodika boʻyicha oʻquv soatlari, mazmun va mutaxassislikka moslik asosida belgilanadi. Taxminiy hisob ({f.metodika}: 2 akademik soat ≈ 1 kredit): {t.soat} soat → ≈ {tavsiya} kredit.
        </Alert>
        <Seg id="tan-turi" value={f.turi} onChange={(v) => setF({ ...f, turi: v })} items={[{ v: 'toliq', l: 'Toʻliq tan olish' }, { v: 'qisman', l: 'Qisman tan olish' }, { v: 'rad', l: 'Rad etish' }]} />
        <div className="form-grid">
          {f.turi !== 'rad' && (
            <>
              <Field label="Milliy kredit" req><Inp type="number" min={0} step={0.5} value={f.milliyKredit} onChange={(e) => setF({ ...f, milliyKredit: e.target.value })} placeholder={String(tavsiya)} /></Field>
              <Field label="Metodika versiyasi" req><Inp value={f.metodika} onChange={(e) => setF({ ...f, metodika: e.target.value })} /></Field>
              <Field label="Kurs turi"><Sel value={f.kursTuri} onChange={(e) => setF({ ...f, kursTuri: e.target.value as T.KursTuri })} options={[{ v: 'tanlov', l: 'Tanlov' }, { v: 'majburiy', l: 'Majburiy' }]} /></Field>
              <Field label="Yoʻnalish"><Sel value={f.yonalish} onChange={(e) => setF({ ...f, yonalish: e.target.value as T.Yonalish })} options={[{ v: 'nazariy', l: 'Nazariy' }, { v: 'amaliy', l: 'Amaliy' }]} /></Field>
            </>
          )}
          <Field label="Asos" req full help="Masalan: qaysi sessiyalar mutaxassislikka mos, tekshiruv natijalari"><Txt rows={4} value={f.asos} onChange={(e) => setF({ ...f, asos: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  )
}
