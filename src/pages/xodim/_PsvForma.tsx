import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { useXodim } from '@/shared/hooks'
import { Alert, Button, Check, Field, Inp, Modal, Txt } from '@/ui'
import { pul } from '@/lib/format'
import { PSV_HUJJAT } from '@/lib/holat'

type HT = T.PsvIsh['hujjatlar'][number]['turi']

export function PsvForma({ open, onClose, onYaratildi }: { open: boolean; onClose: () => void; onYaratildi?: (p: T.PsvIsh) => void }) {
  const { amal, toast } = useXodim()
  const keyinYil = new Date(Date.now() + 182 * 86400000).toISOString().slice(0, 10)
  const [qq, setQq] = useState('')
  const [maqsad, setMaqsad] = useState('')
  const [h, setH] = useState<HT[]>(['diplom', 'ukr'])
  const [roz, setRoz] = useState(false)
  const [muddat, setMuddat] = useState(keyinYil)
  useEffect(() => {
    if (open) {
      setQq('')
      setMaqsad('')
      setH(['diplom', 'ukr'])
      setRoz(false)
      setMuddat(keyinYil)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const yubor = () => {
    const p = amal(A.psvYarat, { qabulQiluvchi: qq, maqsad, hujjatlar: h, rozilikMuddat: muddat })
    if (p) {
      toast({ turi: 'ok', sarlavha: `PSV soʻrovi ${p.raqam} yaratildi`, matn: `Toʻlov: ${pul(p.tolov.tarif)} — Yagona billing orqali toʻlang.` })
      onYaratildi?.(p)
      onClose()
    }
  }
  return (
    <Modal open={open} onClose={onClose} size="lg" title="PSV soʻrovi" sub="Hujjatlarni birlamchi manbadan tekshirish (diplom, toifa, staj, UKR kreditlari …)"
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" icon={<Send />} disabled={!qq.trim() || !h.length || !roz || !muddat} onClick={yubor}>Soʻrov yaratish</Button></>}>
      <div className="col gap-16">
        <div className="form-grid">
          <Field label="Qabul qiluvchi tashkilot" req full><Inp value={qq} onChange={(e) => setQq(e.target.value)} placeholder="Masalan: Medical Council (UK)" /></Field>
          <Field label="Maqsad" full><Txt rows={2} value={maqsad} onChange={(e) => setMaqsad(e.target.value)} placeholder="Masalan: xorijda ishga qabul uchun malaka tasdigʻi" /></Field>
        </div>
        <Field label="Tekshiriladigan hujjatlar" req>
          <div className="grid g3" style={{ gap: 8 }}>
            {(Object.keys(PSV_HUJJAT) as HT[]).map((k) => (
              <Check key={k} label={PSV_HUJJAT[k]} checked={h.includes(k)} onChange={(e) => setH(e.target.checked ? [...h, k] : h.filter((x) => x !== k))} />
            ))}
          </div>
        </Field>
        <div className="card" style={{ boxShadow: 'none', background: 'var(--surface-2)' }}>
          <Check label={<span><b>Roziligimni beraman:</b> tanlangan maʼlumotlar birlamchi manbalardan soʻralib, faqat yuqoridagi tashkilotga uzatilsin.</span>} checked={roz} onChange={(e) => setRoz(e.target.checked)} />
          <div className="row wrap mt-12" style={{ gap: 12 }}>
            <Field label="Rozilik muddati"><Inp type="date" value={muddat} onChange={(e) => setMuddat(e.target.value)} style={{ maxWidth: 200 }} /></Field>
            <div className="xs muted grow" style={{ minWidth: 200 }}>Rozilikni istalgan vaqtda «Profil» boʻlimida bekor qilishingiz mumkin — shundan keyin maʼlumot uzatilmaydi.</div>
          </div>
        </div>
        <Alert ton="info" title={`Xizmat narxi: ${pul(150000)}`}>Toʻlov Yagona billing orqali amalga oshiriladi. PSV hisoboti litsenziya, apostil, nostrifikatsiya yoki Good Standing oʻrnini bosmaydi.</Alert>
      </div>
    </Modal>
  )
}
