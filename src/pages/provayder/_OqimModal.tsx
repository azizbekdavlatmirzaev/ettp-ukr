// «Yangi oqim» oynasi — faqat tasdiqlangan (akkreditatsiyasi amaldagi) versiyalar tanlanadi.
import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Check, Field, Inp, Modal, Sel } from '@/ui'
import { HUDUDLAR } from '@/domain/malumotnoma'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { MOLIYA, SHAKL } from '@/lib/holat'
import { useProv } from './_umumiy'

const qosh = (s: string, kun: number) => {
  const d = new Date(s + 'T12:00:00')
  d.setDate(d.getDate() + kun)
  return d.toISOString().slice(0, 10)
}

export function OqimModal({ open, onClose, versiyaId, onSaved }: { open: boolean; onClose: () => void; versiyaId?: string; onSaved: (o: T.Oqim) => void }) {
  const { db, p, versiyalar, amal, toast, bugun } = useProv()
  const tasdiq = useMemo(() => versiyalar.filter((v) => v.holat === 'tasdiqlangan'), [versiyalar])
  const yangiF = () => {
    const v = tasdiq.find((x) => x.id === versiyaId) ?? tasdiq[0]
    const b = qosh(bugun, 21)
    return {
      versiyaId: v?.id ?? '', boshlanish: b, tugash: qosh(b, 4), qabulTugash: qosh(b, -3), joy: v?.shakl === 'onlayn' ? 'Onlayn (Platforma kurs pleyeri)' : p.manzil, havola: v && v.shakl !== 'oflayn' ? 'https://vebinar.example.uz/' : '',
      hududId: p.hududId ?? 'R01', orinlar: 24, oqituvchi: v?.oqituvchilar[0] ?? '', moliya: 'byudjet' as T.Moliya, narx: 0, story: true,
    }
  }
  const [f, setF] = useState(yangiF)
  const [xato, setXato] = useState('')
  useEffect(() => {
    if (open) {
      setF(yangiF())
      setXato('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const v = A.versiya(db, f.versiyaId)
  const set = (x: Partial<typeof f>) => setF((s) => ({ ...s, ...x }))
  const akk = A.akkFaolmi(p)

  const saqla = () => {
    if (!f.versiyaId) return setXato('Tasdiqlangan dastur versiyasini tanlang.')
    if (f.tugash < f.boshlanish) return setXato('Tugash sanasi boshlanishdan oldin boʻlishi mumkin emas.')
    if (f.qabulTugash > f.boshlanish) return setXato('Qabul oqim boshlanishidan oldin tugashi kerak.')
    if (v?.shakl !== 'oflayn' && !f.havola.trim()) return setXato('Onlayn/aralash oqim uchun havolani kiriting.')
    if (f.moliya === 'shaxsiy' && !(f.narx > 0)) return setXato('Shaxsiy mablagʻ hisobidagi oqim uchun narxni kiriting.')
    const o = amal(A.oqimSaqla, { ...f, havola: f.havola.trim() || undefined, narx: f.moliya === 'shaxsiy' ? f.narx : 0 })
    if (o) {
      toast({ turi: 'ok', sarlavha: `Oqim ${o.kod} yaratildi`, matn: `${o.mashgulotlar.length} ta mashgʻulot va QR-kodlar avtomatik yaratildi. Katalogga chiqarish uchun «Eʼlon qilish»ni bosing.` })
      onSaved(o)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Yangi oqim" sub="Oqim faqat akkreditatsiyasi amaldagi dastur versiyasi uchun ochiladi" footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" onClick={saqla} disabled={!tasdiq.length || !akk}>Oqimni yaratish</Button></>}>
      {!akk && <Alert ton="err" title="Provayder akkreditatsiyasi amalda emas">Yangi oqim ochib boʻlmaydi. Akkreditatsiya boʻlimidan ariza yuboring.</Alert>}
      {!tasdiq.length && <Alert ton="warn" title="Tasdiqlangan dastur yoʻq">Avval dasturni akkreditatsiyadan oʻtkazing.</Alert>}
      {xato && <Alert ton="err">{xato}</Alert>}
      <div className="form-grid mt-12">
        <Field label="Dastur versiyasi" req full help={v ? `${v.soatNazariy + v.soatAmaliy} soat · ${SHAKL[v.shakl]} · tasdiqlangan kredit ${v.tasdiqlanganKredit} · amal muddati ${v.amalMuddati ?? '—'}` : undefined}>
          <Sel value={f.versiyaId} onChange={(e) => { const nv = A.versiya(db, e.target.value); set({ versiyaId: e.target.value, oqituvchi: nv?.oqituvchilar[0] ?? f.oqituvchi }) }} options={tasdiq.map((x) => ({ v: x.id, l: `${x.nomi} (v${x.versiya}, ${x.tasdiqlanganKredit} kredit)` }))} placeholder="Tanlang…" />
        </Field>
        <Field label="Boshlanish" req><Inp type="date" value={f.boshlanish} onChange={(e) => set({ boshlanish: e.target.value })} /></Field>
        <Field label="Tugash" req><Inp type="date" value={f.tugash} onChange={(e) => set({ tugash: e.target.value })} /></Field>
        <Field label="Qabul tugash sanasi" req help="Shu sanagacha katalogda yozilish ochiq"><Inp type="date" value={f.qabulTugash} onChange={(e) => set({ qabulTugash: e.target.value })} /></Field>
        <Field label="Oʻrinlar soni" req><Inp type="number" min={1} value={f.orinlar} onChange={(e) => set({ orinlar: Math.max(0, Number(e.target.value) || 0) })} /></Field>
        <Field label="Joy (manzil)" req full><Inp value={f.joy} onChange={(e) => set({ joy: e.target.value })} /></Field>
        {v?.shakl !== 'oflayn' && <Field label="Onlayn havola" req full><Inp value={f.havola} onChange={(e) => set({ havola: e.target.value })} placeholder="https://" /></Field>}
        <Field label="Hudud" req><Sel value={f.hududId} onChange={(e) => set({ hududId: e.target.value })} options={HUDUDLAR.map((h) => ({ v: h.id, l: h.nomi }))} /></Field>
        <Field label="Oʻqituvchi" req><Sel value={f.oqituvchi} onChange={(e) => set({ oqituvchi: e.target.value })} options={v?.oqituvchilar ?? []} /></Field>
        <Field label="Moliyalashtirish manbai" req><Sel value={f.moliya} onChange={(e) => set({ moliya: e.target.value as T.Moliya })} options={Object.entries(MOLIYA).map(([x, l]) => ({ v: x, l }))} /></Field>
        <Field label="Narx (soʻm)" help={f.moliya === 'shaxsiy' ? 'Tinglovchi toʻlaydi' : 'Shaxsiy mablagʻdan boshqa manbada bepul'}>
          <Inp type="number" min={0} step={50000} value={f.narx} disabled={f.moliya !== 'shaxsiy'} onChange={(e) => set({ narx: Math.max(0, Number(e.target.value) || 0) })} />
        </Field>
        <div className="full">
          <Check label="Eʼlon qilinganda story-eʼlonlar lentasiga chiqarish (mos xodimlarga xabar boradi)" checked={f.story} onChange={(e) => set({ story: e.target.checked })} />
        </div>
      </div>
    </Modal>
  )
}
