import { useEffect, useState } from 'react'
import { useStore } from '@/domain/store'
import { murojaatYubor } from '@/domain/amallar'
import type { Fayl, Murojaat } from '@/domain/types'
import { Button, Field, FileDrop, Modal, Sel, Txt, Alert } from '@/ui'
import { MUROJAAT_TURI } from '@/lib/holat'

/** «Murojaat yuborish» — barcha kabinetlarda (TZ 4.2.14). Obyekt berilsa, murojaat shu yozuvga bogʻlanadi. */
export function MurojaatModal({ open, onClose, obyekt, turi, birinchiQarorChiqargan }: { open: boolean; onClose: () => void; obyekt?: Murojaat['obyekt']; turi?: Murojaat['turi']; birinchiQarorChiqargan?: string }) {
  const amal = useStore((s) => s.amal)
  const toast = useStore((s) => s.toast)
  const [t, setT] = useState<Murojaat['turi']>(turi ?? 'kredit')
  const [matn, setMatn] = useState('')
  const [fayl, setFayl] = useState<Fayl | undefined>()
  useEffect(() => {
    if (open) {
      setT(turi ?? 'kredit')
      setMatn('')
      setFayl(undefined)
    }
  }, [open, turi])
  const yubor = () => {
    const r = amal(murojaatYubor, { turi: t, obyekt, matn, fayllar: fayl ? [fayl] : [], birinchiQarorChiqargan })
    if (r) {
      toast({ turi: 'ok', sarlavha: `Murojaat ${r.raqam} yuborildi`, matn: `Koʻrib chiqish muddati: ${r.muddat}. Holatini «Arizalarim» boʻlimida kuzating.` })
      onClose()
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Murojaat yuborish"
      sub="Kredit, sertifikat, baho, akkreditatsiya yoki boshqa qaror ustidan"
      footer={
        <>
          <Button v="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button v="primary" onClick={yubor} disabled={matn.trim().length < 10}>Yuborish</Button>
        </>
      }
    >
      <div className="col gap-16">
        {obyekt && <Alert ton="info" title="Murojaat obyekti">{obyekt.nomi}</Alert>}
        <Field label="Murojaat turi" req>
          <Sel value={t} onChange={(e) => setT(e.target.value as Murojaat['turi'])} options={Object.entries(MUROJAAT_TURI).map(([v, l]) => ({ v, l }))} />
        </Field>
        <Field label="Murojaat matni" req help="Nimadan norozi ekaningiz va qanday yechim kutayotganingizni yozing (kamida 10 belgi).">
          <Txt value={matn} onChange={(e) => setMatn(e.target.value)} rows={5} placeholder="Masalan: «BLS kursi uchun kredit turi amaliy boʻlishi kerak, chunki…»" />
        </Field>
        <Field label="Ilova (ixtiyoriy)">
          <FileDrop value={fayl} onChange={setFayl} />
        </Field>
        <div className="xs muted">Murojaat yuborilishining oʻzi kredit yoki hujjat holatini oʻzgartirmaydi. Muddat ish kunlarida hisoblanadi; muddat tugashiga 2 ish kuni qolganda masʼulga eslatma boradi.</div>
      </div>
    </Modal>
  )
}

export function MurojaatTugma({ obyekt, turi, label = 'Murojaat yuborish', size = 'sm' as 'sm' | 'xs' }: { obyekt?: Murojaat['obyekt']; turi?: Murojaat['turi']; label?: string; size?: 'sm' | 'xs' }) {
  const [o, setO] = useState(false)
  return (
    <>
      <Button v="ghost" size={size} onClick={(e) => { e.stopPropagation(); setO(true) }}>{label}</Button>
      <MurojaatModal open={o} onClose={() => setO(false)} obyekt={obyekt} turi={turi} />
    </>
  )
}
