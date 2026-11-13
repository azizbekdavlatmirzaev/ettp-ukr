import { useEffect, useState } from 'react'
import { ShieldAlert, Save } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { KONIKMALAR } from '@/domain/malumotnoma'
import { useJoriy } from '@/shared/hooks'
import { Alert, Button, Field, Inp, Modal, Sel, Txt } from '@/ui'
import { DARAJA } from '@/lib/holat'

export function LogbookForma({ open, onClose, mut }: { open: boolean; onClose: () => void; mut: string }) {
  const { db, amalX, toast, bugun } = useJoriy()
  const konikmalar = KONIKMALAR[mut] ?? KONIKMALAR.M01
  const bazalar = db.klinikBazalar.filter((b) => b.mutaxassisliklar.includes(mut))
  const bosh = () => ({ konikmaKod: konikmalar[0].kod, daraja: 'nazorat_ostida' as T.IshtirokDarajasi, sana: bugun, joy: bazalar[0]?.id ?? '', izoh: '' })
  const [d, setD] = useState(bosh)
  const [xato, setXato] = useState('')
  useEffect(() => {
    if (open) {
      setD(bosh())
      setXato('')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const jonli = A.shaxsiyMalumotBormi(d.izoh)
  const saqla = () => {
    setXato('')
    try {
      amalX(A.logbookQosh, d)
      toast({ turi: 'ok', sarlavha: 'Yozuv saqlandi', matn: 'Klinik rahbar tasdigʻiga yuborildi. Oʻz koʻnikmangizni oʻzingiz tasdiqlay olmaysiz.' })
      onClose()
    } catch (e) {
      if (e instanceof A.QoidaXatosi) setXato(e.message)
    }
  }
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Logbookka yozuv qoʻshish" sub="Bajarilgan amaliy koʻnikma — rahbar tasdigʻidan soʻng hisobga olinadi"
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" icon={<Save />} disabled={!d.izoh.trim() || !d.sana || !d.joy} onClick={saqla}>Saqlash</Button></>}>
      <div className="col gap-16">
        <div className="form-grid">
          <Field label="Koʻnikma" req full>
            <Sel value={d.konikmaKod} onChange={(e) => setD({ ...d, konikmaKod: e.target.value })} options={konikmalar.map((k) => ({ v: k.kod, l: `${k.kod} — ${k.nomi}${k.majburiy ? '' : ' (ixtiyoriy)'}` }))} />
          </Field>
          <Field label="Ishtirok darajasi" req>
            <Sel value={d.daraja} onChange={(e) => setD({ ...d, daraja: e.target.value as T.IshtirokDarajasi })} options={Object.entries(DARAJA).map(([v, l]) => ({ v, l }))} />
          </Field>
          <Field label="Sana" req><Inp type="date" max={bugun} value={d.sana} onChange={(e) => setD({ ...d, sana: e.target.value })} /></Field>
          <Field label="Joy (klinik baza)" req full>
            <Sel value={d.joy} onChange={(e) => setD({ ...d, joy: e.target.value })} options={bazalar.map((b) => ({ v: b.id, l: b.nomi }))} />
          </Field>
          <Field label="Izoh (anonim)" req full help="Faqat yosh, jins va klinik holat. Bemorni aniqlaydigan maʼlumot kiritilmaydi.">
            <Txt rows={3} value={d.izoh} onChange={(e) => { setD({ ...d, izoh: e.target.value }); setXato('') }} placeholder="Masalan: 58 yoshli erkak, OKS ST koʻtarilishi bilan" style={jonli.length ? { borderColor: 'var(--err)' } : undefined} />
          </Field>
        </div>
        {jonli.length > 0 && !xato && <Alert ton="warn" title="Shaxsga doir maʼlumot aniqlandi">Matnda {jonli.join(', ')} borga oʻxshaydi — saqlashda bloklanadi. Anonimlashtiring.</Alert>}
        {xato && (
          <Alert ton="err" title="Saqlash bloklandi (422)">
            <div className="row gap-6" style={{ alignItems: 'flex-start' }}><ShieldAlert size={16} style={{ flex: 'none', marginTop: 2 }} /> <span>{xato}</span></div>
          </Alert>
        )}
        <Alert ton="info" title="Ruxsat etilgan izoh namunalari">
          «58 yoshli erkak, OKS ST koʻtarilishi bilan» · «rejali EKG, 50 yoshli ayol» · «qabul boʻlimi, sinkopa» · «yurak yetishmovchiligi, NYHA III».
          <div className="xs mt-4">Taqiqlangan: bemorning F.I.Sh., JSHSHIR, telefon raqami, kasallik tarixi raqami.</div>
        </Alert>
      </div>
    </Modal>
  )
}
