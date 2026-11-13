import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'
import * as A from '@/domain/amallar'
import type * as T from '@/domain/types'
import { MAMLAKATLAR, MUTAXASSISLIKLAR } from '@/domain/malumotnoma'
import { useXodim } from '@/shared/hooks'
import { Alert, Button, DL, Field, FileDrop, Inp, Modal, Sel, Stepper } from '@/ui'
import { hajm, sana } from '@/lib/format'
import { SHAKL } from '@/lib/holat'

const QADAM = ['Kurs maʼlumotlari', 'Kredit', 'Fayllar', 'Tasdiqlash']
const FAYL = [
  { k: 'sertifikat', l: 'Sertifikat nusxasi', req: true },
  { k: 'dastur', l: 'Kurs dasturi (programma)' },
  { k: 'baholash', l: 'Baholash dalili (test/natija)' },
  { k: 'tarjima', l: 'Notarial tarjima (agar ingliz/rus tilida boʻlmasa)' },
]

export function TanOlishForma({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { shaxs, amalX, toast } = useXodim()
  const bosh = () => ({ tashkilot: '', davlat: 'Germaniya', kurs: '', sana: '', soat: '', shakl: 'oflayn' as T.Shakl, sertifikatRaqam: '', xorijiyKredit: '', kreditTuri: 'CME' as T.TanOlishAriza['kreditTuri'], mutaxassislikId: shaxs.mutaxassislikId })
  const [d, setD] = useState(bosh)
  const [f, setF] = useState<Record<string, T.Fayl | undefined>>({})
  const [q, setQ] = useState(0)
  const [xato, setXato] = useState<{ kod: number; matn: string } | null>(null)
  useEffect(() => {
    if (open) {
      setD(bosh())
      setF({})
      setQ(0)
      setXato(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const u = (k: keyof ReturnType<typeof bosh>, v: string) => setD({ ...d, [k]: v })
  const qadamOk = [
    d.tashkilot.trim() && d.kurs.trim() && d.sana && Number(d.soat) > 0 && d.sertifikatRaqam.trim(),
    Number(d.xorijiyKredit) > 0,
    !!f.sertifikat,
    true,
  ]
  const yubor = () => {
    setXato(null)
    try {
      const t = amalX(A.tanOlishYubor, {
        tashkilot: d.tashkilot, davlat: d.davlat, kurs: d.kurs, sana: d.sana, soat: Number(d.soat), shakl: d.shakl, sertifikatRaqam: d.sertifikatRaqam,
        xorijiyKredit: Number(d.xorijiyKredit), kreditTuri: d.kreditTuri, mutaxassislikId: d.mutaxassislikId, fayllar: Object.values(f).filter((x): x is T.Fayl => !!x),
      })
      toast({ turi: 'ok', sarlavha: `Ariza ${t.raqam} yuborildi`, matn: `Koʻrib chiqish muddati: ${sana(t.muddat)} (ish kunlarida).` })
      onClose()
    } catch (e) {
      if (e instanceof A.QoidaXatosi) setXato({ kod: e.kod, matn: e.message })
    }
  }
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Xorijiy kreditni tan olish" sub="Xorijda oʻtgan kurs boʻyicha milliy kreditga tenglashtirish arizasi"
      footer={<>
        {q > 0 && <Button v="ghost" icon={<ChevronLeft />} onClick={() => setQ(q - 1)}>Orqaga</Button>}
        <span style={{ flex: 1 }} />
        {q < 3 ? <Button v="primary" disabled={!qadamOk[q]} onClick={() => setQ(q + 1)}>Keyingi <ChevronRight size={16} /></Button>
          : <Button v="primary" icon={<Send />} onClick={yubor}>Arizani yuborish</Button>}
      </>}>
      <div className="col gap-16">
        <Stepper steps={QADAM} current={q} />
        {q === 0 && (
          <div className="form-grid">
            <Field label="Xorijiy tashkilot" req full><Inp value={d.tashkilot} onChange={(e) => u('tashkilot', e.target.value)} placeholder="Masalan: European Society of Cardiology" /></Field>
            <Field label="Davlat" req><Sel value={d.davlat} onChange={(e) => u('davlat', e.target.value)} options={MAMLAKATLAR.filter((m) => m !== 'Oʻzbekiston')} /></Field>
            <Field label="Shakl" req><Sel value={d.shakl} onChange={(e) => u('shakl', e.target.value)} options={Object.entries(SHAKL).map(([v, l]) => ({ v, l }))} /></Field>
            <Field label="Kurs nomi" req full><Inp value={d.kurs} onChange={(e) => u('kurs', e.target.value)} placeholder="Kurs yoki tadbir nomi" /></Field>
            <Field label="Sana" req><Inp type="date" value={d.sana} onChange={(e) => u('sana', e.target.value)} /></Field>
            <Field label="Soat" req><Inp type="number" min={1} value={d.soat} onChange={(e) => u('soat', e.target.value)} /></Field>
            <Field label="Sertifikat raqami" req full help="Bitta sertifikat boʻyicha faqat bitta ariza qabul qilinadi"><Inp value={d.sertifikatRaqam} onChange={(e) => u('sertifikatRaqam', e.target.value)} className="mono" /></Field>
          </div>
        )}
        {q === 1 && (
          <div className="form-grid">
            <Field label="Xorijiy kredit miqdori" req><Inp type="number" min={0} step={0.5} value={d.xorijiyKredit} onChange={(e) => u('xorijiyKredit', e.target.value)} /></Field>
            <Field label="Kredit turi" req><Sel value={d.kreditTuri} onChange={(e) => u('kreditTuri', e.target.value)} options={['CME', 'ECTS', 'CPD', 'boshqa']} /></Field>
            <Field label="Mutaxassislik" req full><Sel value={d.mutaxassislikId} onChange={(e) => u('mutaxassislikId', e.target.value)} options={MUTAXASSISLIKLAR.map((m) => ({ v: m.id, l: m.nomi }))} /></Field>
            <div className="full"><Alert ton="info">Xorijiy kredit avtomatik milliy kredit hisoblanmaydi. UKR markazi eksperti sertifikatni tekshiradi va metodika boʻyicha toʻliq, qisman tan olish yoki rad etish qarorini tayyorlaydi.</Alert></div>
          </div>
        )}
        {q === 2 && (
          <div className="col gap-12">
            {FAYL.map((x) => (
              <Field key={x.k} label={x.l} req={x.req}><FileDrop value={f[x.k]} onChange={(v) => setF({ ...f, [x.k]: v })} /></Field>
            ))}
          </div>
        )}
        {q === 3 && (
          <>
            <DL items={[
              ['Tashkilot', `${d.tashkilot} (${d.davlat})`],
              ['Kurs', d.kurs],
              ['Sana / hajm', `${sana(d.sana)} · ${d.soat} soat · ${SHAKL[d.shakl]}`],
              ['Sertifikat', d.sertifikatRaqam],
              ['Xorijiy kredit', `${d.xorijiyKredit} ${d.kreditTuri}`],
              ['Mutaxassislik', MUTAXASSISLIKLAR.find((m) => m.id === d.mutaxassislikId)?.nomi],
              ['Fayllar', Object.values(f).filter(Boolean).map((x) => `${x!.nomi} (${hajm(x!.hajm)})`).join(', ')],
            ]} />
            {xato && <Alert ton="err" title={xato.kod === 409 ? 'Takroriy ariza bloklandi (409)' : 'Ariza qabul qilinmadi'}>{xato.matn}</Alert>}
          </>
        )}
      </div>
    </Modal>
  )
}
