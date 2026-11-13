import { useEffect, useMemo, useState } from 'react'
import { Send, BookOpen } from 'lucide-react'
import * as A from '@/domain/amallar'
import { useJoriy } from '@/shared/hooks'
import { Alert, Button, Empty, Field, Modal, Txt, Badge, cx } from '@/ui'
import { sana } from '@/lib/format'
import { SHAKL, KURS_TURI, YONALISH } from '@/lib/holat'
import { useStore } from '@/domain/store'
import { mosOqimlar } from './_umumiy'

/** eslatmaYubor muvaffaqiyatda undefined qaytaradi — natijani oxirgi audit yozuvidan aniqlaymiz */
export function oxirgiAmalOk() {
  const a = useStore.getState().db.audit[0]
  return !!a && a.natija === 'ok' && (a.amal === 'Kurs tavsiyasi yuborildi' || a.amal === 'Eslatma yuborildi')
}

/** Xodim(lar)ga eslatma yuborish (A.eslatmaYubor) */
export function EslatmaModal({ open, onClose, personIds, onDone }: { open: boolean; onClose: () => void; personIds: string[]; onDone?: () => void }) {
  const { amal, toast, yil } = useJoriy()
  const [matn, setMatn] = useState('')
  useEffect(() => {
    if (open) setMatn(`${yil}-yil UKR talabini bajarish muddati 31-dekabr. Iltimos, kreditlaringizni tekshiring va kerakli kurslarga yoziling.`)
  }, [open, yil])
  const yubor = () => {
    amal(A.eslatmaYubor, personIds, matn)
    if (oxirgiAmalOk()) {
      toast({ turi: 'ok', sarlavha: 'Eslatma yuborildi', matn: `${personIds.length} ta xodimga kabinet va email orqali. Amal audit jurnaliga yozildi.` })
      onDone?.()
    }
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Eslatma yuborish" sub={`${personIds.length} ta xodimga · kabinet va email orqali`}
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" icon={<Send size={16} />} disabled={matn.trim().length < 5} onClick={yubor}>Yuborish</Button></>}>
      <Field label="Eslatma matni" req help="Xodim kabinetida «Ish beruvchidan» belgisi bilan koʻrinadi. Yuborish audit jurnaliga yoziladi.">
        <Txt rows={4} value={matn} onChange={(e) => setMatn(e.target.value)} />
      </Field>
    </Modal>
  )
}

/** Katalogdagi ochiq oqimni tanlab kurs tavsiya qilish (A.eslatmaYubor + oqimId) */
export function KursTavsiyaModal({ open, onClose, personIds, onDone }: { open: boolean; onClose: () => void; personIds: string[]; onDone?: () => void }) {
  const { db, amal, toast, bugun } = useJoriy()
  const [tanlangan, setTanlangan] = useState<string>('')
  const [izoh, setIzoh] = useState('')
  const variantlar = useMemo(() => (open ? mosOqimlar(db, personIds, bugun) : []), [open, db, personIds, bugun])
  useEffect(() => {
    if (open) {
      setTanlangan('')
      setIzoh('')
    }
  }, [open])
  const t = variantlar.find((x) => x.o.id === tanlangan)
  const yubor = () => {
    if (!t) return
    const matn = `«${t.v.nomi}» kursini tavsiya qilamiz (${t.o.kod}, ${sana(t.o.boshlanish)} – ${sana(t.o.tugash)}).${izoh.trim() ? ' ' + izoh.trim() : ''} Katalogdan yozilishingiz mumkin.`
    amal(A.eslatmaYubor, t.mos, matn, t.o.id)
    if (oxirgiAmalOk()) toast({ turi: 'ok', sarlavha: 'Kurs tavsiyasi yuborildi', matn: `${t.mos.length} ta xodimga${personIds.length > t.mos.length ? ` (${personIds.length - t.mos.length} tasiga kurs mos emas — yuborilmadi)` : ''}.` })
    onDone?.()
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Kurs tavsiya qilish" sub={`${personIds.length} ta xodim · faqat katalogdagi ochiq va mos oqimlar`}
      footer={<><Button v="ghost" onClick={onClose}>Bekor qilish</Button><Button v="primary" icon={<Send size={16} />} disabled={!t} onClick={yubor}>Tavsiya yuborish</Button></>}>
      {variantlar.length === 0 ? (
        <Empty icon={<BookOpen />} title="Mos ochiq oqim topilmadi">Tanlangan xodimlarning mutaxassisligi va maʼlumot darajasiga mos, qabul ochiq kurs hozircha yoʻq. Keyinroq katalogni qayta tekshiring.</Empty>
      ) : (
        <div className="col gap-16">
          <div className="col gap-6 scroll-y">
            {variantlar.slice(0, 20).map((x) => (
              <button key={x.o.id} type="button" onClick={() => setTanlangan(x.o.id)} className={cx('card', 'hover')} style={{ textAlign: 'left', padding: 12, cursor: 'pointer', borderColor: tanlangan === x.o.id ? 'var(--primary)' : undefined, boxShadow: 'none' }}>
                <div className="row between wrap">
                  <div className="b small">{x.v.nomi}</div>
                  <Badge ton={x.mos.length === personIds.length ? 'ok' : 'warn'}>{x.mos.length}/{personIds.length} mos</Badge>
                </div>
                <div className="xs muted mt-4">
                  {x.p?.qisqa} · {x.o.kod} · {sana(x.o.boshlanish)} – {sana(x.o.tugash)} · {SHAKL[x.v.shakl]} · {KURS_TURI[x.v.kursTuri]}, {YONALISH[x.v.yonalish]} · {x.v.tasdiqlanganKredit} kredit · boʻsh oʻrin: {Math.max(0, x.bosh)}
                </div>
              </button>
            ))}
          </div>
          <Field label="Qoʻshimcha izoh (ixtiyoriy)">
            <Txt rows={2} value={izoh} onChange={(e) => setIzoh(e.target.value)} placeholder="Masalan: majburiy ulushni yopish uchun" />
          </Field>
          <Alert ton="info">Tavsiya xodimni kursga avtomatik yozmaydi — xodim katalogdan oʻzi ariza beradi. Muassasa kreditlarni oʻzgartira olmaydi.</Alert>
        </div>
      )}
    </Modal>
  )
}
